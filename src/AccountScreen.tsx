import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useApp, TAB_BAR_HEIGHT } from './store';
import ParametersScreen from './ParametersScreen';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

export default function AccountScreen() {
  const { role, setRole, currentUserName, familyName, familyCode } = useApp();

  const [showParams, setShowParams] = useState(false);

  const avatar   = role === 'parent' ? '👩' : '🧒';
  const roleLabel = role === 'parent' ? 'Parent' : 'Kid';
  const roleColor = role === 'parent' ? '#5856D6' : '#34C759';

  return (
    <SafeAreaView style={ac.root}>
      <View style={ac.header}>
        <Text style={ac.headerTitle}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>

        {/* ── Profile Card ── */}
        <View style={ac.profileCard}>
          <View style={[ac.avatarCircle, { backgroundColor: roleColor + '22' }]}>
            <Text style={ac.avatarEmoji}>{avatar}</Text>
          </View>
          <View style={ac.profileInfo}>
            <Text style={ac.profileName}>{currentUserName}</Text>
            <View style={[ac.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={ac.roleBadgeText}>{roleLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Family Info ── */}
        <Text style={ac.sectionLabel}>Family</Text>
        <View style={ac.infoCard}>
          <View style={ac.infoRow}>
            <Text style={ac.infoIcon}>👨‍👩</Text>
            <View style={ac.infoTextGroup}>
              <Text style={ac.infoLabel}>Family Name</Text>
              <Text style={ac.infoValue}>{familyName}</Text>
            </View>
          </View>
          <View style={ac.divider} />
          <View style={ac.infoRow}>
            <Text style={ac.infoIcon}>🔑</Text>
            <View style={ac.infoTextGroup}>
              <Text style={ac.infoLabel}>Family Code</Text>
              <Text style={ac.infoValue}>{familyCode}</Text>
            </View>
            <View style={ac.demoTag}><Text style={ac.demoTagText}>DEMO</Text></View>
          </View>
        </View>

        {/* ── Settings ── */}
        <Text style={ac.sectionLabel}>Settings</Text>
        <View style={ac.infoCard}>
          <TouchableOpacity style={ac.settingRow} onPress={() => setShowParams(true)} activeOpacity={0.7}>
            <Text style={ac.settingIcon}>⚙️</Text>
            <View style={ac.settingText}>
              <Text style={ac.settingLabel}>Nutrient Targets</Text>
              <Text style={ac.settingSubLabel}>Set daily goals for points</Text>
            </View>
            <Text style={ac.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Demo Role Switcher ── */}
        <Text style={ac.sectionLabel}>Demo</Text>
        <View style={ac.infoCard}>
          <View style={ac.demoRow}>
            <Text style={ac.demoInfo}>Switch role to preview different views</Text>
          </View>
          <View style={ac.roleRow}>
            <TouchableOpacity
              style={[ac.roleBtn, role === 'kid' && ac.roleBtnActive]}
              onPress={() => setRole('kid')}
              activeOpacity={0.7}
            >
              <Text style={ac.roleBtnEmoji}>🧒</Text>
              <Text style={[ac.roleBtnText, role === 'kid' && ac.roleBtnTextActive]}>Kid</Text>
              {role === 'kid' && <Text style={ac.roleCheck}>✓</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[ac.roleBtn, role === 'parent' && ac.roleBtnActive]}
              onPress={() => setRole('parent')}
              activeOpacity={0.7}
            >
              <Text style={ac.roleBtnEmoji}>👩</Text>
              <Text style={[ac.roleBtnText, role === 'parent' && ac.roleBtnTextActive]}>Parent</Text>
              {role === 'parent' && <Text style={ac.roleCheck}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Actions ── */}
        <Text style={ac.sectionLabel}>Actions</Text>
        <View style={ac.infoCard}>
          <TouchableOpacity style={ac.actionRow} activeOpacity={0.7}>
            <Text style={ac.actionIcon}>🚪</Text>
            <Text style={[ac.actionLabel, { color: '#FF9500' }]}>Leave Family</Text>
            <View style={ac.demoTag}><Text style={ac.demoTagText}>DEMO</Text></View>
          </TouchableOpacity>
          <View style={ac.divider} />
          <TouchableOpacity style={ac.actionRow} activeOpacity={0.7}>
            <Text style={ac.actionIcon}>↩️</Text>
            <Text style={[ac.actionLabel, { color: '#FF3B30' }]}>Log Out</Text>
            <View style={ac.demoTag}><Text style={ac.demoTagText}>DEMO</Text></View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Nutrient Targets Modal */}
      <Modal visible={showParams} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View style={ac.modalNavBar}>
            <TouchableOpacity style={ac.modalBackBtn} onPress={() => setShowParams(false)}>
              <Text style={ac.modalBackText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={ac.modalNavTitle}>Nutrient Targets</Text>
            <View style={{ width: 60 }} />
          </View>
          <ParametersScreen />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const ac = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  header:      { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: DARK },

  profileCard:   { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  avatarCircle:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji:   { fontSize: 40 },
  profileInfo:   { flex: 1 },
  profileName:   { fontSize: 24, fontWeight: '800', color: DARK, marginBottom: 8 },
  roleBadge:     { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  roleBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },

  infoCard:    { backgroundColor: '#fff', borderRadius: 18, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2, overflow: 'hidden' },
  infoRow:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  infoIcon:    { fontSize: 22, width: 30, textAlign: 'center' },
  infoTextGroup:{ flex: 1 },
  infoLabel:   { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginBottom: 2 },
  infoValue:   { fontSize: 16, fontWeight: '700', color: DARK },
  divider:     { height: 1, backgroundColor: '#F2F2F7', marginHorizontal: 16 },
  demoTag:     { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  demoTagText: { fontSize: 10, fontWeight: '800', color: '#8E8E93', letterSpacing: 0.5 },

  settingRow:      { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  settingIcon:     { fontSize: 22, width: 30, textAlign: 'center' },
  settingText:     { flex: 1 },
  settingLabel:    { fontSize: 16, fontWeight: '600', color: DARK },
  settingSubLabel: { fontSize: 12, color: '#8E8E93', marginTop: 1 },
  settingArrow:    { fontSize: 22, color: '#AEAEB2', fontWeight: '300' },

  demoRow:      { padding: 14, paddingBottom: 8 },
  demoInfo:     { fontSize: 13, color: '#8E8E93' },
  roleRow:      { flexDirection: 'row', gap: 10, padding: 14, paddingTop: 0 },
  roleBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: '#F5F5F5' },
  roleBtnActive:{ backgroundColor: DARK },
  roleBtnEmoji: { fontSize: 18 },
  roleBtnText:  { fontSize: 14, fontWeight: '700', color: DARK },
  roleBtnTextActive:{ color: '#fff' },
  roleCheck:    { fontSize: 14, color: YELLOW, fontWeight: '800' },

  actionRow:   { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  actionIcon:  { fontSize: 20, width: 30, textAlign: 'center' },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },

  modalNavBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  modalBackBtn:   { width: 60 },
  modalBackText:  { fontSize: 17, color: '#007AFF', fontWeight: '600' },
  modalNavTitle:  { fontSize: 17, fontWeight: '700', color: DARK },
});
