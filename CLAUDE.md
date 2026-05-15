# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose a platform)
npx expo start          # interactive — press w for web, a for Android, i for iOS
npx expo start --web    # open directly in browser at http://localhost:8081
npx expo start --android
npx expo start --ios    # macOS only

# Type-check without running
npx tsc --noEmit
```

There is no test suite and no linter configured yet.

## Architecture

This is an **Expo SDK 54 + React Native 0.81.5** app with **New Architecture enabled** (`newArchEnabled: true` in `app.json`). Web support is included via `react-native-web`.

### File layout

```
App.tsx                  ← root component, mounts <FoodLog />
index.ts                 ← Expo entry point (registers App)
src/
  FoodLog.tsx            ← entire app UI (single-screen for now)
  foodDatabase.ts        ← local food database + search utility
```

### Data model

`FoodEntry` (runtime, in-memory state inside `FoodLog.tsx`):
```ts
{ id, name, meal, calories, protein, carbs, fat, fiber, vitamins, minerals }
```
- `vitamins` and `minerals` are stored as **% Daily Value** integers, not grams.
- State is ephemeral — there is no persistence layer yet.

`FoodDBEntry` (static database in `foodDatabase.ts`):
- Same nutrient shape as `FoodEntry` minus `meal`.
- `searchFoods(query)` does a case-insensitive substring match on both `name` and `brand`, returning up to 8 results.

### Nutrient goals (kids, approximate)

| Nutrient | Goal |
|----------|------|
| Calories | 1800 kcal |
| Protein  | 50 g |
| Carbs    | 230 g |
| Fat      | 65 g |
| Fiber    | 25 g |
| Vitamins | 100 % DV |
| Minerals | 100 % DV |

These are defined as the `GOALS` constant at the top of `FoodLog.tsx`.

### UI structure

`FoodLog` renders one `SafeAreaView` with:
1. **Header** — greeting + avatar
2. **`<CalorieBar>`** — slim, gray full-width bar (intentionally de-emphasised)
3. **3×2 `<NutrientCard>` grid** — Protein, Carbs, Fat / Fiber, Vitamins, Minerals — uses `flexBasis: '30%'` + `flexGrow: 1` so it fills any window width without overflowing
4. **Meal sections** — Breakfast / Lunch / Dinner / Snacks, each with a `+ Add` chip
5. **Sticky bottom bar** — large yellow `Log Food` button (`position: 'absolute'`)
6. **`<Modal>` sheet** — slide-up; contains meal chip selector, search bar, search results list, selected-food badge, and manual input fields

The modal has two display states driven by `searchResults.length`:
- **Searching** (`searchResults.length > 0`): results list is shown, manual fields are hidden.
- **Not searching** (`searchResults.length === 0`): manual fields are shown (pre-filled if a DB food was selected).

### Design tokens

```ts
YELLOW = '#FFD60A'  // primary action color
BG     = '#F5F5F5'  // page background
DARK   = '#1C1C1E'  // primary text
```

Styles are colocated in the same file using `StyleSheet.create`. There are four separate `StyleSheet` objects: `s` (main), `cb` (calorie bar), `nc` (nutrient cards), `chip`.

### What's not yet built

- Navigation / multiple screens
- User profiles or kid accounts
- Persistence (AsyncStorage, backend, or Firebase)
- Barcode scanning
- Gamification (points, leaderboard)
