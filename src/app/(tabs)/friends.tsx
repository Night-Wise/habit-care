import { useRouter } from 'expo-router';
import { Check, LogIn, MailPlus, Trash2, Users, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import {
  FriendListItem,
  listFriendships,
  removeFriendship,
  respondToFriendRequest,
  sendFriendRequest,
} from '@/lib/friends';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading, isConfigured, authError, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [friendships, setFriendships] = useState<FriendListItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    if (!user?.id) return;
    setIsRefreshing(true);
    setListError(null);
    try {
      const next = await listFriendships(user.id);
      setFriendships(next);
    } catch (error: any) {
      setListError(error?.message || 'Unable to load friends.');
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  const incoming = friendships.filter((item) => item.status === 'pending' && item.direction === 'incoming');
  const outgoing = friendships.filter((item) => item.status === 'pending' && item.direction === 'outgoing');
  const friends = friendships.filter((item) => item.status === 'accepted');

  const handleAddFriend = async () => {
    if (!user?.id) return;
    setIsSending(true);
    try {
      const message = await sendFriendRequest(user.id, email);
      setEmail('');
      Alert.alert('Request sent', message);
      await loadFriends();
    } catch (error: any) {
      Alert.alert('Could not add friend', error?.message || 'Try again with a signed-in Google email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRespond = async (friendshipId: string, status: 'accepted' | 'rejected') => {
    try {
      await respondToFriendRequest(friendshipId, status);
      await loadFriends();
    } catch (error: any) {
      Alert.alert('Update failed', error?.message || 'Unable to update this request.');
    }
  };

  const handleRemove = (item: FriendListItem, label: string) => {
    Alert.alert(label, `Remove ${item.email}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeFriendship(item.friendshipId);
            await loadFriends();
          } catch (error: any) {
            Alert.alert('Remove failed', error?.message || 'Unable to remove this person.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <Text style={styles.headerSub}>Add friends by email and see their daily progress</Text>
      </View>

      {!user ? (
        <View style={styles.signedOutWrap}>
          <Users size={42} color={PURPLE} />
          <Text style={styles.signedOutTitle}>Sign in to use Friends</Text>
          <Text style={styles.signedOutSub}>
            Google sign-in is required so friends can find you by the same email you use in the app.
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, !isConfigured && styles.disabledBtn]}
            onPress={signInWithGoogle}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <LogIn size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.signInBtnText}>
              {isLoading ? 'Checking account...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>
          {!isConfigured && (
            <Text style={styles.hint}>Add Supabase values from SUPABASE_SETUP.md to enable sign-in.</Text>
          )}
          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add friend</Text>
            <Text style={styles.cardSub}>They must already be signed in with this Google email, then accept your request.</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.emailInput}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="friend@gmail.com"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                style={[styles.addBtn, (!email.trim() || isSending) && styles.disabledBtn]}
                onPress={handleAddFriend}
                disabled={!email.trim() || isSending}
                activeOpacity={0.8}
              >
                <MailPlus size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Signed in as {user.email}</Text>
          </View>

          {listError ? <Text style={styles.errorText}>{listError}</Text> : null}
          {isRefreshing ? <ActivityIndicator color={PURPLE} style={{ marginVertical: 8 }} /> : null}

          {incoming.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Friend requests</Text>
              {incoming.map((item) => (
                <View key={item.friendshipId} style={styles.personRow}>
                  <View style={styles.personInfo}>
                    <Text style={styles.personEmail}>{item.email}</Text>
                    <Text style={styles.personMeta}>Wants to be friends</Text>
                  </View>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleRespond(item.friendshipId, 'accepted')}>
                    <Check size={16} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(item.friendshipId, 'rejected')}>
                    <X size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {outgoing.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Waiting for them</Text>
              {outgoing.map((item) => (
                <View key={item.friendshipId} style={styles.personRow}>
                  <View style={styles.personInfo}>
                    <Text style={styles.personEmail}>{item.email}</Text>
                    <Text style={styles.personMeta}>Request sent</Text>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item, 'Cancel request')}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your friends</Text>
            {friends.length === 0 ? (
              <Text style={styles.emptyFriends}>No friends yet. Add someone by email above.</Text>
            ) : (
              friends.map((item) => (
                <View key={item.friendshipId} style={styles.personRow}>
                  <TouchableOpacity
                    style={styles.personInfo}
                    onPress={() =>
                      router.push({
                        pathname: '/friend-progress',
                        params: { userId: item.userId, email: item.email },
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <Text style={styles.personEmail}>{item.email}</Text>
                    <Text style={styles.personMeta}>Tap to see daily and monthly progress</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item, 'Remove friend')}>
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const PURPLE = '#6366f1';
const BG = '#f8f7ff';
const CARD = '#ffffff';
const TEXT = '#1e1b4b';
const SUBTEXT = '#6b7280';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  signedOutWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  signedOutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
    marginTop: 16,
    textAlign: 'center',
  },
  signedOutSub: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInBtn: {
    marginTop: 20,
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: TEXT,
  },
  cardSub: {
    fontSize: 13,
    color: SUBTEXT,
    marginTop: 4,
    lineHeight: 18,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  emailInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    color: TEXT,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.55,
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  emptyFriends: {
    color: SUBTEXT,
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eef2ff',
  },
  personInfo: {
    flex: 1,
  },
  personEmail: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  personMeta: {
    color: SUBTEXT,
    fontSize: 12,
    marginTop: 2,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
