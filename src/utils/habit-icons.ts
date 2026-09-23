export type HabitIconCategory =
  | 'Popular'
  | 'Fitness'
  | 'Health'
  | 'Mind'
  | 'Work'
  | 'Home'
  | 'Food'
  | 'Hobbies'
  | 'Nature'
  | 'Symbols';

export interface HabitIconItem {
  id: string;
  name: string;
  category: HabitIconCategory;
  keywords: string[];
}

export const HABIT_ICON_CATEGORIES: HabitIconCategory[] = [
  'Popular',
  'Fitness',
  'Health',
  'Mind',
  'Work',
  'Home',
  'Food',
  'Hobbies',
  'Nature',
  'Symbols',
];

/** Default Lucide icon when creating a new habit. */
export const DEFAULT_HABIT_ICON = 'circle-check';

/** Quick-pick row on add/edit (~12). */
export const POPULAR_HABIT_ICONS = [
  'dumbbell',
  'brain',
  'footprints',
  'droplet',
  'book-open',
  'apple',
  'moon',
  'coffee',
  'heart-pulse',
  'target',
  'flame',
  'person-standing',
];

export const HABIT_ICON_DATASET: HabitIconItem[] = [
  // --- FITNESS ---
  { id: 'dumbbell', name: 'Dumbbell', category: 'Fitness', keywords: ['gym', 'weights', 'workout', 'lift', 'strength'] },
  { id: 'weight', name: 'Weight', category: 'Fitness', keywords: ['gym', 'kettlebell', 'workout', 'lift'] },
  { id: 'activity', name: 'Activity', category: 'Fitness', keywords: ['pulse', 'workout', 'fitness', 'cardio'] },
  { id: 'bike', name: 'Bike', category: 'Fitness', keywords: ['cycle', 'cycling', 'cardio', 'ride'] },
  { id: 'footprints', name: 'Footprints', category: 'Fitness', keywords: ['walk', 'steps', 'hike', 'run'] },
  { id: 'person-standing', name: 'Standing', category: 'Fitness', keywords: ['stand', 'posture', 'stretch', 'body'] },
  { id: 'stretch-horizontal', name: 'Stretch', category: 'Fitness', keywords: ['stretch', 'flexibility', 'yoga', 'mobility'] },
  { id: 'accessibility', name: 'Accessibility', category: 'Fitness', keywords: ['mobility', 'move', 'person', 'exercise'] },
  { id: 'move', name: 'Move', category: 'Fitness', keywords: ['movement', 'exercise', 'active'] },
  { id: 'timer', name: 'Timer', category: 'Fitness', keywords: ['interval', 'hiit', 'stopwatch', 'workout'] },
  { id: 'zap', name: 'Zap', category: 'Fitness', keywords: ['energy', 'power', 'burst', 'intensity'] },
  { id: 'trophy', name: 'Trophy', category: 'Fitness', keywords: ['win', 'goal', 'achievement', 'sport'] },
  { id: 'medal', name: 'Medal', category: 'Fitness', keywords: ['award', 'achievement', 'sport', 'win'] },
  { id: 'flag', name: 'Flag', category: 'Fitness', keywords: ['goal', 'finish', 'race', 'target'] },
  { id: 'mountain', name: 'Mountain', category: 'Fitness', keywords: ['hike', 'climb', 'trail', 'outdoors'] },
  { id: 'backpack', name: 'Backpack', category: 'Fitness', keywords: ['hike', 'trek', 'outdoors', 'travel'] },
  { id: 'anvil', name: 'Anvil', category: 'Fitness', keywords: ['strength', 'forge', 'heavy', 'gym'] },
  { id: 'swords', name: 'Swords', category: 'Fitness', keywords: ['martial', 'fencing', 'combat', 'training'] },

  // --- HEALTH ---
  { id: 'heart-pulse', name: 'Heart Pulse', category: 'Health', keywords: ['heart', 'health', 'cardio', 'vitals'] },
  { id: 'heart', name: 'Heart', category: 'Health', keywords: ['love', 'health', 'care', 'wellness'] },
  { id: 'droplet', name: 'Droplet', category: 'Health', keywords: ['water', 'hydrate', 'drink', 'fluid'] },
  { id: 'droplets', name: 'Droplets', category: 'Health', keywords: ['water', 'hydrate', 'moisture'] },
  { id: 'glass-water', name: 'Glass of Water', category: 'Health', keywords: ['water', 'hydrate', 'drink'] },
  { id: 'pill', name: 'Pill', category: 'Health', keywords: ['medicine', 'vitamin', 'supplement', 'meds'] },
  { id: 'stethoscope', name: 'Stethoscope', category: 'Health', keywords: ['doctor', 'checkup', 'medical'] },
  { id: 'syringe', name: 'Syringe', category: 'Health', keywords: ['vaccine', 'injection', 'medical'] },
  { id: 'bandage', name: 'Bandage', category: 'Health', keywords: ['heal', 'injury', 'first aid', 'care'] },
  { id: 'bone', name: 'Bone', category: 'Health', keywords: ['calcium', 'strength', 'skeleton'] },
  { id: 'eye', name: 'Eye', category: 'Health', keywords: ['vision', 'sight', 'rest eyes', 'screen'] },
  { id: 'ear', name: 'Ear', category: 'Health', keywords: ['hearing', 'listen', 'audio'] },
  { id: 'bed', name: 'Bed', category: 'Health', keywords: ['sleep', 'rest', 'nap', 'bedtime'] },
  { id: 'moon', name: 'Moon', category: 'Health', keywords: ['sleep', 'night', 'rest', 'bedtime'] },
  { id: 'moon-star', name: 'Moon Star', category: 'Health', keywords: ['sleep', 'night', 'dream'] },
  { id: 'alarm-clock', name: 'Alarm Clock', category: 'Health', keywords: ['wake', 'morning', 'alarm', 'early'] },
  { id: 'sunrise', name: 'Sunrise', category: 'Health', keywords: ['morning', 'wake', 'early', 'routine'] },
  { id: 'bath', name: 'Bath', category: 'Health', keywords: ['shower', 'hygiene', 'self care', 'wash'] },
  { id: 'shower-head', name: 'Shower', category: 'Health', keywords: ['shower', 'hygiene', 'bath', 'wash'] },
  { id: 'hand', name: 'Hand', category: 'Health', keywords: ['wash hands', 'hygiene', 'gesture'] },
  { id: 'thermometer', name: 'Thermometer', category: 'Health', keywords: ['temperature', 'fever', 'health'] },
  { id: 'ambulance', name: 'Ambulance', category: 'Health', keywords: ['emergency', 'hospital', 'medical'] },

  // --- MIND ---
  { id: 'brain', name: 'Brain', category: 'Mind', keywords: ['mind', 'focus', 'think', 'mental', 'meditation'] },
  { id: 'brain-circuit', name: 'Brain Circuit', category: 'Mind', keywords: ['focus', 'logic', 'think', 'ai'] },
  { id: 'brain-cog', name: 'Brain Cog', category: 'Mind', keywords: ['thinking', 'process', 'mental'] },
  { id: 'sparkles', name: 'Sparkles', category: 'Mind', keywords: ['mindfulness', 'magic', 'clarity', 'calm'] },
  { id: 'hand-heart', name: 'Hand Heart', category: 'Mind', keywords: ['kindness', 'gratitude', 'self care', 'love'] },
  { id: 'heart-handshake', name: 'Heart Handshake', category: 'Mind', keywords: ['gratitude', 'kindness', 'care'] },
  { id: 'flower-2', name: 'Flower', category: 'Mind', keywords: ['calm', 'peace', 'mindfulness', 'bloom'] },
  { id: 'leaf', name: 'Leaf', category: 'Mind', keywords: ['calm', 'nature', 'breathe', 'zen'] },
  { id: 'wind', name: 'Wind', category: 'Mind', keywords: ['breathe', 'breath', 'air', 'calm'] },
  { id: 'cloud', name: 'Cloud', category: 'Mind', keywords: ['calm', 'daydream', 'rest', 'soft'] },
  { id: 'sun', name: 'Sun', category: 'Mind', keywords: ['energy', 'mood', 'morning', 'light'] },
  { id: 'cloud-sun', name: 'Cloud Sun', category: 'Mind', keywords: ['mood', 'weather', 'balance'] },
  { id: 'eye', name: 'Focus Eye', category: 'Mind', keywords: ['focus', 'attention', 'awareness'] },
  { id: 'target', name: 'Target', category: 'Mind', keywords: ['focus', 'goal', 'intention', 'aim'] },
  { id: 'crosshair', name: 'Crosshair', category: 'Mind', keywords: ['focus', 'aim', 'precision'] },
  { id: 'lightbulb', name: 'Lightbulb', category: 'Mind', keywords: ['idea', 'insight', 'creativity', 'learn'] },
  { id: 'feather', name: 'Feather', category: 'Mind', keywords: ['soft', 'journal', 'light', 'write'] },

  // --- WORK ---
  { id: 'book-open', name: 'Open Book', category: 'Work', keywords: ['read', 'reading', 'study', 'learn'] },
  { id: 'book', name: 'Book', category: 'Work', keywords: ['read', 'study', 'learn', 'library'] },
  { id: 'book-marked', name: 'Bookmarked', category: 'Work', keywords: ['reading', 'bookmark', 'study'] },
  { id: 'notebook-pen', name: 'Notebook', category: 'Work', keywords: ['journal', 'write', 'notes', 'diary'] },
  { id: 'pen-line', name: 'Pen', category: 'Work', keywords: ['write', 'writing', 'journal', 'notes'] },
  { id: 'highlighter', name: 'Highlighter', category: 'Work', keywords: ['study', 'annotate', 'notes'] },
  { id: 'laptop', name: 'Laptop', category: 'Work', keywords: ['code', 'computer', 'work', 'dev'] },
  { id: 'monitor', name: 'Monitor', category: 'Work', keywords: ['computer', 'desk', 'work', 'screen'] },
  { id: 'smartphone', name: 'Phone', category: 'Work', keywords: ['mobile', 'call', 'screen time'] },
  { id: 'code', name: 'Code', category: 'Work', keywords: ['programming', 'dev', 'software'] },
  { id: 'briefcase', name: 'Briefcase', category: 'Work', keywords: ['work', 'job', 'office', 'career'] },
  { id: 'graduation-cap', name: 'Graduation', category: 'Work', keywords: ['study', 'school', 'learn', 'exam'] },
  { id: 'calculator', name: 'Calculator', category: 'Work', keywords: ['math', 'numbers', 'finance'] },
  { id: 'chart-column', name: 'Chart', category: 'Work', keywords: ['stats', 'analytics', 'progress', 'data'] },
  { id: 'trending-up', name: 'Trending Up', category: 'Work', keywords: ['growth', 'progress', 'improve'] },
  { id: 'calendar', name: 'Calendar', category: 'Work', keywords: ['schedule', 'plan', 'date', 'agenda'] },
  { id: 'clock', name: 'Clock', category: 'Work', keywords: ['time', 'punctual', 'schedule'] },
  { id: 'hourglass', name: 'Hourglass', category: 'Work', keywords: ['time', 'focus', 'pomodoro'] },
  { id: 'list-checks', name: 'Checklist', category: 'Work', keywords: ['todo', 'tasks', 'checklist', 'plan'] },
  { id: 'clipboard-list', name: 'Clipboard', category: 'Work', keywords: ['tasks', 'list', 'plan', 'todo'] },
  { id: 'mail', name: 'Mail', category: 'Work', keywords: ['email', 'inbox', 'message'] },
  { id: 'message-circle', name: 'Message', category: 'Work', keywords: ['chat', 'communicate', 'talk'] },
  { id: 'users', name: 'Users', category: 'Work', keywords: ['team', 'meeting', 'people', 'social'] },
  { id: 'languages', name: 'Languages', category: 'Work', keywords: ['language', 'learn', 'speak', 'translate'] },
  { id: 'globe', name: 'Globe', category: 'Work', keywords: ['world', 'language', 'travel', 'news'] },

  // --- HOME ---
  { id: 'house', name: 'House', category: 'Home', keywords: ['home', 'house', 'chores'] },
  { id: 'sofa', name: 'Sofa', category: 'Home', keywords: ['relax', 'living room', 'rest'] },
  { id: 'armchair', name: 'Armchair', category: 'Home', keywords: ['relax', 'read', 'rest'] },
  { id: 'broom', name: 'Broom', category: 'Home', keywords: ['clean', 'chores', 'sweep', 'tidy'] },
  { id: 'spray-can', name: 'Spray', category: 'Home', keywords: ['clean', 'spray', 'chores'] },
  { id: 'recycle', name: 'Recycle', category: 'Home', keywords: ['recycle', 'trash', 'eco', 'bin'] },
  { id: 'trash', name: 'Trash', category: 'Home', keywords: ['garbage', 'bin', 'clean', 'dispose'] },
  { id: 'shopping-cart', name: 'Cart', category: 'Home', keywords: ['shop', 'grocery', 'buy', 'errands'] },
  { id: 'shopping-bag', name: 'Bag', category: 'Home', keywords: ['shop', 'buy', 'errands'] },
  { id: 'wallet', name: 'Wallet', category: 'Home', keywords: ['money', 'budget', 'finance', 'pay'] },
  { id: 'piggy-bank', name: 'Piggy Bank', category: 'Home', keywords: ['save', 'money', 'budget'] },
  { id: 'shirt', name: 'Shirt', category: 'Home', keywords: ['laundry', 'clothes', 'dress'] },
  { id: 'scissors', name: 'Scissors', category: 'Home', keywords: ['cut', 'craft', 'groom'] },
  { id: 'hammer', name: 'Hammer', category: 'Home', keywords: ['fix', 'repair', 'diy', 'build'] },
  { id: 'wrench', name: 'Wrench', category: 'Home', keywords: ['fix', 'repair', 'tools'] },
  { id: 'lamp', name: 'Lamp', category: 'Home', keywords: ['light', 'room', 'evening'] },
  { id: 'baby', name: 'Baby', category: 'Home', keywords: ['child', 'family', 'care', 'parenting'] },
  { id: 'dog', name: 'Dog', category: 'Home', keywords: ['pet', 'walk dog', 'animal'] },
  { id: 'cat', name: 'Cat', category: 'Home', keywords: ['pet', 'animal', 'care'] },
  { id: 'paw-print', name: 'Paw', category: 'Home', keywords: ['pet', 'animal', 'walk'] },
  { id: 'car', name: 'Car', category: 'Home', keywords: ['drive', 'commute', 'travel'] },
  { id: 'bus', name: 'Bus', category: 'Home', keywords: ['commute', 'transit', 'travel'] },
  { id: 'plane', name: 'Plane', category: 'Home', keywords: ['travel', 'flight', 'trip'] },
  { id: 'map-pin', name: 'Map Pin', category: 'Home', keywords: ['location', 'place', 'visit'] },

  // --- FOOD ---
  { id: 'apple', name: 'Apple', category: 'Food', keywords: ['fruit', 'healthy', 'snack', 'eat'] },
  { id: 'banana', name: 'Banana', category: 'Food', keywords: ['fruit', 'snack', 'potassium'] },
  { id: 'cherry', name: 'Cherry', category: 'Food', keywords: ['fruit', 'berry', 'snack'] },
  { id: 'grape', name: 'Grape', category: 'Food', keywords: ['fruit', 'snack'] },
  { id: 'citrus', name: 'Citrus', category: 'Food', keywords: ['orange', 'lemon', 'vitamin', 'fruit'] },
  { id: 'carrot', name: 'Carrot', category: 'Food', keywords: ['vegetable', 'healthy', 'snack'] },
  { id: 'salad', name: 'Salad', category: 'Food', keywords: ['healthy', 'veggies', 'meal', 'diet'] },
  { id: 'leafy-green', name: 'Greens', category: 'Food', keywords: ['vegetable', 'salad', 'healthy'] },
  { id: 'bean', name: 'Bean', category: 'Food', keywords: ['protein', 'legume', 'healthy'] },
  { id: 'egg', name: 'Egg', category: 'Food', keywords: ['breakfast', 'protein', 'cook'] },
  { id: 'milk', name: 'Milk', category: 'Food', keywords: ['dairy', 'drink', 'calcium'] },
  { id: 'coffee', name: 'Coffee', category: 'Food', keywords: ['cafe', 'caffeine', 'morning', 'drink'] },
  { id: 'cup-soda', name: 'Soda Cup', category: 'Food', keywords: ['drink', 'beverage'] },
  { id: 'utensils', name: 'Utensils', category: 'Food', keywords: ['eat', 'meal', 'dinner', 'lunch'] },
  { id: 'chef-hat', name: 'Chef Hat', category: 'Food', keywords: ['cook', 'cooking', 'kitchen', 'recipe'] },
  { id: 'cooking-pot', name: 'Cooking Pot', category: 'Food', keywords: ['cook', 'meal', 'kitchen'] },
  { id: 'soup', name: 'Soup', category: 'Food', keywords: ['meal', 'warm', 'food'] },
  { id: 'sandwich', name: 'Sandwich', category: 'Food', keywords: ['lunch', 'meal', 'food'] },
  { id: 'pizza', name: 'Pizza', category: 'Food', keywords: ['food', 'treat', 'meal'] },
  { id: 'cookie', name: 'Cookie', category: 'Food', keywords: ['snack', 'treat', 'dessert'] },
  { id: 'ice-cream-cone', name: 'Ice Cream', category: 'Food', keywords: ['dessert', 'treat', 'sweet'] },
  { id: 'beer-off', name: 'No Beer', category: 'Food', keywords: ['alcohol free', 'sobriety', 'quit'] },
  { id: 'wine-off', name: 'No Wine', category: 'Food', keywords: ['alcohol free', 'sobriety', 'quit'] },
  { id: 'cigarette-off', name: 'No Smoking', category: 'Food', keywords: ['quit smoking', 'sobriety', 'health'] },
  { id: 'ban', name: 'Ban', category: 'Food', keywords: ['avoid', 'quit', 'restrict', 'no'] },

  // --- HOBBIES ---
  { id: 'music', name: 'Music', category: 'Hobbies', keywords: ['song', 'listen', 'practice', 'audio'] },
  { id: 'headphones', name: 'Headphones', category: 'Hobbies', keywords: ['music', 'podcast', 'listen'] },
  { id: 'mic', name: 'Mic', category: 'Hobbies', keywords: ['sing', 'podcast', 'speak', 'record'] },
  { id: 'guitar', name: 'Guitar', category: 'Hobbies', keywords: ['music', 'practice', 'instrument'] },
  { id: 'piano', name: 'Piano', category: 'Hobbies', keywords: ['music', 'keys', 'practice', 'instrument'] },
  { id: 'palette', name: 'Palette', category: 'Hobbies', keywords: ['art', 'paint', 'draw', 'creative'] },
  { id: 'paintbrush', name: 'Paintbrush', category: 'Hobbies', keywords: ['art', 'paint', 'draw'] },
  { id: 'brush', name: 'Brush', category: 'Hobbies', keywords: ['art', 'paint', 'design'] },
  { id: 'camera', name: 'Camera', category: 'Hobbies', keywords: ['photo', 'photography', 'picture'] },
  { id: 'film', name: 'Film', category: 'Hobbies', keywords: ['movie', 'watch', 'cinema'] },
  { id: 'clapperboard', name: 'Clapperboard', category: 'Hobbies', keywords: ['movie', 'film', 'watch'] },
  { id: 'gamepad-2', name: 'Gamepad', category: 'Hobbies', keywords: ['game', 'gaming', 'play'] },
  { id: 'dice-5', name: 'Dice', category: 'Hobbies', keywords: ['game', 'board game', 'play'] },
  { id: 'puzzle', name: 'Puzzle', category: 'Hobbies', keywords: ['puzzle', 'brain', 'game', 'solve'] },
  { id: 'binoculars', name: 'Binoculars', category: 'Hobbies', keywords: ['birdwatch', 'explore', 'observe'] },
  { id: 'compass', name: 'Compass', category: 'Hobbies', keywords: ['explore', 'adventure', 'navigate'] },
  { id: 'tent', name: 'Tent', category: 'Hobbies', keywords: ['camp', 'outdoors', 'adventure'] },
  { id: 'fish', name: 'Fish', category: 'Hobbies', keywords: ['fishing', 'aquarium', 'pet'] },
  { id: 'bird', name: 'Bird', category: 'Hobbies', keywords: ['birdwatch', 'nature', 'pet'] },
  { id: 'gift', name: 'Gift', category: 'Hobbies', keywords: ['present', 'give', 'celebrate'] },
  { id: 'party-popper', name: 'Party', category: 'Hobbies', keywords: ['celebrate', 'fun', 'party'] },

  // --- NATURE ---
  { id: 'sprout', name: 'Sprout', category: 'Nature', keywords: ['grow', 'plant', 'garden', 'green'] },
  { id: 'trees', name: 'Trees', category: 'Nature', keywords: ['forest', 'nature', 'outdoors'] },
  { id: 'tree-pine', name: 'Pine Tree', category: 'Nature', keywords: ['forest', 'nature', 'outdoors'] },
  { id: 'flower-2', name: 'Bloom', category: 'Nature', keywords: ['garden', 'flower', 'plant'] },
  { id: 'clover', name: 'Clover', category: 'Nature', keywords: ['luck', 'nature', 'green'] },
  { id: 'sun', name: 'Sunshine', category: 'Nature', keywords: ['outdoors', 'vitamin d', 'day'] },
  { id: 'cloud-rain', name: 'Rain', category: 'Nature', keywords: ['weather', 'rain', 'water'] },
  { id: 'snowflake', name: 'Snowflake', category: 'Nature', keywords: ['winter', 'cold', 'snow'] },
  { id: 'umbrella', name: 'Umbrella', category: 'Nature', keywords: ['rain', 'weather', 'protect'] },
  { id: 'flame', name: 'Flame', category: 'Nature', keywords: ['fire', 'energy', 'warmth', 'streak'] },
  { id: 'bug', name: 'Bug', category: 'Nature', keywords: ['insect', 'nature', 'garden'] },

  // --- SYMBOLS ---
  { id: 'circle-check', name: 'Check', category: 'Symbols', keywords: ['done', 'complete', 'habit', 'check'] },
  { id: 'star', name: 'Star', category: 'Symbols', keywords: ['favorite', 'goal', 'important'] },
  { id: 'award', name: 'Award', category: 'Symbols', keywords: ['achievement', 'badge', 'win'] },
  { id: 'bookmark', name: 'Bookmark', category: 'Symbols', keywords: ['save', 'mark', 'remember'] },
  { id: 'bell', name: 'Bell', category: 'Symbols', keywords: ['reminder', 'notification', 'alert'] },
  { id: 'battery-charging', name: 'Charging', category: 'Symbols', keywords: ['energy', 'recharge', 'power'] },
  { id: 'key', name: 'Key', category: 'Symbols', keywords: ['unlock', 'access', 'important'] },
  { id: 'lock', name: 'Lock', category: 'Symbols', keywords: ['secure', 'privacy', 'protect'] },
  { id: 'shield', name: 'Shield', category: 'Symbols', keywords: ['protect', 'safety', 'defense'] },
  { id: 'infinity', name: 'Infinity', category: 'Symbols', keywords: ['forever', 'habit', 'loop'] },
  { id: 'hash', name: 'Hash', category: 'Symbols', keywords: ['tag', 'number', 'symbol'] },
  { id: 'percent', name: 'Percent', category: 'Symbols', keywords: ['progress', 'stats', 'rate'] },
  { id: 'plus', name: 'Plus', category: 'Symbols', keywords: ['add', 'new', 'positive'] },
  { id: 'atom', name: 'Atom', category: 'Symbols', keywords: ['science', 'learn', 'energy'] },
  { id: 'dna', name: 'DNA', category: 'Symbols', keywords: ['biology', 'health', 'science'] },
];

/**
 * Unique icon ids (dataset may intentionally reuse an id across categories for search).
 */
const UNIQUE_HABIT_ICONS: HabitIconItem[] = (() => {
  const seen = new Set<string>();
  const unique: HabitIconItem[] = [];
  for (const item of HABIT_ICON_DATASET) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
})();

const HABIT_ICON_ID_SET = new Set(UNIQUE_HABIT_ICONS.map((item) => item.id));

export function getUniqueHabitIcons(): HabitIconItem[] {
  return UNIQUE_HABIT_ICONS;
}

export function isHabitIconId(icon: string | null | undefined): boolean {
  if (!icon) return false;
  return HABIT_ICON_ID_SET.has(icon);
}

export function searchHabitIcons(
  query: string,
  category: HabitIconCategory = 'Popular'
): HabitIconItem[] {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    if (category === 'Popular') {
      return UNIQUE_HABIT_ICONS;
    }
    return HABIT_ICON_DATASET.filter((item) => item.category === category).filter(
      (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index
    );
  }

  return UNIQUE_HABIT_ICONS.filter((item) => {
    const matchesName = item.name.toLowerCase().includes(trimmed);
    const matchesId = item.id.toLowerCase().includes(trimmed);
    const matchesKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(trimmed));
    const categoryMatch = HABIT_ICON_DATASET.some(
      (entry) =>
        entry.id === item.id &&
        (entry.category.toLowerCase().includes(trimmed) ||
          entry.keywords.some((kw) => kw.toLowerCase().includes(trimmed)) ||
          entry.name.toLowerCase().includes(trimmed))
    );
    return matchesName || matchesId || matchesKeywords || categoryMatch;
  });
}
