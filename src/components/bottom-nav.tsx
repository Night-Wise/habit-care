import { useRouter } from 'expo-router';
import { Home, Plus, Settings, Sparkles, Users } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/context/theme-context';
import type { ThemeColors } from '@/theme/colors';

interface BottomNavProps {
  activeTab?: 'home' | 'habits' | 'friends' | 'settings';
  state?: any;
  navigation?: any;
}

export function BottomNav({ activeTab: propsActiveTab, state, navigation }: BottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  let currentTab = propsActiveTab || 'home';
  if (state && state.routes && typeof state.index === 'number') {
    const routeName = state.routes[state.index]?.name;
    if (routeName === 'index') currentTab = 'home';
    else if (routeName === 'habits' || routeName === 'tasks') currentTab = 'habits';
    else if (routeName === 'friends') currentTab = 'friends';
    else if (routeName === 'settings') currentTab = 'settings';
  }

  const navigateToTab = (tabName: 'index' | 'habits' | 'friends' | 'settings') => {
    if (navigation) {
      navigation.navigate(tabName);
    } else {
      const targetRoute = tabName === 'index' ? '/' : `/${tabName}`;
      router.replace(targetRoute as any);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => currentTab !== 'home' && navigateToTab('index')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'home' && styles.iconWrapActive]}>
            <Home
              size={20}
              color={currentTab === 'home' ? colors.primary : colors.inactive}
              strokeWidth={currentTab === 'home' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'home' ? styles.navLabelActive : styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateToTab('habits')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'habits' && styles.iconWrapActive]}>
            <Sparkles
              size={20}
              color={currentTab === 'habits' ? colors.primary : colors.inactive}
              strokeWidth={currentTab === 'habits' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'habits' ? styles.navLabelActive : styles.navLabel}>
            Habits
          </Text>
        </TouchableOpacity>

        <View style={styles.navItem}>
          <Pressable
            style={({ pressed }) => [
              styles.addButtonWrap,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
            onPress={() => router.push('/add-or-edit-task')}
          >
            <View style={styles.addButton}>
              <Plus size={24} color={colors.white} strokeWidth={2.8} />
            </View>
          </Pressable>
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => currentTab !== 'friends' && navigateToTab('friends')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'friends' && styles.iconWrapActive]}>
            <Users
              size={20}
              color={currentTab === 'friends' ? colors.primary : colors.inactive}
              strokeWidth={currentTab === 'friends' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'friends' ? styles.navLabelActive : styles.navLabel}>
            Friends
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => currentTab !== 'settings' && navigateToTab('settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'settings' && styles.iconWrapActive]}>
            <Settings
              size={20}
              color={currentTab === 'settings' ? colors.primary : colors.inactive}
              strokeWidth={currentTab === 'settings' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'settings' ? styles.navLabelActive : styles.navLabel}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(
  colors: ThemeColors,
  fs: (size: number) => number,
  fontFamily?: string
) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 10,
    },
    bottomNav: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      paddingTop: 8,
      paddingHorizontal: 6,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      minHeight: 52,
    },
    iconWrap: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
    },
    iconWrapActive: {
      backgroundColor: colors.primarySoft,
    },
    navLabelActive: {
      fontSize: fs(10),
      fontWeight: '700',
      color: colors.primary,
      marginTop: 3,
      fontFamily,
    },
    navLabel: {
      fontSize: fs(10),
      fontWeight: '500',
      color: colors.inactive,
      marginTop: 3,
      fontFamily,
    },
    addButtonWrap: {
      marginTop: -22,
      marginBottom: 2,
    },
    addButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },
  });
}
