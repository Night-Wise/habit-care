import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRight,
  Bell,
  Clock,
  FilePen,
  Palette,
  Pencil,
  Search,
  Tag,
  Zap,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import type { TextInput as TextInputType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitIcon } from '@/components/habit-icon';
import { IconPickerModal } from '@/components/icon-picker-modal';
import { useTheme } from '@/context/theme-context';
import { useTodos } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';
import { DEFAULT_HABIT_ICON, POPULAR_HABIT_ICONS } from '@/utils/habit-icons';

const TIME_PRESETS = [15, 30, 45, 60];
const PRIORITY_PRESETS = [0, 1, 2, 3, 5];
const SCHEDULE_TIMING_PRESETS = [
  '06:00 AM',
  '08:00 AM',
  '10:00 AM',
  '01:00 PM',
  '06:00 PM',
  '10:30 PM',
];
const DEFAULT_ICON = DEFAULT_HABIT_ICON;
const CATEGORY_PRESETS = [
  'Health',
  'Fitness',
  'Food',
  'Development',
  'Learning',
  'Job',
  'Finance',
  'Personal',
  'Home',
];

type Meridiem = 'AM' | 'PM';

function pad2(value: string | number) {
  return String(value).padStart(2, '0');
}

function formatScheduleTime(hour: string, minute: string, period: Meridiem) {
  const h = Math.min(12, Math.max(1, parseInt(hour, 10) || 8));
  const m = Math.min(59, Math.max(0, parseInt(minute, 10) || 0));
  return `${pad2(h)}:${pad2(m)} ${period}`;
}

function parseScheduleParts(value: string): { hour: string; minute: string; period: Meridiem } {
  const match = value.trim().toUpperCase().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) {
    return { hour: '08', minute: '00', period: 'AM' };
  }
  return {
    hour: pad2(Math.min(12, Math.max(1, parseInt(match[1], 10) || 8))),
    minute: pad2(Math.min(59, Math.max(0, parseInt(match[2], 10) || 0))),
    period: match[3] as Meridiem,
  };
}

export default function AddOrEditTaskPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const todoId = typeof id === 'string' ? id : undefined;
  const { todos, isLoaded, addTodo, editTodo } = useTodos();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const isEdit = Boolean(todoId);
  const todo = isEdit ? todos.find((item) => item.id === todoId) : undefined;

  const dismissScreen = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const initialSchedule = parseScheduleParts(todo?.notificationTime ?? '08:00 AM');
  const initialCategory = todo?.category ?? '';
  const initialIsCustomCategory =
    initialCategory.length > 0 &&
    !CATEGORY_PRESETS.some((preset) => preset.toLowerCase() === initialCategory.toLowerCase());

  const [name, setName] = useState(todo?.name ?? '');
  const [time, setTime] = useState(String(todo?.timeMinutes ?? 30));
  const [selectedIcon, setSelectedIcon] = useState<string | null>(todo?.icon ?? null);
  const [category, setCategory] = useState(initialCategory);
  const [isCustomCategory, setIsCustomCategory] = useState(initialIsCustomCategory);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [scheduleHour, setScheduleHour] = useState(initialSchedule.hour);
  const [scheduleMinute, setScheduleMinute] = useState(initialSchedule.minute);
  const [schedulePeriod, setSchedulePeriod] = useState<Meridiem>(initialSchedule.period);
  const [notificationEnabled, setNotificationEnabled] = useState(
    todo?.notificationEnabled ?? true
  );
  const [priority, setPriority] = useState(String(todo?.priority ?? 0));
  const [hasHydratedEdit, setHasHydratedEdit] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit || !todo || hasHydratedEdit) return;
    const schedule = parseScheduleParts(todo.notificationTime ?? '08:00 AM');
    const nextCategory = todo.category ?? '';
    setName(todo.name);
    setTime(String(todo.timeMinutes ?? 30));
    setSelectedIcon(todo.icon ?? null);
    setCategory(nextCategory);
    setIsCustomCategory(
      nextCategory.length > 0 &&
        !CATEGORY_PRESETS.some((preset) => preset.toLowerCase() === nextCategory.toLowerCase())
    );
    setScheduleHour(schedule.hour);
    setScheduleMinute(schedule.minute);
    setSchedulePeriod(schedule.period);
    setNotificationEnabled(todo.notificationEnabled ?? true);
    setPriority(String(todo.priority ?? 0));
    setHasHydratedEdit(true);
  }, [isEdit, todo, hasHydratedEdit]);

  const scheduledTime = useMemo(
    () => formatScheduleTime(scheduleHour, scheduleMinute, schedulePeriod),
    [scheduleHour, scheduleMinute, schedulePeriod]
  );

  const quickIcons = useMemo(() => {
    const defaultList = POPULAR_HABIT_ICONS.slice(0, 10);
    if (selectedIcon && !defaultList.includes(selectedIcon)) {
      return [selectedIcon, ...defaultList.slice(0, 9)];
    }
    return defaultList;
  }, [selectedIcon]);

  const canSubmit = name.trim().length > 0;
  const displayIcon = selectedIcon ?? DEFAULT_ICON;

  const applySchedulePreset = (preset: string) => {
    const parts = parseScheduleParts(preset);
    setScheduleHour(parts.hour);
    setScheduleMinute(parts.minute);
    setSchedulePeriod(parts.period);
  };

  const handleHourChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    setScheduleHour(digits);
  };

  const handleMinuteChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    setScheduleMinute(digits);
  };

  const handleHourBlur = () => {
    const parsed = parseInt(scheduleHour, 10);
    if (!scheduleHour || isNaN(parsed) || parsed < 1) {
      setScheduleHour('08');
      return;
    }
    setScheduleHour(pad2(Math.min(12, parsed)));
  };

  const handleMinuteBlur = () => {
    const parsed = parseInt(scheduleMinute, 10);
    if (!scheduleMinute || isNaN(parsed) || parsed < 0) {
      setScheduleMinute('00');
      return;
    }
    setScheduleMinute(pad2(Math.min(59, parsed)));
  };

  const handleDurationChange = (value: string) => {
    setTime(value.replace(/\D/g, '').slice(0, 4));
  };

  const handlePriorityChange = (value: string) => {
    setPriority(value.replace(/\D/g, '').slice(0, 4));
  };

  const durationInputRef = useRef<TextInputType>(null);
  const priorityInputRef = useRef<TextInputType>(null);
  const isCustomDuration = !TIME_PRESETS.some((preset) => time.trim() === String(preset));
  const isCustomPriority = !PRIORITY_PRESETS.some((preset) => priority.trim() === String(preset));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const parsed = parseInt(time.trim(), 10);
    const minutes = !isNaN(parsed) && parsed > 0 ? parsed : 30;
    const parsedPriority = parseInt(priority.trim(), 10);
    const prioVal = !isNaN(parsedPriority) ? parsedPriority : 0;

    if (isEdit && todoId) {
      await editTodo(
        todoId,
        name.trim(),
        displayIcon,
        minutes,
        scheduledTime,
        notificationEnabled,
        prioVal,
        category.trim()
      );
    } else {
      await addTodo(
        name.trim(),
        displayIcon,
        minutes,
        scheduledTime,
        notificationEnabled,
        prioVal,
        category.trim()
      );
    }
    dismissScreen();
  };

  const selectCategory = (preset: string) => {
    setIsCustomCategory(false);
    setCategory((current) => (current === preset ? '' : preset));
  };

  const openCustomCategory = () => {
    setIsCustomCategory(true);
    if (CATEGORY_PRESETS.some((preset) => preset.toLowerCase() === category.trim().toLowerCase())) {
      setCategory('');
    }
  };

  if (isEdit && !isLoaded) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFound}>Loading...</Text>
      </View>
    );
  }

  if (isEdit && !todo) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFound}>Task not found.</Text>
        <TouchableOpacity onPress={dismissScreen} style={styles.backFallback}>
          <Text style={styles.backFallbackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isEdit && !hasHydratedEdit) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.notFound}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={dismissScreen} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Task' : 'New Task'}</Text>
          <Text style={styles.headerSub}>
            {isEdit ? 'Update this habit and keep going' : 'Build better habits, one task at a time'}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Task Name */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primarySoft }]}>
              <FilePen size={16} color={colors.primary} />
            </View>
            <Text style={styles.cardLabel}>
              Task Name <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning run, Read 20 pages..."
            placeholderTextColor={colors.inactive}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            maxLength={60}
            autoFocus={!isEdit}
          />
        </View>

        {/* Category */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#dcfce7' }]}>
              <Tag size={15} color="#16a34a" />
            </View>
            <Text style={styles.cardLabel}>Category (Optional)</Text>
          </View>
          <View style={styles.chipWrap}>
            {CATEGORY_PRESETS.map((preset) => {
              const isSelected =
                !isCustomCategory && category.trim().toLowerCase() === preset.toLowerCase();
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => selectCategory(preset)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.customChip, isCustomCategory && styles.customChipActive]}
              onPress={openCustomCategory}
              activeOpacity={0.75}
            >
              <Text style={[styles.customChipText, isCustomCategory && styles.customChipTextActive]}>
                + Custom
              </Text>
            </TouchableOpacity>
          </View>
          {isCustomCategory ? (
            <TextInput
              style={[styles.input, styles.customCategoryInput]}
              placeholder="Enter custom category"
              placeholderTextColor={colors.inactive}
              value={category}
              onChangeText={setCategory}
              maxLength={30}
              autoFocus
            />
          ) : null}
        </View>

        {/* Timing */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#e0f2fe' }]}>
              <Clock size={15} color="#0284c7" />
            </View>
            <Text style={styles.cardLabel}>When do you want to do this?</Text>
            <Text style={styles.cardHint}>HH:MM AM/PM</Text>
          </View>

          <View style={styles.scheduleRow}>
            <View style={styles.scheduleTimeGroup}>
              <TextInput
                style={styles.scheduleDigitInput}
                value={scheduleHour}
                onChangeText={handleHourChange}
                onBlur={handleHourBlur}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="08"
                placeholderTextColor={colors.inactive}
                selectTextOnFocus
              />
              <Text style={styles.scheduleColon}>:</Text>
              <TextInput
                style={styles.scheduleDigitInput}
                value={scheduleMinute}
                onChangeText={handleMinuteChange}
                onBlur={handleMinuteBlur}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="00"
                placeholderTextColor={colors.inactive}
                selectTextOnFocus
              />
            </View>

            <View style={styles.periodToggle}>
              {(['AM', 'PM'] as Meridiem[]).map((period) => {
                const isSelected = schedulePeriod === period;
                return (
                  <TouchableOpacity
                    key={period}
                    style={[styles.periodBtn, isSelected && styles.periodBtnSelected]}
                    onPress={() => setSchedulePeriod(period)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.periodBtnText, isSelected && styles.periodBtnTextSelected]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timingPresetsRow}
          >
            {SCHEDULE_TIMING_PRESETS.map((preset) => {
              const isSelected = scheduledTime === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.outlineChip, isSelected && styles.outlineChipSelected]}
                  onPress={() => applySchedulePreset(preset)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.outlineChipText, isSelected && styles.outlineChipTextSelected]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Push Notification */}
        <View style={styles.notificationCard}>
          <View style={[styles.sectionIcon, { backgroundColor: '#fce7f3' }]}>
            <Bell size={15} color="#db2777" />
          </View>
          <View style={styles.notificationCopy}>
            <Text style={styles.notificationTitle}>Push Notification</Text>
            <Text style={styles.notificationSub}>
              {notificationEnabled
                ? `Get a reminder at ${scheduledTime}`
                : 'Notifications disabled for this task'}
            </Text>
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            trackColor={{ false: colors.borderStrong, true: colors.primaryMuted }}
            thumbColor={notificationEnabled ? colors.primary : colors.surface}
          />
        </View>

        {/* Duration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#ccfbf1' }]}>
              <Clock size={15} color="#0d9488" />
            </View>
            <Text style={[styles.cardLabel, { flex: 1 }]}>Estimated Duration</Text>
            <Text style={styles.fieldHint}>Tap field to type custom</Text>
          </View>
          <View style={styles.fieldInputRow}>
            <Pressable
              style={[
                styles.fieldInputWrap,
                isCustomDuration && time.trim().length > 0 && styles.fieldInputWrapCustom,
              ]}
              onPress={() => durationInputRef.current?.focus()}
            >
              <TextInput
                ref={durationInputRef}
                style={styles.fieldInput}
                value={time}
                onChangeText={handleDurationChange}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="e.g. 20"
                placeholderTextColor={colors.inactive}
                selectTextOnFocus
              />
              <Text style={styles.fieldInputSuffix}>min</Text>
              <Pencil size={13} color={colors.inactive} style={{ marginLeft: 4 }} />
            </Pressable>
            <View style={styles.presetsRow}>
              {TIME_PRESETS.map((preset) => {
                const isSelected = time.trim() === String(preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                    onPress={() => setTime(String(preset))}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}
                    >
                      {preset}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {isCustomDuration && time.trim().length > 0 ? (
            <Text style={styles.customValueNote}>Custom: {time} min</Text>
          ) : null}
        </View>

        {/* Priority */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#ffedd5' }]}>
              <Zap size={15} color="#ea580c" />
            </View>
            <Text style={[styles.cardLabel, { flex: 1 }]}>Task Priority</Text>
            <Text style={styles.fieldHint}>Tap field to type custom</Text>
          </View>
          <View style={styles.fieldInputRow}>
            <Pressable
              style={[
                styles.fieldInputWrap,
                isCustomPriority && priority.trim().length > 0 && styles.fieldInputWrapCustom,
              ]}
              onPress={() => priorityInputRef.current?.focus()}
            >
              <TextInput
                ref={priorityInputRef}
                style={styles.fieldInput}
                value={priority}
                onChangeText={handlePriorityChange}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="e.g. 4"
                placeholderTextColor={colors.inactive}
                selectTextOnFocus
              />
              <Text style={styles.fieldInputSuffix}>level</Text>
              <Pencil size={13} color={colors.inactive} style={{ marginLeft: 4 }} />
            </Pressable>
            <View style={styles.presetsRow}>
              {PRIORITY_PRESETS.map((preset) => {
                const isSelected = priority.trim() === String(preset);
                return (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, isSelected && styles.presetChipSelected]}
                    onPress={() => setPriority(String(preset))}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[styles.presetChipText, isSelected && styles.presetChipTextSelected]}
                    >
                      P{preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {isCustomPriority && priority.trim().length > 0 ? (
            <Text style={styles.customValueNote}>Custom: P{priority}</Text>
          ) : null}
        </View>

        {/* Pick an Icon */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primarySoft }]}>
              <Palette size={15} color={colors.primary} />
            </View>
            <Text style={[styles.cardLabel, { flex: 1 }]}>Pick an Icon</Text>
            <TouchableOpacity
              style={styles.searchIconsBtn}
              onPress={() => setIsIconModalOpen(true)}
              activeOpacity={0.75}
            >
              <Search size={13} color={colors.primary} />
              <Text style={styles.searchIconsBtnText}>Search Icons</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.iconRow}
          >
            {quickIcons.map((item) => {
              const isSelected = displayIcon === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.iconBtn, isSelected && styles.iconBtnSelected]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <HabitIcon
                    icon={item}
                    size={22}
                    color={isSelected ? colors.primary : colors.text}
                    strokeWidth={2}
                  />
                </Pressable>
              );
            })}
            <Pressable style={styles.moreIconBtn} onPress={() => setIsIconModalOpen(true)}>
              <Text style={styles.moreIconText}>⋯</Text>
            </Pressable>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <TouchableOpacity
          style={[styles.addBtn, !canSubmit && styles.addBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={!canSubmit}
        >
          <Text style={styles.addBtnText}>{isEdit ? 'Save Changes' : 'Add Task'}</Text>
          {!isEdit ? <ArrowRight size={18} color="#ffffff" strokeWidth={2.5} /> : null}
        </TouchableOpacity>
      </View>

      <IconPickerModal
        visible={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        onSelectIcon={(iconId) => setSelectedIcon(iconId)}
        selectedIcon={selectedIcon}
      />
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: colors.background,
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
  },
  headerTitle: {
    fontSize: fs(20),
    fontWeight: '800',
    color: colors.text,
    fontFamily,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: fs(11),
    color: colors.textMuted,
    fontFamily,
    marginTop: 3,
    textAlign: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    fontSize: fs(14),
    color: colors.textMuted,
    fontFamily,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  required: {
    color: colors.danger,
  },
  cardHint: {
    marginLeft: 'auto',
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldInputWrapCustom: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 0,
  },
  fieldInputSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginLeft: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  presetChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  presetChipTextSelected: {
    color: colors.primary,
  },
  customValueNote: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
  },
  customCategoryInput: {
    marginTop: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  customChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  customChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderStyle: 'solid',
  },
  customChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  customChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  scheduleTimeGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scheduleDigitInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 10,
  },
  scheduleColon: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginHorizontal: 2,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  periodBtnSelected: {
    backgroundColor: colors.primary,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  periodBtnTextSelected: {
    color: colors.white,
  },
  timingPresetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  outlineChip: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineChipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  outlineChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  outlineChipTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  notificationSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchIconsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  searchIconsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  iconRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconBtnSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  iconEmoji: {
    fontSize: 22,
  },
  moreIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  moreIconText: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: -4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.background,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  notFound: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  backFallback: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  backFallbackText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fs(14),
    fontFamily,
  },
  });
}
