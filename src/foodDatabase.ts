export interface FoodDBEntry {
  id:       string;
  name:     string;
  brand:    string;
  calories: number;
  protein:  number; // g
  carbs:    number; // g
  fat:      number; // g
  fiber:    number; // g
  vitamins: number; // % DV
  minerals: number; // % DV
}

export const FOOD_DB: FoodDBEntry[] = [
  // ── McDonald's ─────────────────────────────────────────────────────────────
  { id: 'mc1',  name: "Big Mac",                  brand: "McDonald's",  calories: 550, protein: 25, carbs: 45, fat: 30, fiber: 3,  vitamins: 10, minerals: 25 },
  { id: 'mc2',  name: "McChicken",                brand: "McDonald's",  calories: 400, protein: 14, carbs: 40, fat: 21, fiber: 2,  vitamins:  6, minerals: 15 },
  { id: 'mc3',  name: "Chicken McNuggets (10 pc)",brand: "McDonald's",  calories: 420, protein: 22, carbs: 26, fat: 25, fiber: 1,  vitamins:  4, minerals: 10 },
  { id: 'mc4',  name: "Medium French Fries",      brand: "McDonald's",  calories: 320, protein:  4, carbs: 44, fat: 15, fiber: 4,  vitamins:  8, minerals:  8 },
  { id: 'mc5',  name: "Egg McMuffin",             brand: "McDonald's",  calories: 310, protein: 17, carbs: 30, fat: 13, fiber: 2,  vitamins: 10, minerals: 20 },
  { id: 'mc6',  name: "Quarter Pounder w/ Cheese",brand: "McDonald's",  calories: 520, protein: 30, carbs: 42, fat: 26, fiber: 2,  vitamins:  8, minerals: 30 },
  { id: 'mc7',  name: "Filet-O-Fish",             brand: "McDonald's",  calories: 390, protein: 16, carbs: 38, fat: 19, fiber: 1,  vitamins:  6, minerals: 15 },

  // ── Burger King ────────────────────────────────────────────────────────────
  { id: 'bk1',  name: "Whopper",                  brand: "Burger King", calories: 660, protein: 28, carbs: 49, fat: 40, fiber: 2,  vitamins: 10, minerals: 20 },
  { id: 'bk2',  name: "Crispy Chicken Sandwich",  brand: "Burger King", calories: 660, protein: 25, carbs: 57, fat: 39, fiber: 3,  vitamins:  8, minerals: 15 },
  { id: 'bk3',  name: "Chicken Fries (9 pc)",     brand: "Burger King", calories: 290, protein: 18, carbs: 22, fat: 14, fiber: 1,  vitamins:  4, minerals:  8 },

  // ── Chick-fil-A ────────────────────────────────────────────────────────────
  { id: 'cfa1', name: "Chicken Sandwich",         brand: "Chick-fil-A", calories: 440, protein: 28, carbs: 40, fat: 19, fiber: 1,  vitamins:  4, minerals: 20 },
  { id: 'cfa2', name: "Grilled Chicken Sandwich", brand: "Chick-fil-A", calories: 320, protein: 30, carbs: 36, fat:  6, fiber: 2,  vitamins:  8, minerals: 18 },
  { id: 'cfa3', name: "Waffle Potato Fries (Med)",brand: "Chick-fil-A", calories: 360, protein:  5, carbs: 45, fat: 18, fiber: 5,  vitamins:  6, minerals: 10 },
  { id: 'cfa4', name: "Grilled Nuggets (8 pc)",   brand: "Chick-fil-A", calories: 140, protein: 23, carbs:  3, fat:  3, fiber: 0,  vitamins:  2, minerals: 10 },

  // ── Subway ─────────────────────────────────────────────────────────────────
  { id: 'sub1', name: '6" Turkey Breast Sub',     brand: "Subway",      calories: 280, protein: 18, carbs: 46, fat:  4, fiber: 5,  vitamins: 10, minerals: 15 },
  { id: 'sub2', name: '6" Veggie Delite',         brand: "Subway",      calories: 200, protein:  8, carbs: 40, fat:  2, fiber: 5,  vitamins: 20, minerals: 15 },
  { id: 'sub3', name: '6" Chicken Teriyaki Sub',  brand: "Subway",      calories: 370, protein: 26, carbs: 52, fat:  6, fiber: 4,  vitamins:  8, minerals: 18 },

  // ── Chipotle ───────────────────────────────────────────────────────────────
  { id: 'chp1', name: "Chicken Burrito Bowl",     brand: "Chipotle",    calories: 625, protein: 45, carbs: 60, fat: 18, fiber: 11, vitamins: 22, minerals: 30 },
  { id: 'chp2', name: "Chicken Burrito",          brand: "Chipotle",    calories: 870, protein: 46, carbs: 99, fat: 25, fiber: 12, vitamins: 18, minerals: 32 },
  { id: 'chp3', name: "Steak Salad Bowl",         brand: "Chipotle",    calories: 480, protein: 38, carbs: 40, fat: 18, fiber:  9, vitamins: 25, minerals: 28 },

  // ── Taco Bell ──────────────────────────────────────────────────────────────
  { id: 'tb1',  name: "Crunchy Taco",             brand: "Taco Bell",   calories: 170, protein:  8, carbs: 13, fat:  9, fiber: 3,  vitamins:  4, minerals:  8 },
  { id: 'tb2',  name: "Chicken Quesadilla",       brand: "Taco Bell",   calories: 510, protein: 28, carbs: 40, fat: 27, fiber: 3,  vitamins:  6, minerals: 20 },
  { id: 'tb3',  name: "Bean & Cheese Burrito",    brand: "Taco Bell",   calories: 380, protein: 13, carbs: 55, fat: 11, fiber: 9,  vitamins:  8, minerals: 20 },

  // ── Pizza ──────────────────────────────────────────────────────────────────
  { id: 'ph1',  name: "Pepperoni Pizza (1 slice)",brand: "Pizza Hut",   calories: 310, protein: 13, carbs: 35, fat: 13, fiber: 2,  vitamins:  6, minerals: 15 },
  { id: 'ph2',  name: "Cheese Pizza (1 slice)",   brand: "Pizza Hut",   calories: 260, protein: 11, carbs: 34, fat:  9, fiber: 2,  vitamins:  6, minerals: 15 },
  { id: 'dom1', name: "Pepperoni Pizza (1 slice)",brand: "Domino's",    calories: 300, protein: 12, carbs: 36, fat: 12, fiber: 2,  vitamins:  4, minerals: 12 },

  // ── Panera ─────────────────────────────────────────────────────────────────
  { id: 'pan1', name: "Chicken Noodle Soup",      brand: "Panera",      calories: 130, protein: 10, carbs: 17, fat:  2, fiber: 1,  vitamins:  4, minerals: 10 },
  { id: 'pan2', name: "Turkey Sandwich",          brand: "Panera",      calories: 510, protein: 32, carbs: 58, fat: 15, fiber: 4,  vitamins: 10, minerals: 20 },

  // ── Starbucks ──────────────────────────────────────────────────────────────
  { id: 'sb1',  name: "Chocolate Chip Cookie",    brand: "Starbucks",   calories: 370, protein:  4, carbs: 51, fat: 18, fiber: 2,  vitamins:  2, minerals:  8 },
  { id: 'sb2',  name: "Blueberry Muffin",         brand: "Starbucks",   calories: 380, protein:  6, carbs: 58, fat: 14, fiber: 1,  vitamins:  4, minerals:  8 },

  // ── Fruits ─────────────────────────────────────────────────────────────────
  { id: 'fr1',  name: "Apple (medium)",           brand: "Fresh",       calories:  95, protein:  0, carbs: 25, fat:  0, fiber: 4,  vitamins: 14, minerals:  2 },
  { id: 'fr2',  name: "Banana (medium)",          brand: "Fresh",       calories: 105, protein:  1, carbs: 27, fat:  0, fiber: 3,  vitamins: 12, minerals:  8 },
  { id: 'fr3',  name: "Orange (medium)",          brand: "Fresh",       calories:  62, protein:  1, carbs: 15, fat:  0, fiber: 3,  vitamins: 92, minerals:  5 },
  { id: 'fr4',  name: "Strawberries (1 cup)",     brand: "Fresh",       calories:  49, protein:  1, carbs: 12, fat:  0, fiber: 3,  vitamins: 97, minerals:  5 },
  { id: 'fr5',  name: "Blueberries (1 cup)",      brand: "Fresh",       calories:  84, protein:  1, carbs: 21, fat:  0, fiber: 4,  vitamins: 24, minerals:  4 },
  { id: 'fr6',  name: "Grapes (1 cup)",           brand: "Fresh",       calories: 104, protein:  1, carbs: 27, fat:  0, fiber: 1,  vitamins: 10, minerals:  4 },

  // ── Vegetables ─────────────────────────────────────────────────────────────
  { id: 've1',  name: "Broccoli (1 cup)",         brand: "Fresh",       calories:  55, protein:  4, carbs: 11, fat:  1, fiber: 5,  vitamins: 81, minerals:  8 },
  { id: 've2',  name: "Carrots (1 cup)",          brand: "Fresh",       calories:  52, protein:  1, carbs: 12, fat:  0, fiber: 4,  vitamins: 184, minerals: 6 },
  { id: 've3',  name: "Spinach (1 cup raw)",      brand: "Fresh",       calories:   7, protein:  1, carbs:  1, fat:  0, fiber: 1,  vitamins: 56, minerals: 10 },
  { id: 've4',  name: "Sweet Potato (medium)",    brand: "Fresh",       calories: 103, protein:  2, carbs: 24, fat:  0, fiber: 4,  vitamins: 122, minerals: 8 },

  // ── Proteins ───────────────────────────────────────────────────────────────
  { id: 'pr1',  name: "Grilled Chicken Breast",   brand: "Home",        calories: 165, protein: 31, carbs:  0, fat:  4, fiber: 0,  vitamins:  6, minerals: 12 },
  { id: 'pr2',  name: "Scrambled Eggs (2 large)", brand: "Home",        calories: 182, protein: 12, carbs:  2, fat: 14, fiber: 0,  vitamins: 15, minerals: 10 },
  { id: 'pr3',  name: "Salmon (3 oz)",            brand: "Home",        calories: 177, protein: 17, carbs:  0, fat: 11, fiber: 0,  vitamins: 15, minerals: 18 },
  { id: 'pr4',  name: "Tuna (canned, 3 oz)",      brand: "Home",        calories:  73, protein: 17, carbs:  0, fat:  1, fiber: 0,  vitamins:  4, minerals: 12 },
  { id: 'pr5',  name: "Turkey Breast (3 oz)",     brand: "Home",        calories: 135, protein: 26, carbs:  0, fat:  3, fiber: 0,  vitamins:  4, minerals: 10 },

  // ── Dairy ──────────────────────────────────────────────────────────────────
  { id: 'da1',  name: "Whole Milk (1 cup)",       brand: "Dairy",       calories: 149, protein:  8, carbs: 12, fat:  8, fiber: 0,  vitamins: 12, minerals: 28 },
  { id: 'da2',  name: "Greek Yogurt (plain)",     brand: "Dairy",       calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0,  vitamins:  6, minerals: 14 },
  { id: 'da3',  name: "Cheddar Cheese (1 oz)",    brand: "Dairy",       calories: 114, protein:  7, carbs:  0, fat:  9, fiber: 0,  vitamins:  4, minerals: 20 },
  { id: 'da4',  name: "String Cheese",            brand: "Dairy",       calories:  80, protein:  7, carbs:  1, fat:  5, fiber: 0,  vitamins:  2, minerals: 18 },

  // ── Grains ─────────────────────────────────────────────────────────────────
  { id: 'gr1',  name: "Oatmeal (1 cup cooked)",   brand: "Home",        calories: 154, protein:  5, carbs: 28, fat:  3, fiber: 4,  vitamins:  2, minerals: 10 },
  { id: 'gr2',  name: "Brown Rice (1 cup cooked)",brand: "Home",        calories: 216, protein:  5, carbs: 45, fat:  2, fiber: 4,  vitamins:  4, minerals: 12 },
  { id: 'gr3',  name: "Whole Wheat Bread (1 sl)", brand: "Home",        calories:  80, protein:  4, carbs: 15, fat:  1, fiber: 2,  vitamins:  4, minerals:  6 },
  { id: 'gr4',  name: "Pasta (1 cup cooked)",     brand: "Home",        calories: 220, protein:  8, carbs: 43, fat:  1, fiber: 2,  vitamins:  4, minerals:  8 },

  // ── Snacks ─────────────────────────────────────────────────────────────────
  { id: 'sn1',  name: "Peanut Butter (2 tbsp)",   brand: "Home",        calories: 191, protein:  7, carbs:  7, fat: 16, fiber: 2,  vitamins:  2, minerals:  6 },
  { id: 'sn2',  name: "Almonds (1 oz)",           brand: "Home",        calories: 164, protein:  6, carbs:  6, fat: 14, fiber: 4,  vitamins:  8, minerals: 12 },
  { id: 'sn3',  name: "Granola Bar",              brand: "Home",        calories: 193, protein:  4, carbs: 29, fat:  8, fiber: 2,  vitamins:  4, minerals:  6 },
  { id: 'sn4',  name: "Orange Juice (1 cup)",     brand: "Home",        calories: 112, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 80, minerals:  5 },
  { id: 'sn5',  name: "Apple Juice (1 cup)",      brand: "Home",        calories: 114, protein:  0, carbs: 28, fat:  0, fiber: 0,  vitamins:  6, minerals:  4 },
  { id: 'sn6',  name: "Black Beans (1/2 cup)",    brand: "Home",        calories: 114, protein:  8, carbs: 20, fat:  0, fiber: 8,  vitamins:  2, minerals: 12 },
  { id: 'sn7',  name: "Avocado (1/2)",            brand: "Fresh",       calories: 120, protein:  2, carbs:  6, fat: 11, fiber: 5,  vitamins: 12, minerals:  6 },
];

export function searchFoods(query: string): FoodDBEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return FOOD_DB.filter(
    f =>
      f.name.toLowerCase().includes(q) ||
      f.brand.toLowerCase().includes(q),
  ).slice(0, 8);
}
