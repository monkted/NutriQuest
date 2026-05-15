import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { searchFoods, FoodDBEntry } from './foodDatabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

interface FoodEntry {
  id:       string;
  name:     string;
  meal:     Meal;
  calories: number;
  protein:  number; // g
  carbs:    number; // g
  fat:      number; // g
  fiber:    number; // g
  vitamins: number; // % DV
  minerals: number; // % DV
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const MEAL_EMOJI:  Record<Meal, string> = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎' };
const MEAL_COLOR:  Record<Meal, string> = { Breakfast: '#FF9500', Lunch: '#34C759', Dinner: '#5856D6', Snacks: '#FF2D55' };

const GOALS = { calories: 1800, protein: 50, carbs: 230, fat: 65, fiber: 25, vitamins: 100, minerals: 100 };

const DEMO: FoodEntry[] = [
  { id: '1', name: 'Oatmeal with Berries',  meal: 'Breakfast', calories: 320, protein:  8, carbs: 58, fat:  6, fiber: 4,  vitamins: 8,  minerals: 10 },
  { id: '2', name: 'Orange Juice',           meal: 'Breakfast', calories: 110, protein:  2, carbs: 26, fat:  0, fiber: 0,  vitamins: 15, minerals:  2 },
  { id: '3', name: 'Grilled Chicken Salad', meal: 'Lunch',     calories: 450, protein: 38, carbs: 20, fat: 18, fiber: 5,  vitamins: 20, minerals: 12 },
  { id: '4', name: 'Whole Wheat Bread',      meal: 'Lunch',     calories: 180, protein:  6, carbs: 34, fat:  2, fiber: 3,  vitamins:  4, minerals:  8 },
  { id: '5', name: 'Atlantic Salmon',        meal: 'Dinner',    calories: 380, protein: 34, carbs:  0, fat: 22, fiber: 0,  vitamins: 12, minerals: 18 },
  { id: '6', name: 'Steamed Broccoli',       meal: 'Dinner',    calories:  55, protein:  4, carbs: 11, fat:  1, fiber: 3,  vitamins: 22, minerals:  6 },
  { id: '7', name: 'Greek Yogurt',           meal: 'Snacks',    calories: 150, protein: 12, carbs: 17, fat:  4, fiber: 0,  vitamins:  6, minerals: 14 },
];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FoodLog() {
  const [entries, setEntries]           = useState<FoodEntry[]>(DEMO);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal>('Breakfast');

  // modal inputs
  const [iName,     setIName]     = useState('');
  const [iCal,      setICal]      = useState('');
  const [iProtein,  setIProtein]  = useState('');
  const [iCarbs,    setICarbs]    = useState('');
  const [iFat,      setIFat]      = useState('');
  const [iFiber,    setIFiber]    = useState('');
  const [iVitamins, setIVitamins] = useState('');
  const [iMinerals, setIMinerals] = useState('');

  // search
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedDBFood, setSelectedDBFood] = useState<FoodDBEntry | null>(null);

  const searchResults = useMemo(() => searchFoods(searchQuery), [searchQuery]);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  acc.protein  + e.protein,
      carbs:    acc.carbs    + e.carbs,
      fat:      acc.fat      + e.fat,
      fiber:    acc.fiber    + e.fiber,
      vitamins: acc.vitamins + e.vitamins,
      minerals: acc.minerals + e.minerals,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, vitamins: 0, minerals: 0 },
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const openModal = (meal: Meal) => { setSelectedMeal(meal); setModalVisible(true); };

  const closeModal = () => {
    setModalVisible(false);
    setIName(''); setICal(''); setIProtein(''); setICarbs('');
    setIFat(''); setIFiber(''); setIVitamins(''); setIMinerals('');
    setSearchQuery(''); setSelectedDBFood(null);
  };

  const pickDBFood = (food: FoodDBEntry) => {
    setSelectedDBFood(food);
    setSearchQuery('');
    setIName(food.name);
    setICal(String(food.calories));
    setIProtein(String(food.protein));
    setICarbs(String(food.carbs));
    setIFat(String(food.fat));
    setIFiber(String(food.fiber));
    setIVitamins(String(food.vitamins));
    setIMinerals(String(food.minerals));
  };

  const addFood = () => {
    const c = parseInt(iCal, 10);
    if (!iName.trim() || isNaN(c) || c < 0) return;
    setEntries(prev => [...prev, {
      id:       Date.now().toString(),
      name:     iName.trim(),
      meal:     selectedMeal,
      calories: c,
      protein:  parseInt(iProtein,  10) || 0,
      carbs:    parseInt(iCarbs,    10) || 0,
      fat:      parseInt(iFat,      10) || 0,
      fiber:    parseInt(iFiber,    10) || 0,
      vitamins: parseInt(iVitamins, 10) || 0,
      minerals: parseInt(iMinerals, 10) || 0,
    }]);
    closeModal();
  };

  const removeEntry = (id: string) => setEntries(prev => prev.filter(e => e.id !== id));

  return (
    <SafeAreaView style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Hey there! 👋</Text>
          <Text style={s.date}>{today}</Text>
        </View>
        <View style={s.avatar}>
          <Text style={s.avatarEmoji}>🧒</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── Calorie Bar ── */}
        <View style={s.calSection}>
          <CalorieBar current={totals.calories} goal={GOALS.calories} />
        </View>

        {/* ── 3×2 Nutrient Grid ── */}
        <Text style={s.sectionLabel}>Today's Nutrients</Text>
        <View style={s.nutrientGrid}>
          <NutrientCard emoji="💪" label="Protein"  current={totals.protein}  goal={GOALS.protein}  unit="g"   color="#FF6B35" />
          <NutrientCard emoji="🌾" label="Carbs"    current={totals.carbs}    goal={GOALS.carbs}    unit="g"   color="#4ECDC4" />
          <NutrientCard emoji="🥑" label="Fat"      current={totals.fat}      goal={GOALS.fat}      unit="g"   color="#95E06C" />
          <NutrientCard emoji="🥦" label="Fiber"    current={totals.fiber}    goal={GOALS.fiber}    unit="g"   color="#A8D8A8" />
          <NutrientCard emoji="🍊" label="Vitamins" current={totals.vitamins} goal={GOALS.vitamins} unit="%"   color="#FFB347" />
          <NutrientCard emoji="⚡" label="Minerals" current={totals.minerals} goal={GOALS.minerals} unit="%"   color="#87CEEB" />
        </View>

        {/* ── Meal Sections ── */}
        <Text style={s.sectionLabel}>Food Log</Text>
        {MEALS.map(meal => {
          const items   = entries.filter(e => e.meal === meal);
          const mealCal = items.reduce((sum, e) => sum + e.calories, 0);
          return (
            <View key={meal} style={s.mealCard}>
              <View style={s.mealHeader}>
                <View style={[s.mealBadge, { backgroundColor: MEAL_COLOR[meal] + '22' }]}>
                  <Text style={s.mealEmoji}>{MEAL_EMOJI[meal]}</Text>
                </View>
                <View style={s.mealMeta}>
                  <Text style={s.mealName}>{meal}</Text>
                  <Text style={s.mealCal}>{mealCal} kcal</Text>
                </View>
                <TouchableOpacity style={s.addChip} onPress={() => openModal(meal)}>
                  <Text style={s.addChipText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {items.length === 0 ? (
                <Text style={s.emptyText}>Tap + Add to log something 🍽️</Text>
              ) : (
                items.map(entry => (
                  <View key={entry.id} style={s.foodRow}>
                    <View style={s.foodLeft}>
                      <Text style={s.foodName}>{entry.name}</Text>
                      <View style={s.nutrientChips}>
                        <Chip label={`💪 ${entry.protein}g`}   bg="#FFF0EB" />
                        <Chip label={`🌾 ${entry.carbs}g`}     bg="#E8FAF9" />
                        <Chip label={`🥑 ${entry.fat}g`}       bg="#F0FAE8" />
                        <Chip label={`🥦 ${entry.fiber}g`}     bg="#EAF7EA" />
                        <Chip label={`🍊 ${entry.vitamins}%`}  bg="#FFF6E8" />
                        <Chip label={`⚡ ${entry.minerals}%`}  bg="#EAF4FB" />
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeEntry(entry.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={s.deleteX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Big Log Food Button ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.logBtn} onPress={() => openModal('Breakfast')} activeOpacity={0.85}>
          <Text style={s.logBtnIcon}>🍽️</Text>
          <Text style={s.logBtnText}>Log Food</Text>
        </TouchableOpacity>
      </View>

      {/* ── Add Food Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Log Food 🍽️</Text>

            {/* Meal chips */}
            <View style={s.chipRow}>
              {MEALS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.mealChip, selectedMeal === m && { backgroundColor: MEAL_COLOR[m] }]}
                  onPress={() => setSelectedMeal(m)}
                >
                  <Text style={[s.mealChipText, selectedMeal === m && { color: '#fff' }]}>
                    {MEAL_EMOJI[m]} {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search bar */}
            <View style={s.searchWrap}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Search foods or restaurants…"
                placeholderTextColor="#aaa"
                value={searchQuery}
                onChangeText={t => { setSearchQuery(t); setSelectedDBFood(null); }}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={s.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search results */}
            {searchResults.length > 0 && (
              <View style={s.resultsList}>
                {searchResults.map(food => (
                  <TouchableOpacity key={food.id} style={s.resultRow} onPress={() => pickDBFood(food)}>
                    <View style={s.resultInfo}>
                      <Text style={s.resultName}>{food.name}</Text>
                      <Text style={s.resultBrand}>{food.brand}</Text>
                    </View>
                    <View style={s.resultRight}>
                      <Text style={s.resultCal}>{food.calories}</Text>
                      <Text style={s.resultCalLabel}>kcal</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Selected food badge */}
            {selectedDBFood && (
              <View style={s.selectedBadge}>
                <Text style={s.selectedCheck}>✓</Text>
                <Text style={s.selectedText}>{selectedDBFood.name} — {selectedDBFood.brand}</Text>
                <TouchableOpacity onPress={() => { setSelectedDBFood(null); setIName(''); }}>
                  <Text style={s.selectedClear}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Manual / editable fields — always visible so user can tweak */}
            {searchResults.length === 0 && (
              <>
                <TextInput style={s.input} placeholder="Food name 🥦" placeholderTextColor="#aaa" value={iName} onChangeText={setIName} />
                <View style={s.inputRow}>
                  <TextInput style={[s.input, s.inputHalf]} placeholder="🔥 Calories"  placeholderTextColor="#aaa" keyboardType="numeric" value={iCal}      onChangeText={setICal}      />
                  <TextInput style={[s.input, s.inputHalf]} placeholder="💪 Protein g"  placeholderTextColor="#aaa" keyboardType="numeric" value={iProtein}  onChangeText={setIProtein}  />
                </View>
                <View style={s.inputRow}>
                  <TextInput style={[s.input, s.inputHalf]} placeholder="🌾 Carbs g"    placeholderTextColor="#aaa" keyboardType="numeric" value={iCarbs}    onChangeText={setICarbs}    />
                  <TextInput style={[s.input, s.inputHalf]} placeholder="🥑 Fat g"      placeholderTextColor="#aaa" keyboardType="numeric" value={iFat}      onChangeText={setIFat}      />
                </View>
                <View style={s.inputRow}>
                  <TextInput style={[s.input, s.inputHalf]} placeholder="🥦 Fiber g"    placeholderTextColor="#aaa" keyboardType="numeric" value={iFiber}    onChangeText={setIFiber}    />
                  <TextInput style={[s.input, s.inputHalf]} placeholder="🍊 Vitamins %"  placeholderTextColor="#aaa" keyboardType="numeric" value={iVitamins} onChangeText={setIVitamins} />
                </View>
                <TextInput style={s.input} placeholder="⚡ Minerals %" placeholderTextColor="#aaa" keyboardType="numeric" value={iMinerals} onChangeText={setIMinerals} />
              </>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={addFood}>
                <Text style={s.saveText}>Add Food ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CalorieBar({ current, goal }: { current: number; goal: number }) {
  const pct  = Math.min(current / goal, 1);
  const over = current > goal;
  return (
    <View style={cb.wrap}>
      <View style={cb.row}>
        <Text style={cb.label}>🔥 Calories</Text>
        <Text style={cb.value}>
          {current}
          <Text style={cb.sub}> / {goal} kcal</Text>
        </Text>
      </View>
      <View style={cb.track}>
        <View style={[cb.fill, { width: `${pct * 100}%` as any, backgroundColor: over ? '#FF3B30' : '#AEAEB2' }]} />
      </View>
    </View>
  );
}

function NutrientCard({ emoji, label, current, goal, unit, color }: {
  emoji: string; label: string; current: number; goal: number; unit: string; color: string;
}) {
  const pct  = Math.min(current / goal, 1);
  const over = current > goal;
  return (
    <View style={[nc.card, { borderTopColor: color }]}>
      <Text style={nc.emoji}>{emoji}</Text>
      <Text style={nc.label}>{label}</Text>
      <Text style={nc.value}>{current}<Text style={nc.unit}>{unit}</Text></Text>
      <View style={nc.track}>
        <View style={[nc.fill, { width: `${pct * 100}%` as any, backgroundColor: over ? '#FF3B30' : color }]} />
      </View>
      <Text style={nc.goal}>Goal: {goal}{unit}</Text>
    </View>
  );
}

function Chip({ label, bg }: { label: string; bg: string }) {
  return (
    <View style={[chip.pill, { backgroundColor: bg }]}>
      <Text style={chip.text}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const YELLOW = '#FFD60A';
const BG     = '#F5F5F5';
const DARK   = '#1C1C1E';

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  greeting:    { fontSize: 24, fontWeight: '800', color: DARK },
  date:        { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  avatar:      { width: 48, height: 48, borderRadius: 24, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 26 },

  calSection:   { paddingHorizontal: 16, marginTop: 14 },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: DARK, marginHorizontal: 16, marginTop: 16, marginBottom: 10 },

  // 3-column grid
  nutrientGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },

  mealCard:    { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  mealHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  mealBadge:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mealEmoji:   { fontSize: 24 },
  mealMeta:    { flex: 1 },
  mealName:    { fontSize: 16, fontWeight: '700', color: DARK },
  mealCal:     { fontSize: 13, color: '#8E8E93' },
  addChip:     { backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addChipText: { fontSize: 13, fontWeight: '700', color: DARK },
  emptyText:   { fontSize: 13, color: '#C7C7CC', textAlign: 'center', paddingVertical: 10 },

  foodRow:       { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  foodLeft:      { flex: 1 },
  foodName:      { fontSize: 15, fontWeight: '600', color: DARK, marginBottom: 6 },
  nutrientChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deleteX:       { fontSize: 14, color: '#C7C7CC', paddingLeft: 8, paddingTop: 2 },

  bottomBar:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  logBtn:      { backgroundColor: YELLOW, borderRadius: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: YELLOW, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  logBtnIcon:  { fontSize: 22 },
  logBtnText:  { fontSize: 18, fontWeight: '800', color: DARK },

  overlay:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetTitle:   { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 16 },

  // Search
  searchWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 12, marginBottom: 10 },
  searchIcon:    { fontSize: 16, marginRight: 8 },
  searchInput:   { flex: 1, fontSize: 15, color: DARK, paddingVertical: 13 },
  searchClear:   { fontSize: 14, color: '#AEAEB2', paddingLeft: 8 },
  resultsList:   { backgroundColor: '#F9F9F9', borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#EFEFEF' },
  resultRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  resultInfo:    { flex: 1 },
  resultName:    { fontSize: 14, fontWeight: '600', color: DARK },
  resultBrand:   { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  resultRight:   { alignItems: 'flex-end' },
  resultCal:     { fontSize: 15, fontWeight: '700', color: DARK },
  resultCalLabel:{ fontSize: 11, color: '#AEAEB2' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FAF0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, gap: 8 },
  selectedCheck: { fontSize: 16, color: '#34C759' },
  selectedText:  { flex: 1, fontSize: 13, fontWeight: '600', color: '#1C5C2B' },
  selectedClear: { fontSize: 13, color: '#AEAEB2' },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  mealChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F2F2F7' },
  mealChipText: { fontSize: 13, fontWeight: '700', color: DARK },
  input:        { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14, fontSize: 15, color: DARK, marginBottom: 10 },
  inputRow:     { flexDirection: 'row', gap: 10 },
  inputHalf:    { flex: 1 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:    { flex: 1, padding: 15, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText:   { fontSize: 16, fontWeight: '700', color: DARK },
  saveBtn:      { flex: 1, padding: 15, borderRadius: 16, backgroundColor: YELLOW, alignItems: 'center' },
  saveText:     { fontSize: 16, fontWeight: '800', color: DARK },
});

// Calorie bar styles
const cb = StyleSheet.create({
  wrap:  { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#AEAEB2' },
  value: { fontSize: 15, fontWeight: '700', color: '#8E8E93' },
  sub:   { fontSize: 13, fontWeight: '400', color: '#AEAEB2' },
  track: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
});

// Nutrient card styles (3-per-row)
const nc = StyleSheet.create({
  card:  { flexBasis: '30%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  emoji: { fontSize: 22, marginBottom: 4 },
  label: { fontSize: 11, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  value: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  unit:  { fontSize: 12, fontWeight: '500', color: '#8E8E93' },
  track: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden', marginTop: 6, marginBottom: 3 },
  fill:  { height: '100%', borderRadius: 3 },
  goal:  { fontSize: 10, color: '#AEAEB2' },
});

const chip = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  text: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
});
