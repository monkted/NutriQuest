import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import {
  useApp, DayRecord, FoodEntry, Nutrient,
  calcTodayPoints, getWeekStart, todayString,
  N_EMOJI, N_UNIT, NUTRIENTS,
  TAB_BAR_HEIGHT,
} from './store';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekGroup {
  weekStart: string;   // "YYYY-MM-DD" (Monday)
  label:     string;   // "This week" | "Last week" | "May 5 – 11"
  days:      DayRecord[];
  totalPts:  number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function weekRangeLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00');
  const end   = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function dayCalories(entries: FoodEntry[]): number {
  return entries.reduce((s, e) => s + e.calories, 0);
}

function dayTotals(entries: FoodEntry[]): Record<Nutrient, number> {
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { history, entries, params, role } = useApp();

  const today     = todayString();
  const thisWeek  = getWeekStart(new Date());

  // Build today as a pseudo-DayRecord for display
  const todayRecord: DayRecord = { date: today, entries };
  const todayPts = calcTodayPoints(entries, params);

  // Group history by week, sorted newest first
  const weeks = useMemo<WeekGroup[]>(() => {
    const map = new Map<string, DayRecord[]>();
    for (const day of history) {
      const ws = getWeekStart(new Date(day.date + 'T12:00:00'));
      if (!map.has(ws)) map.set(ws, []);
      map.get(ws)!.push(day);
    }
    const groups: WeekGroup[] = [];
    for (const [ws, days] of map) {
      const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
      const totalPts = sorted.reduce((s, d) => s + calcTodayPoints(d.entries, params), 0);
      let label: string;
      if (ws === thisWeek) label = 'This week';
      else {
        const prevWeek = new Date(thisWeek + 'T12:00:00');
        prevWeek.setDate(prevWeek.getDate() - 7);
        label = ws === prevWeek.toISOString().split('T')[0] ? 'Last week' : weekRangeLabel(ws);
      }
      groups.push({ weekStart: ws, label, days: sorted, totalPts });
    }
    return groups.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [history, params, thisWeek]);

  const [openWeeks, setOpenWeeks] = useState<Set<string>>(() => new Set([thisWeek]));
  const [openDays,  setOpenDays]  = useState<Set<string>>(() => new Set([today]));

  const toggleWeek = (ws: string) =>
    setOpenWeeks(prev => { const s = new Set(prev); s.has(ws) ? s.delete(ws) : s.add(ws); return s; });

  const toggleDay = (date: string) =>
    setOpenDays(prev => { const s = new Set(prev); s.has(date) ? s.delete(date) : s.add(date); return s; });

  return (
    <SafeAreaView style={hs.root}>
      <View style={hs.header}>
        <View>
          <Text style={hs.headerTitle}>📅 History</Text>
          <Text style={hs.headerSub}>Your food log by week</Text>
        </View>
        <View style={[hs.rolePill, { backgroundColor: role === 'parent' ? '#5856D6' : '#34C759' }]}>
          <Text style={hs.rolePillText}>{role === 'parent' ? '👨‍👩 Parent' : '🧒 Kid'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>

        {/* ── Today card (always visible at top) ── */}
        <DayCard
          record={todayRecord}
          pts={todayPts}
          params={params}
          isOpen={openDays.has(today)}
          onToggle={() => toggleDay(today)}
          isToday
        />

        {/* ── Past weeks ── */}
        {weeks.map(week => {
          // Skip this-week prior days if they appear in history — show under "This week" section
          const priorDays = week.days.filter(d => d.date !== today);
          if (priorDays.length === 0 && week.weekStart !== thisWeek) return null;

          const isOpen = openWeeks.has(week.weekStart);
          // For this week, also count today's pts in the header total
          const displayPts = week.weekStart === thisWeek ? week.totalPts + todayPts : week.totalPts;

          return (
            <View key={week.weekStart} style={hs.weekGroup}>
              <TouchableOpacity style={hs.weekHeader} onPress={() => toggleWeek(week.weekStart)} activeOpacity={0.7}>
                <View style={hs.weekLeft}>
                  <Text style={hs.weekLabel}>{week.label}</Text>
                  <Text style={hs.weekRange}>{weekRangeLabel(week.weekStart)}</Text>
                </View>
                <View style={hs.weekRight}>
                  <Text style={hs.weekPts}>{displayPts} pts</Text>
                  <Text style={hs.weekChevron}>{isOpen ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {isOpen && priorDays.map(day => (
                <DayCard
                  key={day.date}
                  record={day}
                  pts={calcTodayPoints(day.entries, params)}
                  params={params}
                  isOpen={openDays.has(day.date)}
                  onToggle={() => toggleDay(day.date)}
                  isToday={false}
                />
              ))}
            </View>
          );
        })}

        {history.length === 0 && (
          <View style={hs.emptyState}>
            <Text style={hs.emptyEmoji}>📭</Text>
            <Text style={hs.emptyTitle}>No history yet</Text>
            <Text style={hs.emptySub}>Past days will appear here after you log food.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── DayCard ─────────────────────────────────────────────────────────────────

function DayCard({ record, pts, params, isOpen, onToggle, isToday }: {
  record:   DayRecord;
  pts:      number;
  params:   Record<Nutrient, number>;
  isOpen:   boolean;
  onToggle: () => void;
  isToday:  boolean;
}) {
  const cal     = dayCalories(record.entries);
  const totals  = dayTotals(record.entries);
  const hitNuts = NUTRIENTS.filter(n => params[n] > 0 && totals[n] >= params[n]);

  return (
    <View style={[dc.card, isToday && dc.cardToday]}>
      <TouchableOpacity style={dc.row} onPress={onToggle} activeOpacity={0.7}>
        <View style={dc.left}>
          <Text style={dc.dateText}>{isToday ? 'Today' : formatDate(record.date)}</Text>
          <View style={dc.chipRow}>
            {hitNuts.map(n => (
              <View key={n} style={dc.nutChip}>
                <Text style={dc.nutChipText}>{N_EMOJI[n]} ✓</Text>
              </View>
            ))}
            {hitNuts.length === 0 && <Text style={dc.noHits}>No targets hit</Text>}
          </View>
        </View>
        <View style={dc.right}>
          <Text style={[dc.pts, pts > 0 && dc.ptsActive]}>{pts} pts</Text>
          <Text style={dc.cal}>{cal} kcal</Text>
          <Text style={dc.chevron}>{isOpen ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={dc.entries}>
          {record.entries.length === 0 ? (
            <Text style={dc.emptyEntries}>Nothing logged this day.</Text>
          ) : (
            record.entries.map(entry => (
              <View key={entry.id} style={dc.entryRow}>
                <View style={dc.entryLeft}>
                  <Text style={dc.entryName}>{entry.name}</Text>
                  <Text style={dc.entryMeal}>{entry.meal}</Text>
                </View>
                <View style={dc.entryRight}>
                  <Text style={dc.entryCal}>{entry.calories} kcal</Text>
                  <Text style={dc.entryNuts}>
                    {['protein', 'fiber', 'vitamins']
                      .filter(n => (entry as any)[n] > 0)
                      .map(n => `${N_EMOJI[n as Nutrient]}${(entry as any)[n]}${N_UNIT[n as Nutrient]}`)
                      .join('  ')}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Nutrient totals row */}
          <View style={dc.totalsRow}>
            {NUTRIENTS.filter(n => params[n] > 0).map(n => (
              <View key={n} style={[dc.totalChip, totals[n] >= params[n] && dc.totalChipHit]}>
                <Text style={dc.totalChipText}>
                  {N_EMOJI[n]} {totals[n]}/{params[n]}{N_UNIT[n]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const hs = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  rolePill:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rolePillText:{ fontSize: 13, fontWeight: '700', color: '#fff' },

  weekGroup:   { marginBottom: 16 },
  weekHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  weekLeft:    { flex: 1 },
  weekLabel:   { fontSize: 16, fontWeight: '800', color: DARK },
  weekRange:   { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  weekRight:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weekPts:     { fontSize: 15, fontWeight: '700', color: '#FF9500' },
  weekChevron: { fontSize: 11, color: '#AEAEB2' },

  emptyState:  { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:  { fontSize: 52, marginBottom: 12 },
  emptyTitle:  { fontSize: 20, fontWeight: '700', color: DARK, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
});

const dc = StyleSheet.create({
  card:          { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  cardToday:     { borderLeftWidth: 4, borderLeftColor: YELLOW },
  row:           { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  left:          { flex: 1 },
  dateText:      { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 6 },
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  nutChip:       { backgroundColor: '#F0FAF0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  nutChipText:   { fontSize: 12, fontWeight: '600', color: '#1C5C2B' },
  noHits:        { fontSize: 12, color: '#AEAEB2' },
  right:         { alignItems: 'flex-end', gap: 2 },
  pts:           { fontSize: 16, fontWeight: '800', color: '#AEAEB2' },
  ptsActive:     { color: '#FF9500' },
  cal:           { fontSize: 12, color: '#8E8E93' },
  chevron:       { fontSize: 10, color: '#AEAEB2', marginTop: 4 },

  entries:       { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingHorizontal: 14, paddingBottom: 12 },
  emptyEntries:  { fontSize: 13, color: '#C7C7CC', paddingTop: 12 },
  entryRow:      { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, gap: 8 },
  entryLeft:     { flex: 1 },
  entryName:     { fontSize: 14, fontWeight: '600', color: DARK },
  entryMeal:     { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  entryRight:    { alignItems: 'flex-end' },
  entryCal:      { fontSize: 13, fontWeight: '700', color: DARK },
  entryNuts:     { fontSize: 11, color: '#8E8E93', marginTop: 2 },

  totalsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  totalChip:     { backgroundColor: '#F0F0F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  totalChipHit:  { backgroundColor: '#E8FAF0' },
  totalChipText: { fontSize: 12, fontWeight: '600', color: DARK },
});
