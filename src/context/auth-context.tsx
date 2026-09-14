import { Session, User } from '@supabase/supabase-js';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { Todo } from '@/context/todos-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type SyncMode = 'merge' | 'replace' | 'cloud';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncTodos: (localTodos: Todo[], mode: SyncMode) => Promise<Todo[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getCodeFromUrl(url: string): string | null {
  const query = url.split('?')[1]?.split('#')[0];
  if (!query) return null;
  return new URLSearchParams(query).get('code');
}

function getRedirectUri(): string {
  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({ path: 'auth/callback' });
  }
  return AuthSession.makeRedirectUri({
    scheme: 'habitapp',
    path: 'auth/callback',
  });
}

function mergeTodos(localTodos: Todo[], cloudTodos: Todo[]): Todo[] {
  const merged = new Map<string, Todo>();
  [...cloudTodos, ...localTodos].forEach((todo) => {
    const existing = merged.get(todo.id);
    merged.set(todo.id, existing
      ? { ...existing, ...todo, completions: { ...(existing.completions || {}), ...(todo.completions || {}) } }
      : todo);
  });
  return Array.from(merged.values());
}

function getMissingSupabaseConfigMessage(): string {
  const missing = [] as string[];
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) missing.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');

  const missingLabel = missing.length > 1 ? missing.join(' and ') : missing[0];
  const verb = missing.length > 1 ? 'are missing' : 'is missing';

  return `Supabase is not configured yet: ${missingLabel} ${verb} in .env. Add the values from SUPABASE_SETUP.md to enable Google sign-in.`;
}

function getAuthErrorMessage(message: string | undefined): string {
  if (message?.toLowerCase().includes('unsupported provider')) {
    return 'Google sign-in is not enabled in Supabase yet. Enable Authentication > Providers > Google and add the Google OAuth credentials.';
  }
  return message || 'Unable to start Google sign-in.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    if (!isSupabaseConfigured) {
      setAuthError(getMissingSupabaseConfigMessage());
      return;
    }

    const redirectUri = getRedirectUri();
    console.log('[Auth] redirectUri =>', redirectUri); // 👈 check Metro logs for this
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      setAuthError(getAuthErrorMessage(error?.message));
      return;
    }

    // 👇 Decode the redirect_uri Supabase embedded in the OAuth URL
    const oauthUrl = new URL(data.url);
    console.log('[Auth] Supabase OAuth URL redirect_to param =>', oauthUrl.searchParams.get('redirect_to'));

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type === 'success') {
      const code = getCodeFromUrl(result.url);
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) setAuthError(getAuthErrorMessage(exchangeError.message));
      }
    } else if (result.type !== 'cancel' && result.type !== 'dismiss') {
      setAuthError('Google sign-in was not completed.');
    }
  };

  const signOut = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  };

  const syncTodos = async (localTodos: Todo[], mode: SyncMode) => {
    console.log('[Cloud Sync] Preparing Supabase sync', {
      mode,
      localTodoCount: localTodos.length,
      userId: session?.user?.id,
      isConfigured: isSupabaseConfigured,
    });

    if (!isSupabaseConfigured) {
      const error = new Error('Supabase is not configured. Add the Supabase environment variables and restart the app.');
      console.error('[Cloud Sync] Supabase is not configured', error);
      throw error;
    }
    if (!session?.user) {
      const error = new Error('Sign in before syncing your habits.');
      console.error('[Cloud Sync] No authenticated user', error);
      throw error;
    }

    console.log('[Cloud Sync] Fetching habit_data row', { userId: session.user.id });
    const { data, error } = await supabase
      .from('habit_data')
      .select('todos')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (error) {
      console.error('[Cloud Sync] Supabase fetch failed', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      if (error.code === 'PGRST205') {
        throw new Error('The Supabase habit_data table is missing. Run the SQL from SUPABASE_SETUP.md in your Supabase SQL Editor, then try syncing again.');
      }
      throw error;
    }

    const cloudTodos = Array.isArray(data?.todos) ? (data.todos as Todo[]) : [];
    console.log('[Cloud Sync] Supabase fetch succeeded', { cloudTodoCount: cloudTodos.length });
    const nextTodos = mode === 'cloud'
      ? cloudTodos
      : mode === 'replace'
        ? localTodos
        : mergeTodos(localTodos, cloudTodos);

    console.log('[Cloud Sync] Saving habit_data row', { nextTodoCount: nextTodos.length });
    const { error: saveError } = await supabase.from('habit_data').upsert({
      user_id: session.user.id,
      todos: nextTodos,
      updated_at: new Date().toISOString(),
    });
    if (saveError) {
      console.error('[Cloud Sync] Supabase save failed', {
        message: saveError.message,
        code: saveError.code,
        details: saveError.details,
        hint: saveError.hint,
      });
      throw saveError;
    }
    console.log('[Cloud Sync] Supabase save succeeded');
    return nextTodos;
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        isLoading,
        isConfigured: isSupabaseConfigured,
        authError,
        signInWithGoogle,
        signOut,
        syncTodos,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
