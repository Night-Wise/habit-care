import { Pencil, Trash2 } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';

const MENU_WIDTH = 168;
const MENU_HEIGHT = 96;

export function ItemActionsMenu({
  name,
  onEdit,
  onDelete,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const anchorRef = useRef<View>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; left: number } | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const openMenu = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const gap = 6;
      let top = y + height + gap;
      if (top + MENU_HEIGHT > screenHeight - 12) {
        top = Math.max(12, y - MENU_HEIGHT - gap);
      }
      let left = x + width - MENU_WIDTH;
      left = Math.max(12, Math.min(left, screenWidth - MENU_WIDTH - 12));
      setMenuAnchor({ top, left });
    });
  };

  const closeMenu = () => setMenuAnchor(null);

  const confirmDelete = () => {
    setIsDeleteConfirmOpen(false);
    onDelete();
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <TouchableOpacity
          style={styles.triggerBtn}
          onPress={openMenu}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Edit or delete ${name}`}
        >
          <Pencil size={14} color={colors.textMuted} />
        </TouchableOpacity>
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

      <Modal
        visible={isDeleteConfirmOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsDeleteConfirmOpen(false)}
      >
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
    </>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    triggerBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuBackdrop: {
      flex: 1,
    },
    menuCard: {
      position: 'absolute',
      width: MENU_WIDTH,
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
