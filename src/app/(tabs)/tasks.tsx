import { useRouter } from 'expo-router';

import { useMemo, useState } from 'react';

import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { MonthlyHabitView } from '@/components/monthly-habit-view';

import { TaskManageItem } from '@/components/task-manage-item';

import { useTheme } from '@/context/theme-context';

import { useTodos } from '@/context/todos-context';

import type { ThemeColors } from '@/theme/colors';



export default function TasksScreen() {

  const { todos, isLoaded, deleteTodo, toggleTodoNotification } = useTodos();

  const router = useRouter();

  const insets = useSafeAreaInsets();

  const { colors, fs, fontFamilyValue } = useTheme();

  const styles = useMemo(

    () => createStyles(colors, fs, fontFamilyValue),

    [colors, fs, fontFamilyValue]

  );

  const [viewMode, setViewMode] = useState<'manage' | 'month'>('manage');



  const total = todos.length;



  return (

    <View style={styles.root}>

      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />



      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>

        <Text style={styles.headerTitle}>Manage Tasks</Text>

        <Text style={styles.headerSub}>

          {total === 0 ? 'No tasks yet' : `${total} task${total !== 1 ? 's' : ''}`}

        </Text>

      </View>



      <View style={styles.viewSwitcher}>

        <TouchableOpacity

          style={[styles.viewOption, viewMode === 'manage' && styles.viewOptionActive]}

          onPress={() => setViewMode('manage')}

        >

          <Text style={[styles.viewOptionText, viewMode === 'manage' && styles.viewOptionTextActive]}>

            Manage

          </Text>

        </TouchableOpacity>

        <TouchableOpacity

          style={[styles.viewOption, viewMode === 'month' && styles.viewOptionActive]}

          onPress={() => setViewMode('month')}

        >

          <Text style={[styles.viewOptionText, viewMode === 'month' && styles.viewOptionTextActive]}>

            Monthly view

          </Text>

        </TouchableOpacity>

      </View>



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

        ) : viewMode === 'month' ? (

          <MonthlyHabitView todos={todos} />

        ) : (

          todos.map((todo) => (

            <TaskManageItem

              key={todo.id}

              name={todo.name}

              icon={todo.icon}

              category={todo.category}

              timeMinutes={todo.timeMinutes}

              priority={todo.priority}

              notificationTime={todo.notificationTime}

              notificationEnabled={todo.notificationEnabled}

              onEdit={() =>

                router.push({ pathname: '/add-or-edit-task', params: { id: todo.id } })

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



function createStyles(

  colors: ThemeColors,

  fs: (size: number) => number,

  fontFamily?: string

) {

  return StyleSheet.create({

    root: {

      flex: 1,

      backgroundColor: colors.background,

    },

    header: {

      backgroundColor: colors.headerBg,

      paddingHorizontal: 24,

      paddingBottom: 14,

    },

    headerTitle: {

      fontSize: fs(28),

      fontWeight: '800',

      color: colors.headerText,

      letterSpacing: -0.5,

      fontFamily,

    },

    headerSub: {

      fontSize: fs(14),

      color: 'rgba(255,255,255,0.75)',

      marginTop: 4,

      fontFamily,

    },

    viewSwitcher: {

      flexDirection: 'row',

      backgroundColor: colors.primarySoft,

      marginHorizontal: 16,

      marginTop: 14,

      padding: 3,

      borderRadius: 10,

    },

    viewOption: {

      flex: 1,

      alignItems: 'center',

      paddingVertical: 9,

      borderRadius: 8,

    },

    viewOptionActive: {

      backgroundColor: colors.card,

      shadowColor: colors.primary,

      shadowOffset: { width: 0, height: 1 },

      shadowOpacity: 0.08,

      shadowRadius: 3,

      elevation: 1,

    },

    viewOptionText: {

      color: colors.textMuted,

      fontSize: fs(13),

      fontWeight: '600',

      fontFamily,

    },

    viewOptionTextActive: {

      color: colors.primary,

      fontWeight: '700',

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

      fontSize: fs(18),

      fontWeight: '700',

      color: colors.text,

      textAlign: 'center',

      fontFamily,

    },

    emptySubtext: {

      fontSize: fs(14),

      color: colors.textMuted,

      marginTop: 6,

      textAlign: 'center',

      fontFamily,

    },

  });

}

