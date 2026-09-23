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

import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';
import {
  EMOJI_CATEGORIES,
  EmojiCategory,
  EmojiItem,
  searchEmojis,
} from '@/utils/emoji-data';

interface EmojiPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  selectedEmoji: string | null;
}

export function EmojiPickerModal({
  visible,
  onClose,
  onSelectEmoji,
  selectedEmoji,
}: EmojiPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('Popular');

  const filteredEmojis = useMemo(() => {
    return searchEmojis(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);

  const isDirectEmojiInput = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return false;
    const emojiRegex = /\p{Extended_Pictographic}/u;
    return emojiRegex.test(trimmed);
  }, [searchQuery]);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);
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
          <Text style={styles.headerTitle}>Select Icon / Emoji</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={colors.inactive} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search emojis e.g. water, run, book…"
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

        {isDirectEmojiInput && (
          <TouchableOpacity
            style={styles.customEmojiBanner}
            onPress={() => handleSelect(searchQuery.trim())}
            activeOpacity={0.8}
          >
            <Text style={styles.customEmojiText}>
              Use typed emoji: <Text style={styles.customEmojiLarge}>{searchQuery.trim()}</Text>
            </Text>
            <View style={styles.customEmojiChip}>
              <Text style={styles.customEmojiChipText}>Select ✨</Text>
            </View>
          </TouchableOpacity>
        )}

        {searchQuery.length === 0 && (
          <View style={styles.categoriesWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContent}
            >
              {EMOJI_CATEGORIES.map((cat) => {
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
          data={filteredEmojis}
          keyExtractor={(item, index) => item.emoji + index}
          numColumns={6}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.gridContainer, { paddingBottom: insets.bottom + 24 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No matching emojis found</Text>
              <Text style={styles.emptySub}>
                Try searching for another keyword or pick from device keyboard.
              </Text>
            </View>
          }
          renderItem={({ item }: { item: EmojiItem }) => {
            const isSelected = selectedEmoji === item.emoji;
            return (
              <Pressable
                style={[styles.emojiBtn, isSelected && styles.emojiBtnSelected]}
                onPress={() => handleSelect(item.emoji)}
                android_ripple={{ color: colors.primarySoft }}
              >
                <Text style={styles.emojiText}>{item.emoji}</Text>
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
    customEmojiBanner: {
      marginHorizontal: 20,
      marginTop: 4,
      marginBottom: 8,
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      borderWidth: 1.5,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    customEmojiText: {
      fontSize: fs(14),
      fontWeight: '600',
      color: colors.text,
      fontFamily,
    },
    customEmojiLarge: {
      fontSize: 20,
    },
    customEmojiChip: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    customEmojiChipText: {
      color: colors.white,
      fontSize: fs(12),
      fontWeight: '700',
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
    emojiBtn: {
      flex: 1,
      aspectRatio: 1,
      margin: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    emojiBtnSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    emojiText: {
      fontSize: 24,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyIcon: {
      fontSize: 40,
      marginBottom: 10,
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
