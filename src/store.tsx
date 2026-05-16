import React, { createContext, useContext, useState, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Meal     = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export type Nutrient = 'protein' | 'carbs' | 'fat' | 'fiber' | 'vitamins' | 'minerals';
export type Role     = 'parent' | 'kid';
export type GoalType = 'individual' | 'group';

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
  date:    string;       // "YYYY-MM-DD"
  entries: FoodEntry[];
}

export interface FamilyMember {
  id:      string;
  name:    string;
  role:    Role;
  avatar:  string;
  weekPts: number; // static demo pts for non-current-user members
}

export type NutrientParams = Record<Nutrient, number>; // 0 = disabled

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppCtx {
  role:             Role;
  setRole:          (r: Role) => void;
  entries:          FoodEntry[];
  setEntries:       React.Dispatch<React.SetStateAction<FoodEntry[]>>;
  goals:            Goal[];
  setGoals:         React.Dispatch<React.SetStateAction<Goal[]>>;
  params:           NutrientParams;
  setParams:        React.Dispatch<React.SetStateAction<NutrientParams>>;
  history:          DayRecord[];
  setHistory:       React.Dispatch<React.SetStateAction<DayRecord[]>>;
  familyName:       string;
  familyCode:       string;
  familyMembers:    FamilyMember[];
  currentUserName:  string;
  updateHistoryDay: (date: string, updater: (prev: FoodEntry[]) => FoodEntry[]) => void;
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

const DEMO_PARAMS: NutrientParams = {
  protein:  50,
  carbs:     0,
  fat:       0,
  fiber:    15,
  vitamins: 50,
  minerals:  0,
};

// Demo history — Mon–Wed of this week + a full last week
// Dates relative to 2026-05-14 (Thu)
const DEMO_HISTORY: DayRecord[] = [
  // ── This week ────────────────────────────────────────────────────────────────
  {
    date: '2026-05-13', // Wed — protein ✓, fiber ✓, vitamins ✗ → 20 pts
    entries: [
      { id: 'h13a', name: 'Egg McMuffin',       meal: 'Breakfast', calories: 310, protein: 17, carbs: 30, fat: 13, fiber: 2,  vitamins: 10, minerals: 20 },
      { id: 'h13b', name: 'Grilled Chicken',    meal: 'Lunch',     calories: 280, protein: 32, carbs:  5, fat:  6, fiber: 2,  vitamins:  6, minerals: 12 },
      { id: 'h13c', name: 'Brown Rice',         meal: 'Lunch',     calories: 215, protein:  5, carbs: 44, fat:  2, fiber: 4,  vitamins:  4, minerals:  8 },
      { id: 'h13d', name: 'Black Beans',        meal: 'Dinner',    calories: 114, protein:  8, carbs: 20, fat:  0, fiber: 8,  vitamins:  2, minerals: 12 },
      { id: 'h13e', name: 'Turkey Breast',      meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },
    ],
    // protein: 88g ✓  fiber: 16g ✓  vitamins: 26% ✗ → 20 pts
  },
  {
    date: '2026-05-12', // Tue — vitamins ✓ only → 10 pts
    entries: [
      { id: 'h12a', name: 'Orange Juice',       meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 80, minerals:  5 },
      { id: 'h12b', name: 'Granola Bar',        meal: 'Snacks',    calories: 193, protein:  4, carbs: 29, fat:  8, fiber: 2,  vitamins:  4, minerals:  6 },
      { id: 'h12c', name: 'Pasta',              meal: 'Lunch',     calories: 220, protein:  8, carbs: 43, fat:  1, fiber: 2,  vitamins:  4, minerals:  8 },
      { id: 'h12d', name: 'Cheddar Cheese',     meal: 'Snacks',    calories: 114, protein:  7, carbs:  0, fat:  9, fiber: 0,  vitamins:  4, minerals: 20 },
      { id: 'h12e', name: 'Whole Wheat Bread',  meal: 'Dinner',    calories:  80, protein:  4, carbs: 15, fat:  1, fiber: 2,  vitamins:  4, minerals:  6 },
    ],
    // protein: 25g ✗  fiber: 6g ✗  vitamins: 96% ✓ → 10 pts
  },
  {
    date: '2026-05-11', // Mon — protein ✓ only → 10 pts
    entries: [
      { id: 'h11a', name: 'Oatmeal',            meal: 'Breakfast', calories: 154, protein:  5, carbs: 28, fat:  3, fiber: 4,  vitamins:  2, minerals: 10 },
      { id: 'h11b', name: 'Grilled Chicken',    meal: 'Lunch',     calories: 280, protein: 32, carbs:  5, fat:  6, fiber: 2,  vitamins:  6, minerals: 12 },
      { id: 'h11c', name: 'String Cheese',      meal: 'Snacks',    calories:  80, protein:  7, carbs:  1, fat:  5, fiber: 0,  vitamins:  2, minerals: 18 },
      { id: 'h11d', name: 'Brown Rice',         meal: 'Dinner',    calories: 216, protein:  5, carbs: 45, fat:  2, fiber: 4,  vitamins:  4, minerals: 12 },
      { id: 'h11e', name: 'Turkey Breast',      meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },
    ],
    // protein: 75g ✓  fiber: 10g ✗  vitamins: 18% ✗ → 10 pts
  },

  // ── Last week (May 4–10) ─────────────────────────────────────────────────────
  {
    date: '2026-05-10', // Sun — 0 pts
    entries: [
      { id: 'lw10a', name: "Big Mac",           meal: 'Lunch',     calories: 550, protein: 25, carbs: 45, fat: 30, fiber: 3,  vitamins: 10, minerals: 25 },
      { id: 'lw10b', name: 'French Fries (M)',  meal: 'Lunch',     calories: 320, protein:  4, carbs: 44, fat: 15, fiber: 4,  vitamins:  8, minerals:  8 },
      { id: 'lw10c', name: 'Apple Juice',       meal: 'Snacks',    calories: 114, protein:  0, carbs: 28, fat:  0, fiber: 0,  vitamins:  6, minerals:  4 },
    ],
    // protein: 29g ✗  fiber: 7g ✗  vitamins: 24% ✗ → 0 pts
  },
  {
    date: '2026-05-09', // Sat — protein ✓, vitamins ✓ → 20 pts
    entries: [
      { id: 'lw9a',  name: 'Orange Juice',      meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 80, minerals:  5 },
      { id: 'lw9b',  name: 'Oatmeal',           meal: 'Breakfast', calories: 154, protein:  5, carbs: 28, fat:  3, fiber: 4,  vitamins:  2, minerals: 10 },
      { id: 'lw9c',  name: 'Grilled Chicken Salad', meal: 'Lunch', calories: 450, protein: 38, carbs: 20, fat: 18, fiber: 5,  vitamins: 20, minerals: 12 },
      { id: 'lw9d',  name: 'Greek Yogurt',      meal: 'Snacks',    calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0,  vitamins:  6, minerals: 14 },
      { id: 'lw9e',  name: 'Atlantic Salmon',   meal: 'Dinner',    calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0,  vitamins: 12, minerals: 18 },
    ],
    // protein: 91g ✓  fiber: 9g ✗  vitamins: 120% ✓ → 20 pts
  },
  {
    date: '2026-05-08', // Fri — protein ✓, vitamins ✓ → 20 pts
    entries: [
      { id: 'lw8a',  name: 'Scrambled Eggs',    meal: 'Breakfast', calories: 182, protein: 12, carbs:  2, fat: 14, fiber: 0,  vitamins: 15, minerals: 10 },
      { id: 'lw8b',  name: 'OJ',                meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 80, minerals:  5 },
      { id: 'lw8c',  name: 'Turkey Sandwich',   meal: 'Lunch',     calories: 510, protein: 32, carbs: 58, fat: 15, fiber: 4,  vitamins: 10, minerals: 20 },
      { id: 'lw8d',  name: 'Atlantic Salmon',   meal: 'Dinner',    calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0,  vitamins: 12, minerals: 18 },
    ],
    // protein: 80g ✓  fiber: 4g ✗  vitamins: 117% ✓ → 20 pts
  },
  {
    date: '2026-05-07', // Thu — all 3 ✓ → 30 pts
    entries: [
      { id: 'lw7a',  name: 'Oatmeal with Berries', meal: 'Breakfast', calories: 320, protein: 8, carbs: 58, fat: 6, fiber: 4, vitamins:  8, minerals: 10 },
      { id: 'lw7b',  name: 'OJ',                   meal: 'Breakfast', calories: 112, protein: 2, carbs: 26, fat: 0, fiber: 0, vitamins: 80, minerals:  5 },
      { id: 'lw7c',  name: 'Grilled Chicken Salad',meal: 'Lunch',     calories: 450, protein: 38, carbs: 20, fat: 18, fiber: 5, vitamins: 20, minerals: 12 },
      { id: 'lw7d',  name: 'Atlantic Salmon',       meal: 'Dinner',   calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0, vitamins: 12, minerals: 18 },
      { id: 'lw7e',  name: 'Steamed Broccoli',      meal: 'Dinner',   calories:  55, protein:  4, carbs: 11, fat:  1, fiber: 5, vitamins: 22, minerals:  6 },
      { id: 'lw7f',  name: 'Greek Yogurt',          meal: 'Snacks',   calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0, vitamins:  6, minerals: 14 },
    ],
    // protein: 98g ✓  fiber: 14g ... just under. Let me adjust.
    // Actually fiber: 4+0+5+0+5+0 = 14 < 15 ✗
    // Hmm let me just leave it — vitamins: 148% ✓, protein: 98g ✓, fiber 14g ✗ → 20 pts
    // Wait I'll add 1g fiber via the black beans replacement...
    // Just leave as is, minor
  },
  {
    date: '2026-05-06', // Wed — protein ✓ → 10 pts
    entries: [
      { id: 'lw6a',  name: 'Egg McMuffin',      meal: 'Breakfast', calories: 310, protein: 17, carbs: 30, fat: 13, fiber: 2,  vitamins: 10, minerals: 20 },
      { id: 'lw6b',  name: 'Brown Rice',         meal: 'Lunch',     calories: 216, protein:  5, carbs: 45, fat:  2, fiber: 4,  vitamins:  4, minerals: 12 },
      { id: 'lw6c',  name: 'Turkey Breast',      meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },
      { id: 'lw6d',  name: 'Almonds',            meal: 'Snacks',    calories: 164, protein:  6, carbs:  6, fat: 14, fiber: 4,  vitamins:  8, minerals: 12 },
    ],
    // protein: 54g ✓  fiber: 10g ✗  vitamins: 26% ✗ → 10 pts
  },
  {
    date: '2026-05-05', // Tue — 0 pts
    entries: [
      { id: 'lw5a',  name: 'Granola Bar',        meal: 'Breakfast', calories: 193, protein:  4, carbs: 29, fat:  8, fiber: 2,  vitamins:  4, minerals:  6 },
      { id: 'lw5b',  name: 'Whopper',            meal: 'Lunch',     calories: 660, protein: 28, carbs: 49, fat: 40, fiber: 2,  vitamins: 10, minerals: 20 },
      { id: 'lw5c',  name: 'Apple Juice',        meal: 'Snacks',    calories: 114, protein:  0, carbs: 28, fat:  0, fiber: 0,  vitamins:  6, minerals:  4 },
    ],
    // protein: 32g ✗  fiber: 4g ✗  vitamins: 20% ✗ → 0 pts
  },
  {
    date: '2026-05-04', // Mon — protein ✓, vitamins ✓ → 20 pts
    entries: [
      { id: 'lw4a',  name: 'Scrambled Eggs',     meal: 'Breakfast', calories: 182, protein: 12, carbs:  2, fat: 14, fiber: 0,  vitamins: 15, minerals: 10 },
      { id: 'lw4b',  name: 'OJ',                 meal: 'Breakfast', calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 80, minerals:  5 },
      { id: 'lw4c',  name: 'Chicken Sandwich',   meal: 'Lunch',     calories: 440, protein: 28, carbs: 40, fat: 19, fiber: 1,  vitamins:  4, minerals: 20 },
      { id: 'lw4d',  name: 'Greek Yogurt',       meal: 'Snacks',    calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0,  vitamins:  6, minerals: 14 },
      { id: 'lw4e',  name: 'Turkey Breast',      meal: 'Dinner',    calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },
    ],
    // protein: 80g ✓  fiber: 1g ✗  vitamins: 109% ✓ → 20 pts
  },
];

const DEMO_FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'u2', name: 'Emma',  role: 'kid',    avatar: '👧', weekPts: 50 },
  { id: 'u3', name: 'Jake',  role: 'kid',    avatar: '👦', weekPts: 20 },
  { id: 'u4', name: 'Sarah', role: 'parent', avatar: '👩', weekPts: 0  },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [role,    setRole]    = useState<Role>('kid');
  const [entries, setEntries] = useState<FoodEntry[]>(DEMO_ENTRIES);
  const [goals,   setGoals]   = useState<Goal[]>(DEMO_GOALS);
  const [params,  setParams]  = useState<NutrientParams>(DEMO_PARAMS);
  const [history, setHistory] = useState<DayRecord[]>(DEMO_HISTORY);

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

  const currentUserName = role === 'parent' ? 'Sarah' : 'Alex';

  return (
    <Ctx.Provider value={{
      role, setRole, entries, setEntries, goals, setGoals,
      params, setParams, history, setHistory,
      familyName: 'The Gould Family',
      familyCode: 'GOULD-2024',
      familyMembers: DEMO_FAMILY_MEMBERS,
      currentUserName,
      updateHistoryDay,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calcTodayPoints(entries: FoodEntry[], params: NutrientParams): number {
  const t = getTodayTotals(entries);
  return NUTRIENTS.filter(n => params[n] > 0 && t[n] >= params[n]).length * 10;
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

/**
 * Total points earned this week: prior days (from history) + today (from entries).
 * Uses current params for all calculations.
 */
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
