import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart2, Check, CheckCircle2, Flame, Minus, Trophy, X, XCircle } from 'lucide-react-native';
import { useTheme } from '@/context/theme-context';
import { formatDateKey, getMonday, getTodoInsights, isTodoCompleted, Todo } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDaysFromMonday(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

interface InsightsModalProps {
  visible: boolean;
  onClose: () => void;
  todos: Todo[];
}

function ActivityInsightCard({ todo }: { todo: Todo }) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const insights = getTodoInsights(todo);
  const now = new Date();
  const todayKey = formatDateKey(now);
  const monday = getMonday(now);
  const weekDays = getWeekDaysFromMonday(monday);

  return (
    <View style={styles.card}>
      {/* Activity Title Row */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIcon}>{todo.icon}</Text>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {todo.name}
          </Text>
        </View>
        {insights.currentStreak > 0 && (
          <View style={styles.activePill}>
            <Flame size={12} color="#d97706" style={{ marginRight: 3 }} />
            <Text style={styles.activePillText}>Active</Text>
          </View>
        )}
      </View>

      {/* Subtle Divider */}
      <View style={styles.cardDivider} />

      {/* Streaks Row */}
      <View style={styles.streaksContainer}>
        <View style={styles.streakBlock}>
          <View style={styles.labelWithIcon}>
            <Flame size={13} color="#d97706" style={{ marginRight: 4 }} />
            <Text style={styles.streakLabel}>Current streak</Text>
          </View>
          <Text style={styles.streakValue}>
            {insights.currentStreak} {insights.currentStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
        <View style={styles.streakSeparator} />
        <View style={styles.streakBlock}>
          <View style={styles.labelWithIcon}>
            <Trophy size={13} color="#ca8a04" style={{ marginRight: 4 }} />
            <Text style={styles.streakLabel}>Max streak</Text>
          </View>
          <Text style={styles.streakValue}>
            {insights.maxStreak} {insights.maxStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      {/* Completion vs Missed Pill Row */}
      <View style={styles.ratesRow}>
        <View style={styles.ratePillDone}>
          <View style={styles.labelWithIcon}>
            <CheckCircle2 size={13} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.rateLabelDone}>Completed</Text>
          </View>
          <Text style={styles.rateValueDone}>
            {insights.completedCount} ({insights.completedPct}%)
          </Text>
        </View>
        <View style={styles.ratePillMissed}>
          <View style={styles.labelWithIcon}>
            <XCircle size={13} color="#dc2626" style={{ marginRight: 4 }} />
            <Text style={styles.rateLabelMissed}>Missed</Text>
          </View>
          <Text style={styles.rateValueMissed}>
            {insights.missedCount} ({insights.missedPct}%)
          </Text>
        </View>
      </View>

      {/* Timeframe Quick-Stat Boxes */}
      <View style={styles.timeframesRow}>
        <View style={styles.timeframeBox}>
          <Text style={styles.timeframeLabel}>This week</Text>
          <Text style={styles.timeframeValue}>
            {insights.weekCompleted} / {insights.weekTotal}
          </Text>
        </View>
        <View style={styles.timeframeBox}>
          <Text style={styles.timeframeLabel}>This month</Text>
          <Text style={styles.timeframeValue}>
            {insights.monthCompleted} / {insights.monthTotal}
          </Text>
        </View>
        <View style={styles.timeframeBox}>
          <Text style={styles.timeframeLabel}>All time</Text>
          <Text style={styles.timeframeValue}>
            {insights.allTimeCompleted} / {insights.allTimeTotal}
          </Text>
        </View>
      </View>

      {/* 7-Day History Badges Row (No heading text) */}
      <View style={styles.weekHistorySection}>
        <View style={styles.weekHistoryRow}>
          {weekDays.map((day, index) => {
            const dayKey = formatDateKey(day);
            const isCompleted = isTodoCompleted(todo, dayKey);
            const isToday = dayKey === todayKey;
            const isFuture = dayKey > todayKey;

            return (
              <View
                key={dayKey}
                style={[
                  styles.historyPill,
                  isToday && styles.historyPillToday,
                ]}
              >
                <Text style={[styles.historyDayLabel, isToday && styles.historyDayLabelToday]}>
                  {DAY_LABELS[index]}
                </Text>

                <View
                  style={[
                    styles.historyBadge,
                    isCompleted && styles.historyBadgeDone,
                    !isCompleted && !isFuture && styles.historyBadgeMissed,
                    isFuture && styles.historyBadgeFuture,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={11} color="#ffffff" strokeWidth={3} />
                  ) : isFuture ? (
                    <Minus size={11} color="#94a3b8" strokeWidth={2.5} />
                  ) : (
                    <X size={11} color="#ef4444" strokeWidth={3} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function InsightsModal({ visible, onClose, todos }: InsightsModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop clickable to dismiss */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Modal Bottom Sheet Container */}
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Modal Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderTitleRow}>
              <BarChart2 size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.sheetTitle}>Activity Insights</Text>
                <Text style={styles.sheetSubtitle}>
                  {todos.length} {todos.length === 1 ? 'activity' : 'activities'} tracked
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={12}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Activity Cards List */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {todos.length === 0 ? (
              <View style={styles.emptyState}>
                <BarChart2 size={44} color={colors.inactive} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>No activities yet</Text>
                <Text style={styles.emptySubtext}>
                  Add tasks from the home screen to see detailed streak and completion stats here.
                </Text>
              </View>
            ) : (
              todos.map((todo) => (
                <ActivityInsightCard key={todo.id} todo={todo} />
              ))
            )}
          </ScrollView>
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
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryMuted,
  },
  sheetHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily,
    letterSpacing: -0.4,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
    flexShrink: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d97706',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.surfaceMuted,
    marginBottom: 9,
  },
  streaksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  streakBlock: {
    flex: 1,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b21a8',
    marginBottom: 2,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    fontFamily,
  },
  streakSeparator: {
    width: 1,
    height: 26,
    backgroundColor: '#e9d5ff',
    marginHorizontal: 10,
  },
  ratesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratePillDone: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  rateLabelDone: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065f46',
  },
  rateValueDone: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  ratePillMissed: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  rateLabelMissed: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991b1b',
  },
  rateValueMissed: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },
  timeframesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timeframeBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeframeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily,
    marginBottom: 2,
    textAlign: 'center',
  },
  timeframeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text,
    fontFamily,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    fontFamily,
    textAlign: 'center',
    lineHeight: 18,
  },
  weekHistorySection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  weekHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyPill: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.surface,
    minWidth: 38,
  },
  historyPillToday: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  historyDayLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  historyDayLabelToday: {
    color: colors.primary,
    fontWeight: '800',
  },
  historyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadgeDone: {
    backgroundColor: colors.success,
  },
  historyBadgeMissed: {
    backgroundColor: colors.dangerSoft,
  },
  historyBadgeFuture: {
    backgroundColor: colors.border,
  },
  });
}
