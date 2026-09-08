import { Bell, Clock, Pencil, Trash2, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTodos } from '@/context/todos-context';

function TaskManageItem({
  id,
  name,
  icon,
  timeMinutes,
  priority = 0,
  notificationTime,
  notificationEnabled,
  onEdit,
  onDelete,
  onToggleNotification,
}: {
  id: string;
  name: string;
  icon: string;
  timeMinutes?: number;
  priority?: number;
  notificationTime?: string;
  notificationEnabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleNotification: () => void;
}) {
  const prioLevel = typeof priority === 'number' && !isNaN(priority) ? priority : 0;
  const [scaleAnim] = useState(() => new Animated.Value(1));

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
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
        {/* Icon + name + time */}
        <View style={styles.taskLeft}>
          <Text style={styles.taskIcon}>{icon}</Text>
          <View style={styles.taskNameWrap}>
            <Text style={styles.taskName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.badgesRow}>
              {/* Priority badge */}
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
                  size={10}
                  color={
                    prioLevel >= 3 ? '#dc2626' : prioLevel >= 1 ? '#d97706' : '#64748b'
                  }
                  style={{ marginRight: 2 }}
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

              {notificationTime ? (
                <Text style={styles.timingSubtext}>⏰ {notificationTime}</Text>
              ) : null}
              <View style={styles.timeBadge}>
                <Clock size={11} color="#64748b" style={{ marginRight: 3 }} />
                <Text style={styles.timeBadgeText}>{timeMinutes ?? 30}m</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[
              styles.bellBtn,
              notificationEnabled && styles.bellBtnActive,
            ]}
            onPress={onToggleNotification}
            hitSlop={6}
          >
            <Bell size={16} color={notificationEnabled ? '#6366f1' : '#94a3b8'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            hitSlop={8}
          >
            <Pencil size={16} color="#4f46e5" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            hitSlop={8}
          >
            <Trash2 size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const { todos, isLoaded, deleteTodo, toggleTodoNotification } = useTodos();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const total = todos.length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Tasks</Text>
        <Text style={styles.headerSub}>
          {total === 0 ? 'No tasks yet' : `${total} task${total !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isLoaded ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Go to Home and tap + to add tasks</Text>
          </View>
        ) : (
          todos.map((todo) => (
            <TaskManageItem
              key={todo.id}
              id={todo.id}
              name={todo.name}
              icon={todo.icon}
              timeMinutes={todo.timeMinutes}
              priority={todo.priority}
              notificationTime={todo.notificationTime}
              notificationEnabled={todo.notificationEnabled}
              onEdit={() =>
                router.push({ pathname: '/edit-todo', params: { id: todo.id } })
              }
              onDelete={() => deleteTodo(todo.id)}
              onToggleNotification={() => toggleTodoNotification(todo.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const PURPLE = '#6366f1';
const BG = '#f8f7ff';
const CARD = '#ffffff';
const TEXT = '#1e1b4b';
const SUBTEXT = '#6b7280';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: SUBTEXT,
    marginTop: 6,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: CARD,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  taskIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  taskNameWrap: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityBadgeNormal: {
    backgroundColor: '#f1f5f9',
  },
  priorityBadgeMed: {
    backgroundColor: '#fef3c7',
  },
  priorityBadgeHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityBadgeTextNormal: {
    color: '#64748b',
  },
  priorityBadgeTextMed: {
    color: '#b45309',
  },
  priorityBadgeTextHigh: {
    color: '#b91c1c',
  },
  timingSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBtnActive: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
