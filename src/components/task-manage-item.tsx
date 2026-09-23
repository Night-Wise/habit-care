import { Bell, Clock, EllipsisVertical, Pencil, Trash2, Zap } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getHabitTheme } from '@/components/habit-heatmap';
import { HabitIcon } from '@/components/habit-icon';
import { getCategoryStyle, getIconBg } from '@/components/todo-item';
import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { isHabitIconId } from '@/utils/habit-icons';

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
  const moreAnchorRef = useRef<View>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; left: number } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const categoryStyle = useMemo(() => getCategoryStyle(category, colors), [category, colors]);
  const habitTheme = useMemo(() => getHabitTheme(name || icon), [name, icon]);
  const iconBg = useMemo(
    () => (isHabitIconId(icon) ? habitTheme.soft : getIconBg(name || icon)),
    [habitTheme.soft, icon, name]
  );

  const confirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    onDelete();
  };

  const openMenu = () => {
    moreAnchorRef.current?.measureInWindow((x, y, width, height) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const menuWidth = 168;
      const menuHeight = 96;
      const gap = 6;
      let top = y + height + gap;
      if (top + menuHeight > screenHeight - 12) {
        top = Math.max(12, y - menuHeight - gap);
      }
      let left = x + width - menuWidth;
      left = Math.max(12, Math.min(left, screenWidth - menuWidth - 12));
      setMenuAnchor({ top, left });
    });
  };

  const closeMenu = () => setMenuAnchor(null);

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskRow}>
        <TouchableOpacity
          style={styles.itemPress}
          onPress={onEdit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${name}`}
        >
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <HabitIcon icon={icon} size={20} color={habitTheme.solid} strokeWidth={2.2} />
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
        </TouchableOpacity>

        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.bellBtn, notificationEnabled && styles.bellBtnActive]}
            onPress={onToggleNotification}
            hitSlop={6}
            accessibilityLabel={`${notificationEnabled ? 'Disable' : 'Enable'} reminder for ${name}`}
          >
            <Bell size={14} color={notificationEnabled ? colors.primary : colors.inactive} />
          </TouchableOpacity>

          <View ref={moreAnchorRef} collapsable={false}>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={openMenu}
              hitSlop={8}
              accessibilityLabel={`More actions for ${name}`}
            >
              <EllipsisVertical size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={menuAnchor !== null} animationType="fade" transparent onRequestClose={closeMenu}>
        <View style={styles.menuBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeMenu} />
          {menuAnchor ? (
            <View style={[styles.menuCard, { top: menuAnchor.top, left: menuAnchor.left }]}>
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  closeMenu();
                  onEdit();
                }}
                accessibilityLabel={`Edit ${name}`}
              >
                <Pencil size={15} color={colors.primary} />
                <Text style={styles.menuOptionText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  closeMenu();
                  setIsDeleteConfirmOpen(true);
                }}
                accessibilityLabel={`Delete ${name}`}
              >
                <Trash2 size={15} color={colors.danger} />
                <Text style={[styles.menuOptionText, styles.menuDeleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>

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
    </View>
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
    itemPress: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
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
    moreBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuBackdrop: {
      flex: 1,
    },
    menuCard: {
      position: 'absolute',
      width: 168,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 4,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
    menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    menuOptionText: {
      fontSize: fs(14),
      fontWeight: '700',
      color: colors.text,
      fontFamily,
    },
    menuDeleteText: {
      color: colors.danger,
    },
    menuDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: 10,
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
