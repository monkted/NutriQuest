import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Animated, LayoutAnimation, UIManager, Easing,
} from 'react-native';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import {
  useApp, Goal, GoalType, FamilyMember,
  calcWeekPoints, calcTodayPoints, getWeekStart, todayString,
  TAB_BAR_HEIGHT,
} from './store';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

let _familyAnimPlayed = false;
const AnimSvgCircle = Animated.createAnimatedComponent(SvgCircle);

const LAST_WEEK_GOALS = [
  { id: 'lw1', title: 'Veggie Challenge',    type: 'group',      weeklyPointsTarget: 100, reward: 'Pizza night 🍕',    earned: 110, complete: true  },
  { id: 'lw2', title: 'Fiber Boost Week',    type: 'individual', weeklyPointsTarget: 50,  reward: 'New book 📚',        earned: 30,  complete: false },
];

const CONFETTI_ITEMS = [
  { emoji: '🎉', dx: -32, dy: -72, delay: 0 },
  { emoji: '⭐', dx:  12, dy: -88, delay: 60 },
  { emoji: '✨', dx:  36, dy: -58, delay: 120 },
  { emoji: '🌟', dx: -18, dy: -80, delay: 40 },
  { emoji: '🎊', dx:  -4, dy: -65, delay: 90 },
  { emoji: '⭐', dx:  28, dy: -82, delay: 150 },
];

function ConfettiParticle({ emoji, dx, dy, delay }: { emoji: string; dx: number; dy: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.Text style={{
      position: 'absolute', fontSize: 15, pointerEvents: 'none' as any,
      opacity:   anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
        { scale:      anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.3, 0.7] }) },
      ],
    }}>{emoji}</Animated.Text>
  );
}

// Goal progress bar — tweens on mount when animate=true (one-shot on first open)
function GoalProgressBar({ progress, complete, animate }: { progress: number; complete: boolean; animate: boolean }) {
  const anim = useRef(new Animated.Value(animate ? 0 : 1)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.timing(anim, {
      toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(progress * 100)}%`] });
  return (
    <View style={fs.progressTrack}>
      <Animated.View style={[fs.progressFill, { width, backgroundColor: complete ? '#34C759' : YELLOW }]} />
    </View>
  );
}

// Participation bar — tweens from 0 every time it mounts (i.e. each time goal is expanded)
function BreakdownBar({ pct }: { pct: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, []);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${Math.round(pct * 100)}%`] });
  return (
    <View style={fs.breakdownBarWrap}>
      <Animated.View style={[fs.breakdownBar, { width }]} />
    </View>
  );
}

function MemberCircle({ size, progress, strokeWidth = 7, isSelf = false, animate = false, noSelfPop = false, weekPts = 0, children }: {
  size: number; progress: number; strokeWidth?: number; isSelf?: boolean; animate?: boolean; noSelfPop?: boolean; weekPts?: number; children?: React.ReactNode;
}) {
  const completed   = progress >= 1;
  const innerSize   = isSelf ? size - 6 : size;
  const r           = (innerSize - strokeWidth) / 2;
  const cx          = innerSize / 2;
  const circ        = 2 * Math.PI * r;
  const pct         = Math.min(Math.max(progress, 0), 1);
  const strokeColor = completed ? '#34C759' : '#007AFF';
  const target      = circ * (1 - pct);

  const outerSize   = size + 6;
  const goldR       = (outerSize - 3) / 2;
  const goldCx      = outerSize / 2;

  // When noSelfPop=true an external heroScale wraps this component, so start at 1 always
  const scaleAnim   = useRef(new Animated.Value((isSelf && animate) ? 1 : (completed ? 0.82 : 1))).current;
  const prevDoneRef = useRef(completed);
  const [confetti,    setConfetti]    = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const offsetAnim  = useRef(new Animated.Value((animate && pct > 0) ? circ : target)).current;
  const ringMounted = useRef(false);

  const [dispPts, setDispPts] = useState(animate ? 0 : weekPts);

  useEffect(() => {
    if (!animate) setDispPts(weekPts);
  }, [weekPts, animate]);

  useEffect(() => {
    if (!animate || weekPts === 0) return;
    const DURATION = 1600;
    const startMs = Date.now();
    const interval = setInterval(() => {
      const t = Math.min((Date.now() - startMs) / DURATION, 1);
      setDispPts(Math.round((1 - Math.pow(1 - t, 3)) * weekPts));
      if (t >= 1) clearInterval(interval);
    }, 33);
    return () => clearInterval(interval);
  }, []);

  // Ring fill + optional internal self pop (disabled when noSelfPop — external heroScale handles it)
  useEffect(() => {
    if (!ringMounted.current) {
      ringMounted.current = true;
      if (animate && pct > 0) {
        Animated.spring(offsetAnim, {
          toValue: target, tension: 40, friction: 8, useNativeDriver: false,
        }).start(({ finished }) => {
          if (!finished || !isSelf || noSelfPop) return;
          Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.10, tension: 200, friction: 6, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
          ]).start();
        });
      } else {
        offsetAnim.setValue(target);
        if (animate && isSelf && !noSelfPop) {
          setTimeout(() => {
            Animated.sequence([
              Animated.spring(scaleAnim, { toValue: 1.10, tension: 200, friction: 6, useNativeDriver: true }),
              Animated.spring(scaleAnim, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
            ]).start();
          }, 800);
        }
      }
    } else {
      offsetAnim.setValue(target);
    }
  }, [target]);

  // Completion spring — skip initial for isSelf+animate (external handles scale)
  useEffect(() => {
    if (completed) {
      const justDone = !prevDoneRef.current;
      if (!(animate && isSelf && !justDone)) {
        scaleAnim.setValue(0.82);
        Animated.spring(scaleAnim, {
          toValue: 1, tension: justDone ? 140 : 80, friction: justDone ? 4 : 7, useNativeDriver: true,
        }).start();
      }
      if (justDone) {
        setConfettiKey(k => k + 1);
        setConfetti(true);
        const t = setTimeout(() => setConfetti(false), 1800);
        return () => clearTimeout(t);
      }
    }
    prevDoneRef.current = completed;
  }, [completed]);

  return (
    <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
      {isSelf && (
        <Svg width={outerSize} height={outerSize} style={{ position: 'absolute' }}>
          <SvgCircle cx={goldCx} cy={goldCx} r={goldR} stroke={YELLOW} strokeWidth={3} fill="none" />
        </Svg>
      )}
      <Animated.View style={{
        width: innerSize, height: innerSize, alignItems: 'center', justifyContent: 'center',
        transform: [{ scale: scaleAnim }],
      }}>
        <Svg width={innerSize} height={innerSize} style={{ position: 'absolute' }}>
          <SvgCircle cx={cx} cy={cx} r={r} stroke="#EFEFEF" strokeWidth={strokeWidth} fill="none" />
          {pct > 0 && (
            <AnimSvgCircle cx={cx} cy={cx} r={r} stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
              strokeDasharray={circ} strokeDashoffset={offsetAnim}
              strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
            />
          )}
        </Svg>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {children}
          <Text style={fs.memberPts}>{dispPts}<Text style={fs.memberPtsSub}>pts</Text></Text>
        </View>
      </Animated.View>
      {confetti && CONFETTI_ITEMS.map((c, i) => (
        <ConfettiParticle key={`${confettiKey}-${i}`} emoji={c.emoji} dx={c.dx} dy={c.dy} delay={c.delay} />
      ))}
    </View>
  );
}

export default function FamilyScreen() {
  const { role, goals, setGoals, entries, params, history, familyName, familyCode, familyMembers, currentUserName, currentUserId } = useApp();

  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(() => new Set([goals[0]?.id]));
  const [showPastGoals, setShowPastGoals] = useState(false);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [fTitle,        setFTitle]        = useState('');
  const [fType,         setFType]         = useState<GoalType>('individual');
  const [fPointsTarget, setFPointsTarget] = useState('');
  const [fReward,       setFReward]       = useState('');

  const weekPts  = calcWeekPoints(history, entries, params);
  const todayPts = calcTodayPoints(entries, params);

  const currentMemberBase = familyMembers.find(m => m.id === currentUserId)!;
  const allMembers: (FamilyMember & { isDynamic?: boolean })[] = [
    { ...currentMemberBase, weekPts, isDynamic: true },
    ...familyMembers.filter(m => m.id !== currentUserId),
  ];

  const totalFamilyPts       = allMembers.reduce((s, m) => s + m.weekPts, 0);
  const individualGoalTarget = goals.find(g => g.type === 'individual')?.weeklyPointsTarget ?? 100;
  const groupGoalTarget      = goals.find(g => g.type === 'group')?.weeklyPointsTarget ?? 100;

  // ── Animation ────────────────────────────────────────────────────────────────
  const shouldAnimate = useRef(!_familyAnimPlayed).current;

  const [dispFamilyTotal, setDispFamilyTotal] = useState(() =>
    _familyAnimPlayed ? totalFamilyPts : 0
  );

  // Single Animated.Value shared by family total pts text AND self member circle —
  // guarantees pixel-perfect sync, same as the leaderboard hero pattern.
  const heroScale   = useRef(new Animated.Value(1)).current;
  const goalsAnim   = useRef(new Animated.Value(_familyAnimPlayed ? 1 : 0)).current;
  const goalsTranslateY = goalsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });

  useEffect(() => {
    if (!shouldAnimate) return;
    _familyAnimPlayed = true;

    const DURATION   = 1600;
    const finalTotal = totalFamilyPts;
    const startMs    = Date.now();

    // Count-up — same cubic ease-out as heroScale timing
    const totalInterval = setInterval(() => {
      const t     = Math.min((Date.now() - startMs) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDispFamilyTotal(Math.round(eased * finalTotal));
      if (t >= 1) clearInterval(totalInterval);
    }, 33);

    // Shared scale — grows during count then springs back (identical to leaderboard hero)
    Animated.timing(heroScale, {
      toValue: 1.18,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      Animated.spring(heroScale, {
        toValue: 1, tension: 200, friction: 6, useNativeDriver: true,
      }).start();
    });

    // Goals section slides up
    Animated.timing(goalsAnim, {
      toValue: 1, duration: 800, delay: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();

    return () => clearInterval(totalInterval);
  }, []);

  const toggleGoal = (id: string) => {
    LayoutAnimation.configureNext({
      duration: 320,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.72 },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setExpandedGoals(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const openAdd = () => {
    setEditingGoal(null);
    setFTitle(''); setFType('individual'); setFPointsTarget(''); setFReward('');
    setModalVisible(true);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFTitle(goal.title); setFType(goal.type);
    setFPointsTarget(String(goal.weeklyPointsTarget));
    setFReward(goal.reward);
    setModalVisible(true);
  };

  const saveGoal = () => {
    const pts = parseInt(fPointsTarget, 10);
    if (!fTitle.trim() || isNaN(pts) || pts <= 0) return;
    if (editingGoal) {
      setGoals(prev => prev.map(g =>
        g.id === editingGoal.id
          ? { ...g, title: fTitle.trim(), type: fType, weeklyPointsTarget: pts, reward: fReward.trim() }
          : g,
      ));
    } else {
      setGoals(prev => [...prev, {
        id: Date.now().toString(), title: fTitle.trim(), type: fType,
        weeklyPointsTarget: pts, reward: fReward.trim(),
      }]);
    }
    setModalVisible(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <SafeAreaView style={fs.root}>
      {/* Header */}
      <View style={fs.header}>
        <View>
          <Text style={fs.headerTitle}>👨‍👩 Family</Text>
          <Text style={fs.headerSub}>{familyName}</Text>
        </View>
        <View style={[fs.rolePill, { backgroundColor: role === 'parent' ? '#5856D6' : '#34C759' }]}>
          <Text style={fs.rolePillText}>{role === 'parent' ? '👩 Parent' : '🧒 Kid'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>

        {/* ── Individual Points ── */}
        <Text style={fs.sectionLabel}>Individual Points This Week</Text>
        <View style={fs.memberGrid}>
          {allMembers.map(m => {
            const isCurrentUser = m.id === 'u1';
            const progress = Math.min(m.weekPts / individualGoalTarget, 1);

            const circle = (
              <MemberCircle
                size={86} progress={progress} strokeWidth={7}
                isSelf={isCurrentUser} animate={shouldAnimate}
                noSelfPop={isCurrentUser}
                weekPts={m.weekPts}
              >
                <Text style={fs.memberAvatar}>{m.avatar}</Text>
              </MemberCircle>
            );

            return (
              <View key={m.id} style={fs.memberCell}>
                {/* Self circle shares heroScale — same Animated.Value as the family total */}
                {isCurrentUser ? (
                  <Animated.View style={{ transform: [{ scale: heroScale }] }}>
                    {circle}
                  </Animated.View>
                ) : circle}
                <Text style={fs.memberName} numberOfLines={1}>{m.name}</Text>
                {isCurrentUser
                  ? <View style={fs.youBadge}><Text style={fs.youBadgeText}>You</Text></View>
                  : <Text style={fs.memberRole}>{m.role}</Text>
                }
              </View>
            );
          })}
        </View>

        {/* ── Family Total ── */}
        <View style={fs.familyTotalCard}>
          <Text style={fs.familyTotalLabel}>Total Family Points This Week</Text>
          {/* heroScale is the same Animated.Value as the self circle above */}
          <Animated.View style={{ transform: [{ scale: heroScale }], alignSelf: 'flex-start' }}>
            <Text style={fs.familyTotalPts}>{dispFamilyTotal}<Text style={fs.familyTotalPtsSub}> pts</Text></Text>
          </Animated.View>
          <Text style={fs.familyTotalSub}>{allMembers.length} members · {allMembers.filter(m => m.weekPts > 0).length} earning points this week</Text>
        </View>

        {/* ── Weekly Goals (slide-in) ── */}
        <Animated.View style={{ opacity: goalsAnim, transform: [{ translateY: goalsTranslateY }] }}>
          <View style={fs.sectionRow}>
            <Text style={fs.sectionLabel}>Weekly Goals</Text>
            {role === 'parent' && goals.length < 3 && (
              <TouchableOpacity style={fs.addGoalBtn} onPress={openAdd}>
                <Text style={fs.addGoalBtnText}>+ Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {goals.length === 0 && (
            <View style={fs.emptyGoals}>
              <Text style={fs.emptyGoalsText}>
                {role === 'parent' ? 'Tap + Add to create a goal.' : 'No goals set yet — ask a parent!'}
              </Text>
            </View>
          )}

          {goals.map(goal => {
            const isOpen    = expandedGoals.has(goal.id);
            const scorePts  = goal.type === 'group' ? totalFamilyPts : weekPts;
            const progress  = Math.min(scorePts / goal.weeklyPointsTarget, 1);
            const complete  = scorePts >= goal.weeklyPointsTarget;

            return (
              <View key={goal.id} style={[fs.goalCard, complete && fs.goalCardComplete]}>
                <TouchableOpacity style={fs.goalCardHeader} onPress={() => toggleGoal(goal.id)} activeOpacity={0.7}>
                  <View style={fs.goalCardLeft}>
                    <View style={fs.goalBadgeRow}>
                      <View style={[fs.typeBadge, { backgroundColor: goal.type === 'group' ? '#5856D622' : '#FF950022' }]}>
                        <Text style={[fs.typeBadgeText, { color: goal.type === 'group' ? '#5856D6' : '#FF9500' }]}>
                          {goal.type === 'group' ? '👨‍👩 Group' : '⭐ Individual'}
                        </Text>
                      </View>
                      {complete && <View style={fs.completeBadge}><Text style={fs.completeBadgeText}>✓ Complete</Text></View>}
                    </View>
                    <Text style={fs.goalTitle}>{goal.title}</Text>
                    <Text style={fs.goalReward}>🏆 {goal.reward}</Text>
                  </View>
                  <View style={fs.goalCardRight}>
                    <Text style={[fs.goalPts, complete && { color: '#34C759' }]}>{scorePts}</Text>
                    <Text style={fs.goalPtsTarget}>/ {goal.weeklyPointsTarget}</Text>
                    <Text style={fs.chevron}>{isOpen ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Animated goal progress bar */}
                <View style={{ marginHorizontal: 16, marginBottom: isOpen ? 0 : 14 }}>
                  <GoalProgressBar progress={progress} complete={complete} animate={shouldAnimate} />
                </View>

                {/* Expanded: per-member breakdown with animated participation bars */}
                {isOpen && (
                  <View style={fs.memberBreakdown}>
                    <Text style={fs.breakdownTitle}>Participation</Text>
                    {allMembers.map(m => {
                      const pct = Math.min(m.weekPts / goal.weeklyPointsTarget, 1);
                      return (
                        <View key={m.id} style={fs.breakdownRow}>
                          <Text style={fs.breakdownAvatar}>{m.avatar}</Text>
                          <Text style={fs.breakdownName}>{m.name}</Text>
                          <BreakdownBar pct={pct} />
                          <Text style={fs.breakdownPts}>{m.weekPts} pts</Text>
                        </View>
                      );
                    })}
                    {role === 'parent' && (
                      <View style={fs.goalActions}>
                        <TouchableOpacity style={fs.editBtn} onPress={() => openEdit(goal)}>
                          <Text style={fs.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={fs.deleteBtn} onPress={() => setDeleteConfirm(goal.id)}>
                          <Text style={fs.deleteBtnText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* ── Previous Goals ── */}
        <TouchableOpacity style={fs.pastHeader} onPress={() => setShowPastGoals(p => !p)} activeOpacity={0.7}>
          <Text style={fs.sectionLabel}>Previous Goals</Text>
          <Text style={fs.chevron}>{showPastGoals ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showPastGoals && LAST_WEEK_GOALS.map(pg => (
          <View key={pg.id} style={[fs.pastGoalCard, pg.complete && fs.pastGoalComplete]}>
            <View style={fs.pastGoalTop}>
              <View style={[fs.typeBadge, { backgroundColor: pg.type === 'group' ? '#5856D622' : '#FF950022' }]}>
                <Text style={[fs.typeBadgeText, { color: pg.type === 'group' ? '#5856D6' : '#FF9500' }]}>
                  {pg.type === 'group' ? '👨‍👩 Group' : '⭐ Individual'}
                </Text>
              </View>
              <View style={[fs.completeBadge, { backgroundColor: pg.complete ? '#34C75922' : '#FF3B3022' }]}>
                <Text style={[fs.completeBadgeText, { color: pg.complete ? '#34C759' : '#FF3B30' }]}>
                  {pg.complete ? '✓ Completed' : '✗ Missed'}
                </Text>
              </View>
            </View>
            <Text style={fs.goalTitle}>{pg.title}</Text>
            <Text style={fs.goalReward}>🏆 {pg.reward}</Text>
            <Text style={fs.pastGoalPts}>{pg.earned} / {pg.weeklyPointsTarget} pts · Last week</Text>
          </View>
        ))}

      </ScrollView>

      {/* Delete confirm */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade">
        <View style={fs.confirmOverlay}>
          <View style={fs.confirmBox}>
            <Text style={fs.confirmTitle}>Delete this goal?</Text>
            <Text style={fs.confirmSub}>This can't be undone.</Text>
            <View style={fs.confirmBtns}>
              <TouchableOpacity style={fs.confirmCancel} onPress={() => setDeleteConfirm(null)}>
                <Text style={fs.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fs.confirmDelete} onPress={() => deleteGoal(deleteConfirm!)}>
                <Text style={fs.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Goal modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={fs.overlay}>
          <View style={fs.sheet}>
            <Text style={fs.sheetTitle}>{editingGoal ? 'Edit Goal ✏️' : 'New Goal 🎯'}</Text>

            <Text style={fs.fieldLabel}>Goal Title</Text>
            <TextInput style={fs.input} placeholder="e.g. Protein Power Week" placeholderTextColor="#aaa" value={fTitle} onChangeText={setFTitle} />

            <Text style={fs.fieldLabel}>Goal Type</Text>
            <View style={fs.typeRow}>
              <TouchableOpacity style={[fs.typeChip, fType === 'individual' && { backgroundColor: '#FF9500' }]} onPress={() => setFType('individual')}>
                <Text style={[fs.typeChipText, fType === 'individual' && { color: '#fff' }]}>⭐ Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[fs.typeChip, fType === 'group' && { backgroundColor: '#5856D6' }]} onPress={() => setFType('group')}>
                <Text style={[fs.typeChipText, fType === 'group' && { color: '#fff' }]}>👨‍👩 Group</Text>
              </TouchableOpacity>
            </View>

            <Text style={fs.fieldLabel}>Points to Complete</Text>
            <TextInput style={fs.input} placeholder="e.g. 70" placeholderTextColor="#aaa" keyboardType="numeric" value={fPointsTarget} onChangeText={setFPointsTarget} />

            <Text style={fs.fieldLabel}>Reward 🏆</Text>
            <TextInput style={fs.input} placeholder="e.g. $10 allowance" placeholderTextColor="#aaa" value={fReward} onChangeText={setFReward} />

            <View style={fs.modalBtns}>
              <TouchableOpacity style={fs.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={fs.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={fs.saveBtn} onPress={saveGoal}>
                <Text style={fs.saveText}>Save Goal ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const fs = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  rolePill:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rolePillText:{ fontSize: 13, fontWeight: '700', color: '#fff' },

  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 10, marginTop: 4 },
  addGoalBtn:   { backgroundColor: YELLOW, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  addGoalBtnText:{ fontSize: 13, fontWeight: '700', color: DARK },

  memberGrid:   { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginBottom: 14, gap: 8 },
  memberCell:   { alignItems: 'center', width: 90 },
  memberAvatar: { fontSize: 24, marginBottom: 1 },
  memberPts:    { fontSize: 14, fontWeight: '800', color: DARK },
  memberPtsSub: { fontSize: 9, fontWeight: '500', color: '#8E8E93' },
  memberName:   { fontSize: 12, fontWeight: '700', color: DARK, marginTop: 6, textAlign: 'center' },
  memberRole:   { fontSize: 10, color: '#8E8E93', textTransform: 'capitalize', marginTop: 2 },
  youBadge:     { backgroundColor: YELLOW + '44', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: '#A07800' },

  familyTotalCard:    { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  familyTotalLabel:   { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6 },
  familyTotalPts:     { fontSize: 36, fontWeight: '900', color: DARK, marginBottom: 4 },
  familyTotalPtsSub:  { fontSize: 16, fontWeight: '500', color: '#8E8E93' },
  familyTotalSub:     { fontSize: 12, color: '#AEAEB2' },

  progressTrack: { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 5, backgroundColor: YELLOW },

  emptyGoals:    { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
  emptyGoalsText:{ fontSize: 14, color: '#8E8E93', textAlign: 'center' },

  goalCard:         { backgroundColor: '#fff', borderRadius: 20, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, overflow: 'hidden' },
  goalCardComplete: { borderWidth: 2, borderColor: '#34C759' },
  goalCardHeader:   { flexDirection: 'row', alignItems: 'flex-start', padding: 16, paddingBottom: 10 },
  goalCardLeft:     { flex: 1 },
  goalCardRight:    { alignItems: 'flex-end', paddingLeft: 8 },
  goalBadgeRow:     { flexDirection: 'row', gap: 6, marginBottom: 6 },
  typeBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText:    { fontSize: 12, fontWeight: '700' },
  completeBadge:    { backgroundColor: '#34C75922', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completeBadgeText:{ fontSize: 12, fontWeight: '700', color: '#34C759' },
  goalTitle:        { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 4 },
  goalReward:       { fontSize: 13, color: '#8E8E93' },
  goalPts:          { fontSize: 22, fontWeight: '800', color: DARK },
  goalPtsTarget:    { fontSize: 12, color: '#8E8E93' },
  chevron:          { fontSize: 11, color: '#AEAEB2', marginTop: 6 },

  memberBreakdown: { borderTopWidth: 1, borderTopColor: '#F2F2F7', padding: 16, paddingTop: 12 },
  breakdownTitle:  { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  breakdownRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  breakdownAvatar: { fontSize: 18, width: 24, textAlign: 'center' },
  breakdownName:   { fontSize: 13, fontWeight: '600', color: DARK, width: 52 },
  breakdownBarWrap:{ flex: 1, height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  breakdownBar:    { height: '100%', backgroundColor: YELLOW, borderRadius: 4 },
  breakdownPts:    { fontSize: 12, fontWeight: '700', color: DARK, width: 46, textAlign: 'right' },

  goalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  editBtn:     { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
  deleteBtn:   { backgroundColor: '#FFF0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  deleteBtnText:{ fontSize: 13, fontWeight: '700', color: '#FF3B30' },

  pastHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  pastGoalCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, opacity: 0.8, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  pastGoalComplete:{ borderLeftWidth: 4, borderLeftColor: '#34C759' },
  pastGoalTop:     { flexDirection: 'row', gap: 8, marginBottom: 6 },
  pastGoalPts:     { fontSize: 12, color: '#8E8E93', marginTop: 4 },

  confirmOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  confirmBox:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '80%', alignItems: 'center' },
  confirmTitle:      { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 6 },
  confirmSub:        { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  confirmBtns:       { flexDirection: 'row', gap: 12 },
  confirmCancel:     { flex: 1, padding: 13, borderRadius: 14, backgroundColor: '#F2F2F7', alignItems: 'center' },
  confirmCancelText: { fontSize: 15, fontWeight: '700', color: DARK },
  confirmDelete:     { flex: 1, padding: 13, borderRadius: 14, backgroundColor: '#FF3B30', alignItems: 'center' },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  sheetTitle:  { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 20 },
  fieldLabel:  { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 6, marginTop: 4 },
  input:       { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 13, fontSize: 15, color: DARK, marginBottom: 10 },
  typeRow:     { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeChip:    { flex: 1, padding: 12, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center' },
  typeChipText:{ fontSize: 14, fontWeight: '700', color: DARK },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, padding: 15, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText:  { fontSize: 16, fontWeight: '700', color: DARK },
  saveBtn:     { flex: 1, padding: 15, borderRadius: 16, backgroundColor: YELLOW, alignItems: 'center' },
  saveText:    { fontSize: 16, fontWeight: '800', color: DARK },
});
