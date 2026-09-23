import type { Todo } from '@/context/todos-context';
import { supabase } from '@/lib/supabase';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendshipRecord {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface FriendListItem {
  friendshipId: string;
  userId: string;
  email: string;
  name: string;
  status: FriendshipStatus;
  direction: 'incoming' | 'outgoing';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  if (!local) return email || 'Unknown user';
  return local
    .replace(/[._+-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function resolveDisplayName(
  displayName: string | null | undefined,
  email: string | null | undefined
): string {
  const trimmed = displayName?.trim();
  if (trimmed && !trimmed.includes('@')) return trimmed;
  if (email) return nameFromEmail(email);
  return 'Unknown user';
}

/** Pull a human name from Google / Supabase auth user metadata. */
export function getAuthDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null;
}): string {
  const meta = user.user_metadata || {};
  const identityData = user.identities?.[0]?.identity_data || {};

  const givenFamily = (...sources: Record<string, unknown>[]) => {
    for (const source of sources) {
      const given = typeof source.given_name === 'string' ? source.given_name.trim() : '';
      const family = typeof source.family_name === 'string' ? source.family_name.trim() : '';
      const combined = [given, family].filter(Boolean).join(' ').trim();
      if (combined) return combined;
    }
    return '';
  };

  const candidates = [
    meta.full_name,
    meta.name,
    meta.preferred_username,
    givenFamily(meta, identityData),
    identityData.full_name,
    identityData.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed && !trimmed.includes('@')) return trimmed;
    }
  }

  return resolveDisplayName(null, user.email);
}

function sanitizeTodos(raw: unknown): Todo[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || typeof (item as Todo).name !== 'string') {
      return [];
    }
    const todo = item as Todo;
    const completions =
      todo.completions && typeof todo.completions === 'object' ? { ...todo.completions } : {};
    return [
      {
        id: todo.id ? String(todo.id) : `friend_${index}`,
        name: String(todo.name).trim(),
        icon: todo.icon ? String(todo.icon) : 'circle-check',
        category: typeof todo.category === 'string' ? todo.category : '',
        timeMinutes: typeof todo.timeMinutes === 'number' && todo.timeMinutes > 0 ? todo.timeMinutes : 30,
        priority: typeof todo.priority === 'number' && !Number.isNaN(todo.priority) ? todo.priority : 0,
        createdAt: todo.createdAt ? String(todo.createdAt) : new Date().toISOString(),
        completions,
        notificationTime: todo.notificationTime || '09:00 AM',
        notificationEnabled: false,
      },
    ];
  });
}

export async function ensureUserProfile(
  userId: string,
  email: string | undefined,
  displayName?: string | null
): Promise<void> {
  if (!email) return;
  const trimmedName = displayName?.trim();
  const basePayload = {
    user_id: userId,
    email: normalizeEmail(email),
    updated_at: new Date().toISOString(),
  };

  const withName = trimmedName
    ? { ...basePayload, display_name: trimmedName }
    : basePayload;

  const { error } = await supabase.from('profiles').upsert(withName, { onConflict: 'user_id' });
  if (!error) return;

  // Column may not exist yet before migration — still keep email in sync.
  if (/display_name/i.test(error.message) && trimmedName) {
    const fallback = await supabase.from('profiles').upsert(basePayload, { onConflict: 'user_id' });
    if (fallback.error) {
      console.warn('[Friends] Failed to upsert profile', fallback.error);
    }
    return;
  }

  console.warn('[Friends] Failed to upsert profile', error);
}

async function fetchProfilesByUserIds(
  userIds: string[]
): Promise<Record<string, { email: string; name: string }>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  let rows: Array<{ user_id: string; email: string; display_name?: string | null }> = [];

  const withName = await supabase
    .from('profiles')
    .select('user_id, email, display_name')
    .in('user_id', uniqueIds);

  if (withName.error && /display_name/i.test(withName.error.message)) {
    const fallback = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', uniqueIds);
    if (fallback.error) throw fallback.error;
    rows = fallback.data || [];
  } else if (withName.error) {
    throw withName.error;
  } else {
    rows = withName.data || [];
  }

  const map: Record<string, { email: string; name: string }> = {};
  rows.forEach((row) => {
    const email = row.email || '';
    map[row.user_id] = {
      email,
      name: resolveDisplayName(row.display_name, email),
    };
  });
  return map;
}

export async function listFriendships(userId: string): Promise<FriendListItem[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, created_at')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = (data || []) as FriendshipRecord[];
  const profiles = await fetchProfilesByUserIds(
    rows.flatMap((row) => [row.requester_id, row.addressee_id])
  );

  return rows.map((row) => {
    const isIncoming = row.addressee_id === userId;
    const otherId = isIncoming ? row.requester_id : row.addressee_id;
    const profile = profiles[otherId];
    return {
      friendshipId: row.id,
      userId: otherId,
      email: profile?.email || 'Unknown user',
      name: profile?.name || 'Unknown user',
      status: row.status,
      direction: isIncoming ? 'incoming' : 'outgoing',
    };
  });
}

export async function sendFriendRequest(myUserId: string, email: string): Promise<string> {
  const lookupEmail = normalizeEmail(email);
  if (!lookupEmail || !lookupEmail.includes('@')) {
    throw new Error('Enter a valid email address.');
  }

  const { data: foundId, error: lookupError } = await supabase.rpc('find_user_id_by_email', {
    lookup_email: lookupEmail,
  });
  if (lookupError) throw lookupError;
  if (!foundId) {
    throw new Error('No signed-in user was found with that email. They need to sign in with Google first.');
  }
  if (foundId === myUserId) {
    throw new Error('You cannot add yourself as a friend.');
  }

  const { data: existing, error: existingError } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${myUserId},addressee_id.eq.${foundId}),and(requester_id.eq.${foundId},addressee_id.eq.${myUserId})`
    )
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('You are already friends with this user.');
    }
    if (existing.status === 'pending' && existing.requester_id === myUserId) {
      throw new Error('A friend request is already waiting for them to accept.');
    }
    if (existing.status === 'pending' && existing.addressee_id === myUserId) {
      await respondToFriendRequest(existing.id, 'accepted');
      return 'They had already sent you a request. You are now friends.';
    }
    if (existing.status === 'rejected') {
      const { error: deleteError } = await supabase.from('friendships').delete().eq('id', existing.id);
      if (deleteError) throw deleteError;
    }
  }

  const { error: insertError } = await supabase.from('friendships').insert({
    requester_id: myUserId,
    addressee_id: foundId,
    status: 'pending',
  });
  if (insertError) throw insertError;
  return `Friend request sent to ${lookupEmail}.`;
}

export async function respondToFriendRequest(
  friendshipId: string,
  status: Extract<FriendshipStatus, 'accepted' | 'rejected'>
): Promise<void> {
  const { error } = await supabase
    .from('friendships')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', friendshipId);
  if (error) throw error;
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (error) throw error;
}

export async function fetchFriendTodos(friendUserId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('habit_data')
    .select('todos')
    .eq('user_id', friendUserId)
    .maybeSingle();
  if (error) throw error;
  return sanitizeTodos(data?.todos);
}
