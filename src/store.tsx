import React, { createContext, useContext, useState, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Meal     = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export type Nutrient = 'protein' | 'carbs' | 'fat' | 'fiber' | 'vitamins' | 'minerals';
export type Role     = 'parent' | 'kid';
export type GoalType = 'individual' | 'group';
export type AgeGroup = 'child_4_8' | 'child_9_13' | 'teen_14_18' | 'adult';

export const TAB_BAR_HEIGHT = 70;

export interface FoodEntry {
  id:       string;
  name:     string;
  meal:     Meal;
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
  fiber:    number;
  vitamins: number;
  minerals: number;
}

export interface Goal {
  id:                 string;
  title:              string;
  type:               GoalType;
  weeklyPointsTarget: number;
  reward:             string;
}

export interface DayRecord {
  date:    string; // "YYYY-MM-DD"
  entries: FoodEntry[];
}

export interface FamilyMember {
  id:         string;
  name:       string;
  role:       Role;
  avatar:     string;
  weekPts:    number;
  ageGroup:   AgeGroup;
  autoPreset: boolean;
  params:     NutrientParams;
}

export type NutrientParams = Record<Nutrient, number>; // 0 = disabled

// ─── Age-group presets (USDA Dietary Reference Intakes) ───────────────────────

export const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  child_4_8:  'Ages 4–8',
  child_9_13: 'Ages 9–13',
  teen_14_18: 'Ages 14–18',
  adult:      'Adult',
};

// Default enabled nutrients when auto is first applied (carbs/fat/minerals off by default)
export const NUTRIENT_PRESETS: Record<AgeGroup, NutrientParams> = {
  child_4_8:  { protein: 19, carbs: 0, fat: 0, fiber: 25, vitamins: 100, minerals: 0 },
  child_9_13: { protein: 34, carbs: 0, fat: 0, fiber: 26, vitamins: 100, minerals: 0 },
  teen_14_18: { protein: 50, carbs: 0, fat: 0, fiber: 29, vitamins: 100, minerals: 0 },
  adult:      { protein: 50, carbs: 0, fat: 0, fiber: 25, vitamins: 100, minerals: 0 },
};

// Full DRI reference values for every nutrient — used when toggling extras on in auto mode
export const NUTRIENT_DRI: Record<AgeGroup, NutrientParams> = {
  child_4_8:  { protein: 19, carbs: 130, fat: 40, fiber: 25, vitamins: 100, minerals: 100 },
  child_9_13: { protein: 34, carbs: 130, fat: 60, fiber: 26, vitamins: 100, minerals: 100 },
  teen_14_18: { protein: 50, carbs: 130, fat: 65, fiber: 29, vitamins: 100, minerals: 100 },
  adult:      { protein: 50, carbs: 130, fat: 65, fiber: 25, vitamins: 100, minerals: 100 },
};

export const AGE_GROUPS: AgeGroup[] = ['child_4_8', 'child_9_13', 'teen_14_18', 'adult'];

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppCtx {
  role:               Role;
  setRole:            (r: Role) => void;
  entries:            FoodEntry[];
  setEntries:         React.Dispatch<React.SetStateAction<FoodEntry[]>>;
  goals:              Goal[];
  setGoals:           React.Dispatch<React.SetStateAction<Goal[]>>;
  params:             NutrientParams;
  setParams:          React.Dispatch<React.SetStateAction<NutrientParams>>;
  ageGroup:           AgeGroup;
  setAgeGroup:        (g: AgeGroup) => void;
  history:            DayRecord[];
  setHistory:         React.Dispatch<React.SetStateAction<DayRecord[]>>;
  familyName:         string;
  familyCode:         string;
  familyMembers:      FamilyMember[];
  familyNutrients:    Nutrient[];
  setFamilyNutrients: (nutrients: Nutrient[]) => void;
  setMemberAgeGroup:  (id: string, g: AgeGroup) => void;
  currentUserName:    string;
  currentUserId:      string;
  updateMember:       (id: string, updates: Partial<FamilyMember>) => void;
  updateHistoryDay:   (date: string, updater: (prev: FoodEntry[]) => FoodEntry[]) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ENTRIES: FoodEntry[] = [
  { id: '1', name: 'Oatmeal with Berries',  meal: 'Breakfast', calories: 320, protein:  8, carbs: 58, fat:  6, fiber: 4, vitamins:  8, minerals: 10 },
  { id: '2', name: 'Orange Juice',           meal: 'Breakfast', calories: 110, protein:  2, carbs: 26, fat:  0, fiber: 0, vitamins: 15, minerals:  2 },
  { id: '3', name: 'Grilled Chicken Salad', meal: 'Lunch',     calories: 450, protein: 38, carbs: 20, fat: 18, fiber: 5, vitamins: 20, minerals: 12 },
  { id: '4', name: 'Whole Wheat Bread',      meal: 'Lunch',     calories: 180, protein:  6, carbs: 34, fat:  2, fiber: 3, vitamins:  4, minerals:  8 },
  { id: '5', name: 'Atlantic Salmon',        meal: 'Dinner',    calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0, vitamins: 12, minerals: 18 },
  { id: '6', name: 'Steamed Broccoli',       meal: 'Dinner',    calories:  55, protein:  4, carbs: 11, fat:  1, fiber: 3, vitamins: 22, minerals:  6 },
  { id: '7', name: 'Greek Yogurt',           meal: 'Snacks',    calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0, vitamins:  6, minerals: 14 },
];

const DEMO_GOALS: Goal[] = [
  { id: 'g1', title: 'Protein Power Week',      type: 'individual', weeklyPointsTarget: 70,  reward: '$10 allowance 💵'     },
  { id: 'g2', title: 'Family Health Challenge',  type: 'group',      weeklyPointsTarget: 200, reward: 'Family movie night 🎬' },
];

// Demo history — Mon–Wed of this week + a full last week
const DEMO_HISTORY: DayRecord[] = [
  {
    date: '2026-05-13',
    entries: [
      { id: 'h13a', name: 'Egg McMuffin',       meal: 'Breakfast', calories: 310, protein: 17, carbs: 30, fat: 13, fiber: 2,  vitamins: 10, minerals: 20 },
      { id: 'h13b', name: 'Grilled Chicken',    meal: 'Lunch',     calories: 280, protein: 32, carbs:  5, fat:  6, fiber: 2,  vitamins:  6, minerals: 12 },
      { id: 'h13c', name: 'Brown Rice',         meal: 'Lunch',     calories: 215, protein:  5, carbs: 44, fat:  2, fiber: 4,  vitamins:  4, minerals:  8 },
      { id: 'h13d', name: 'Black Beans',        meal: 'Dinner',    calories: 114, protein:  8, carbs: 20, fat:  0, fiber: 8,  vitamins:  2, minerals: 12 },
      { id: 'h13e', name: 'Turkey Breast',      meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },
    ],
  },
  {
    date: '2026-05-12',
    entries: [
      { id: 'h12a', name: 'Orange Juice',       meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 80, minerals:  5 },
      { id: 'h12b', name: 'Granola Bar',        meal: 'Snacks',    calories: 193, protein:  4, carbs: 29, fat:  8, fiber: 2,  vitamins:  4, minerals:  6 },
      { id: 'h12c', name: 'Pasta',              meal: 'Lunch',     calories: 220, protein:  8, carbs: 43, fat:  1, fiber: 2,  vitamins:  4, minerals:  8 },
      { id: 'h12d', name: 'Cheddar Cheese',     meal: 'Snacks',    calories: 114, protein:  7, carbs:  0, fat:  9, fiber: 0,  vitamins:  4, minerals: 20 },
      { id: 'h12e', name: 'Whole Wheat Bread',  meal: 'Dinner',    calories:  80, protein:  4, carbs: 15, fat:  1, fiber: 2,  vitamins:  4, minerals:  6 },
    ],
  },
  {
    date: '2026-05-11',
    entries: [
      { id: 'h11a', name: 'Oatmeal',            meal: 'Breakfast', calories: 154, protein:  5, carbs: 28, fat:  3, fiber: 4,  vitamins:  2, minerals: 10 },
      { id: 'h11b', name: 'Grilled Chicken',    meal: 'Lunch',     calories: 280, protein: 32, carbs:  5, fat:  6, fiber: 2,  vitamins:  6, minerals: 12 },
      { id: 'h11c', name: 'String Cheese',      meal: 'Snacks',    calories:  80, protein:  7, carbs:  1, fat:  5, fiber: 0,  vitamins:  2, minerals: 18 },
      { id: 'h11d', name: 'Brown Rice',         meal: 'Dinner',    calories: 216, protein:  5, carbs: 45, fat:  2, fiber: 4,  vitamins:  4, minerals: 12 },
      { id: 'h11e', name: 'Turkey Breast',      meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },
    ],
  },
  {
    date: '2026-05-10',
    entries: [
      { id: 'lw10a', name: 'Big Mac',           meal: 'Lunch',     calories: 550, protein: 25, carbs: 45, fat: 30, fiber: 3,  vitamins: 10, minerals: 25 },
      { id: 'lw10b', name: 'French Fries (M)',  meal: 'Lunch',     calories: 320, protein:  4, carbs: 44, fat: 15, fiber: 4,  vitamins:  8, minerals:  8 },
      { id: 'lw10c', name: 'Apple Juice',       meal: 'Snacks',    calories: 114, protein:  0, carbs: 28, fat:  0, fiber: 0,  vitamins:  6, minerals:  4 },
    ],
  },
  {
    date: '2026-05-09',
    entries: [
      { id: 'lw9a',  name: 'Orange Juice',          meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0, vitamins: 80, minerals:  5 },
      { id: 'lw9b',  name: 'Oatmeal',               meal: 'Breakfast', calories: 154, protein:  5, carbs: 28, fat:  3, fiber: 4, vitamins:  2, minerals: 10 },
      { id: 'lw9c',  name: 'Grilled Chicken Salad', meal: 'Lunch',     calories: 450, protein: 38, carbs: 20, fat: 18, fiber: 5, vitamins: 20, minerals: 12 },
      { id: 'lw9d',  name: 'Greek Yogurt',           meal: 'Snacks',    calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0, vitamins:  6, minerals: 14 },
      { id: 'lw9e',  name: 'Atlantic Salmon',        meal: 'Dinner',    calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0, vitamins: 12, minerals: 18 },
    ],
  },
  {
    date: '2026-05-08',
    entries: [
      { id: 'lw8a',  name: 'Scrambled Eggs',   meal: 'Breakfast', calories: 182, protein: 12, carbs:  2, fat: 14, fiber: 0, vitamins: 15, minerals: 10 },
      { id: 'lw8b',  name: 'OJ',               meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0, vitamins: 80, minerals:  5 },
      { id: 'lw8c',  name: 'Turkey Sandwich',  meal: 'Lunch',     calories: 510, protein: 32, carbs: 58, fat: 15, fiber: 4, vitamins: 10, minerals: 20 },
      { id: 'lw8d',  name: 'Atlantic Salmon',  meal: 'Dinner',    calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0, vitamins: 12, minerals: 18 },
    ],
  },
  {
    date: '2026-05-07',
    entries: [
      { id: 'lw7a',  name: 'Oatmeal with Berries',  meal: 'Breakfast', calories: 320, protein:  8, carbs: 58, fat:  6, fiber: 4, vitamins:  8, minerals: 10 },
      { id: 'lw7b',  name: 'OJ',                    meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0, vitamins: 80, minerals:  5 },
      { id: 'lw7c',  name: 'Grilled Chicken Salad', meal: 'Lunch',     calories: 450, protein: 38, carbs: 20, fat: 18, fiber: 5, vitamins: 20, minerals: 12 },
      { id: 'lw7d',  name: 'Atlantic Salmon',        meal: 'Dinner',   calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0, vitamins: 12, minerals: 18 },
      { id: 'lw7e',  name: 'Steamed Broccoli',       meal: 'Dinner',   calories:  55, protein:  4, carbs: 11, fat:  1, fiber: 5, vitamins: 22, minerals:  6 },
      { id: 'lw7f',  name: 'Greek Yogurt',           meal: 'Snacks',   calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0, vitamins:  6, minerals: 14 },
    ],
  },
  {
    date: '2026-05-06',
    entries: [
      { id: 'lw6a',  name: 'Egg McMuffin',  meal: 'Breakfast', calories: 310, protein: 17, carbs: 30, fat: 13, fiber: 2, vitamins: 10, minerals: 20 },
      { id: 'lw6b',  name: 'Brown Rice',    meal: 'Lunch',     calories: 216, protein:  5, carbs: 45, fat:  2, fiber: 4, vitamins:  4, minerals: 12 },
      { id: 'lw6c',  name: 'Turkey Breast', meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0, vitamins:  4, minerals: 10 },
      { id: 'lw6d',  name: 'Almonds',       meal: 'Snacks',    calories: 164, protein:  6, carbs:  6, fat: 14, fiber: 4, vitamins:  8, minerals: 12 },
    ],
  },
  {
    date: '2026-05-05',
    entries: [
      { id: 'lw5a',  name: 'Granola Bar',  meal: 'Breakfast', calories: 193, protein:  4, carbs: 29, fat:  8, fiber: 2, vitamins:  4, minerals:  6 },
      { id: 'lw5b',  name: 'Whopper',      meal: 'Lunch',     calories: 660, protein: 28, carbs: 49, fat: 40, fiber: 2, vitamins: 10, minerals: 20 },
      { id: 'lw5c',  name: 'Apple Juice',  meal: 'Snacks',    calories: 114, protein:  0, carbs: 28, fat:  0, fiber: 0, vitamins:  6, minerals:  4 },
    ],
  },
  {
    date: '2026-05-04',
    entries: [
      { id: 'lw4a',  name: 'Scrambled Eggs',   meal: 'Breakfast', calories: 182, protein: 12, carbs:  2, fat: 14, fiber: 0, vitamins: 15, minerals: 10 },
      { id: 'lw4b',  name: 'OJ',               meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0, vitamins: 80, minerals:  5 },
      { id: 'lw4c',  name: 'Chicken Sandwich', meal: 'Lunch',     calories: 440, protein: 28, carbs: 40, fat: 19, fiber: 1, vitamins:  4, minerals: 20 },
      { id: 'lw4d',  name: 'Greek Yogurt',     meal: 'Snacks',    calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0, vitamins:  6, minerals: 14 },
      { id: 'lw4e',  name: 'Turkey Breast',    meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0, vitamins:  4, minerals: 10 },
    ],
  },
];

// Each member carries their own age group + params. Alex (u1) is the demo kid account.
const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'u1', name: 'Alex',  role: 'kid',    avatar: '🧒', weekPts: 0,
    ageGroup: 'child_9_13', autoPreset: true,
    params: { ...NUTRIENT_PRESETS.child_9_13 },
  },
  {
    id: 'u2', name: 'Emma',  role: 'kid',    avatar: '👧', weekPts: 50,
    ageGroup: 'child_4_8',  autoPreset: true,
    params: { ...NUTRIENT_PRESETS.child_4_8 },
  },
  {
    id: 'u3', name: 'Jake',  role: 'kid',    avatar: '👦', weekPts: 20,
    ageGroup: 'child_9_13', autoPreset: false,
    params: { protein: 40, carbs: 0, fat: 0, fiber: 20, vitamins: 100, minerals: 0 },
  },
  {
    id: 'u4', name: 'Sarah', role: 'parent', avatar: '👩', weekPts: 0,
    ageGroup: 'adult',      autoPreset: false,
    params: { protein: 0, carbs: 0, fat: 0, fiber: 0, vitamins: 0, minerals: 0 },
  },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

// Default nutrients tracked family-wide
const DEFAULT_FAMILY_NUTRIENTS: Nutrient[] = ['protein', 'fiber', 'vitamins'];

export function AppProvider({ children }: { children: ReactNode }) {
  const [role,             setRole]             = useState<Role>('kid');
  const [entries,          setEntries]          = useState<FoodEntry[]>(DEMO_ENTRIES);
  const [goals,            setGoals]            = useState<Goal[]>(DEMO_GOALS);
  const [history,          setHistory]          = useState<DayRecord[]>(DEMO_HISTORY);
  const [familyMembers,    setFamilyMembers]    = useState<FamilyMember[]>(DEMO_FAMILY_MEMBERS);
  const [familyNutrients,  setFamilyNutrientsState] = useState<Nutrient[]>(DEFAULT_FAMILY_NUTRIENTS);

  // Current user identity — role switch drives which member record is active
  const currentUserId   = role === 'parent' ? 'u4' : 'u1';
  const currentUserName = role === 'parent' ? 'Sarah' : 'Alex';
  const currentMember   = familyMembers.find(m => m.id === currentUserId)!;

  // params and ageGroup derived from the current user's member record
  const params   = currentMember.params;
  const ageGroup = currentMember.ageGroup;

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setFamilyMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  // Build a params object for a member based on which family nutrients are enabled
  const paramsForMember = (ag: AgeGroup, enabled: Nutrient[], existingParams: NutrientParams, isAuto: boolean): NutrientParams =>
    Object.fromEntries(NUTRIENTS.map(n => {
      if (!enabled.includes(n)) return [n, 0];
      // Auto members always use DRI; manual members keep their existing value or fall back to DRI
      return [n, isAuto ? NUTRIENT_DRI[ag][n] : (existingParams[n] > 0 ? existingParams[n] : NUTRIENT_DRI[ag][n])];
    })) as NutrientParams;

  // Toggle a family nutrient on/off — updates every member simultaneously
  const setFamilyNutrients = (nutrients: Nutrient[]) => {
    const added   = nutrients.filter(n => !familyNutrients.includes(n));
    const removed = familyNutrients.filter(n => !nutrients.includes(n));
    setFamilyNutrientsState(nutrients);
    if (added.length === 0 && removed.length === 0) return;
    setFamilyMembers(prev => prev.map(m => {
      const newParams = { ...m.params };
      added.forEach(n => { newParams[n] = NUTRIENT_DRI[m.ageGroup][n]; });
      removed.forEach(n => { newParams[n] = 0; });
      return { ...m, params: newParams };
    }));
  };

  // Change one member's age group — only updates enabled family nutrients
  const setMemberAgeGroup = (id: string, g: AgeGroup) => {
    setFamilyMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      const newParams = paramsForMember(g, familyNutrients, m.params, m.autoPreset);
      return { ...m, ageGroup: g, params: newParams };
    }));
  };

  // setParams writes through to the current user's member record
  const setParams: React.Dispatch<React.SetStateAction<NutrientParams>> = (action) => {
    setFamilyMembers(prev => prev.map(m => {
      if (m.id !== currentUserId) return m;
      const next = typeof action === 'function' ? action(m.params) : action;
      return { ...m, params: next };
    }));
  };

  const setAgeGroup = (g: AgeGroup) => {
    setMemberAgeGroup(currentUserId, g);
    // also mark the current user as auto
    setFamilyMembers(prev => prev.map(m => m.id === currentUserId ? { ...m, autoPreset: true } : m));
  };

  const updateHistoryDay = (date: string, updater: (prev: FoodEntry[]) => FoodEntry[]) => {
    if (date === todayString()) {
      setEntries(updater);
    } else {
      setHistory(prev => {
        const idx = prev.findIndex(d => d.date === date);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { date, entries: updater(copy[idx].entries) };
          return copy;
        }
        return [...prev, { date, entries: updater([]) }];
      });
    }
  };

  return (
    <Ctx.Provider value={{
      role, setRole, entries, setEntries, goals, setGoals,
      params, setParams, ageGroup, setAgeGroup,
      history, setHistory,
      familyName: 'The Gould Family',
      familyCode: 'GOULD-2024',
      familyMembers,
      familyNutrients,
      setFamilyNutrients,
      setMemberAgeGroup,
      currentUserName,
      currentUserId,
      updateMember,
      updateHistoryDay,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calcTodayPoints(entries: FoodEntry[], params: NutrientParams): number {
  const t = getTodayTotals(entries);
  return NUTRIENTS.reduce((pts, n) => {
    if (params[n] <= 0) return pts;
    const pct = t[n] / params[n];
    if (pct >= 1.0) return pts + 10;
    if (pct >= 0.7) return pts + 5;
    return pts;
  }, 0);
}

export function getTodayTotals(entries: FoodEntry[]): Record<Nutrient, number> {
  return entries.reduce(
    (acc, e) => ({
      protein:  acc.protein  + e.protein,
      carbs:    acc.carbs    + e.carbs,
      fat:      acc.fat      + e.fat,
      fiber:    acc.fiber    + e.fiber,
      vitamins: acc.vitamins + e.vitamins,
      minerals: acc.minerals + e.minerals,
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0, vitamins: 0, minerals: 0 },
  );
}

/** Monday of the week containing `date`, as YYYY-MM-DD. */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().split('T')[0];
}

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function calcWeekPoints(
  history: DayRecord[],
  entries: FoodEntry[],
  params:  NutrientParams,
): number {
  const weekStart = getWeekStart(new Date());
  const today     = todayString();
  const prior = history
    .filter(d => d.date >= weekStart && d.date < today)
    .reduce((sum, d) => sum + calcTodayPoints(d.entries, params), 0);
  return prior + calcTodayPoints(entries, params);
}

export const NUTRIENTS: Nutrient[] = ['protein', 'carbs', 'fat', 'fiber', 'vitamins', 'minerals'];

export const N_EMOJI:  Record<Nutrient, string> = { protein: '💪', carbs: '🌾', fat: '🥑', fiber: '🥦', vitamins: '🍊', minerals: '⚡' };
export const N_LABEL:  Record<Nutrient, string> = { protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fiber: 'Fiber', vitamins: 'Vitamins', minerals: 'Minerals' };
export const N_UNIT:   Record<Nutrient, string> = { protein: 'g', carbs: 'g', fat: 'g', fiber: 'g', vitamins: '%', minerals: '%' };
export const N_COLOR:  Record<Nutrient, string> = { protein: '#FF6B35', carbs: '#4ECDC4', fat: '#95E06C', fiber: '#A8D8A8', vitamins: '#FFB347', minerals: '#87CEEB' };

/** Returns easy/medium/hard weekly point targets based on active nutrients. */
export function suggestWeeklyGoals(params: NutrientParams): { easy: number; medium: number; hard: number } {
  const active = NUTRIENTS.filter(n => params[n] > 0).length;
  const maxDay = active * 10;
  const snap = (n: number) => Math.round(n / 5) * 5;
  return {
    easy:   snap(maxDay * 7 * 0.45),
    medium: snap(maxDay * 7 * 0.65),
    hard:   snap(maxDay * 7 * 0.82),
  };
}
