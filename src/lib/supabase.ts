import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

if (Platform.OS !== 'web' && (!globalThis.crypto || !globalThis.crypto.subtle)) {
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: {
      getRandomValues: ExpoCrypto.getRandomValues,
      subtle: {
        digest: (_algorithm: string, data: BufferSource) =>
          ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data),
      },
    },
  });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const authStorage =
  Platform.OS === 'web'
    ? typeof window !== 'undefined'
      ? window.localStorage
      : undefined
    : AsyncStorage;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      persistSession: true,
      storage: authStorage,
    },
  }
);
