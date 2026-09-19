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
              color={currentTab === 'home' ? PRIMARY : INACTIVE_COLOR}
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
              color={currentTab === 'tasks' ? PRIMARY : INACTIVE_COLOR}
              strokeWidth={currentTab === 'tasks' ? 2.5 : 2}
            />
          </View>
          <Text style={currentTab === 'tasks' ? styles.navLabelActive : styles.navLabel}>
            Tasks
          </Text>
        </TouchableOpacity>

        <View style={styles.navItem}>
          <Pressable
            style={({ pressed }) => [
              styles.addButtonWrap,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
            onPress={() => router.push('/add-todo')}
          >
            <View style={styles.addButton}>
              <Plus size={28} color="#ffffff" strokeWidth={2.8} />
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
              color={currentTab === 'friends' ? PRIMARY : INACTIVE_COLOR}
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
              color={currentTab === 'settings' ? PRIMARY : INACTIVE_COLOR}
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

const PRIMARY = '#6264FD';
const PRIMARY_SOFT = '#eef0ff';
const CARD = '#ffffff';
const INACTIVE_COLOR = '#94a3b8';

const styles = StyleSheet.create({
  container: {
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: PRIMARY,
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
    backgroundColor: PRIMARY_SOFT,
  },
  navLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    color: PRIMARY,
    marginTop: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: INACTIVE_COLOR,
    marginTop: 3,
  },
  addButtonWrap: {
    marginTop: -22,
    marginBottom: 2,
  },
  addButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
});
