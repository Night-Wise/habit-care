import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cloud, CloudDownload, CloudUpload, GitMerge } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  type AppStateStatus,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth, type SyncMode } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useTodos } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';

const MONTHLY_VIEW_PREFS_KEY = '@habit-app/monthly-view-prefs';

/**
 * Handles post-sign-in sync choice, auto-merge on open/resume,
 * and full local reset on sign-out.
 */
export function CloudSyncBridge() {
  const {
    user,
    isLoading: authLoading,
    autoSyncEnabled,
    syncTodos,
  } = useAuth();
  const { todos, isLoaded: todosLoaded, replaceTodos, clearAllData } = useTodos();
  const { colors, fs, fontFamilyValue, resetAppearance } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  const [isInitialSyncOpen, setIsInitialSyncOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const authReady = useRef(false);
  const previousUserId = useRef<string | null>(null);
  const skipNextAutoSync = useRef(false);
  const hasAutoSyncedThisSession = useRef(false);
  const syncInFlight = useRef(false);
  const todosRef = useRef(todos);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const runSync = useCallback(
    async (mode: SyncMode, options?: { silent?: boolean }) => {
      if (syncInFlight.current) return;
      syncInFlight.current = true;
      setIsSyncing(true);
      try {
        const synced = await syncTodos(todosRef.current, mode);
        replaceTodos(synced);
        hasAutoSyncedThisSession.current = true;
        if (!options?.silent) {
          Alert.alert(
            'Cloud sync successful',
            `${synced.length} habit${synced.length === 1 ? '' : 's'} synced successfully.`
          );
        }
      } catch (error: any) {
        if (!options?.silent) {
          Alert.alert('Cloud sync failed', error?.message || 'Unable to sync your habits.');
        } else {
          console.warn('[Cloud Sync] Auto-sync failed', error);
        }
      } finally {
        syncInFlight.current = false;
        setIsSyncing(false);
      }
    },
    [replaceTodos, syncTodos]
  );

  const resetLocalData = useCallback(async () => {
    clearAllData();
    resetAppearance();
    await AsyncStorage.removeItem(MONTHLY_VIEW_PREFS_KEY).catch(() => {});
  }, [clearAllData, resetAppearance]);

  // Detect sign-in / sign-out
  useEffect(() => {
    if (authLoading) return;

    if (!authReady.current) {
      authReady.current = true;
      previousUserId.current = user?.id || null;
      return;
    }

    const nextUserId = user?.id || null;
    if (nextUserId === previousUserId.current) return;

    if (nextUserId) {
      // Fresh Google sign-in: ask how to reconcile local vs cloud
      skipNextAutoSync.current = true;
      hasAutoSyncedThisSession.current = false;
      setIsInitialSyncOpen(true);
    } else {
      // Sign-out: wipe all local app data
      void resetLocalData();
      setIsInitialSyncOpen(false);
      skipNextAutoSync.current = false;
      hasAutoSyncedThisSession.current = false;
      Alert.alert('Signed out', 'Local data has been cleared. Cloud backup is unchanged.');
    }

    previousUserId.current = nextUserId;
  }, [authLoading, resetLocalData, user]);

  const tryAutoMerge = useCallback(() => {
    if (!user || !autoSyncEnabled || !todosLoaded || authLoading) return;
    if (isInitialSyncOpen || skipNextAutoSync.current) return;
    void runSync('merge', { silent: true });
  }, [authLoading, autoSyncEnabled, isInitialSyncOpen, runSync, todosLoaded, user]);

  // Auto-sync on cold start once auth + todos are ready
  useEffect(() => {
    if (!user || !autoSyncEnabled || !todosLoaded || authLoading) return;
    if (isInitialSyncOpen || skipNextAutoSync.current) return;
    if (hasAutoSyncedThisSession.current) return;
    tryAutoMerge();
    // Only re-run when readiness / account / toggle changes — not on every todo edit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, autoSyncEnabled, todosLoaded, authLoading, isInitialSyncOpen]);

  // Auto-sync when returning to foreground
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = next;
      if (wasBackground && next === 'active') {
        skipNextAutoSync.current = false;
        tryAutoMerge();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [tryAutoMerge]);

  const chooseInitialSync = (mode: SyncMode) => {
    setIsInitialSyncOpen(false);
    // Prevent the cold-start effect from firing a second merge right after this choice
    skipNextAutoSync.current = true;
    void runSync(mode).finally(() => {
      skipNextAutoSync.current = false;
    });
  };

  const dismissInitialSync = () => {
    setIsInitialSyncOpen(false);
    // Skip auto-sync until the next resume / next app open
    skipNextAutoSync.current = true;
    hasAutoSyncedThisSession.current = true;
  };

  return (
    <Modal visible={isInitialSyncOpen} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.confirmIconWrap}>
            <Cloud size={28} color={colors.primary} />
          </View>
          <Text style={styles.confirmTitle}>Sync your habits</Text>
          <Text style={styles.confirmSub}>
            Signed in successfully. How should this device sync with the cloud?
          </Text>

          <View style={styles.confirmChoiceGroup}>
            <TouchableOpacity
              style={styles.choiceBtn}
              onPress={() => chooseInitialSync('merge')}
              disabled={isSyncing}
              activeOpacity={0.8}
            >
              <View style={styles.choiceBtnIconWrap}>
                <GitMerge size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceBtnTitle}>Merge (Local + Cloud)</Text>
                <Text style={styles.choiceBtnSub}>
                  Combine habits from this device and the cloud.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.choiceBtn}
              onPress={() => chooseInitialSync('cloud')}
              disabled={isSyncing}
              activeOpacity={0.8}
            >
              <View style={styles.choiceBtnIconWrap}>
                <CloudDownload size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceBtnTitle}>Pull (Cloud only)</Text>
                <Text style={styles.choiceBtnSub}>
                  Replace this device&apos;s habits with cloud data.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.choiceBtn}
              onPress={() => chooseInitialSync('replace')}
              disabled={isSyncing}
              activeOpacity={0.8}
            >
              <View style={styles.choiceBtnIconWrap}>
                <CloudUpload size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.choiceBtnTitle}>Push (Local only)</Text>
                <Text style={styles.choiceBtnSub}>
                  Upload this device&apos;s habits and overwrite the cloud.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelChoiceBtn} onPress={dismissInitialSync}>
            <Text style={styles.cancelChoiceText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    confirmIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 10,
    },
    confirmTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      fontFamily,
      textAlign: 'center',
    },
    confirmSub: {
      fontSize: 13,
      color: colors.textMuted,
      fontFamily,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 16,
      lineHeight: 18,
    },
    confirmChoiceGroup: {
      gap: 10,
    },
    choiceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.surface,
    },
    choiceBtnIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    choiceBtnTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      fontFamily,
    },
    choiceBtnSub: {
      fontSize: 11,
      color: colors.textMuted,
      fontFamily,
      marginTop: 2,
    },
    cancelChoiceBtn: {
      marginTop: 14,
      alignSelf: 'center',
      paddingVertical: 8,
    },
    cancelChoiceText: {
      fontSize: fs(14),
      color: colors.textMuted,
      fontFamily,
      fontWeight: '600',
    },
  });
}
