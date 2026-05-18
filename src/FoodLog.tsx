import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Alert,
  TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Easing,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
  useApp, FoodEntry, Meal, Nutrient,
  calcTodayPoints, calcWeekPoints, todayString,
  NUTRIENTS, N_EMOJI, N_LABEL, N_UNIT, N_COLOR,
  TAB_BAR_HEIGHT,
} from './store';
import { searchFoods, FoodDBEntry } from './foodDatabase';
import { analyzeImageWithClaude, lookupBarcode, FoodAnalysis } from './claudeFood';

// ─── One-shot animation flag (persists across tab switches within same session) ─
let _homeAnimPlayed = false;

// ─── Design tokens ────────────────────────────────────────────────────────────

const YELLOW = '#FFD60A';
const BG     = '#F5F5F5';
const DARK   = '#1C1C1E';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEALS: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const MEAL_EMOJI:  Record<Meal, string> = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎' };
const MEAL_COLOR:  Record<Meal, string> = { Breakfast: '#FF9500', Lunch: '#34C759', Dinner: '#5856D6', Snacks: '#FF2D55' };
const DAY_LETTERS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
const LOG_BTN_H = 64;

// ─── Animated SVG circle ────────────────────────────────────────────────────

const AnimCircle = Animated.createAnimatedComponent(Circle);

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ size, progress, color, strokeWidth = 6, children }: {
  size: number; progress: number; color: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const r      = (size - strokeWidth) / 2;
  const cx     = size / 2;
  const circ   = 2 * Math.PI * r;
  const pct    = Math.min(Math.max(progress, 0), 1);
  const target = circ * (1 - pct);

  const offsetAnim  = useRef(new Animated.Value(_homeAnimPlayed ? target : circ)).current;
  const mountedRef  = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (!_homeAnimPlayed) {
        Animated.timing(offsetAnim, {
          toValue: target, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: false,
        }).start();
      } else {
        offsetAnim.setValue(target);
      }
    } else {
      offsetAnim.setValue(target);
    }
  }, [target]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={cx} cy={cx} r={r} stroke="#EFEFEF" strokeWidth={strokeWidth} fill="none" />
        <AnimCircle cx={cx} cy={cx} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ} strokeDashoffset={offsetAnim}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cx})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

// ─── Flame Streak ─────────────────────────────────────────────────────────────

function FlameStreak({ streak, best }: { streak: number; best: number }) {
  return (
    <View style={sf.card}>
      <View style={sf.topRow}>
        <Text style={sf.emoji}>🔥</Text>
        <Text style={sf.num}>{streak}</Text>
      </View>
      <Text style={sf.best}>Best: {best} days</Text>
    </View>
  );
}

const sf = StyleSheet.create({
  card:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 11, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2, borderWidth: 1.5, borderColor: YELLOW },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emoji:  { fontSize: 22 },
  num:    { fontSize: 24, fontWeight: '900', color: '#FF7A00' },
  best:   { fontSize: 10, fontWeight: '600', color: '#C9A600', marginTop: 3 },
});

// ─── Bounce-on-press wrapper ──────────────────────────────────────────────────

function BounceTouch({ onPress, style, children }: {
  onPress: () => void; style?: any; children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const fire  = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.87, useNativeDriver: true, speed: 80, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 4 }),
    ]).start();
    onPress();
  };
  return (
    <TouchableOpacity onPress={fire} activeOpacity={1} style={style}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { entries, goals, params, history, role, currentUserName, updateHistoryDay } = useApp();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Date
  const [selectedDate, setSelectedDate] = useState(todayString);
  const dateScrollRef = useRef<ScrollView>(null);

  // Manual modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal>('Breakfast');
  const [iName,     setIName]     = useState('');
  const [iCal,      setICal]      = useState('');
  const [iProtein,  setIProtein]  = useState('');
  const [iCarbs,    setICarbs]    = useState('');
  const [iFat,      setIFat]      = useState('');
  const [iFiber,    setIFiber]    = useState('');
  const [iVitamins, setIVitamins] = useState('');
  const [iMinerals, setIMinerals] = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [selectedDBFood, setSelectedDBFood] = useState<FoodDBEntry | null>(null);

  // New log flows
  const [logOptionsVisible, setLogOptionsVisible] = useState(false);
  const [scannerVisible,    setScannerVisible]    = useState(false);
  const [scanned,           setScanned]           = useState(false);
  const [scanLoading,       setScanLoading]       = useState(false);
  const [analyzing,         setAnalyzing]         = useState(false);
  const [aiError,           setAiError]           = useState<string | null>(null);

  const searchResults = useMemo(() => searchFoods(searchQuery), [searchQuery]);

  const dates = useMemo<string[]>(() => {
    const arr: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split('T')[0]);
    }
    return arr;
  }, []);

  const today = todayString();
  const isToday = selectedDate === today;

  const selectedEntries = useMemo(() => {
    if (isToday) return entries;
    return history.find(d => d.date === selectedDate)?.entries ?? [];
  }, [selectedDate, isToday, entries, history]);

  const totals = selectedEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories, protein:  acc.protein  + e.protein,
      carbs:    acc.carbs    + e.carbs,    fat:      acc.fat      + e.fat,
      fiber:    acc.fiber    + e.fiber,    vitamins: acc.vitamins + e.vitamins,
      minerals: acc.minerals + e.minerals,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, vitamins: 0, minerals: 0 },
  );

  const weekPts  = calcWeekPoints(history, entries, params);
  const todayPts = calcTodayPoints(entries, params);

  // ── Points count-up on first load only ──────────────────────────────────────
  const [dispWeek,  setDispWeek]  = useState(_homeAnimPlayed ? weekPts  : 0);
  const [dispToday, setDispToday] = useState(_homeAnimPlayed ? todayPts : 0);
  // Single Animated.Value shared by both pts numbers — guarantees pixel-perfect sync
  const heroScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (_homeAnimPlayed) return;
    _homeAnimPlayed = true;

    const DURATION   = 1600;
    const startMs    = Date.now();
    const finalWeek  = weekPts;
    const finalToday = todayPts;

    // One interval drives both counts simultaneously — same cubic ease-out as the rings
    const interval = setInterval(() => {
      const t     = Math.min((Date.now() - startMs) / DURATION, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDispWeek(Math.round(eased * finalWeek));
      setDispToday(Math.round(eased * finalToday));
      if (t >= 1) clearInterval(interval);
    }, 33);

    // Shared scale grows alongside the count, then springs back
    Animated.timing(heroScale, {
      toValue: 1.18, duration: DURATION, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      Animated.spring(heroScale, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }).start();
    });

    return () => clearInterval(interval);
  }, []);

  // ── Log Food button scale ────────────────────────────────────────────────────
  const logBtnScale = useRef(new Animated.Value(1)).current;
  const bounceLogBtn = (cb: () => void) => {
    Animated.sequence([
      Animated.spring(logBtnScale, { toValue: 0.93, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(logBtnScale, { toValue: 1,    useNativeDriver: true, tension: 180, friction: 5 }),
    ]).start();
    cb();
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const prefillFromAnalysis = (food: FoodAnalysis) => {
    setIName(food.name);
    setICal(String(food.calories));
    setIProtein(String(food.protein));
    setICarbs(String(food.carbs));
    setIFat(String(food.fat));
    setIFiber(String(food.fiber));
    setIVitamins(String(food.vitamins));
    setIMinerals(String(food.minerals));
    setSearchQuery('');
    setSelectedDBFood(null);
  };

  const handleScan = async () => {
    setLogOptionsVisible(false);
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) { Alert.alert('Camera permission is needed to scan barcodes.'); return; }
    }
    setScanned(false);
    setScanLoading(false);
    setScannerVisible(true);
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || scanLoading) return;
    setScanned(true);
    setScanLoading(true);
    try {
      const food = await lookupBarcode(data);
      setScannerVisible(false);
      setScanLoading(false);
      if (food) {
        prefillFromAnalysis(food);
        setModalVisible(true);
      } else {
        Alert.alert('Product Not Found', 'This barcode wasn\'t recognised. Try manual entry.', [
          { text: 'Manual Entry', onPress: () => setModalVisible(true) },
          { text: 'Scan Again',   onPress: () => { setScanned(false); setScannerVisible(true); } },
          { text: 'Cancel' },
        ]);
      }
    } catch {
      setScannerVisible(false);
      setScanLoading(false);
      Alert.alert('Network Error', 'Could not look up the barcode. Please try manual entry.');
    }
  };

  const handleAIPhoto = async () => {
    setLogOptionsVisible(false);
    setAiError(null);
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: 'images' });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    setAnalyzing(true);
    try {
      const food = await analyzeImageWithClaude(result.assets[0].base64);
      prefillFromAnalysis(food);
      setModalVisible(true);
    } catch (e: any) {
      if (e.message === 'API_KEY_NOT_SET') {
        setAiError('API key not set. Add your Anthropic API key to src/config.ts.');
      } else {
        setAiError(`AI scan failed: ${e.message}`);
        setModalVisible(true);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManual = () => {
    setLogOptionsVisible(false);
    setModalVisible(true);
  };

  const openLogOptions = (meal: Meal) => {
    setSelectedMeal(meal);
    setLogOptionsVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setIName(''); setICal(''); setIProtein(''); setICarbs('');
    setIFat(''); setIFiber(''); setIVitamins(''); setIMinerals('');
    setSearchQuery(''); setSelectedDBFood(null);
  };

  const pickDBFood = (food: FoodDBEntry) => {
    setSelectedDBFood(food); setSearchQuery('');
    setIName(food.name);       setICal(String(food.calories));
    setIProtein(String(food.protein)); setICarbs(String(food.carbs));
    setIFat(String(food.fat));         setIFiber(String(food.fiber));
    setIVitamins(String(food.vitamins)); setIMinerals(String(food.minerals));
  };

  const addFood = () => {
    const c = parseInt(iCal, 10);
    if (!iName.trim() || isNaN(c) || c < 0) return;
    const entry: FoodEntry = {
      id: Date.now().toString(), name: iName.trim(), meal: selectedMeal,
      calories: c,
      protein:  parseInt(iProtein,  10) || 0, carbs:    parseInt(iCarbs,    10) || 0,
      fat:      parseInt(iFat,      10) || 0, fiber:    parseInt(iFiber,    10) || 0,
      vitamins: parseInt(iVitamins, 10) || 0, minerals: parseInt(iMinerals, 10) || 0,
    };
    updateHistoryDay(selectedDate, prev => [...prev, entry]);
    closeModal();
  };

  const removeEntry = (id: string) =>
    updateHistoryDay(selectedDate, prev => prev.filter(e => e.id !== id));

  // ── Nutrient field config (used in modal grid) ──────────────────────────────
  const nutrientFields: Array<{ key: Nutrient; value: string; setter: (v: string) => void }> = [
    { key: 'protein',  value: iProtein,  setter: setIProtein  },
    { key: 'carbs',    value: iCarbs,    setter: setICarbs    },
    { key: 'fat',      value: iFat,      setter: setIFat      },
    { key: 'fiber',    value: iFiber,    setter: setIFiber    },
    { key: 'vitamins', value: iVitamins, setter: setIVitamins },
    { key: 'minerals', value: iMinerals, setter: setIMinerals },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{role === 'parent' ? `Hi, ${currentUserName} 👋` : `Hey ${currentUserName}! 👋`}</Text>
          <Text style={s.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={[s.rolePill, { backgroundColor: role === 'parent' ? '#5856D6' : '#34C759' }]}>
          <Text style={s.rolePillText}>{role === 'parent' ? '👩 Parent' : '🧒 Kid'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: LOG_BTN_H + TAB_BAR_HEIGHT + 24 }}>

        {/* ── Date Selector ── */}
        <View style={s.dateSection}>
          <ScrollView
            ref={dateScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dateRow}
            onLayout={() => dateScrollRef.current?.scrollToEnd({ animated: false })}
          >
            {dates.map(date => {
              const isSelected = date === selectedDate;
              const isTd = date === today;
              const d = new Date(date + 'T12:00:00');
              const dayEnt = isTd ? entries : history.find(r => r.date === date)?.entries ?? [];
              const hasPts = calcTodayPoints(dayEnt, params) > 0;
              return (
                <TouchableOpacity
                  key={date}
                  style={[ds.square, isSelected && ds.squareSelected]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[ds.letter, isSelected && ds.letterSelected]}>{isTd ? 'Today' : DAY_LETTERS[d.getDay()]}</Text>
                  <Text style={[ds.num, isSelected && ds.numSelected]}>{d.getDate()}</Text>
                  <View style={[ds.dot, hasPts && ds.dotActive, isSelected && hasPts && ds.dotSelectedActive]} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Points ── */}
        <View style={s.pointsRow}>
          <View style={s.pointsCard}>
            <Text style={s.pointsLabel}>This Week</Text>
            <Animated.View style={{ transform: [{ scale: heroScale }], alignSelf: 'flex-start' }}>
              <Text style={s.pointsVal}>{dispWeek}<Text style={s.pointsPts}> pts</Text></Text>
            </Animated.View>
          </View>

          <FlameStreak streak={7} best={12} />

          <View style={[s.pointsCard, s.pointsCardAccent]}>
            <Text style={s.pointsLabel}>Today</Text>
            <Animated.View style={{ transform: [{ scale: heroScale }], alignSelf: 'flex-start' }}>
              <Text style={[s.pointsVal, { color: '#007AFF' }]}>{dispToday}<Text style={s.pointsPts}> pts</Text></Text>
            </Animated.View>
          </View>
        </View>

        {/* ── Nutrients ── */}
        <Text style={s.sectionLabel}>Nutrients{!isToday ? ` · ${formatDateShort(selectedDate)}` : ''}</Text>
        {NUTRIENTS.some(n => params[n] > 0) ? (
          <View style={s.nutrientGrid}>
            {NUTRIENTS.filter(n => params[n] > 0).map(n => {
              const val      = (totals as any)[n] as number;
              const pct      = Math.min(val / params[n], 1);
              const met      = pct >= 1;
              const partial  = pct >= 0.7;
              const pctNum   = Math.round(pct * 100);
              const isPerct  = N_UNIT[n] === '%';
              const tierColor = met ? '#34C759' : partial ? '#C9A600' : DARK;
              const subtitle  = met ? '✓ Done' : partial ? 'Partially done' : 'No credit';
              const subColor  = met ? '#34C759' : partial ? '#C9A600' : '#AEAEB2';
              const valLine   = isPerct ? `${val} / 100%` : `${val} / ${params[n]}g`;
              return (
                <View key={n} style={nc.wrapper}>
                  <CircularProgress size={88} progress={pct} color={N_COLOR[n]} strokeWidth={7}>
                    <Text style={nc.emoji}>{N_EMOJI[n]}</Text>
                    {met ? (
                      <Text style={nc.bigCheck}>✓</Text>
                    ) : (
                      <Text style={[nc.val, { color: tierColor }]}>
                        {pctNum}<Text style={[nc.unit, { color: tierColor }]}>%</Text>
                      </Text>
                    )}
                  </CircularProgress>
                  <Text style={nc.label}>{N_LABEL[n]}</Text>
                  <Text style={[nc.sub, { color: subColor }]}>{subtitle}</Text>
                  <Text style={nc.valLine}>{valLine}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={s.noTargetsWrap}>
            <Text style={s.noTargetsText}>No nutrient targets set yet</Text>
            <Text style={s.noTargetsSub}>Ask a parent to configure targets in Account settings</Text>
          </View>
        )}

        {/* ── Goals ── */}
        {goals.length > 0 && (
          <>
            <Text style={s.sectionLabel}>Goals Progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.goalRow}>
              {goals.map(goal => {
                const progress = Math.min(weekPts / goal.weeklyPointsTarget, 1);
                const complete = weekPts >= goal.weeklyPointsTarget;
                const ringColor = complete ? '#34C759' : goal.type === 'group' ? '#5856D6' : '#007AFF';
                return (
                  <View key={goal.id} style={[gm.card, complete && gm.cardComplete]}>
                    <View style={gm.topRow}>
                      <View style={[gm.typeBadge, { backgroundColor: goal.type === 'group' ? '#5856D622' : '#007AFF22' }]}>
                        <Text style={[gm.typeBadgeText, { color: goal.type === 'group' ? '#5856D6' : '#007AFF' }]}>
                          {goal.type === 'group' ? '👨‍👩 Group' : '⭐ Individual'}
                        </Text>
                      </View>
                      {complete && <Text style={gm.completeTick}>✓</Text>}
                    </View>
                    <CircularProgress size={112} progress={progress} color={ringColor} strokeWidth={9}>
                      <Text style={gm.pct}>{Math.round(progress * 100)}<Text style={gm.pctSym}>%</Text></Text>
                      <Text style={gm.pts}>{weekPts}<Text style={gm.ptsSub}>/{goal.weeklyPointsTarget}</Text></Text>
                    </CircularProgress>
                    <Text style={gm.title} numberOfLines={2}>{goal.title}</Text>
                    <Text style={gm.reward} numberOfLines={1}>🏆 {goal.reward}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Meal Sections ── */}
        <Text style={s.sectionLabel}>Food Log{!isToday ? ` · ${formatDateShort(selectedDate)}` : ''}</Text>
        {MEALS.map(meal => {
          const items   = selectedEntries.filter(e => e.meal === meal);
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
                <BounceTouch onPress={() => openLogOptions(meal)}>
                  <View style={s.addChip}>
                    <Text style={s.addChipText}>+ Add</Text>
                  </View>
                </BounceTouch>
              </View>
              {items.length === 0 ? (
                <Text style={s.emptyText}>Nothing logged 🍽️</Text>
              ) : items.map(entry => (
                <View key={entry.id} style={s.foodRow}>
                  <View style={s.foodLeft}>
                    <Text style={s.foodName}>{entry.name}</Text>
                    <View style={s.chips}>
                      {entry.protein > 0  && <Chip label={`💪 ${entry.protein}g`}  bg="#FFF0EB" />}
                      {entry.fiber > 0    && <Chip label={`🥦 ${entry.fiber}g`}    bg="#EAF7EA" />}
                      {entry.vitamins > 0 && <Chip label={`🍊 ${entry.vitamins}%`} bg="#FFF6E8" />}
                      <Chip label={`🔥 ${entry.calories}`} bg="#F5F5F5" />
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeEntry(entry.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={s.deleteX}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Log Food Button ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity onPress={() => bounceLogBtn(() => openLogOptions('Breakfast'))} activeOpacity={1}>
          <Animated.View style={[s.logBtn, { transform: [{ scale: logBtnScale }] }]}>
            <Text style={s.logBtnIcon}>🍽️</Text>
            <Text style={s.logBtnText}>{isToday ? 'Log Food' : `Log for ${formatDateShort(selectedDate)}`}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── AI Error Banner ── */}
      {aiError && (
        <TouchableOpacity style={lo.errorBanner} onPress={() => setAiError(null)} activeOpacity={0.8}>
          <Text style={lo.errorBannerText}>⚠️ {aiError}  ✕</Text>
        </TouchableOpacity>
      )}

      {/* ── Log Options Sheet ── */}
      <Modal visible={logOptionsVisible} transparent animationType="slide">
        <TouchableOpacity style={lo.backdrop} onPress={() => setLogOptionsVisible(false)} activeOpacity={1}>
          <View style={lo.sheet}>
            <View style={lo.handle} />
            <Text style={lo.title}>How do you want to log food?</Text>
            <Text style={lo.mealLabel}>Adding to: {selectedMeal} {MEAL_EMOJI[selectedMeal]}</Text>

            <TouchableOpacity style={lo.option} onPress={handleScan} activeOpacity={0.7}>
              <View style={[lo.optionIcon, { backgroundColor: '#5856D622' }]}>
                <Text style={lo.optionEmoji}>📷</Text>
              </View>
              <View style={lo.optionText}>
                <Text style={lo.optionLabel}>Scan Barcode</Text>
                <Text style={lo.optionSub}>Point camera at any product barcode</Text>
              </View>
              <Text style={lo.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={lo.option} onPress={handleAIPhoto} activeOpacity={0.7}>
              <View style={[lo.optionIcon, { backgroundColor: '#34C75922' }]}>
                <Text style={lo.optionEmoji}>🤖</Text>
              </View>
              <View style={lo.optionText}>
                <Text style={lo.optionLabel}>AI Photo Scan</Text>
                <Text style={lo.optionSub}>Take a photo — AI identifies nutrients</Text>
              </View>
              <Text style={lo.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={lo.option} onPress={handleManual} activeOpacity={0.7}>
              <View style={[lo.optionIcon, { backgroundColor: '#FF950022' }]}>
                <Text style={lo.optionEmoji}>✏️</Text>
              </View>
              <View style={lo.optionText}>
                <Text style={lo.optionLabel}>Manual Entry</Text>
                <Text style={lo.optionSub}>Search database or enter details yourself</Text>
              </View>
              <Text style={lo.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity style={lo.cancelBtn} onPress={() => setLogOptionsVisible(false)}>
              <Text style={lo.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Barcode Scanner ── */}
      <Modal visible={scannerVisible} animationType="slide">
        <View style={bs.container}>
          {Platform.OS !== 'web' ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'] }}
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#fff', fontSize: 16 }}>Barcode scanning is not available on web.</Text>
            </View>
          )}

          {/* Dim overlay */}
          <View style={bs.dimTop} />
          <View style={bs.midRow}>
            <View style={bs.dimSide} />
            <View style={bs.frame}>
              <View style={[bs.corner, bs.cornerTL]} />
              <View style={[bs.corner, bs.cornerTR]} />
              <View style={[bs.corner, bs.cornerBL]} />
              <View style={[bs.corner, bs.cornerBR]} />
            </View>
            <View style={bs.dimSide} />
          </View>
          <View style={bs.dimBottom}>
            {scanLoading ? (
              <View style={bs.statusRow}>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={bs.hint}>Looking up product...</Text>
              </View>
            ) : (
              <Text style={bs.hint}>Point camera at barcode</Text>
            )}
            <TouchableOpacity style={bs.cancelBtn} onPress={() => setScannerVisible(false)}>
              <Text style={bs.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── AI Analyzing Overlay ── */}
      <Modal visible={analyzing} transparent animationType="fade">
        <View style={an.overlay}>
          <View style={an.card}>
            <Text style={an.emoji}>🤖</Text>
            <ActivityIndicator color="#FF9500" size="large" style={{ marginBottom: 12 }} />
            <Text style={an.title}>Analysing Food...</Text>
            <Text style={an.sub}>AI is identifying nutrients</Text>
          </View>
        </View>
      </Modal>

      {/* ── Manual Entry Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <ScrollView style={s.sheet} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={s.sheetTitle}>Log Food 🍽️{!isToday ? ` · ${formatDateShort(selectedDate)}` : ''}</Text>

            <View style={s.chipRow}>
              {MEALS.map(m => (
                <TouchableOpacity key={m} style={[s.mealChip, selectedMeal === m && { backgroundColor: MEAL_COLOR[m] }]} onPress={() => setSelectedMeal(m)}>
                  <Text style={[s.mealChipText, selectedMeal === m && { color: '#fff' }]}>{MEAL_EMOJI[m]} {m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.searchWrap}>
              <Text style={s.searchIcon}>🔍</Text>
              <TextInput style={s.searchInput} placeholder="Search foods or restaurants…" placeholderTextColor="#aaa" value={searchQuery}
                onChangeText={t => { setSearchQuery(t); setSelectedDBFood(null); }} autoCorrect={false} />
              {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Text style={s.searchClear}>✕</Text></TouchableOpacity>}
            </View>

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

            {selectedDBFood && (
              <View style={s.selectedBadge}>
                <Text style={s.selectedCheck}>✓</Text>
                <Text style={s.selectedText}>{selectedDBFood.name} — {selectedDBFood.brand}</Text>
                <TouchableOpacity onPress={() => { setSelectedDBFood(null); setIName(''); }}><Text style={s.selectedClear}>✕</Text></TouchableOpacity>
              </View>
            )}

            {searchResults.length === 0 && (
              <>
                {/* Food name */}
                <Text style={ni.fieldLabel}>Food Name</Text>
                <TextInput style={[s.input, { marginBottom: 10 }]} placeholder="e.g. Grilled Chicken" placeholderTextColor="#aaa" value={iName} onChangeText={setIName} />

                {/* Calories — no nutrient goal, shown as simple card */}
                <View style={ni.calCard}>
                  <Text style={ni.calLabel}>🔥 Calories</Text>
                  <View style={ni.calRight}>
                    <TextInput style={ni.calInput} placeholder="0" placeholderTextColor="#AEAEB2" keyboardType="numeric" value={iCal} onChangeText={setICal} />
                    <Text style={ni.unit}>kcal</Text>
                  </View>
                </View>

                {/* Nutrient grid — persistent labels + contribution badges */}
                <View style={ni.grid}>
                  {nutrientFields.map(({ key, value, setter }) => {
                    const goalVal  = params[key] ?? 0;
                    const alreadyMet = goalVal > 0 && (totals as Record<Nutrient, number>)[key] >= goalVal;
                    const inputNum = parseFloat(value);
                    const contrib  = goalVal > 0 && !isNaN(inputNum) && inputNum > 0
                      ? Math.round((inputNum / goalVal) * 100) : 0;
                    return (
                      <View key={key} style={ni.cell}>
                        <View style={ni.cellTop}>
                          <Text style={ni.cellLabel}>{N_EMOJI[key]} {N_LABEL[key]}</Text>
                          {goalVal > 0 && (
                            alreadyMet
                              ? <Text style={ni.badgeDone}>✓</Text>
                              : contrib > 0
                                ? <Text style={[ni.badgePct, { color: N_COLOR[key] }]}>+{contrib}%</Text>
                                : null
                          )}
                        </View>
                        <View style={ni.cellInputRow}>
                          <TextInput
                            style={ni.cellInput}
                            value={value}
                            onChangeText={setter}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="#AEAEB2"
                          />
                          <Text style={ni.unit}>{N_UNIT[key]}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={addFood}><Text style={s.saveText}>Add Food ✓</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function Chip({ label, bg }: { label: string; bg: string }) {
  return <View style={[chip.pill, { backgroundColor: bg }]}><Text style={chip.text}>{label}</Text></View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  greeting:     { fontSize: 22, fontWeight: '800', color: DARK },
  date:         { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  rolePill:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rolePillText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  dateSection:  { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dateRow:      { paddingHorizontal: 14, gap: 8 },

  pointsRow:        { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  pointsCard:       { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 11, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  pointsCardAccent: { borderWidth: 1.5, borderColor: '#007AFF' },
  pointsLabel:      { fontSize: 11, fontWeight: '600', color: '#8E8E93', marginBottom: 3 },
  pointsVal:        { fontSize: 20, fontWeight: '800', color: DARK },
  pointsPts:        { fontSize: 11, fontWeight: '500', color: '#8E8E93' },

  sectionLabel:   { fontSize: 17, fontWeight: '700', color: DARK, marginHorizontal: 16, marginTop: 18, marginBottom: 12 },
  noTargetsWrap:  { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  noTargetsText:  { fontSize: 15, fontWeight: '700', color: '#AEAEB2', marginBottom: 4 },
  noTargetsSub:   { fontSize: 13, color: '#C7C7CC', textAlign: 'center' },

  nutrientGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, justifyContent: 'space-between' },
  goalRow:      { paddingHorizontal: 16, gap: 12 },

  mealCard:    { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  mealHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mealBadge:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  mealEmoji:   { fontSize: 24 },
  mealMeta:    { flex: 1 },
  mealName:    { fontSize: 15, fontWeight: '700', color: DARK },
  mealCal:     { fontSize: 12, color: '#8E8E93' },
  addChip:     { backgroundColor: YELLOW, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addChipText: { fontSize: 13, fontWeight: '700', color: DARK },
  emptyText:   { fontSize: 13, color: '#C7C7CC', textAlign: 'center', paddingVertical: 8 },

  foodRow:  { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  foodLeft: { flex: 1 },
  foodName: { fontSize: 14, fontWeight: '600', color: DARK, marginBottom: 5 },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  deleteX:  { fontSize: 14, color: '#C7C7CC', paddingLeft: 10, paddingTop: 2 },

  bottomBar:    { position: 'absolute', bottom: TAB_BAR_HEIGHT, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#F2F2F7' },
  logBtn:       { backgroundColor: YELLOW, borderRadius: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: YELLOW, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  logBtnIcon:   { fontSize: 20 },
  logBtnText:   { fontSize: 17, fontWeight: '800', color: DARK },

  overlay:       { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
  sheetTitle:    { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 16 },
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
  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  mealChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F2F2F7' },
  mealChipText:  { fontSize: 13, fontWeight: '700', color: DARK },
  input:         { backgroundColor: '#F5F5F5', borderRadius: 14, padding: 14, fontSize: 15, color: DARK, marginBottom: 10 },
  inputRow:      { flexDirection: 'row', gap: 10 },
  inputHalf:     { flex: 1 },
  modalActions:  { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:     { flex: 1, padding: 15, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText:    { fontSize: 16, fontWeight: '700', color: DARK },
  saveBtn:       { flex: 1, padding: 15, borderRadius: 16, backgroundColor: YELLOW, alignItems: 'center' },
  saveText:      { fontSize: 16, fontWeight: '800', color: DARK },
});

// Date squares
const ds = StyleSheet.create({
  square:            { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1, gap: 2 },
  squareSelected:    { borderWidth: 2, borderColor: YELLOW },
  letter:            { fontSize: 9, fontWeight: '600', color: '#8E8E93' },
  letterSelected:    { color: '#8E8E93' },
  num:               { fontSize: 17, fontWeight: '800', color: DARK },
  numSelected:       { color: DARK },
  dot:               { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'transparent' },
  dotActive:         { backgroundColor: YELLOW },
  dotSelectedActive: { backgroundColor: DARK },
});

// Nutrient circles
const nc = StyleSheet.create({
  wrapper:     { width: '30%', alignItems: 'center', marginBottom: 8 },
  emoji:       { fontSize: 17, marginBottom: 1 },
  val:         { fontSize: 17, fontWeight: '800', color: '#1C1C1E' },
  unit:        { fontSize: 10, fontWeight: '600', color: '#8E8E93' },
  bigCheck:    { fontSize: 18, fontWeight: '800', color: '#34C759' },
  label:       { fontSize: 11, fontWeight: '700', color: '#8E8E93', marginTop: 7 },
  sub:         { fontSize: 10, fontWeight: '700', marginTop: 2 },
  valLine:     { fontSize: 9,  fontWeight: '500', color: '#AEAEB2', marginTop: 1 },
});

// Goal circles
const gm = StyleSheet.create({
  card:         { width: 168, backgroundColor: '#fff', borderRadius: 20, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardComplete: { borderWidth: 2, borderColor: '#34C759' },
  topRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  typeBadge:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  typeBadgeText:{ fontSize: 11, fontWeight: '700' },
  completeTick: { fontSize: 14, color: '#34C759', fontWeight: '800' },
  pct:          { fontSize: 24, fontWeight: '900', color: '#1C1C1E' },
  pctSym:       { fontSize: 14, fontWeight: '600' },
  pts:          { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  ptsSub:       { fontSize: 10 },
  title:        { fontSize: 12, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', marginTop: 10, lineHeight: 17 },
  reward:       { fontSize: 11, color: '#8E8E93', textAlign: 'center', marginTop: 4 },
});

// Log Options sheet
const lo = StyleSheet.create({
  backdrop:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E5EA', alignSelf: 'center', marginBottom: 16 },
  title:       { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 4 },
  mealLabel:   { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  option:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', gap: 14 },
  optionIcon:  { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionEmoji: { fontSize: 24 },
  optionText:  { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '700', color: DARK },
  optionSub:   { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  arrow:       { fontSize: 22, color: '#AEAEB2', fontWeight: '300' },
  cancelBtn:    { marginTop: 16, backgroundColor: '#F5F5F5', borderRadius: 16, padding: 16, alignItems: 'center' },
  cancelText:   { fontSize: 16, fontWeight: '700', color: DARK },
  errorBanner:  { position: 'absolute', bottom: TAB_BAR_HEIGHT + LOG_BTN_H + 8, left: 16, right: 16, backgroundColor: '#FF3B30', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, zIndex: 99 },
  errorBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});

// Barcode scanner
const FRAME = 240;
const bs = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  dimTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  midRow:    { flexDirection: 'row', height: FRAME },
  dimSide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  frame:     { width: FRAME, height: FRAME },
  corner:    { position: 'absolute', width: 24, height: 24, borderColor: '#fff' },
  cornerTL:  { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR:  { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL:  { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR:  { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  dimBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', gap: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  hint:      { fontSize: 15, fontWeight: '600', color: '#fff' },
  cancelBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  cancelText:{ fontSize: 15, fontWeight: '700', color: '#fff' },
});

// AI analyzing overlay
const an = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  card:    { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: 220 },
  emoji:   { fontSize: 40, marginBottom: 12 },
  title:   { fontSize: 17, fontWeight: '800', color: DARK, marginBottom: 6 },
  sub:     { fontSize: 13, color: '#8E8E93', textAlign: 'center' },
});

const chip = StyleSheet.create({
  pill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: '600', color: '#3C3C43' },
});

// Nutrient input grid (manual entry modal)
const ni = StyleSheet.create({
  fieldLabel:   { fontSize: 13, fontWeight: '700', color: '#8E8E93', marginBottom: 6 },

  calCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F5F5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  calLabel:     { fontSize: 14, fontWeight: '700', color: DARK },
  calRight:     { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  calInput:     { fontSize: 22, fontWeight: '800', color: DARK, minWidth: 64, textAlign: 'right' },

  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  cell:         { width: '47%', backgroundColor: '#F5F5F5', borderRadius: 14, padding: 12 },
  cellTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cellLabel:    { fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  badgeDone:    { fontSize: 14, fontWeight: '800', color: '#34C759' },
  badgePct:     { fontSize: 11, fontWeight: '800' },
  cellInputRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  cellInput:    { flex: 1, fontSize: 22, fontWeight: '800', color: DARK, padding: 0 },
  unit:         { fontSize: 12, fontWeight: '600', color: '#AEAEB2' },
});
