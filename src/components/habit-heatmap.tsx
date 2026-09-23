import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/theme-context';
import { formatDateKey, getMonday, isTodoCompleted, Todo } from '@/context/todos-context';

const WEEKS = 8;
const DAYS = 7;
const CELL = 7;
const GAP = 2;

export interface HabitTheme {
  soft: string;
  solid: string;
}

const HABIT_THEMES: HabitTheme[] = [
  { soft: '#e8f5e9', solid: '#43a047' },
  { soft: '#ffebee', solid: '#e53935' },
  { soft: '#f3e5f5', solid: '#8e24aa' },
  { soft: '#e3f2fd', solid: '#1e88e5' },
  { soft: '#fff3e0', solid: '#fb8c00' },
  { soft: '#e0f7fa', solid: '#00acc1' },
  { soft: '#fce4ec', solid: '#d81b60' },
  { soft: '#e8eaf6', solid: '#5c6bc0' },
  { soft: '#f1f8e9', solid: '#7cb342' },
  { soft: '#fff8e1', solid: '#f9a825' },
];

export function getHabitTheme(seed: string): HabitTheme {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % 997;
  }
  return HABIT_THEMES[hash % HABIT_THEMES.length];
}

function buildHeatmapGrid(todo: Todo, today: Date): boolean[][] {
  const todayMonday = getMonday(today);
  const startMonday = new Date(todayMonday);
  startMonday.setDate(todayMonday.getDate() - (WEEKS - 1) * 7);

  const todayKey = formatDateKey(today);
  const grid: boolean[][] = [];

  for (let week = 0; week < WEEKS; week++) {
    const column: boolean[] = [];
    for (let day = 0; day < DAYS; day++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + week * 7 + day);
      const key = formatDateKey(date);
      column.push(key <= todayKey && isTodoCompleted(todo, key));
    }
    grid.push(column);
  }

  return grid;
}

export const HabitHeatmap = memo(function HabitHeatmap({
  todo,
  color,
}: {
  todo: Todo;
  color: string;
}) {
  const { resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createStyles(resolvedScheme),
    [resolvedScheme]
  );
  const grid = useMemo(() => buildHeatmapGrid(todo, new Date()), [todo]);

  return (
    <View style={styles.grid}>
      {grid.map((column, weekIndex) => (
        <View key={weekIndex} style={styles.column}>
          {column.map((done, dayIndex) => (
            <View
              key={dayIndex}
              style={[styles.cell, done ? { backgroundColor: color } : styles.cellEmpty]}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

function createStyles(scheme: 'light' | 'dark') {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      gap: GAP,
    },
    column: {
      gap: GAP,
    },
    cell: {
      width: CELL,
      height: CELL,
      borderRadius: 2,
    },
    // Distinct from page bg so unmarked days stay visible (GitHub-style).
    cellEmpty: {
      backgroundColor: scheme === 'dark' ? '#3a3a3a' : '#f1f5f9',
    },
  });
}
