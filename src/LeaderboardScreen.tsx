import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Animated, Easing } from 'react-native';
import { useApp, calcWeekPoints, TAB_BAR_HEIGHT } from './store';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#AEAEB2'];
const RANK_MEDALS = ['🥇', '🥈', '🥉', '🏅'];

let _lbAnimPlayed = false;

const HERO_CONFETTI = [
  { emoji: '🎉', dx: -90,  dy: -65, delay: 0  },
  { emoji: '⭐', dx:  95,  dy: -60, delay: 40 },
  { emoji: '✨', dx: -38,  dy: -100,delay: 15 },
  { emoji: '🌟', dx:  44,  dy: -96, delay: 55 },
  { emoji: '🎊', dx: -112, dy: -35, delay: 25 },
  { emoji: '⭐', dx:  115, dy: -30, delay: 60 },
  { emoji: '✨', dx:   6,  dy: -110,delay: 10 },
  { emoji: '🎉', dx:  68,  dy: -78, delay: 45 },
  { emoji: '🌟', dx: -70,  dy: -74, delay: 20 },
  { emoji: '🎊', dx: -48,  dy: -88, delay: 50 },
  { emoji: '⭐', dx:  78,  dy: -48, delay: 30 },
  { emoji: '✨', dx: -80,  dy: -50, delay: 35 },
];

function ConfettiParticle({ emoji, dx, dy, delay }: { emoji: string; dx: number; dy: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 950, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.Text style={{
      position: 'absolute', fontSize: 22, pointerEvents: 'none' as any,
      opacity:   anim.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
      ],
    }}>{emoji}</Animated.Text>
  );
}

export default function LeaderboardScreen() {
  const { entries, params, history, goals, familyName, familyMembers, currentUserId, role } = useApp();

  const weekPts       = calcWeekPoints(history, entries, params);
  const currentMember = familyMembers.find(m => m.id === currentUserId)!;

  const allMembers = [
    { ...currentMember, weekPts, isSelf: true },
    ...familyMembers.filter(m => m.id !== currentUserId).map(m => ({ ...m, isSelf: false })),
  ].sort((a, b) => b.weekPts - a.weekPts);

  const totalFamilyPts = allMembers.reduce((s, m) => s + m.weekPts, 0);
  const topPts         = allMembers[0]?.weekPts || 1;
  const allGoalsComplete = goals.length > 0 && goals.every(g =>
    (g.type === 'group' ? totalFamilyPts : weekPts) >= g.weeklyPointsTarget
  );

  const played = _lbAnimPlayed;

  const [dispTotal,    setDispTotal]    = useState(played ? totalFamilyPts : 0);
  // Per-member count-up display — same cubic ease-out as family total
  const [dispPtsArr,   setDispPtsArr]   = useState<number[]>(
    played ? allMembers.map(m => m.weekPts) : allMembers.map(() => 0)
  );
  const [showConfetti, setShowConfetti] = useState(false);

  // ONE shared Animated.Value drives both the hero pts text and the self rank card.
  // Using the same value guarantees pixel-perfect sync — no two separate tweens to drift.
  const heroScale = useRef(new Animated.Value(1)).current;
  const barAnims  = useRef(allMembers.map(() => new Animated.Value(played ? 1 : 0))).current;

  useEffect(() => {
    if (_lbAnimPlayed) {
      setDispTotal(totalFamilyPts);
      return;
    }
    _lbAnimPlayed = true;

    const DURATION       = 1600;
    const startMs        = Date.now();
    const finalTotal     = totalFamilyPts;
    const finalMemberPts = allMembers.map(m => m.weekPts);

    // Single interval updates family total AND all member pts in one render per tick
    const countInterval = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const t       = Math.min(elapsed / DURATION, 1);
      const eased   = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDispTotal(Math.round(eased * finalTotal));
      setDispPtsArr(finalMemberPts.map(pts => Math.round(eased * pts)));
      if (t >= 1) clearInterval(countInterval);
    }, 33);

    // Shared scale — same easing as count-up so growth rate feels identical
    Animated.timing(heroScale, {
      toValue: 1.18,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2400);
      // Spring back — hero text and self card shrink together
      Animated.spring(heroScale, {
        toValue: 1, tension: 200, friction: 6, useNativeDriver: true,
      }).start();
    });

    // Bars grow in sync with the count — same duration, same easing, negligible stagger
    barAnims.forEach(a => a.setValue(0));
    Animated.stagger(30, barAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: false })
    )).start();

    return () => clearInterval(countInterval);
  }, []);

  return (
    <SafeAreaView style={lb.root}>
      <View style={lb.header}>
        <View>
          <Text style={lb.headerTitle}>🏆 Leaderboard</Text>
          <Text style={lb.headerSub}>{familyName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 24 }}>

        {/* ── Hero ── */}
        <View style={lb.heroCard}>
          <View style={lb.heroTopRow}>
            <Text style={lb.heroTrophy}>🏆</Text>
            <Text style={lb.heroLabel}>This Week's Family Total</Text>
          </View>
          <View style={{ alignItems: 'center', justifyContent: 'center', overflow: 'visible' as any }}>
            {/* heroScale is shared with the self rank card below */}
            <Animated.Text style={[lb.heroPts, { transform: [{ scale: heroScale }] }]}>
              {dispTotal}
            </Animated.Text>
            {showConfetti && HERO_CONFETTI.map((c, i) => (
              <ConfettiParticle key={i} emoji={c.emoji} dx={c.dx} dy={c.dy} delay={c.delay} />
            ))}
          </View>
          <Text style={lb.heroPtsSub}>points earned together</Text>
          {allGoalsComplete && (
            <View style={lb.allCompleteBadge}>
              <Text style={lb.allCompleteText}>🎉 All Goals Complete!</Text>
            </View>
          )}
        </View>

        {/* ── Rankings ── */}
        <View style={lb.section}>
          <Text style={lb.sectionLabel}>Rankings</Text>
          {allMembers.map((m, i) => {
            const targetPct = topPts > 0 ? (m.weekPts / topPts) * 100 : 0;
            const animWidth = (barAnims[i] ?? new Animated.Value(1)).interpolate({
              inputRange: [0, 1], outputRange: ['0%', `${targetPct}%`],
            });

            const inner = (
              <View style={[lb.rankCard, m.isSelf && lb.rankCardSelf]}>
                <View style={lb.rankLeft}>
                  <Text style={lb.rankMedal}>{RANK_MEDALS[Math.min(i, 3)]}</Text>
                  <Text style={lb.rankAvatar}>{m.avatar}</Text>
                  <View style={lb.rankInfo}>
                    <View style={lb.rankNameRow}>
                      <Text style={lb.rankName}>{m.name}</Text>
                      {m.isSelf && <View style={lb.youTag}><Text style={lb.youTagText}>You</Text></View>}
                    </View>
                    <View style={lb.rankBarWrap}>
                      <Animated.View style={[lb.rankBar, { width: animWidth, backgroundColor: RANK_COLORS[Math.min(i, 3)] }]} />
                    </View>
                  </View>
                </View>
                {/* Count-up pts — dispPtsArr[i] for all members */}
                <Text style={lb.rankPts}>{dispPtsArr[i] ?? m.weekPts}<Text style={lb.rankPtsSub}> pts</Text></Text>
              </View>
            );

            // Self card uses heroScale — the exact same Animated.Value as the hero text
            return m.isSelf ? (
              <Animated.View key={m.id} style={{ transform: [{ scale: heroScale }] }}>
                {inner}
              </Animated.View>
            ) : <View key={m.id}>{inner}</View>;
          })}
        </View>

        {/* ── Active Goals ── */}
        {goals.length > 0 && (
          <View style={lb.section}>
            <Text style={lb.sectionLabel}>Active Goals</Text>
            {goals.map(goal => {
              const scorePts = goal.type === 'group' ? totalFamilyPts : weekPts;
              const progress = Math.min(scorePts / goal.weeklyPointsTarget, 1);
              const complete = scorePts >= goal.weeklyPointsTarget;
              const pct = Math.round(progress * 100);
              return (
                <View key={goal.id} style={[lb.goalCard, complete && lb.goalCardComplete]}>
                  <View style={lb.goalTop}>
                    <View style={lb.goalTitleRow}>
                      <View style={[lb.goalTypeBadge, { backgroundColor: goal.type === 'group' ? '#5856D622' : '#007AFF22' }]}>
                        <Text style={[lb.goalTypeBadgeText, { color: goal.type === 'group' ? '#5856D6' : '#007AFF' }]}>
                          {goal.type === 'group' ? '👨‍👩 Group' : '⭐ Individual'}
                        </Text>
                      </View>
                      {complete && <View style={lb.completeBadge}><Text style={lb.completeBadgeText}>✓ Complete!</Text></View>}
                    </View>
                    <Text style={lb.goalName}>{goal.title}</Text>
                    <Text style={lb.goalReward}>🏆 {goal.reward}</Text>
                  </View>
                  <View style={lb.goalProgressRow}>
                    <View style={lb.goalProgressTrack}>
                      <View style={[lb.goalProgressFill, { width: `${pct}%` as any, backgroundColor: complete ? '#34C759' : YELLOW }]} />
                    </View>
                    <Text style={lb.goalPctText}>{pct}%</Text>
                  </View>
                  <View style={lb.goalPtsRow}>
                    <Text style={lb.goalPtsLabel}>{scorePts} / {goal.weeklyPointsTarget} pts needed</Text>
                    {!complete && <Text style={lb.goalPtsRemaining}>{goal.weeklyPointsTarget - scorePts} pts to go</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {goals.length === 0 && (
          <View style={lb.noGoals}>
            <Text style={lb.noGoalsEmoji}>🎯</Text>
            <Text style={lb.noGoalsText}>No active goals yet.</Text>
            <Text style={lb.noGoalsSub}>A parent can add goals on the Family tab.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const lb = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  header:      { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 13, color: '#8E8E93', marginTop: 2 },

  heroCard:         { backgroundColor: YELLOW, margin: 16, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: YELLOW, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  heroTopRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  heroTrophy:       { fontSize: 26 },
  heroLabel:        { fontSize: 14, fontWeight: '700', color: '#A07800', letterSpacing: 0.3 },
  heroPts:          { fontSize: 72, fontWeight: '900', color: DARK, lineHeight: 80 },
  heroPtsSub:       { fontSize: 15, fontWeight: '600', color: '#7A5C00', marginBottom: 4 },
  allCompleteBadge: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  allCompleteText:  { fontSize: 15, fontWeight: '700', color: '#34C759' },

  section:      { paddingHorizontal: 16, marginBottom: 8 },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 12 },

  rankCard:    { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  rankCardSelf:{ borderWidth: 2, borderColor: YELLOW },
  rankLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  rankMedal:   { fontSize: 24, width: 30, textAlign: 'center' },
  rankAvatar:  { fontSize: 28 },
  rankInfo:    { flex: 1 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rankName:    { fontSize: 15, fontWeight: '700', color: DARK },
  youTag:      { backgroundColor: YELLOW + '44', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  youTagText:  { fontSize: 10, fontWeight: '700', color: '#A07800' },
  rankBarWrap: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  rankBar:     { height: '100%', borderRadius: 4 },
  rankPts:     { fontSize: 18, fontWeight: '800', color: DARK },
  rankPtsSub:  { fontSize: 11, fontWeight: '500', color: '#8E8E93' },

  goalCard:          { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  goalCardComplete:  { borderWidth: 2, borderColor: '#34C759' },
  goalTop:           { marginBottom: 12 },
  goalTitleRow:      { flexDirection: 'row', gap: 8, marginBottom: 8 },
  goalTypeBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  goalTypeBadgeText: { fontSize: 12, fontWeight: '700' },
  completeBadge:     { backgroundColor: '#34C75922', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completeBadgeText: { fontSize: 12, fontWeight: '700', color: '#34C759' },
  goalName:          { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 4 },
  goalReward:        { fontSize: 13, color: '#8E8E93' },
  goalProgressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  goalProgressTrack: { flex: 1, height: 12, backgroundColor: '#F0F0F0', borderRadius: 6, overflow: 'hidden' },
  goalProgressFill:  { height: '100%', borderRadius: 6 },
  goalPctText:       { fontSize: 13, fontWeight: '700', color: DARK, width: 40, textAlign: 'right' },
  goalPtsRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  goalPtsLabel:      { fontSize: 13, color: '#8E8E93' },
  goalPtsRemaining:  { fontSize: 13, fontWeight: '700', color: '#007AFF' },

  noGoals:      { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  noGoalsEmoji: { fontSize: 48, marginBottom: 12 },
  noGoalsText:  { fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 6 },
  noGoalsSub:   { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
});
