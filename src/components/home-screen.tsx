import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  LayoutGrid,
  Search,
  Trophy,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { TodoItem } from '@/components/todo-item';
import { useTheme } from '@/context/theme-context';
import { formatDateKey, isTodoCompleted, Todo, useTodos } from '@/context/todos-context';
import type { ThemeColors } from '@/theme/colors';
import { getDailyQuote } from '@/utils/daily-quote';

const HERO_IMAGES = {
  morning: require('../../assets/home-page-hero/morning.png'),
  afternoon: require('../../assets/home-page-hero/afternoon.png'),
  evening: require('../../assets/home-page-hero/evening.png'),
  night: require('../../assets/home-page-hero/night.png'),
} as const;

type HeroPeriod = keyof typeof HERO_IMAGES;

function getHeroPeriod(date: Date = new Date()): {
  period: HeroPeriod;
  greeting: string;
  statusBarColor: string;
} {
  const hour = date.getHours();

  // 5:00 AM – 11:59 AM
  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      greeting: 'GOOD MORNING',
      statusBarColor: '#7c9fd4',
    };
  }
  // 12:00 PM – 4:59 PM
  if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      greeting: 'GOOD AFTERNOON',
      statusBarColor: '#3b82c4',
    };
  }
  // 5:00 PM – 8:59 PM
  if (hour >= 17 && hour < 21) {
    return {
      period: 'evening',
      greeting: 'GOOD EVENING',
      statusBarColor: '#5b4bb5',
    };
  }
  // 9:00 PM – 4:59 AM
  return {
    period: 'night',
    greeting: 'GOOD NIGHT',
    statusBarColor: '#1a237e',
  };
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 1440;
  const trimmed = timeStr.trim().toUpperCase();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 1440;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDaysFromMonday(monday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


function CircularProgress({
  pct,
  styles,
  colors,
}: {
  pct: number;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const size = 64;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, pct));
  const strokeDashoffset = circumference * (1 - clamped);

  return (
    <View style={styles.circularProgressWrap}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primaryMuted}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
      <Text style={styles.circularProgressText}>{Math.round(clamped * 100)}%</Text>
    </View>
  );
}

function ProgressBarFill({
  pct,
  styles,
}: {
  pct: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const [animatedWidth] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: pct,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [pct, animatedWidth]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

export function HomeScreen({
  todosOverride,
  isLoadedOverride,
  readOnly = false,
  headerTitle,
  headerSubtitle,
  onBack,
  emptySubtitle,
  listBottomPadding,
}: {
  todosOverride?: Todo[];
  isLoadedOverride?: boolean;
  readOnly?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  onBack?: () => void;
  emptySubtitle?: string;
  listBottomPadding?: number;
} = {}) {
  const ownTodos = useTodos();
  const todos = todosOverride ?? ownTodos.todos;
  const isLoaded = isLoadedOverride ?? ownTodos.isLoaded;
  const toggleTodo = ownTodos.toggleTodo;
  const insets = useSafeAreaInsets();
  const { colors, fs, fontFamilyValue } = useTheme();
  const styles = useMemo(
    () => createStyles(colors, fs, fontFamilyValue),
    [colors, fs, fontFamilyValue]
  );

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getMonday(new Date()));
  const [sortBy, setSortBy] = useState<'timing' | 'priority' | 'category'>('timing');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentWeekMonday = getMonday(new Date());
  const isCurrentOrFutureWeek = weekStartDate.getTime() >= currentWeekMonday.getTime();

  const selectedDateKey = formatDateKey(selectedDate);
  const todayKey = formatDateKey(new Date());
  const isViewingToday = selectedDateKey === todayKey;
  const isFutureDate = selectedDateKey > todayKey;

  const weekDays = getWeekDaysFromMonday(weekStartDate);

  const goToPrevWeek = () => {
    setWeekStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const goToNextWeek = () => {
    if (weekStartDate.getTime() >= currentWeekMonday.getTime()) return;
    setWeekStartDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const goToToday = () => {
    const now = new Date();
    setWeekStartDate(getMonday(now));
    setSelectedDate(now);
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
  };

  const yearStr = weekDays[6].getFullYear();
  const weekMonthYear = `${weekDays[0].toLocaleDateString('en-US', { month: 'long' })} ${yearStr}`;

  const done = todos.filter((t) => isTodoCompleted(t, selectedDateKey)).length;
  const total = todos.length;
  const progressPct = total === 0 ? 0 : done / total;

  const progressLabel = isViewingToday
    ? "Today's Progress"
    : isFutureDate
    ? `${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (Upcoming)`
    : `${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} Progress`;

  const categories = useMemo(() => {
    const set = new Set<string>();
    todos.forEach((t) => {
      const c = t.category?.trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [todos]);

  const sortedTodos = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = todos.filter((t) => {
      if (categoryFilter) {
        const cat = t.category?.trim() || '';
        if (cat.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      }
      if (query && !t.name.toLowerCase().includes(query)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const pA = typeof a.priority === 'number' ? a.priority : 0;
        const pB = typeof b.priority === 'number' ? b.priority : 0;
        if (pB !== pA) return pB - pA;
        return parseTimeToMinutes(a.notificationTime) - parseTimeToMinutes(b.notificationTime);
      }
      if (sortBy === 'category') {
        const cA = (a.category || '').toLowerCase();
        const cB = (b.category || '').toLowerCase();
        if (cA !== cB) return cA.localeCompare(cB);
        return parseTimeToMinutes(a.notificationTime) - parseTimeToMinutes(b.notificationTime);
      }
      const tA = parseTimeToMinutes(a.notificationTime);
      const tB = parseTimeToMinutes(b.notificationTime);
      if (tA !== tB) return tA - tB;
      const pA = typeof a.priority === 'number' ? a.priority : 0;
      const pB = typeof b.priority === 'number' ? b.priority : 0;
      return pB - pA;
    });
  }, [todos, sortBy, categoryFilter, searchQuery]);

  const encouragement =
    total > 0 && done === total
      ? 'All done!'
      : progressPct >= 0.5
      ? 'Nice work!'
      : 'Keep going!';

  const dailyQuote = useMemo(() => getDailyQuote(new Date()), []);

  const hero = getHeroPeriod();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={hero.statusBarColor} />

      {/* Hero */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Image
          source={HERO_IMAGES[hero.period]}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['rgba(15,23,42,0.18)', 'rgba(15,23,42,0.42)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.heroOverlay}
          pointerEvents="none"
        />

        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            {onBack ? (
              <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
                <ChevronLeft size={22} color="#ffffff" />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{hero.greeting}</Text>
              <Text style={styles.headerTitle}>{headerTitle || 'Daily Tasks'}</Text>
              <View style={styles.subtitleSlot}>
                {headerSubtitle ? (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {headerSubtitle}
                  </Text>
                ) : isViewingToday ? (
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    "{dailyQuote.text}"
                  </Text>
                ) : (
                  <TouchableOpacity style={styles.todayChip} onPress={goToToday} activeOpacity={0.85}>
                    <Text style={styles.todayChipText}>Jump to Today</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.headerButtonsRow}>
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setIsSearchOpen((v) => !v)}
              activeOpacity={0.8}
            >
              <Search size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Floating date selector */}
        <View style={styles.dateCard}>
          <View style={styles.weekNavRow}>
            <TouchableOpacity
              style={styles.navArrowBtn}
              onPress={goToPrevWeek}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <ChevronLeft size={18} color={colors.primary} />
            </TouchableOpacity>

            <Text style={styles.weekRangeText}>{weekMonthYear}</Text>

            {!isCurrentOrFutureWeek ? (
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={goToNextWeek}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.navArrowPlaceholder} />
            )}
          </View>

          <View style={styles.weekPillsRow}>
            {weekDays.map((day, index) => {
              const dayKey = formatDateKey(day);
              const isSelected = dayKey === selectedDateKey;
              const isToday = dayKey === todayKey;

              return (
                <TouchableOpacity
                  key={dayKey}
                  style={styles.dayColTouch}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.dayCol,
                      isSelected && styles.dayPillSelected,
                      !isSelected && isToday && styles.dayPillToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayName,
                        isToday && !isSelected && styles.dayNameToday,
                        isSelected && styles.dayNameSelected,
                      ]}
                    >
                      {DAY_LABELS[index]}
                    </Text>
                    {isSelected ? (
                      <View style={styles.dayNumCircle}>
                        <Text style={styles.dayNumSelected}>{day.getDate()}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                        {day.getDate()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Search size={16} color={colors.inactive} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor={colors.inactive}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.searchClear}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Today's Progress */}
        <View style={styles.progressCard}>
          <CircularProgress pct={progressPct} styles={styles} colors={colors} />
          <View style={styles.progressMiddle}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={styles.progressCount}>
              {done} of {total} tasks completed
            </Text>
            <ProgressBarFill pct={progressPct} styles={styles} />
          </View>
          <View style={styles.encourageBadge}>
            <Trophy size={12} color={colors.primary} />
            <Text style={styles.encourageText}>{encouragement}</Text>
          </View>
        </View>

        {/* Sort / filter controls */}
        <View style={styles.sortBar}>
          <View style={styles.sortTabs}>
            {(
              [
                { key: 'timing' as const, label: 'Timing', Icon: Clock },
                { key: 'priority' as const, label: 'Priority', Icon: Zap },
                { key: 'category' as const, label: 'Category', Icon: LayoutGrid },
              ] as const
            ).map(({ key, label, Icon }) => {
              const isActive = sortBy === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortTab, isActive && styles.sortTabActive]}
                  onPress={() => setSortBy(key)}
                  activeOpacity={0.85}
                >
                  <Icon size={13} color={isActive ? colors.primary : colors.textMuted} />
                  <Text style={[styles.sortTabText, isActive && styles.sortTabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.allFilterBtn}
            onPress={() => setIsFilterOpen(true)}
            activeOpacity={0.85}
          >
            <Filter size={13} color={colors.textMuted} />
            <Text style={styles.allFilterText} numberOfLines={1}>
              {categoryFilter || 'All'}
            </Text>
            <ChevronDown size={14} color={colors.inactive} />
          </TouchableOpacity>
        </View>

        {/* Task list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: listBottomPadding ?? insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isFutureDate && !readOnly && (
            <View style={styles.futureNoticeBanner}>
              <Text style={styles.futureNoticeText}>
              Future date tasks cannot be checked off yet.
              </Text>
            </View>
          )}

          {!isLoaded ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : sortedTodos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks yet</Text>
              <Text style={styles.emptySubtext}>
                {emptySubtitle || 'Tap + to add your first task'}
              </Text>
            </View>
          ) : (
            sortedTodos.map((todo) => {
              const completed = isTodoCompleted(todo, selectedDateKey);
              return (
                <TodoItem
                  key={todo.id}
                  name={todo.name}
                  icon={todo.icon}
                  category={todo.category}
                  timeMinutes={todo.timeMinutes}
                  priority={todo.priority}
                  notificationTime={todo.notificationTime}
                  notificationEnabled={todo.notificationEnabled}
                  completed={completed}
                  disabled={readOnly || isFutureDate}
                  onToggle={() => {
                    if (!readOnly && !isFutureDate) {
                      toggleTodo(todo.id, selectedDateKey);
                    }
                  }}
                />
              );
            })
          )}
        </ScrollView>
      </View>

      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <Pressable style={styles.filterOverlay} onPress={() => setIsFilterOpen(false)}>
          <Pressable style={styles.filterSheet} onPress={() => {}}>
            <Text style={styles.filterSheetTitle}>Filter by category</Text>
            <TouchableOpacity
              style={[styles.filterOption, !categoryFilter && styles.filterOptionActive]}
              onPress={() => {
                setCategoryFilter(null);
                setIsFilterOpen(false);
              }}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  !categoryFilter && styles.filterOptionTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterOption,
                  categoryFilter === cat && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setCategoryFilter(cat);
                  setIsFilterOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    categoryFilter === cat && styles.filterOptionTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default HomeScreen;

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
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingTop: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
  },
  body: {
    flex: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
    marginTop: 4,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
    lineHeight: 18,
  },
  subtitleSlot: {
    marginTop: 4,
    height: 28,
    justifyContent: 'flex-start',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  todayChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  todayChipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  dateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 10,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(98,100,253,0.06)',
  },
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  navArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowPlaceholder: {
    width: 26,
    height: 26,
  },
  weekRangeText: {
    color: colors.text,
    fontFamily,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  weekPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  dayColTouch: {
    flex: 1,
    marginHorizontal: 2,
  },
  dayCol: {
    alignItems: 'center',
    paddingTop: 3,
    paddingBottom: 6,
    borderRadius: 16,
    // Android drops Text inside overflow:'hidden' views that have no background.
    // Keep a transparent bg so labels stay visible when a day is unselected.
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  dayPillToday: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 3,
  },
  dayNameToday: {
    color: '#ea580c',
    fontWeight: '700',
  },
  dayNameSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  dayNumToday: {
    color: '#ea580c',
  },
  dayNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumSelected: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontFamily,
    padding: 0,
  },
  searchClear: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.05)',
  },
  circularProgressWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    fontFamily,
  },
  progressMiddle: {
    flex: 1,
    gap: 4,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily,
    marginBottom: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.primaryMuted,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  encourageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: 88,
  },
  encourageText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortTabs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  sortTabActive: {
    borderBottomColor: colors.primary,
  },
  sortTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily,
  },
  sortTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  allFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 110,
  },
  allFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    fontFamily,
    maxWidth: 56,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily,
    marginTop: 6,
    textAlign: 'center',
  },
  futureNoticeBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    alignItems: 'center',
  },
  futureNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  filterSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  filterOptionActive: {
    backgroundColor: colors.primarySoft,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily,
  },
  filterOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  });
}
