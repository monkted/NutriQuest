import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, TAB_BAR_HEIGHT } from './src/store';
import HomeScreen        from './src/FoodLog';
import FamilyScreen      from './src/FamilyScreen';
import LeaderboardScreen from './src/LeaderboardScreen';
import AccountScreen     from './src/AccountScreen';

type Tab = 'home' | 'family' | 'leaderboard' | 'account';

export default function App() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <AppShell />
    </AppProvider>
  );
}

function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>('home');

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'home'        && <HomeScreen />}
      {activeTab === 'family'      && <FamilyScreen />}
      {activeTab === 'leaderboard' && <LeaderboardScreen />}
      {activeTab === 'account'     && <AccountScreen />}

      <View style={tb.bar}>
        <TabButton icon="🏠" label="Home"        active={activeTab === 'home'}        onPress={() => setActiveTab('home')}        />
        <TabButton icon="👨‍👩" label="Family"      active={activeTab === 'family'}      onPress={() => setActiveTab('family')}      />
        <TabButton icon="🏆" label="Leaderboard"  active={activeTab === 'leaderboard'} onPress={() => setActiveTab('leaderboard')} />
        <TabButton icon="👤" label="Account"      active={activeTab === 'account'}     onPress={() => setActiveTab('account')}     />
      </View>
    </View>
  );
}

function TabButton({ icon, label, active, onPress }: {
  icon: string; label: string; active: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.26, duration: 70,  easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    tension: 420,  friction: 9, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity style={tb.btn} onPress={handlePress} activeOpacity={1}>
      <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
        <Text style={[tb.icon, active && tb.iconActive]}>{icon}</Text>
        <Text style={[tb.label, active && tb.labelActive]}>{label}</Text>
        {active && <View style={tb.dot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';

const tb = StyleSheet.create({
  bar:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: TAB_BAR_HEIGHT, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingBottom: 8 },
  btn:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  icon:        { fontSize: 20, opacity: 0.4 },
  iconActive:  { opacity: 1 },
  label:       { fontSize: 9, fontWeight: '600', color: '#AEAEB2', marginTop: 2 },
  labelActive: { color: DARK },
  dot:         { position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: YELLOW },
});
