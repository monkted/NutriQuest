import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet,
  SafeAreaView, TouchableOpacity, Switch,
} from 'react-native';
import {
  useApp, Nutrient, NUTRIENTS,
  N_EMOJI, N_LABEL, N_UNIT, N_COLOR,
  getTodayTotals, TAB_BAR_HEIGHT,
  AGE_GROUPS, AGE_GROUP_LABEL, NUTRIENT_PRESETS,
  suggestWeeklyGoals,
} from './store';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

interface Props {
  memberId?: string;
}

export default function ParametersScreen({ memberId }: Props) {
  const {
    role, params, setParams, entries, ageGroup, setAgeGroup,
    familyMembers, updateMember, currentUserId,
  } = useApp();

  const targetId     = memberId ?? currentUserId;
  const targetMember = familyMembers.find(m => m.id === targetId)!;
  const isOther      = !!memberId && memberId !== currentUserId;

  const targetParams     = isOther ? targetMember.params     : params;
  const targetAgeGroup   = isOther ? targetMember.ageGroup   : ageGroup;
  const targetAutoPreset = isOther ? targetMember.autoPreset : false;

  const [draft, setDraft] = useState<Record<Nutrient, string>>(
    () => Object.fromEntries(
      NUTRIENTS.map(n => [n, targetParams[n] > 0 ? String(targetParams[n]) : ''])
    ) as Record<Nutrient, string>,
  );

  const todayTotals = getTodayTotals(entries);

  const setTargetParam = (n: Nutrient, val: number) => {
    if (isOther) {
      updateMember(targetId, { params: { ...targetMember.params, [n]: val } });
    } else {
      setParams(prev => ({ ...prev, [n]: val }));
    }
  };

  const clearTargetParam = (n: Nutrient) => {
    setDraft(prev => ({ ...prev, [n]: '' }));
    setTargetParam(n, 0);
  };

  const handleSetAgeGroup = (g: Parameters<typeof setAgeGroup>[0]) => {
    if (isOther) {
      updateMember(targetId, { ageGroup: g, autoPreset: true, params: NUTRIENT_PRESETS[g] });
    } else {
      setAgeGroup(g);
    }
  };

  const toggleAutoPreset = (val: boolean) => {
    if (!isOther) return;
    updateMember(targetId, {
      autoPreset: val,
      params: val ? NUTRIENT_PRESETS[targetAgeGroup] : targetMember.params,
    });
  };

  const commit = (nutrient: Nutrient) => {
    const val = parseInt(draft[nutrient], 10);
    setTargetParam(nutrient, isNaN(val) || val <= 0 ? 0 : val);
  };

  const activeParams  = NUTRIENTS.filter(n => targetParams[n] > 0);
  const totalPtsToday = activeParams.reduce((sum, n) => {
    const pct = todayTotals[n] / targetParams[n];
    if (pct >= 1.0) return sum + 10;
    if (pct >= 0.7) return sum + 5;
    return sum;
  }, 0);
  const maxPtsPerDay  = activeParams.length * 10;
  const suggested     = suggestWeeklyGoals(targetParams);

  // Editable only when parent + manual mode
  const canEdit = role === 'parent' && !targetAutoPreset;

  const headerTitle = isOther ? `${targetMember.name}'s Targets` : '⚙️ Parameters';
  const headerSub   = isOther
    ? `Editing ${targetMember.name}'s daily nutrient targets`
    : (role === 'parent' ? 'Set daily nutrient targets for your kids' : 'Daily targets set by your parent');

  return (
    <SafeAreaView style={ps.root}>
      <View style={ps.header}>
        <View>
          <Text style={ps.headerTitle}>{headerTitle}</Text>
          <Text style={ps.headerSub}>{headerSub}</Text>
        </View>
        <View style={[ps.rolePill, { backgroundColor: role === 'parent' ? '#5856D6' : '#34C759' }]}>
          <Text style={ps.rolePillText}>{role === 'parent' ? '👨‍👩 Parent' : '🧒 Kid'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>

        {/* Age-group preset chips */}
        {(role === 'parent' || isOther) && (
          <View style={ps.presetSection}>
            {isOther && (
              <View style={ps.autoRow}>
                <View style={ps.autoRowLeft}>
                  <Text style={ps.autoLabel}>Auto-set nutrient targets</Text>
                  <Text style={ps.autoSub}>
                    {targetAutoPreset
                      ? `Locked to ${AGE_GROUP_LABEL[targetAgeGroup]} DRI values`
                      : 'Manual — customize each target below'}
                  </Text>
                </View>
                <Switch
                  value={targetAutoPreset}
                  onValueChange={toggleAutoPreset}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#fff"
                />
              </View>
            )}

            <Text style={ps.presetLabel}>Age Preset</Text>
            <View style={ps.presetRow}>
              {AGE_GROUPS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[ps.presetChip, targetAgeGroup === g && ps.presetChipActive]}
                  onPress={() => handleSetAgeGroup(g)}
                  activeOpacity={0.7}
                >
                  <Text style={[ps.presetChipText, targetAgeGroup === g && ps.presetChipTextActive]}>
                    {AGE_GROUP_LABEL[g]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* How it works */}
        <View style={ps.infoCard}>
          <Text style={ps.infoTitle}>How points work</Text>
          <Text style={ps.infoText}>
            Hit 100% of a target → <Text style={ps.infoBold}>10 points</Text>.{'\n'}
            Reach 70%+ of a target → <Text style={ps.infoBold}>5 points</Text>.{'\n'}
            All points go toward every active goal.
          </Text>
        </View>

        {/* Today's earnings */}
        <View style={ps.todaySummary}>
          <View style={ps.todaySummaryLeft}>
            <Text style={ps.todaySummaryLabel}>Today's earnings</Text>
            <Text style={ps.todaySummaryPts}>
              {totalPtsToday}<Text style={ps.todaySummaryMax}> / {maxPtsPerDay} pts</Text>
            </Text>
          </View>
          <View style={ps.todayChips}>
            {activeParams.length === 0 && <Text style={ps.todayNone}>No targets set</Text>}
            {activeParams.map(n => {
              const pct     = todayTotals[n] / targetParams[n];
              const full    = pct >= 1.0;
              const partial = pct >= 0.7;
              const bg    = full ? N_COLOR[n] + '33' : partial ? YELLOW + '44' : '#F0F0F0';
              const label = full ? '✓' : partial ? `~${Math.round(pct * 100)}%` : `${todayTotals[n]}/${targetParams[n]}${N_UNIT[n]}`;
              return (
                <View key={n} style={[ps.todayChip, { backgroundColor: bg }]}>
                  <Text style={ps.todayChipText}>{N_EMOJI[n]} {label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Nutrient rows */}
        <Text style={ps.sectionLabel}>Nutrient Targets</Text>
        {NUTRIENTS.map(nutrient => {
          const active  = targetParams[nutrient] > 0;
          const met     = active && todayTotals[nutrient] >= targetParams[nutrient];

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
                      : `Today: ${todayTotals[nutrient]} / ${targetParams[nutrient]}${N_UNIT[nutrient]}`}
                  </Text>
                ) : (
                  <Text style={ps.nutrientStatus}>
                    Not tracked — disabled for the family
                  </Text>
                )}
              </View>

              {/* Right side: text input (manual) / read-only value */}
              {canEdit ? (
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
                    <TouchableOpacity style={ps.clearBtn} onPress={() => clearTargetParam(nutrient)}>
                      <Text style={ps.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={ps.readonlyGroup}>
                  <Text style={[ps.readonlyVal, !active && { color: '#AEAEB2' }]}>
                    {active ? `${targetParams[nutrient]}${N_UNIT[nutrient]}` : '—'}
                  </Text>
                </View>
              )}

              {active && (() => {
                const pct     = todayTotals[nutrient] / targetParams[nutrient];
                const full    = pct >= 1.0;
                const partial = pct >= 0.7;
                const badgeBg   = full ? '#34C75933' : partial ? YELLOW + '55' : YELLOW + '33';
                const badgeText = full ? '+10 pts ✓' : partial ? '+5 pts' : '+10 pts';
                const textColor = full ? '#1A7F3C' : '#A07800';
                return (
                  <View style={[ps.ptsBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[ps.ptsBadgeText, { color: textColor }]}>{badgeText}</Text>
                  </View>
                );
              })()}
            </View>
          );
        })}

        {canEdit && (
          <Text style={ps.helpText}>
            Leave a field empty or set it to 0 to disable that nutrient. Changes save automatically.
          </Text>
        )}

        {isOther && targetAutoPreset && (
          <View style={ps.familyNutrNote}>
            <Text style={ps.familyNutrNoteText}>
              Which nutrients are tracked is set family-wide.{'\n'}
              Change it in <Text style={ps.familyNutrNoteLink}>Account → Settings → Family Nutrients</Text>.
            </Text>
          </View>
        )}

        {/* Suggested weekly goal — light card to match overall design */}
        {activeParams.length > 0 && (
          <View style={ps.suggestCard}>
            <View style={ps.suggestCardHeader}>
              <Text style={ps.suggestTitle}>Suggested Weekly Goal</Text>
              <Text style={ps.suggestSub}>
                {activeParams.length} active nutrient{activeParams.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={ps.suggestRow}>
              <View style={ps.suggestItem}>
                <View style={[ps.suggestDot, { backgroundColor: '#34C759' }]} />
                <Text style={[ps.suggestPts, { color: '#1A7F3C' }]}>{suggested.easy}</Text>
                <Text style={ps.suggestItemLabel}>Easy</Text>
              </View>
              <View style={ps.suggestSep} />
              <View style={ps.suggestItem}>
                <View style={[ps.suggestDot, { backgroundColor: YELLOW }]} />
                <Text style={[ps.suggestPts, { color: '#A07800' }]}>{suggested.medium}</Text>
                <Text style={ps.suggestItemLabel}>Medium</Text>
              </View>
              <View style={ps.suggestSep} />
              <View style={ps.suggestItem}>
                <View style={[ps.suggestDot, { backgroundColor: '#FF6B35' }]} />
                <Text style={[ps.suggestPts, { color: '#C04A1A' }]}>{suggested.hard}</Text>
                <Text style={ps.suggestItemLabel}>Challenging</Text>
              </View>
            </View>
            <Text style={ps.suggestFootnote}>pts / week — use these when creating a goal</Text>
          </View>
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

  todaySummary:     { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: YELLOW, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  todaySummaryLeft: { },
  todaySummaryLabel:{ fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  todaySummaryPts:  { fontSize: 28, fontWeight: '800', color: DARK, marginTop: 2 },
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

  familyNutrNote:     { backgroundColor: '#F0F0F5', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 8 },
  familyNutrNoteText: { fontSize: 12, color: '#8E8E93', lineHeight: 18, textAlign: 'center' },
  familyNutrNoteLink: { color: '#5856D6', fontWeight: '700' },

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

  presetSection:       { marginBottom: 16 },
  presetLabel:         { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  presetRow:           { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetChip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E5E5EA' },
  presetChipActive:    { backgroundColor: DARK, borderColor: DARK },
  presetChipText:      { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  presetChipTextActive:{ color: '#fff' },

  autoRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, gap: 12 },
  autoRowLeft: { flex: 1 },
  autoLabel:   { fontSize: 15, fontWeight: '700', color: DARK },
  autoSub:     { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  // Suggested goal card — white, matches overall card style
  suggestCard:       { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 8, borderLeftWidth: 4, borderLeftColor: '#34C759', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  suggestCardHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 },
  suggestTitle:      { fontSize: 15, fontWeight: '700', color: DARK },
  suggestSub:        { fontSize: 12, color: '#8E8E93' },
  suggestRow:        { flexDirection: 'row', alignItems: 'center' },
  suggestItem:       { flex: 1, alignItems: 'center', gap: 4 },
  suggestDot:        { width: 8, height: 8, borderRadius: 4 },
  suggestPts:        { fontSize: 28, fontWeight: '800' },
  suggestItemLabel:  { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  suggestSep:        { width: 1, height: 44, backgroundColor: '#F2F2F7' },
  suggestFootnote:   { fontSize: 11, color: '#AEAEB2', textAlign: 'center', marginTop: 14 },
});
