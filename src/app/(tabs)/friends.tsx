import { useRouter } from 'expo-router';

import { Check, MailPlus, Trash2, Users, X } from 'lucide-react-native';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {

  ActivityIndicator,

  Alert,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,

} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { GoogleLogo } from '@/components/google-logo';
import { ScreenHeader } from '@/components/screen-header';
import {
  FriendListItem,
  listFriendships,
  removeFriendship,
  respondToFriendRequest,
  sendFriendRequest,
} from '@/lib/friends';
import type { ThemeColors } from '@/theme/colors';



export default function FriendsScreen() {

  const insets = useSafeAreaInsets();

  const router = useRouter();

  const { user, isLoading, isConfigured, authError, signInWithGoogle } = useAuth();

  const { colors, fs, fontFamilyValue } = useTheme();

  const styles = useMemo(

    () => createStyles(colors, fs, fontFamilyValue),

    [colors, fs, fontFamilyValue]

  );



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

    <View style={styles.root}>

      <ScreenHeader
        title="Friends"
        subtitle="Add friends by email and see their daily progress"
      />


      {!user ? (

        <View style={styles.signedOutWrap}>

          <Users size={42} color={colors.primary} />

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

            <GoogleLogo size={16} />

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

                placeholderTextColor={colors.inactive}

              />

              <TouchableOpacity

                style={[styles.addBtn, (!email.trim() || isSending) && styles.disabledBtn]}

                onPress={handleAddFriend}

                disabled={!email.trim() || isSending}

                activeOpacity={0.8}

              >

                <MailPlus size={16} color={colors.white} />

              </TouchableOpacity>

            </View>

            <Text style={styles.hint}>Signed in as {user.email}</Text>

          </View>



          {listError ? <Text style={styles.errorText}>{listError}</Text> : null}

          {isRefreshing ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} /> : null}



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

                    <Check size={16} color={colors.white} />

                  </TouchableOpacity>

                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleRespond(item.friendshipId, 'rejected')}>

                    <X size={16} color={colors.white} />

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

                    <Trash2 size={16} color={colors.danger} />

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

                    <Trash2 size={16} color={colors.danger} />

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



function createStyles(

  colors: ThemeColors,

  fs: (size: number) => number,

  fontFamily?: string

) {

  return StyleSheet.create({

    root: {

      flex: 1,

      backgroundColor: colors.background,

    },

    signedOutWrap: {

      flex: 1,

      alignItems: 'center',

      justifyContent: 'center',

      paddingHorizontal: 28,

      paddingBottom: 80,

    },

    signedOutTitle: {

      fontSize: fs(20),

      fontWeight: '800',

      color: colors.text,

      marginTop: 16,

      textAlign: 'center',

      fontFamily,

    },

    signedOutSub: {

      fontSize: fs(14),

      color: colors.textMuted,

      marginTop: 8,

      textAlign: 'center',

      lineHeight: 20,

      fontFamily,

    },

    signInBtn: {

      marginTop: 20,

      height: 46,

      paddingHorizontal: 18,

      borderRadius: 12,

      backgroundColor: colors.primary,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'center',

    },

    signInBtnText: {

      color: colors.white,

      fontWeight: '700',

      fontSize: fs(15),

      fontFamily,

    },

    container: {

      flex: 1,

    },

    content: {

      padding: 16,

      gap: 14,

    },

    card: {

      backgroundColor: colors.card,

      borderRadius: 16,

      padding: 16,

      shadowColor: colors.black,

      shadowOffset: { width: 0, height: 2 },

      shadowOpacity: 0.05,

      shadowRadius: 8,

      elevation: 3,

    },

    cardTitle: {

      fontSize: fs(16),

      fontWeight: '800',

      color: colors.text,

      fontFamily,

    },

    cardSub: {

      fontSize: fs(13),

      color: colors.textMuted,

      marginTop: 4,

      lineHeight: 18,

      fontFamily,

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

      borderColor: colors.borderStrong,

      borderRadius: 10,

      paddingHorizontal: 12,

      backgroundColor: colors.inputBg,

      color: colors.text,

      fontSize: fs(15),

      fontFamily,

    },

    addBtn: {

      width: 44,

      height: 44,

      borderRadius: 10,

      backgroundColor: colors.primary,

      alignItems: 'center',

      justifyContent: 'center',

    },

    disabledBtn: {

      opacity: 0.55,

    },

    hint: {

      color: colors.textMuted,

      fontSize: fs(12),

      marginTop: 10,

      lineHeight: 17,

      fontFamily,

    },

    errorText: {

      color: colors.danger,

      fontSize: fs(12),

      marginTop: 8,

      lineHeight: 17,

      fontFamily,

    },

    emptyFriends: {

      color: colors.textMuted,

      fontSize: fs(13),

      marginTop: 10,

      lineHeight: 18,

      fontFamily,

    },

    personRow: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 8,

      marginTop: 12,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor: colors.primarySoft,

    },

    personInfo: {

      flex: 1,

    },

    personEmail: {

      color: colors.text,

      fontSize: fs(14),

      fontWeight: '700',

      fontFamily,

    },

    personMeta: {

      color: colors.textMuted,

      fontSize: fs(12),

      marginTop: 2,

      fontFamily,

    },

    acceptBtn: {

      width: 36,

      height: 36,

      borderRadius: 10,

      backgroundColor: colors.success,

      alignItems: 'center',

      justifyContent: 'center',

    },

    rejectBtn: {

      width: 36,

      height: 36,

      borderRadius: 10,

      backgroundColor: colors.danger,

      alignItems: 'center',

      justifyContent: 'center',

    },

    removeBtn: {

      width: 36,

      height: 36,

      borderRadius: 10,

      backgroundColor: colors.dangerSoft,

      alignItems: 'center',

      justifyContent: 'center',

    },

  });

}

