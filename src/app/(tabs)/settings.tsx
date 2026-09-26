import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { AlertTriangle, BarChart3, Bell, BellRing, ChevronDown, ChevronUp, Cloud, Copy, Eye, FileDown, FileText, FolderOpen, GitMerge, LayoutGrid, LogOut, Palette, RefreshCw, Share2, Trash2, Upload } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatLastSyncedAt, useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { useTodos } from '@/context/todos-context';
import { GoogleLogo } from '@/components/google-logo';
import { MonthlyHeatmapPreview } from '@/components/monthly-heatmap-preview';
import { ScreenHeader } from '@/components/screen-header';
import { buildCurrentMonthActivityHeatmap } from '@/utils/monthly-activity-heatmap';
import { MONTHLY_HEATMAP_WIDGET_NAME } from '@/widgets/constants';
import { syncMonthlyHeatmapWidget } from '@/widgets/sync-monthly-heatmap-widget';
import {
  getMonthlyHeatmapWidgetPrefs,
  setMonthlyHeatmapWidgetEnabled,
  setMonthlyHeatmapWidgetTheme,
  type WidgetThemeMode,
} from '@/widgets/widget-prefs';
import {
  ACCENT_LABELS,
  AccentColor,
  buildThemeColors,
  FONT_FAMILY_LABELS,
  FONT_SCALE_LABELS,
  FontScaleId,
  THEME_MODE_LABELS,
  ThemeMode,
} from '@/theme/colors';
import type { ThemeColors } from '@/theme/colors';
import {
  requestNotificationPermissions,
  sendTestNotification,
  sendTestRingNotification,
} from '@/utils/notifications';
import { stopRingAlarm } from '@/utils/ring-alarm';

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];
const ACCENT_OPTIONS: AccentColor[] = ['blue', 'purple', 'green'];
const FONT_SCALES: FontScaleId[] = ['small', 'default', 'large'];
const WIDGET_THEME_MODES: WidgetThemeMode[] = ['system', 'light', 'dark'];
const WIDGET_THEME_LABELS: Record<WidgetThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { todos, exportData, importData, clearAllData, replaceTodos } = useTodos();
  const {
    user,
    isConfigured,
    authError,
    autoSyncEnabled,
    lastSyncedAt,
    setAutoSyncEnabled,
    signInWithGoogle,
    signOut,
    syncTodos,
  } = useAuth();
  const {
    colors,
    fs,
    fontFamilyValue,
    resolvedScheme,
    themeMode,
    accent,
    fontScale,
    fontFamily,
    setThemeMode,
    setAccent,
    setFontScale,
  } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [appearanceExpanded, setAppearanceExpanded] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const [widgetTheme, setWidgetTheme] = useState<WidgetThemeMode>('system');
  const [widgetPrefsLoaded, setWidgetPrefsLoaded] = useState(false);

  const heatmapPreviewData = useMemo(
    () => buildCurrentMonthActivityHeatmap(todos),
    [todos]
  );

  const previewDark =
    widgetTheme === 'dark' ||
    (widgetTheme === 'system' && resolvedScheme === 'dark');

  useEffect(() => {
    void getMonthlyHeatmapWidgetPrefs().then((prefs) => {
      setWidgetEnabled(prefs.enabled);
      setWidgetTheme(prefs.theme);
      setWidgetPrefsLoaded(true);
    });
  }, []);

  const handleWidgetEnabledChange = (enabled: boolean) => {
    setWidgetEnabled(enabled);
    void setMonthlyHeatmapWidgetEnabled(enabled).then(() => {
      syncMonthlyHeatmapWidget(todos);
      showToast(
        enabled
          ? 'Home screen widget enabled'
          : 'Home screen widget disabled'
      );
    });
  };

  const handleWidgetThemeChange = (theme: WidgetThemeMode) => {
    setWidgetTheme(theme);
    void setMonthlyHeatmapWidgetTheme(theme).then(() => {
      syncMonthlyHeatmapWidget(todos);
      showToast(
        theme === 'system'
          ? 'Widget follows system light/dark'
          : `Widget locked to ${theme} mode`
      );
    });
  };

  const handleAddWidgetToHome = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Android only',
        'Home screen widgets are available on Android builds (not Expo Go / web).'
      );
      return;
    }
    try {
      const { requestPinWidget } = await import('react-native-android-widget');
      const accepted = await requestPinWidget({
        widgetName: MONTHLY_HEATMAP_WIDGET_NAME,
      });
      if (accepted) {
        showToast('Follow the system prompt to place the widget');
      } else {
        Alert.alert(
          'Add widget manually',
          'Long-press your home screen → Widgets → HabitCare → Monthly Activity. You can resize it freely after placing.'
        );
      }
    } catch {
      Alert.alert(
        'Add widget manually',
        'Long-press your home screen → Widgets → HabitCare → Monthly Activity. You can resize it freely after placing.'
      );
    }
  };

  // Modals state
  const [isViewJsonOpen, setIsViewJsonOpen] = useState(false);
  const [isPasteJsonOpen, setIsPasteJsonOpen] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');

  // Import Confirmation state
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [importSummaryCount, setImportSummaryCount] = useState<number>(0);
  const [isConfirmImportOpen, setIsConfirmImportOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate statistics
  const totalHabits = todos.length;
  const totalCompletions = todos.reduce((acc, t) => {
    const doneKeys = Object.keys(t.completions || {}).filter((k) => t.completions![k]);
    return acc + doneKeys.length;
  }, 0);

  const rawJsonString = exportData();
  const dataSizeKb = (new Blob([rawJsonString]).size / 1024).toFixed(1);

  // EXPORT HANDLERS
  const handleExportFile = async () => {
    try {
      const jsonStr = exportData();
      const filename = `habit_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast('📁 JSON backup file downloaded!');
      } else {
        const file = new File(Paths.cache, filename);
        if (!file.exists) {
          file.create();
        }
        file.write(jsonStr);
        const fileUri = file.uri;

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export HabitCare Backup',
            UTI: 'public.json',
          });
          showToast('✅ Backup file exported!');
        } else {
          await Clipboard.setStringAsync(jsonStr);
          Alert.alert(
            'Copied to Clipboard',
            'Sharing is not available on this device. The JSON backup has been copied to your clipboard!'
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Failed to export data.');
    }
  };

  const handleCopyClipboard = async () => {
    try {
      const jsonStr = exportData();
      await Clipboard.setStringAsync(jsonStr);
      showToast('📋 JSON copied to clipboard!');
    } catch (err: any) {
      Alert.alert('Copy Error', err?.message || 'Failed to copy to clipboard.');
    }
  };

  // IMPORT PREPARATION
  const prepareImport = (jsonText: string) => {
    try {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        Alert.alert('Invalid JSON', 'The provided data is not a valid JSON string.');
        return;
      }

      let candidateList: any[] = [];
      if (Array.isArray(parsed)) {
        candidateList = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.todos)) {
        candidateList = parsed.todos;
      }

      if (candidateList.length === 0) {
        Alert.alert('Empty Backup', 'No valid habit records found in the JSON file.');
        return;
      }

      setPendingImportJson(jsonText);
      setImportSummaryCount(candidateList.length);
      setIsConfirmImportOpen(true);
    } catch (err: any) {
      Alert.alert('Parse Error', err?.message || 'Unable to parse JSON file.');
    }
  };

  const handlePickFile = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) prepareImport(text);
            };
            reader.readAsText(file);
          }
        };
        input.click();
      } else {
        const res = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (!res.canceled && res.assets && res.assets.length > 0) {
          const pickedFile = new File(res.assets[0].uri);
          const text = await pickedFile.text();
          prepareImport(text);
        }
      }
    } catch (err: any) {
      Alert.alert('Import Error', err?.message || 'Failed to pick or read file.');
    }
  };

  const handleConfirmImport = (mode: 'merge' | 'replace') => {
    if (!pendingImportJson) return;

    const res = importData(pendingImportJson, mode);
    setIsConfirmImportOpen(false);
    setPendingImportJson(null);
    setIsPasteJsonOpen(false);

    if (res.success) {
      showToast(`🎉 Successfully imported ${res.count} habits (${mode === 'merge' ? 'Merged' : 'Replaced'})!`);
    } else {
      Alert.alert('Import Failed', res.error || 'Could not import JSON data.');
    }
  };

  // TEST NOTIFICATION HANDLER
  const handleTestNotification = async () => {
    await requestNotificationPermissions(colors.primary);
    const success = await sendTestNotification();
    if (success) {
      showToast('🔔 Test notification sent! Check your notification bar.');
    } else {
      Alert.alert(
        'Notification Info',
        'Push notifications require a development build or granted permissions. Ensure notifications are enabled in your device settings.'
      );
    }
  };

  const handleTestRingNotification = async () => {
    await requestNotificationPermissions(colors.primary);
    const result = await sendTestRingNotification('clock');
    if (result.scheduled || result.ringing) {
      showToast(
        result.scheduled
          ? '🔔 Ring test sent — alarm loops ~10s. Check lock-screen actions.'
          : '🔔 Playing ring preview (~10s). Full lock-screen alarms need a native build.'
      );
    } else {
      Alert.alert(
        'Ring Notification',
        'Could not play a ring preview. On web/Expo Go, audio may be limited — try a development build for full lock-screen ring alarms.'
      );
    }
  };

  // CLEAR ALL HANDLER
  const handleClearAll = () => {
    Alert.alert(
      '⚠️ Reset All Data?',
      'Are you sure you want to delete all habits and history? This action cannot be undone unless you have an exported JSON backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            showToast('🗑️ All habit data cleared.');
          },
        },
      ]
    );
  };

  const handleCloudSync = async () => {
    console.log('[Cloud Sync] Sync Now pressed', {
      isConfigured,
      userId: user?.id,
      localTodoCount: todos.length,
    });
    setIsSyncing(true);
    showToast('Merging habits with cloud...');
    try {
      const syncedTodos = await syncTodos(todos, 'merge');
      replaceTodos(syncedTodos);
      Alert.alert(
        'Cloud sync successful',
        `${syncedTodos.length} habit${syncedTodos.length === 1 ? '' : 's'} synced successfully.`
      );
    } catch (error: any) {
      console.error('[Cloud Sync] Sync failed', error);
      Alert.alert('Cloud sync failed', error?.message || 'Unable to sync your habits.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = () => {
    const message =
      'This will clear all local habit data and reset preferences on this device. Your cloud backup stays intact.';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Sign out?\n\n${message}`)) {
        void signOut();
      }
      return;
    }

    Alert.alert('Sign out?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out & Clear',
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Setting"
        subtitle="Export, Import & Manage your Habit Data"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Overview Stats Card */}
        <View style={styles.statsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <BarChart3 size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.sectionHeading}>Data Summary</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalHabits}</Text>
              <Text style={styles.statLabel}>Active Habits</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalCompletions}</Text>
              <Text style={styles.statLabel}>Logs Recorded</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{dataSizeKb} KB</Text>
              <Text style={styles.statLabel}>Backup Size</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.card}>
          <View style={styles.appearanceHeader}>
            <View style={styles.appearanceHeaderLeft}>
              <Palette size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.sectionHeading}>Appearance</Text>
            </View>
            <TouchableOpacity
              style={styles.appearanceMoreBtn}
              onPress={() => setAppearanceExpanded((open) => !open)}
              activeOpacity={0.75}
              accessibilityLabel={
                appearanceExpanded
                  ? 'Hide more appearance settings'
                  : 'Show more appearance settings'
              }
            >
              <Text style={styles.appearanceMoreBtnText}>
                {appearanceExpanded ? 'Less settings' : 'More settings'}
              </Text>
              {appearanceExpanded ? (
                <ChevronUp size={16} color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.appearanceLabel, { marginTop: 0 }]}>Theme mode</Text>
          <View style={styles.chipRow}>
            {THEME_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.appearanceChip, themeMode === mode && styles.appearanceChipActive]}
                onPress={() => setThemeMode(mode)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.appearanceChipText,
                    themeMode === mode && styles.appearanceChipTextActive,
                  ]}
                >
                  {THEME_MODE_LABELS[mode]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {appearanceExpanded ? (
            <>
              <Text style={styles.appearanceLabel}>Accent</Text>
              <View style={styles.accentRow}>
                {ACCENT_OPTIONS.map((accentOption) => {
                  const swatchColor = buildThemeColors(accentOption, resolvedScheme).primary;
                  const isSelected = accent === accentOption;
                  return (
                    <TouchableOpacity
                      key={accentOption}
                      style={styles.accentOption}
                      onPress={() => setAccent(accentOption)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.accentSwatch,
                          { backgroundColor: swatchColor },
                          isSelected && styles.accentSwatchSelected,
                        ]}
                      />
                      <Text
                        style={[styles.accentOptionText, isSelected && styles.accentOptionTextActive]}
                      >
                        {ACCENT_LABELS[accentOption]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.appearanceLabel}>Font size</Text>
              <View style={styles.chipRow}>
                {FONT_SCALES.map((scale) => (
                  <TouchableOpacity
                    key={scale}
                    style={[styles.appearanceChip, fontScale === scale && styles.appearanceChipActive]}
                    onPress={() => setFontScale(scale)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.appearanceChipText,
                        fontScale === scale && styles.appearanceChipTextActive,
                      ]}
                    >
                      {FONT_SCALE_LABELS[scale]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.appearanceLabel}>Font family</Text>
              <View style={styles.chipRow}>
                <View style={[styles.appearanceChip, styles.appearanceChipActive]}>
                  <Text style={[styles.appearanceChipText, styles.appearanceChipTextActive]}>
                    {FONT_FAMILY_LABELS[fontFamily]}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Home screen widget */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LayoutGrid size={24} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Home Screen Widget</Text>
              <Text style={styles.cardSub}>
                Monthly GitHub-style heatmap. Follows system light/dark, or lock to one look.
              </Text>
            </View>
          </View>

          <View style={styles.widgetPreviewRow}>
            <View style={styles.widgetPreviewCol}>
              <Text style={styles.widgetPreviewLabel}>Light</Text>
              <MonthlyHeatmapPreview
                data={heatmapPreviewData}
                dark={false}
                enabled={widgetEnabled}
                width={148}
                height={128}
              />
            </View>
            <View style={styles.widgetPreviewCol}>
              <Text style={styles.widgetPreviewLabel}>Dark</Text>
              <MonthlyHeatmapPreview
                data={heatmapPreviewData}
                dark
                enabled={widgetEnabled}
                width={148}
                height={128}
              />
            </View>
          </View>

          <Text style={[styles.appearanceLabel, { marginTop: 0 }]}>Widget theme</Text>
          <View style={[styles.chipRow, { marginBottom: 12 }]}>
            {WIDGET_THEME_MODES.map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.appearanceChip,
                  widgetTheme === mode && styles.appearanceChipActive,
                ]}
                onPress={() => handleWidgetThemeChange(mode)}
                disabled={!widgetPrefsLoaded}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.appearanceChipText,
                    widgetTheme === mode && styles.appearanceChipTextActive,
                  ]}
                >
                  {WIDGET_THEME_LABELS[mode]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.syncMetaSub, { marginBottom: 12 }]}>
            {widgetTheme === 'system'
              ? `Currently previewing ${previewDark ? 'dark' : 'light'} from your device theme.`
              : `Widget stays ${widgetTheme} even if the phone theme changes.`}
          </Text>

          <View style={styles.syncMetaRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.syncMetaTitle}>Show activity on widget</Text>
              <Text style={styles.syncMetaSub}>
                When off, the home screen widget shows a disabled state until you turn it back on.
              </Text>
            </View>
            <Switch
              value={widgetEnabled}
              onValueChange={handleWidgetEnabledChange}
              disabled={!widgetPrefsLoaded}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={widgetEnabled ? colors.primary : colors.inactive}
            />
          </View>
          {Platform.OS === 'android' ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, !widgetEnabled && { opacity: 0.55 }]}
              onPress={handleAddWidgetToHome}
              disabled={!widgetEnabled}
              activeOpacity={0.8}
            >
              <LayoutGrid size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Add to Home Screen</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.setupHint}>
              Widgets require an Android install (APK / development build), not Expo Go or web.
            </Text>
          )}
        </View>

        {/* Account Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Cloud size={24} color="#0284c7" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Cloud Account</Text>
              <Text style={styles.cardSub}>
                {user ? `Signed in as ${user.email || 'Google account'}` : 'Optional Google sign-in for cloud backup.'}
              </Text>
            </View>
          </View>

          {!user ? (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, !isConfigured && { opacity: 0.55 }]}
              onPress={signInWithGoogle}
              activeOpacity={0.8}
            >
              <GoogleLogo size={16} />
              <Text style={styles.btnPrimaryText}>Continue with Google</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.syncMetaRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.syncMetaTitle}>Auto sync</Text>
                  <Text style={styles.syncMetaSub}>
                    Merge with cloud when the app opens or returns to the foreground.
                  </Text>
                </View>
                <Switch
                  value={autoSyncEnabled}
                  onValueChange={setAutoSyncEnabled}
                  trackColor={{ false: colors.border, true: colors.primarySoft }}
                  thumbColor={autoSyncEnabled ? colors.primary : colors.inactive}
                />
              </View>

              <Text style={styles.lastSyncedText}>
                Last synced: {formatLastSyncedAt(lastSyncedAt)}
              </Text>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnInRow, styles.btnPrimary, isSyncing && { opacity: 0.55 }]}
                  onPress={handleCloudSync}
                  disabled={isSyncing}
                  activeOpacity={0.8}
                >
                  <Cloud size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.btnPrimaryText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnInRow, styles.btnSecondary]}
                  onPress={handleSignOut}
                  activeOpacity={0.8}
                >
                  <LogOut size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={styles.btnSecondaryText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {!isConfigured && <Text style={styles.setupHint}>Add Supabase values from SUPABASE_SETUP.md to enable sign-in.</Text>}
          {authError && <Text style={styles.errorText}>{authError}</Text>}
        </View>

        {/* Export Data Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Share2 size={24} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Export Data (JSON)</Text>
              <Text style={styles.cardSub}>
                Export a full JSON backup of all your habits and completion records.
              </Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnInRow, styles.btnPrimary]}
              onPress={handleExportFile}
              activeOpacity={0.8}
            >
              <FileDown size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Save JSON File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnInRow, styles.btnSecondary]}
              onPress={handleCopyClipboard}
              activeOpacity={0.8}
            >
              <Copy size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.btnSecondaryText}>Copy JSON</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.inlineLinkBtn}
            onPress={() => setIsViewJsonOpen(true)}
            activeOpacity={0.7}
          >
            <Eye size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.inlineLinkText}>View / Inspect Raw JSON</Text>
          </TouchableOpacity>
        </View>

        {/* Import Data Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Upload size={24} color="#0284c7" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Import Data (JSON)</Text>
              <Text style={styles.cardSub}>
                Restore or merge habits from an exported JSON file or text string.
              </Text>
            </View>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnInRow, styles.btnPrimary]}
              onPress={handlePickFile}
              activeOpacity={0.8}
            >
              <FolderOpen size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Select JSON File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnInRow, styles.btnSecondary]}
              onPress={() => {
                setPastedJsonText('');
                setIsPasteJsonOpen(true);
              }}
              activeOpacity={0.8}
            >
              <FileText size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.btnSecondaryText}>Paste Text</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Push Notifications Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Bell size={24} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Push Notifications</Text>
              <Text style={styles.cardSub}>
                Test push notifications to make sure scheduled task reminders will trigger on time.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Bell size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnPrimaryText}>Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Ring Notifications Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BellRing size={24} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Ring Notifications</Text>
              <Text style={styles.cardSub}>
                Test the looping ring alarm (auto-stops). On device builds you also get lock-screen
                actions: Mark as done, Remind after 1 hour, Off.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleTestRingNotification}
            activeOpacity={0.8}
          >
            <BellRing size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.btnPrimaryText}>Test Ring Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary, { marginTop: 10 }]}
            onPress={() => void stopRingAlarm()}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>Stop Ring</Text>
          </TouchableOpacity>
        </View>

        {/* Reset / Danger Zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={24} color={colors.danger} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.danger }]}>Danger Zone</Text>
              <Text style={styles.cardSub}>
                Clear all habits and reset the app back to initial state.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={handleClearAll}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.dangerBtnText}>Clear All Habit Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL 1: View Raw JSON */}
      <Modal visible={isViewJsonOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raw JSON Data</Text>
              <TouchableOpacity onPress={() => setIsViewJsonOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.jsonScrollView}>
              <Text style={styles.jsonText}>{rawJsonString}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleCopyClipboard}>
                <Copy size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnText}>Copy to Clipboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceMuted }]}
                onPress={() => setIsViewJsonOpen(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Paste JSON */}
      <Modal visible={isPasteJsonOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Paste JSON Data</Text>
              <TouchableOpacity onPress={() => setIsPasteJsonOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Paste your exported JSON string below to import habits:
            </Text>

            <TextInput
              style={styles.jsonInput}
              multiline
              placeholder='{"todos": [...]}'
              placeholderTextColor={colors.inactive}
              value={pastedJsonText}
              onChangeText={setPastedJsonText}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, !pastedJsonText.trim() && { opacity: 0.5 }]}
                disabled={!pastedJsonText.trim()}
                onPress={() => prepareImport(pastedJsonText.trim())}
              >
                <Text style={styles.modalBtnText}>Validate & Import</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surfaceMuted }]}
                onPress={() => setIsPasteJsonOpen(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Import Confirmation (Merge vs Replace) */}
      <Modal visible={isConfirmImportOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 420 }]}>
            <View style={styles.confirmIconWrap}>
              <Upload size={28} color={colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>Confirm JSON Import</Text>
            <Text style={styles.confirmSub}>
              Found <Text style={{ fontWeight: '700', color: colors.primary }}>{importSummaryCount}</Text>{' '}
              habits in the JSON data. How would you like to apply this backup?
            </Text>

            <View style={styles.confirmChoiceGroup}>
              <TouchableOpacity
                style={styles.choiceBtn}
                onPress={() => handleConfirmImport('merge')}
                activeOpacity={0.8}
              >
                <View style={styles.choiceBtnIconWrap}>
                  <GitMerge size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.choiceBtnTitle}>Merge Data (Recommended)</Text>
                  <Text style={styles.choiceBtnSub}>
                    Combines imported habits with your existing habits without deleting anything.
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceBtn, styles.choiceBtnDanger]}
                onPress={() => handleConfirmImport('replace')}
                activeOpacity={0.8}
              >
                <View style={[styles.choiceBtnIconWrap, styles.choiceBtnIconWrapDanger]}>
                  <RefreshCw size={20} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.choiceBtnTitle, { color: colors.danger }]}>
                    Replace All Data
                  </Text>
                  <Text style={styles.choiceBtnSub}>
                    Replaces all current habits with the habits in this JSON file.
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelChoiceBtn}
              onPress={() => setIsConfirmImportOpen(false)}
            >
              <Text style={styles.cancelChoiceText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  toast: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
    lineHeight: 20,
  },
  appearanceLabel: {
    fontSize: fs(13),
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 14,
    marginBottom: 8,
    fontFamily,
  },
  appearanceMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  appearanceMoreBtnText: {
    color: colors.primary,
    fontSize: fs(13),
    fontWeight: '700',
    fontFamily,
  },
  appearanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appearanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appearanceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appearanceChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  appearanceChipText: {
    fontSize: fs(13),
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily,
  },
  appearanceChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  accentRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  accentOption: {
    alignItems: 'center',
    gap: 6,
  },
  accentSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accentSwatchSelected: {
    borderColor: colors.text,
  },
  accentOptionText: {
    fontSize: fs(12),
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily,
  },
  accentOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily,
    marginTop: 2,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  cardIcon: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  cardSub: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily,
    marginTop: 2,
    lineHeight: 18,
  },
  setupHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 17,
  },
  syncMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetPreviewWrap: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  widgetPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  widgetPreviewCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  widgetPreviewLabel: {
    fontSize: fs(12),
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily,
  },
  syncMetaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  syncMetaSub: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily,
    marginTop: 2,
    lineHeight: 16,
  },
  lastSyncedText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily,
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    minHeight: 44,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 12,
  },
  btnInRow: {
    flex: 1,
    alignSelf: 'auto',
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  inlineLinkBtn: {
    marginTop: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },

  // Modal styles
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  modalSub: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily,
    marginBottom: 12,
  },
  modalClose: {
    fontSize: 20,
    color: colors.textMuted,
    fontFamily,
    fontWeight: '600',
  },
  jsonScrollView: {
    backgroundColor: colors.black,
    borderRadius: 10,
    padding: 12,
    maxHeight: 280,
  },
  jsonText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#38bdf8',
  },
  jsonInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text,
    height: 150,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // Confirm Modal specific
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
  choiceBtnDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  choiceBtnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnIconWrapDanger: {
    backgroundColor: colors.dangerSoft,
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
