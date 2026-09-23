import { Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HabitIcon } from '@/components/habit-icon';
import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';
import {
  HABIT_ICON_CATEGORIES,
  HabitIconCategory,
  HabitIconItem,
  searchHabitIcons,
} from '@/utils/habit-icons';

interface IconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (iconId: string) => void;
  selectedIcon: string | null;
}

export function IconPickerModal({
  visible,
  onClose,
  onSelectIcon,
  selectedIcon,
}: IconPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<HabitIconCategory>('Popular');

  const filteredIcons = useMemo(() => {
    return searchHabitIcons(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  const handleSelect = (iconId: string) => {
    onSelectIcon(iconId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select Icon</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.inactive} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search icons e.g. water, run, book…"
              placeholderTextColor={colors.inactive}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                <X size={16} color={colors.inactive} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchQuery.length === 0 && (
          <View style={styles.categoriesWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              {HABIT_ICON_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                    onPress={() => setActiveCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={filteredIcons}
          keyExtractor={(item) => item.id}
          numColumns={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.gridContainer, { paddingBottom: insets.bottom + 24 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matching icons found</Text>
              <Text style={styles.emptySub}>Try another keyword like water, gym, or sleep.</Text>
            </View>
          }
          renderItem={({ item }: { item: HabitIconItem }) => {
            const isSelected = selectedIcon === item.id;
            return (
              <Pressable
                style={[styles.iconBtn, isSelected && styles.iconBtnSelected]}
                onPress={() => handleSelect(item.id)}
                android_ripple={{ color: colors.primarySoft }}
              >
                <HabitIcon
                  icon={item.id}
                  size={24}
                  color={isSelected ? colors.primary : colors.text}
                  strokeWidth={2}
                />
              </Pressable>
            );
          }}
        />
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
    container: {
      flex: 1,
      backgroundColor: colors.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fs(18),
      fontWeight: '700',
      color: colors.text,
      fontFamily,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 48,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: fs(15),
      color: colors.text,
      fontWeight: '500',
      fontFamily,
    },
    categoriesWrapper: {
      paddingVertical: 8,
    },
    categoriesContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    categoryTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: colors.surfaceMuted,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryTabActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    categoryTabText: {
      fontSize: fs(13),
      fontWeight: '600',
      color: colors.textMuted,
      fontFamily,
    },
    categoryTabTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    gridContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    iconBtn: {
      flex: 1,
      aspectRatio: 1,
      margin: 5,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    iconBtnSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: fs(16),
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      fontFamily,
    },
    emptySub: {
      fontSize: fs(13),
      color: colors.textMuted,
      textAlign: 'center',
      fontFamily,
    },
  });
}
