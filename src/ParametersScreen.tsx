import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet,
  SafeAreaView, TouchableOpacity,
} from 'react-native';
import {
  useApp, Nutrient, NUTRIENTS, NutrientParams,
  N_EMOJI, N_LABEL, N_UNIT, N_COLOR,
  getTodayTotals, TAB_BAR_HEIGHT,
} from './store';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';
const POINTS_PER_HIT = 10;

export default function ParametersScreen() {
  const { role, params, setParams, entries } = useApp();

  // Local draft so parent edits don't fire on every keystroke; they commit on blur
  const [draft, setDraft] = useState<Record<Nutrient, string>>(
    () => Object.fromEntries(NUTRIENTS.map(n => [n, params[n] > 0 ? String(params[n]) : ''])) as Record<Nutrient, string>,
  );

  const todayTotals = getTodayTotals(entries);

  const commit = (nutrient: Nutrient) => {
    const val = parseInt(draft[nutrient], 10);
    setParams(prev => ({ ...prev, [nutrient]: isNaN(val) || val <= 0 ? 0 : val }));
  };

  const clearParam = (nutrient: Nutrient) => {
    setDraft(prev => ({ ...prev, [nutrient]: '' }));
    setParams(prev => ({ ...prev, [nutrient]: 0 }));
  };

  const activeParams   = NUTRIENTS.filter(n => params[n] > 0);
  const earnedToday    = activeParams.filter(n => todayTotals[n] >= params[n]);
  const totalPtsToday  = earnedToday.length * POINTS_PER_HIT;
  const maxPtsPerDay   = activeParams.length * POINTS_PER_HIT;

  return (
    <SafeAreaView style={ps.root}>
      {/* Header */}
      <View style={ps.header}>
        <View>
          <Text style={ps.headerTitle}>⚙️ Parameters</Text>
          <Text style={ps.headerSub}>
            {role === 'parent' ? 'Set daily nutrient targets for your kids' : 'Daily targets set by your parent'}
          </Text>
        </View>
        <View style={[ps.rolePill, { backgroundColor: role === 'parent' ? '#5856D6' : '#34C759' }]}>
          <Text style={ps.rolePillText}>{role === 'parent' ? '👨‍👩 Parent' : '🧒 Kid'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>

        {/* How it works */}
        <View style={ps.infoCard}>
          <Text style={ps.infoTitle}>How points work</Text>
          <Text style={ps.infoText}>
            Hit a daily target → earn <Text style={ps.infoBold}>10 points</Text>.{'\n'}
            Points are earned once per day per nutrient.{'\n'}
            All points go toward every active goal.
          </Text>
        </View>

        {/* Today's earnings summary */}
        <View style={ps.todaySummary}>
          <View style={ps.todaySummaryLeft}>
            <Text style={ps.todaySummaryLabel}>Today's earnings</Text>
            <Text style={ps.todaySummaryPts}>{totalPtsToday}<Text style={ps.todaySummaryMax}> / {maxPtsPerDay} pts</Text></Text>
          </View>
          <View style={ps.todayChips}>
            {activeParams.length === 0 && <Text style={ps.todayNone}>No targets set</Text>}
            {activeParams.map(n => {
              const met = todayTotals[n] >= params[n];
              return (
                <View key={n} style={[ps.todayChip, { backgroundColor: met ? N_COLOR[n] + '33' : '#F0F0F0' }]}>
                  <Text style={ps.todayChipText}>{N_EMOJI[n]} {met ? '✓' : `${todayTotals[n]}/${params[n]}${N_UNIT[n]}`}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Nutrient rows */}
        <Text style={ps.sectionLabel}>Nutrient Targets</Text>
        {NUTRIENTS.map(nutrient => {
          const active = params[nutrient] > 0;
          const met    = active && todayTotals[nutrient] >= params[nutrient];

          return (
            <View key={nutrient} style={[ps.nutrientCard, active && { borderLeftWidth: 4, borderLeftColor: N_COLOR[nutrient] }]}>
              <View style={[ps.nutrientIcon, { backgroundColor: N_COLOR[nutrient] + '22' }]}>
                <Text style={ps.nutrientEmoji}>{N_EMOJI[nutrient]}</Text>
              </View>

              <View style={ps.nutrientInfo}>
                <Text style={ps.nutrientName}>{N_LABEL[nutrient]}</Text>
                {active ? (
                  <Text style={[ps.nutrientStatus, { color: met ? '#34C759' : '#AEAEB2' }]}>
                    {met
                      ? `✓ Hit today! (${todayTotals[nutrient]}${N_UNIT[nutrient]})`
                      : `Today: ${todayTotals[nutrient]} / ${params[nutrient]}${N_UNIT[nutrient]}`}
                  </Text>
                ) : (
                  <Text style={ps.nutrientStatus}>Not set — no points for this nutrient</Text>
                )}
              </View>

              {role === 'parent' ? (
                <View style={ps.inputGroup}>
                  <TextInput
                    style={[ps.targetInput, active && { borderColor: N_COLOR[nutrient] }]}
                    value={draft[nutrient]}
                    onChangeText={val => setDraft(prev => ({ ...prev, [nutrient]: val }))}
                    onBlur={() => commit(nutrient)}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor="#AEAEB2"
                  />
                  <Text style={ps.targetUnit}>{N_UNIT[nutrient]}</Text>
                  {active && (
                    <TouchableOpacity style={ps.clearBtn} onPress={() => clearParam(nutrient)}>
                      <Text style={ps.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={ps.readonlyGroup}>
                  <Text style={[ps.readonlyVal, !active && { color: '#AEAEB2' }]}>
                    {active ? `${params[nutrient]}${N_UNIT[nutrient]}` : '—'}
                  </Text>
                </View>
              )}

              {active && (
                <View style={ps.ptsBadge}>
                  <Text style={ps.ptsBadgeText}>+10 pts</Text>
                </View>
              )}
            </View>
          );
        })}

        {role === 'parent' && (
          <Text style={ps.helpText}>
            Leave a field empty or set it to 0 to disable that nutrient. Changes save automatically.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const ps = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 13, color: '#8E8E93', marginTop: 2, maxWidth: 220 },
  rolePill:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rolePillText:{ fontSize: 13, fontWeight: '700', color: '#fff' },

  infoCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: YELLOW },
  infoTitle:  { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 6 },
  infoText:   { fontSize: 13, color: '#8E8E93', lineHeight: 20 },
  infoBold:   { fontWeight: '700', color: DARK },

  todaySummary:     { backgroundColor: DARK, borderRadius: 18, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  todaySummaryLeft: { },
  todaySummaryLabel:{ fontSize: 12, color: '#AEAEB2', fontWeight: '600' },
  todaySummaryPts:  { fontSize: 28, fontWeight: '800', color: YELLOW, marginTop: 2 },
  todaySummaryMax:  { fontSize: 13, fontWeight: '500', color: '#8E8E93' },
  todayChips:       { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  todayChip:        { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  todayChipText:    { fontSize: 12, fontWeight: '600', color: DARK },
  todayNone:        { fontSize: 12, color: '#AEAEB2' },

  sectionLabel: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 10 },

  nutrientCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  nutrientIcon:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nutrientEmoji: { fontSize: 22 },
  nutrientInfo:  { flex: 1 },
  nutrientName:  { fontSize: 15, fontWeight: '700', color: DARK },
  nutrientStatus:{ fontSize: 12, color: '#AEAEB2', marginTop: 2 },

  inputGroup:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  targetInput: { width: 56, borderWidth: 2, borderColor: '#E5E5EA', borderRadius: 10, padding: 8, fontSize: 16, fontWeight: '700', color: DARK, textAlign: 'center' },
  targetUnit:  { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  clearBtn:    { paddingHorizontal: 4 },
  clearBtnText:{ fontSize: 13, color: '#AEAEB2' },

  readonlyGroup: { alignItems: 'flex-end' },
  readonlyVal:   { fontSize: 17, fontWeight: '800', color: DARK },

  ptsBadge:     { backgroundColor: YELLOW + '33', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ptsBadgeText: { fontSize: 12, fontWeight: '800', color: '#A07800' },

  helpText: { fontSize: 12, color: '#AEAEB2', textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
