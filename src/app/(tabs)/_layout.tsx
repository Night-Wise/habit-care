import { Tabs } from 'expo-router';
import React from 'react';
import { BottomNav } from '@/components/bottom-nav';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav state={props.state} navigation={props.navigation} />}
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="settings" options={{ title: 'Setting' }} />
    </Tabs>
  );
}
