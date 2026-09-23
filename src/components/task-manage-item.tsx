import { Bell, Clock, Pencil, Trash2, Zap } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getCategoryStyle, getIconBg } from '@/components/todo-item';
import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';

export function TaskManageItem({
  name,
  icon,
  category,
  timeMinutes,
  priority = 0,
  notificationTime,
  notificationEnabled,
  onEdit,
  onDelete,
  onToggleNotification,
}: {
  name: string;
  icon: string;
  category?: string;
  timeMinutes?: number;
  priority?: number;
  notificationTime?: string;
  notificationEnabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleNotification: () => void;
}) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const prioLevel = typeof priority === 'number' && !isNaN(priority) ? priority : 0;
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const categoryStyle = useMemo(() => getCategoryStyle(category, colors), [category, colors]);
  const iconBg = useMemo(() => getIconBg(name || icon), [name, icon]);

  const confirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    onDelete();
  };

  const handlePressIn = () => {
    Animated.timing(scaleAnim, { toValue: 0.98, duration: 60, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.taskCard, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.taskRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Text style={styles.taskIcon}>{icon}</Text>
        </View>

        <View style={styles.taskInfoWrap}>
          <View style={styles.taskMain}>
            <Text style={styles.taskName} numberOfLines={1}>
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

            <View style={styles.timeBadge}>
              <Clock size={10} color={colors.textMuted} />
              <Text style={styles.timeBadgeText}>{timeMinutes ?? 30}m</Text>
            </View>
          </View>
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.bellBtn, notificationEnabled && styles.bellBtnActive]}
            onPress={onToggleNotification}
            hitSlop={6}
          >
            <Bell size={14} color={notificationEnabled ? colors.primary : colors.inactive} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={8}
          >
            <Pencil size={14} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => setIsDeleteConfirmOpen(true)}
            hitSlop={8}
          >
            <Trash2 size={14} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isDeleteConfirmOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={22} color={colors.danger} />
            </View>
            <Text style={styles.confirmTitle}>Delete Task</Text>
            <Text style={styles.confirmSub}>
              Are you sure you want to delete &quot;{name}&quot;?
            </Text>

            <View style={styles.deleteChoiceRow}>
              <TouchableOpacity
                style={styles.cancelChoiceBtn}
                onPress={() => setIsDeleteConfirmOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelChoiceText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color={colors.white} style={{ marginRight: 6 }} />
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    taskCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    taskIcon: {
      fontSize: 17,
    },
    taskInfoWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginRight: 8,
      minWidth: 0,
    },
    taskMain: {
      flex: 1,
      marginRight: 8,
      minWidth: 0,
    },
    taskName: {
      fontSize: fs(14),
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
      fontFamily,
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
    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.surface,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeBadgeText: {
      fontSize: fs(10),
      fontWeight: '600',
      color: colors.textMuted,
      fontFamily,
    },
    taskActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
    },
    bellBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellBtnActive: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryMuted,
    },
    editBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
    },
    confirmIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 12,
    },
    confirmTitle: {
      fontSize: fs(20),
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      fontFamily,
    },
    confirmSub: {
      fontSize: fs(13),
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 16,
      lineHeight: 18,
      fontFamily,
    },
    deleteChoiceRow: {
      flexDirection: 'row',
      gap: 10,
    },
    cancelChoiceBtn: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelChoiceText: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: fs(14),
      fontFamily,
    },
    deleteConfirmBtn: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.danger,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteConfirmText: {
      color: colors.white,
      fontWeight: '700',
      fontSize: fs(14),
      fontFamily,
    },
  });
}
