import { Bell, Clock, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';

export interface TodoItemProps {
  name: string;
  icon: string;
  category?: string;
  timeMinutes?: number;
  priority?: number;
  notificationTime?: string;
  notificationEnabled?: boolean;
  completed: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onToggleNotification?: () => void;
}

const ICON_PASTELS = ['#fce7f3', '#e0f2fe', '#dcfce7', '#fef3c7', '#ede9fe', '#ffedd5'];
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  fitness: { bg: '#dbeafe', text: '#1d4ed8' },
  health: { bg: '#dcfce7', text: '#15803d' },
  work: { bg: '#ede9fe', text: '#6d28d9' },
  home: { bg: '#ffedd5', text: '#c2410c' },
  hobbies: { bg: '#fce7f3', text: '#be185d' },
};

export function getCategoryStyle(
  category?: string,
  themeColors?: Pick<ThemeColors, 'primary' | 'primarySoft'>
) {
  if (!category) {
    return {
      bg: themeColors?.primarySoft ?? '#eef2ff',
      text: themeColors?.primary ?? '#6264FD',
    };
  }
  const key = category.trim().toLowerCase();
  return CATEGORY_COLORS[key] || { bg: '#e0f2fe', text: '#0369a1' };
}

export function getIconBg(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i) * (i + 1)) % 997;
  return ICON_PASTELS[hash % ICON_PASTELS.length];
}

export function TodoItem({
  name,
  icon,
  category,
  timeMinutes,
  priority = 0,
  notificationTime,
  notificationEnabled,
  completed,
  disabled = false,
  onToggle,
  onToggleNotification,
}: TodoItemProps) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const categoryStyle = useMemo(() => getCategoryStyle(category, colors), [category, colors]);
  const iconBg = useMemo(() => getIconBg(name || icon), [name, icon]);

  const handleToggle = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle();
  };

  const prioLevel = typeof priority === 'number' && !isNaN(priority) ? priority : 0;

  return (
    <Animated.View
      style={[
        styles.todoCard,
        { transform: [{ scale: scaleAnim }] },
        disabled && styles.todoCardDisabled,
      ]}
    >
      <TouchableOpacity
        style={styles.todoRow}
        onPress={handleToggle}
        activeOpacity={disabled ? 1 : 0.85}
        disabled={disabled}
      >
        <View
          style={[
            styles.checkbox,
            completed && styles.checkboxDone,
            disabled && styles.checkboxDisabled,
          ]}
        >
          {completed && <Text style={styles.checkmark}>✓</Text>}
        </View>

        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Text style={[styles.todoIcon, disabled && styles.todoIconDisabled]}>{icon}</Text>
        </View>

        <View style={styles.todoInfoWrap}>
          <View style={styles.todoMain}>
            <Text
              style={[
                styles.todoName,
                completed && styles.todoNameDone,
                disabled && styles.todoNameDisabled,
              ]}
              numberOfLines={1}
            >
              {name}
            </Text>

            <View style={styles.metaRow}>
              {notificationTime ? (
                <View style={styles.timingRow}>
                  <Clock size={10} color={colors.primary} />
                  <Text style={styles.timingSubtext}>{notificationTime}</Text>
                </View>
              ) : null}
              {category ? (
                <View style={[styles.categoryBadge, { backgroundColor: categoryStyle.bg }]}>
                  <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
                    {category}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.badgesCol}>
            {prioLevel > 0 ? (
              <View
                style={[
                  styles.priorityBadge,
                  prioLevel >= 3
                    ? styles.priorityBadgeHigh
                    : prioLevel >= 1
                      ? styles.priorityBadgeMed
                      : styles.priorityBadgeNormal,
                ]}
              >
                <Zap
                  size={9}
                  color={prioLevel >= 3 ? colors.danger : prioLevel >= 1 ? '#d97706' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.priorityBadgeText,
                    prioLevel >= 3
                      ? styles.priorityBadgeTextHigh
                      : prioLevel >= 1
                        ? styles.priorityBadgeTextMed
                        : styles.priorityBadgeTextNormal,
                  ]}
                >
                  P{prioLevel}
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.timeBadge,
                completed && styles.timeBadgeDone,
                disabled && styles.timeBadgeDisabled,
              ]}
            >
              <Text style={[styles.timeBadgeText, disabled && styles.timeBadgeTextDisabled]}>
                ◷ {timeMinutes ?? 30}m
              </Text>
            </View>

            {onToggleNotification ? (
              <TouchableOpacity
                style={[styles.bellBtn, notificationEnabled && styles.bellBtnActive]}
                onPress={onToggleNotification}
                hitSlop={6}
              >
                <Bell size={11} color={notificationEnabled ? colors.primary : colors.inactive} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    todoCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    todoCardDisabled: {
      opacity: 0.65,
    },
    todoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 17,
      paddingVertical: 13,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxDone: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    checkboxDisabled: {
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
    },
    checkmark: {
      color: colors.white,
      fontSize: fs(11),
      fontWeight: '700',
      fontFamily,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    todoIcon: {
      fontSize: 17,
    },
    todoIconDisabled: {
      opacity: 0.5,
    },
    todoInfoWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    todoMain: {
      flex: 1,
      marginRight: 8,
      minWidth: 0,
    },
    todoName: {
      fontSize: fs(14),
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
      fontFamily,
    },
    todoNameDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    todoNameDisabled: {
      color: colors.textMuted,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      gap: 6,
      flexWrap: 'wrap',
    },
    categoryBadge: {
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    categoryText: {
      fontSize: fs(10),
      fontWeight: '700',
      fontFamily,
    },
    timingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    timingSubtext: {
      fontSize: fs(10),
      fontWeight: '600',
      color: colors.primary,
      fontFamily,
    },
    badgesCol: {
      alignItems: 'flex-end',
      gap: 4,
      flexShrink: 0,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    priorityBadgeNormal: {
      backgroundColor: colors.surfaceMuted,
    },
    priorityBadgeMed: {
      backgroundColor: colors.warningSoft,
    },
    priorityBadgeHigh: {
      backgroundColor: colors.dangerSoft,
    },
    priorityBadgeText: {
      fontSize: fs(10),
      fontWeight: '700',
      fontFamily,
    },
    priorityBadgeTextNormal: {
      color: colors.textMuted,
    },
    priorityBadgeTextMed: {
      color: '#b45309',
    },
    priorityBadgeTextHigh: {
      color: '#b91c1c',
    },
    bellBtn: {
      width: 24,
      height: 24,
      borderRadius: 6,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellBtnActive: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryMuted,
    },
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeBadgeDone: {
      opacity: 0.6,
    },
    timeBadgeDisabled: {
      opacity: 0.7,
    },
    timeBadgeText: {
      fontSize: fs(10),
      fontWeight: '600',
      color: colors.textMuted,
      fontFamily,
    },
    timeBadgeTextDisabled: {
      color: colors.inactive,
    },
  });
}
