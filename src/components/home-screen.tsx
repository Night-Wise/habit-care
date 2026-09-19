import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart2,
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

import { InsightsModal } from '@/components/insights-modal';
import { TodoItem } from '@/components/todo-item';
import { formatDateKey, isTodoCompleted, Todo, useTodos } from '@/context/todos-context';

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
  emoji: string;
  statusBarColor: string;
} {
  const hour = date.getHours();

  // 5:00 AM – 11:59 AM
  if (hour >= 5 && hour < 12) {
    return {
      period: 'morning',
      greeting: 'GOOD MORNING',
      emoji: '🌅',
      statusBarColor: '#7c9fd4',
    };
  }
  // 12:00 PM – 4:59 PM
  if (hour >= 12 && hour < 17) {
    return {
      period: 'afternoon',
      greeting: 'GOOD AFTERNOON',
      emoji: '☀️',
      statusBarColor: '#3b82c4',
    };
  }
  // 5:00 PM – 8:59 PM
  if (hour >= 17 && hour < 21) {
    return {
      period: 'evening',
      greeting: 'GOOD EVENING',
      emoji: '🌇',
      statusBarColor: '#5b4bb5',
    };
  }
  // 9:00 PM – 4:59 AM
  return {
    period: 'night',
    greeting: 'GOOD NIGHT',
    emoji: '🌙',
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


function CircularProgress({ pct }: { pct: number }) {
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
          stroke="#ede9fe"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6264FD"
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

function ProgressBarFill({ pct }: { pct: number }) {
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

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getMonday(new Date()));
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
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
              <Text style={styles.greeting}>
                {hero.greeting} {hero.emoji}
              </Text>
              <Text style={styles.headerTitle}>{headerTitle || 'Daily Tasks'}</Text>
              <Text style={styles.headerSubtitle}>
                {headerSubtitle || '"Small steps make big progress."'}
              </Text>
              <View style={styles.todayChipSlot}>
                {!isViewingToday ? (
                  <TouchableOpacity style={styles.todayChip} onPress={goToToday} activeOpacity={0.85}>
                    <Text style={styles.todayChipText}>Jump to Today</Text>
                  </TouchableOpacity>
                ) : null}
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
            <TouchableOpacity
              style={styles.iconCircleBtn}
              onPress={() => setIsInsightsOpen(true)}
              activeOpacity={0.8}
            >
              <BarChart2 size={18} color="#ffffff" />
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
              <ChevronLeft size={18} color="#6264FD" />
            </TouchableOpacity>

            <Text style={styles.weekRangeText}>{weekMonthYear}</Text>

            {!isCurrentOrFutureWeek ? (
              <TouchableOpacity
                style={styles.navArrowBtn}
                onPress={goToNextWeek}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <ChevronRight size={18} color="#6264FD" />
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
                  style={styles.dayCol}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.85}
                >
                  {isSelected ? (
                    <View style={styles.dayPillSelected}>
                      <Text style={styles.dayNameSelected}>{DAY_LABELS[index]}</Text>
                      <View style={styles.dayNumCircle}>
                        <Text style={styles.dayNumSelected}>{day.getDate()}</Text>
                      </View>
                      <View style={styles.selectedDot} />
                    </View>
                  ) : (
                    <View style={[styles.dayPill, isToday && styles.dayPillToday]}>
                      <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                        {DAY_LABELS[index]}
                      </Text>
                      <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                        {day.getDate()}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isSearchOpen && (
          <View style={styles.searchBar}>
            <Search size={16} color="#94a3b8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              placeholderTextColor="#94a3b8"
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
          <CircularProgress pct={progressPct} />
          <View style={styles.progressMiddle}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={styles.progressCount}>
              {done} of {total} tasks completed
            </Text>
            <ProgressBarFill pct={progressPct} />
          </View>
          <View style={styles.encourageBadge}>
            <Trophy size={12} color="#6264FD" />
            <Text style={styles.encourageText}>{encouragement}</Text>
          </View>
        </View>

        {/* Sort / filter controls */}
        <View style={styles.sortBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortPillsRow}
          >
            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'timing' && styles.sortPillActive]}
              onPress={() => setSortBy('timing')}
              activeOpacity={0.85}
            >
              <Clock size={13} color={sortBy === 'timing' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.sortPillText, sortBy === 'timing' && styles.sortPillTextActive]}>
                Timing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'priority' && styles.sortPillActive]}
              onPress={() => setSortBy('priority')}
              activeOpacity={0.85}
            >
              <Zap size={13} color={sortBy === 'priority' ? '#ffffff' : '#64748b'} />
              <Text
                style={[styles.sortPillText, sortBy === 'priority' && styles.sortPillTextActive]}
              >
                Priority
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortPill, sortBy === 'category' && styles.sortPillActive]}
              onPress={() => setSortBy('category')}
              activeOpacity={0.85}
            >
              <LayoutGrid size={13} color={sortBy === 'category' ? '#ffffff' : '#64748b'} />
              <Text
                style={[styles.sortPillText, sortBy === 'category' && styles.sortPillTextActive]}
              >
                Category
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            style={styles.allFilterBtn}
            onPress={() => setIsFilterOpen(true)}
            activeOpacity={0.85}
          >
            <Filter size={13} color="#64748b" />
            <Text style={styles.allFilterText} numberOfLines={1}>
              {categoryFilter || 'All'}
            </Text>
            <ChevronDown size={14} color="#94a3b8" />
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
                🔒 Future date tasks cannot be checked off yet.
              </Text>
            </View>
          )}

          {!isLoaded ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : sortedTodos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📋</Text>
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

          {/* Motivational banner */}
          <View style={styles.motivationBanner}>
            <Text style={styles.motivationIcon}>🌱</Text>
            <View style={styles.motivationTextWrap}>
              <Text style={styles.motivationTitle}>A productive day</Text>
              <Text style={styles.motivationSubtitle}>is a happy day!</Text>
            </View>
            <View style={styles.motivationWave} />
          </View>
        </ScrollView>
      </View>

      <InsightsModal
        visible={isInsightsOpen}
        onClose={() => setIsInsightsOpen(false)}
        todos={todos}
      />

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

const PRIMARY = '#6264FD';
const PRIMARY_SOFT = '#eef0ff';
const BG = '#f4f3fb';
const CARD = '#ffffff';
const TEXT = '#1e1b4b';
const SUBTEXT = '#6b7280';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
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
    paddingBottom: 36,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#6264FD',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
  },
  body: {
    flex: 1,
    marginTop: -24,
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
    marginTop: 4,
    fontWeight: '500',
    fontStyle: 'italic',
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
  todayChipSlot: {
    marginTop: 8,
    minHeight: 28,
    justifyContent: 'center',
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
    backgroundColor: CARD,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    shadowColor: '#4c1d95',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.06)',
  },
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowPlaceholder: {
    width: 32,
    height: 32,
  },
  weekRangeText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  weekPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
  },
  dayPill: {
    width: '92%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 18,
  },
  dayPillToday: {
    backgroundColor: PRIMARY_SOFT,
  },
  dayPillSelected: {
    width: '92%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 72,
    backgroundColor: PRIMARY,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  dayNameToday: {
    color: PRIMARY,
    fontWeight: '700',
  },
  dayNameSelected: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
  dayNumToday: {
    color: PRIMARY,
  },
  dayNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumSelected: {
    fontSize: 13,
    fontWeight: '800',
    color: PRIMARY,
  },
  selectedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: TEXT,
    padding: 0,
  },
  searchClear: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },
  progressCard: {
    backgroundColor: CARD,
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
    color: TEXT,
  },
  progressMiddle: {
    flex: 1,
    gap: 4,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
  progressCount: {
    fontSize: 12,
    fontWeight: '500',
    color: SUBTEXT,
    marginBottom: 4,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#ede9fe',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 99,
  },
  encourageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PRIMARY_SOFT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: 88,
  },
  encourageText: {
    fontSize: 10,
    fontWeight: '700',
    color: PRIMARY,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 4,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  sortPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  sortPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  allFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eef2ff',
    maxWidth: 110,
  },
  allFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    maxWidth: 56,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
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
  futureNoticeBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
  },
  futureNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  motivationBanner: {
    backgroundColor: '#ecfdf5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 8,
  },
  motivationIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  motivationTextWrap: {
    flex: 1,
    zIndex: 1,
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065f46',
  },
  motivationSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
    marginTop: 2,
  },
  motivationWave: {
    position: 'absolute',
    right: -20,
    top: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(167,243,208,0.55)',
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  filterSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 4,
  },
  filterOptionActive: {
    backgroundColor: PRIMARY_SOFT,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  filterOptionTextActive: {
    color: PRIMARY,
    fontWeight: '700',
  },
});
