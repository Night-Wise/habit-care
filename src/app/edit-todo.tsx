import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, Clock, Search, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmojiPickerModal } from '@/components/emoji-picker-modal';
import { useTodos } from '@/context/todos-context';
import { POPULAR_EMOJIS } from '@/utils/emoji-data';

const TIME_PRESETS = [15, 30, 45, 60];

const SCHEDULE_TIMING_PRESETS = [
  '6:00 AM',
  '8:00 AM',
  '10:00 AM',
  '1:00 PM',
  '6:00 PM',
  '10:30 PM',
];
const CATEGORY_PRESETS = ['Health', 'Fitness', 'Food', 'Development', 'Learning', 'Job', 'Finance', 'Personal', 'Home'];

export default function EditTodoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { todos, editTodo } = useTodos();

  const todo = todos.find((t) => t.id === id);

  const [name, setName] = useState(todo?.name ?? '');
  const [time, setTime] = useState(String(todo?.timeMinutes ?? 30));
  const [selectedIcon, setSelectedIcon] = useState<string>(todo?.icon ?? '✅');
  const [category, setCategory] = useState<string>(todo?.category ?? '');
  const [scheduledTime, setScheduledTime] = useState<string>(todo?.notificationTime ?? '06:00 AM');
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(
    todo?.notificationEnabled ?? false
  );
  const [priority, setPriority] = useState<string>(String(todo?.priority ?? 0));
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);

  // Derive quick icons list ensuring selectedIcon is included if custom
  const quickIcons = useMemo(() => {
    const defaultList = POPULAR_EMOJIS.slice(0, 11);
    if (selectedIcon && !defaultList.includes(selectedIcon)) {
      return [selectedIcon, ...defaultList.slice(0, 10)];
    }
    return defaultList;
  }, [selectedIcon]);

  if (!todo) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFound}>Task not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const parsed = parseInt(time.trim(), 10);
    const minutes = !isNaN(parsed) && parsed > 0 ? parsed : 30;
    const parsedPriority = parseInt(priority.trim(), 10);
    const prioVal = !isNaN(parsedPriority) ? parsedPriority : 0;
    await editTodo(
      id,
      name.trim(),
      selectedIcon,
      minutes,
      scheduledTime.trim() || '06:00 AM',
      notificationEnabled,
      prioVal,
      category
    );
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Task name input */}
        <Text style={styles.sectionLabel}>Task name</Text>
        <TextInput
          style={styles.input}
          placeholder="Task name…"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
          returnKeyType="done"
          maxLength={60}
          autoFocus
        />

        {/* Optional category */}
        <Text style={styles.sectionLabel}>Category (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Choose or enter a category"
          placeholderTextColor="#9ca3af"
          value={category}
          onChangeText={setCategory}
          maxLength={30}
        />
        <View style={styles.timingPresetsWrap}>
          {CATEGORY_PRESETS.map((preset) => {
            const isSelected = category.trim().toLowerCase() === preset.toLowerCase();
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.timingChip, isSelected && styles.timingChipSelected]}
                onPress={() => setCategory(isSelected ? '' : preset)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timingChipText, isSelected && styles.timingChipTextSelected]}>
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Task Scheduled Time */}
        <View style={styles.timeSectionHeader}>
          <Text style={styles.sectionLabel}>Timing to do that task</Text>
          <Text style={styles.timeDefaultHint}>e.g. 6:00 AM, 10:30 PM</Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="e.g. 6:00 AM, 10:30 PM"
          placeholderTextColor="#9ca3af"
          value={scheduledTime}
          onChangeText={setScheduledTime}
        />

        {/* Schedule Preset Chips */}
        <View style={styles.timingPresetsWrap}>
          {SCHEDULE_TIMING_PRESETS.map((preset) => {
            const isSelected = scheduledTime.trim().toUpperCase() === preset.toUpperCase();
            return (
              <TouchableOpacity
                key={preset}
                style={[styles.timingChip, isSelected && styles.timingChipSelected]}
                onPress={() => setScheduledTime(preset)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timingChipText,
                    isSelected && styles.timingChipTextSelected,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notification Option Toggle */}
        <View style={styles.notificationToggleCard}>
          <View style={styles.notificationToggleLeft}>
            <View style={styles.bellIconWrap}>
              <Bell size={20} color={notificationEnabled ? '#6366f1' : '#94a3b8'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notificationToggleTitle}>Push Notification Alert</Text>
              <Text style={styles.notificationToggleSub}>
                {notificationEnabled
                  ? `Push-down pop banner at ${scheduledTime || '06:00 AM'}`
                  : 'Notifications disabled for this task'}
              </Text>
            </View>
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            trackColor={{ false: '#cbd5e1', true: '#c7d2fe' }}
            thumbColor={notificationEnabled ? '#6366f1' : '#f8fafc'}
          />
        </View>

        {/* Time duration input */}
        <View style={[styles.timeSectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionLabel}>Estimated Duration</Text>
          <Text style={styles.timeDefaultHint}>(default 30 min)</Text>
        </View>

        <View style={styles.timeInputRow}>
          <View style={styles.timeInputWrap}>
            <Clock size={18} color="#6366f1" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.timeInput}
              placeholder="30"
              placeholderTextColor="#9ca3af"
              value={time}
              onChangeText={setTime}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.timeInputSuffix}>min</Text>
          </View>

          {/* Quick preset chips */}
          <View style={styles.presetsRow}>
            {TIME_PRESETS.map((preset) => {
              const isSelected = time.trim() === String(preset);
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                  onPress={() => setTime(String(preset))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextSelected,
                    ]}
                  >
                    {preset}m
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Priority Input Section */}
        <View style={[styles.timeSectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionLabel}>Task Priority</Text>
          <Text style={styles.timeDefaultHint}>(default 0, higher = higher priority)</Text>
        </View>

        <View style={styles.timeInputRow}>
          <View style={styles.timeInputWrap}>
            <Zap size={18} color="#f59e0b" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.timeInput}
              placeholder="0"
              placeholderTextColor="#9ca3af"
              value={priority}
              onChangeText={setPriority}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={styles.timeInputSuffix}>level</Text>
          </View>

          {/* Quick priority chips */}
          <View style={styles.presetsRow}>
            {[0, 1, 2, 3, 5].map((preset) => {
              const isSelected = priority.trim() === String(preset);
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                  onPress={() => setPriority(String(preset))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected && styles.presetChipTextSelected,
                    ]}
                  >
                    P{preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Icon picker header */}
        <View style={styles.iconSectionHeader}>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Pick an icon</Text>
          <TouchableOpacity
            style={styles.searchMoreBtn}
            onPress={() => setIsEmojiModalOpen(true)}
            activeOpacity={0.7}
          >
            <Search size={14} color="#6366f1" style={{ marginRight: 4 }} />
            <Text style={styles.searchMoreBtnText}>Search & More</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={quickIcons}
          keyExtractor={(item) => item}
          numColumns={6}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.iconBtn,
                selectedIcon === item && styles.iconBtnSelected,
              ]}
              onPress={() => setSelectedIcon(item)}
            >
              <Text style={styles.iconEmoji}>{item}</Text>
            </Pressable>
          )}
          contentContainerStyle={styles.iconGrid}
        />
      </ScrollView>

      {/* Save button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      {/* Full Searchable Emoji Picker Modal */}
      <EmojiPickerModal
        visible={isEmojiModalOpen}
        onClose={() => setIsEmojiModalOpen(false)}
        onSelectEmoji={(emoji) => setSelectedIcon(emoji)}
        selectedEmoji={selectedIcon}
      />
    </KeyboardAvoidingView>
  );
}

const PURPLE = '#6366f1';
const PURPLE_LIGHT = '#eef2ff';
const TEXT = '#1e1b4b';
const SUBTEXT = '#6b7280';
const BORDER = '#e5e7eb';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 16,
    color: SUBTEXT,
    marginBottom: 16,
  },
  backFallback: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: PURPLE,
    borderRadius: 12,
  },
  backFallbackText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: SUBTEXT,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: SUBTEXT,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: TEXT,
    marginBottom: 12,
  },
  timingPresetsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timingChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timingChipSelected: {
    backgroundColor: PURPLE_LIGHT,
    borderColor: PURPLE,
  },
  timingChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: SUBTEXT,
  },
  timingChipTextSelected: {
    color: PURPLE,
    fontWeight: '700',
  },
  notificationToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  notificationToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  bellIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT,
  },
  notificationToggleSub: {
    fontSize: 12,
    color: SUBTEXT,
    marginTop: 2,
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeDefaultHint: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 8,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    flex: 1,
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    paddingVertical: 0,
  },
  timeInputSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: SUBTEXT,
    marginLeft: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  presetChipSelected: {
    backgroundColor: PURPLE_LIGHT,
    borderColor: PURPLE,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: SUBTEXT,
  },
  presetChipTextSelected: {
    color: PURPLE,
  },
  iconSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  searchMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  searchMoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  iconGrid: {
    gap: 8,
  },
  iconBtn: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconBtnSelected: {
    backgroundColor: PURPLE_LIGHT,
    borderColor: PURPLE,
  },
  iconEmoji: {
    fontSize: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  saveBtn: {
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
