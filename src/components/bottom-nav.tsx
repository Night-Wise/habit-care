import { useRouter } from 'expo-router';
import { Home, ListTodo, Plus, Settings, Users } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavProps {
  activeTab?: 'home' | 'tasks' | 'friends' | 'settings';
  state?: any;
  navigation?: any;
}

export function BottomNav({ activeTab: propsActiveTab, state, navigation }: BottomNavProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  let currentTab = propsActiveTab || 'home';
  if (state && state.routes && typeof state.index === 'number') {
    const routeName = state.routes[state.index]?.name;
    if (routeName === 'index') currentTab = 'home';
    else if (routeName === 'tasks') currentTab = 'tasks';
    else if (routeName === 'friends') currentTab = 'friends';
    else if (routeName === 'settings') currentTab = 'settings';
  }

  const navigateToTab = (tabName: 'index' | 'tasks' | 'friends' | 'settings') => {
    if (navigation) {
      navigation.navigate(tabName);
    } else {
      const targetRoute = tabName === 'index' ? '/' : `/${tabName}`;
      router.replace(targetRoute as any);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bottomNav}>
        <View style={styles.navItem}>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
            onPress={() => router.push('/add-todo')}
          >
            <Plus size={22} color="#ffffff" strokeWidth={2.8} />
          </Pressable>
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => currentTab !== 'home' && navigateToTab('index')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'home' && styles.iconWrapActive]}>
            <Home
              size={20}
              color={currentTab === 'home' ? PURPLE : INACTIVE_COLOR}
              strokeWidth={currentTab === 'home' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'home' ? styles.navLabelActive : styles.navLabel}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => currentTab !== 'tasks' && navigateToTab('tasks')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'tasks' && styles.iconWrapActive]}>
            <ListTodo
              size={20}
              color={currentTab === 'tasks' ? PURPLE : INACTIVE_COLOR}
              strokeWidth={currentTab === 'tasks' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'tasks' ? styles.navLabelActive : styles.navLabel}>
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => currentTab !== 'friends' && navigateToTab('friends')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, currentTab === 'friends' && styles.iconWrapActive]}>
            <Users
              size={20}
              color={currentTab === 'friends' ? PURPLE : INACTIVE_COLOR}
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
              color={currentTab === 'settings' ? PURPLE : INACTIVE_COLOR}
              strokeWidth={currentTab === 'settings' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'settings' ? styles.navLabelActive : styles.navLabel}>
            Setting
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PURPLE = '#6366f1';
const PURPLE_DARK = '#4f46e5';
const CARD = '#ffffff';
const INACTIVE_COLOR = '#64748b';

const styles = StyleSheet.create({
  container: {
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  iconWrapActive: {
    backgroundColor: '#eef2ff',
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: PURPLE,
    marginTop: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: INACTIVE_COLOR,
    marginTop: 3,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});
