import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  StyleSheet, SafeAreaView, Switch,
} from 'react-native';
import {
  useApp, TAB_BAR_HEIGHT, FamilyMember, Nutrient, NUTRIENTS,
  AGE_GROUPS, AGE_GROUP_LABEL, NUTRIENT_DRI,
  N_EMOJI, N_LABEL, N_UNIT, N_COLOR,
} from './store';
import ParametersScreen from './ParametersScreen';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

export default function AccountScreen() {
  const {
    role, setRole, currentUserName, currentUserId,
    familyName, familyCode, familyMembers, updateMember,
    ageGroup, setAgeGroup, setMemberAgeGroup,
    familyNutrients, setFamilyNutrients,
  } = useApp();

  const [showParams,       setShowParams]       = useState(false);
  const [memberParamsId,   setMemberParamsId]   = useState<string | null>(null);
  const [pickerMemberId,   setPickerMemberId]   = useState<string | null>(null);
  const [showAgePicker,    setShowAgePicker]    = useState(false);
  const [showFamilyNutr,   setShowFamilyNutr]   = useState(false);

  const avatar    = role === 'parent' ? '👩' : '🧒';
  const roleLabel = role === 'parent' ? 'Parent' : 'Kid';
  const roleColor = role === 'parent' ? '#5856D6' : '#34C759';

  const pickerMember = pickerMemberId ? familyMembers.find(m => m.id === pickerMemberId) : null;
  const kidMembers   = familyMembers.filter(m => m.role === 'kid');
  const otherMembers = familyMembers.filter(m => m.id !== currentUserId);

  const openMemberPicker = (m: FamilyMember) => setPickerMemberId(m.id);

  const selectAgeForMember = (g: Parameters<typeof setAgeGroup>[0]) => {
    if (pickerMemberId) setMemberAgeGroup(pickerMemberId, g);
    setPickerMemberId(null);
  };

  const toggleMemberAuto = (m: FamilyMember, val: boolean) => {
    if (val) {
      // Switching to auto: reset to DRI values for enabled family nutrients only
      const newParams = Object.fromEntries(
        NUTRIENTS.map(n => [n, familyNutrients.includes(n) ? NUTRIENT_DRI[m.ageGroup][n] : 0])
      ) as Record<string, number>;
      updateMember(m.id, { autoPreset: true, params: newParams as any });
    } else {
      updateMember(m.id, { autoPreset: false });
    }
  };

  const toggleFamilyNutrient = (n: Nutrient, val: boolean) => {
    const next = val
      ? [...familyNutrients, n]
      : familyNutrients.filter(x => x !== n);
    setFamilyNutrients(next);
  };

  // DRI summary for a nutrient across all kids
  const nutrientMemberSummary = (n: Nutrient): string => {
    return kidMembers
      .map(m => `${m.name}: ${NUTRIENT_DRI[m.ageGroup][n]}${N_UNIT[n]}`)
      .join('  ·  ');
  };

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

        {/* ── Family Members (parent only) ── */}
        {role === 'parent' && (
          <>
            <Text style={ac.sectionLabel}>Family Members</Text>
            <View style={ac.infoCard}>
              {otherMembers.map((m, idx) => (
                <React.Fragment key={m.id}>
                  {idx > 0 && <View style={ac.divider} />}
                  <View style={ac.memberRow}>
                    <View style={[ac.memberAvatar, { backgroundColor: m.role === 'kid' ? '#34C75922' : '#5856D622' }]}>
                      <Text style={ac.memberAvatarEmoji}>{m.avatar}</Text>
                    </View>
                    <View style={ac.memberInfo}>
                      <Text style={ac.memberName}>{m.name}</Text>
                      {m.role === 'kid' ? (
                        <TouchableOpacity onPress={() => openMemberPicker(m)} activeOpacity={0.7}>
                          <View style={ac.ageChip}>
                            <Text style={ac.ageChipText}>{AGE_GROUP_LABEL[m.ageGroup]} ›</Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <Text style={ac.memberRoleText}>Parent</Text>
                      )}
                    </View>

                    {m.role === 'kid' && (
                      <View style={ac.memberControls}>
                        <View style={ac.memberAutoRow}>
                          <Text style={ac.memberAutoLabel}>{m.autoPreset ? 'Auto-set' : 'Custom'}</Text>
                          <Switch
                            value={m.autoPreset}
                            onValueChange={val => toggleMemberAuto(m, val)}
                            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                            thumbColor="#fff"
                            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                          />
                        </View>
                        <TouchableOpacity
                          style={ac.memberSettingsBtn}
                          onPress={() => setMemberParamsId(m.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={ac.memberSettingsBtnText}>Details ›</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
        )}

        {/* ── Settings ── */}
        <Text style={ac.sectionLabel}>Settings</Text>
        <View style={ac.infoCard}>
          <TouchableOpacity style={ac.settingRow} onPress={() => setShowParams(true)} activeOpacity={0.7}>
            <Text style={ac.settingIcon}>⚙️</Text>
            <View style={ac.settingText}>
              <Text style={ac.settingLabel}>My Nutrient Targets</Text>
              <Text style={ac.settingSubLabel}>Set daily goals for points</Text>
            </View>
            <Text style={ac.settingArrow}>›</Text>
          </TouchableOpacity>
          <View style={ac.divider} />
          <TouchableOpacity style={ac.settingRow} onPress={() => setShowAgePicker(true)} activeOpacity={0.7}>
            <Text style={ac.settingIcon}>🎂</Text>
            <View style={ac.settingText}>
              <Text style={ac.settingLabel}>My Age Group</Text>
              <Text style={ac.settingSubLabel}>{AGE_GROUP_LABEL[ageGroup]} · DRI preset</Text>
            </View>
            <Text style={ac.settingArrow}>›</Text>
          </TouchableOpacity>
          {role === 'parent' && <>
            <View style={ac.divider} />
            <TouchableOpacity style={ac.settingRow} onPress={() => setShowFamilyNutr(true)} activeOpacity={0.7}>
              <Text style={ac.settingIcon}>🥗</Text>
              <View style={ac.settingText}>
                <Text style={ac.settingLabel}>Family Nutrients</Text>
                <Text style={ac.settingSubLabel}>
                  {familyNutrients.length} tracked · same for all members
                </Text>
              </View>
              <Text style={ac.settingArrow}>›</Text>
            </TouchableOpacity>
          </>}
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

      {/* ── My Nutrient Targets Modal ── */}
      <Modal visible={showParams} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View style={ac.modalNavBar}>
            <TouchableOpacity style={ac.modalBackBtn} onPress={() => setShowParams(false)}>
              <Text style={ac.modalBackText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={ac.modalNavTitle}>My Targets</Text>
            <View style={{ width: 60 }} />
          </View>
          <ParametersScreen />
        </SafeAreaView>
      </Modal>

      {/* ── Per-member Nutrient Targets Modal ── */}
      <Modal visible={!!memberParamsId} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View style={ac.modalNavBar}>
            <TouchableOpacity style={ac.modalBackBtn} onPress={() => setMemberParamsId(null)}>
              <Text style={ac.modalBackText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={ac.modalNavTitle}>
              {memberParamsId ? (familyMembers.find(m => m.id === memberParamsId)?.name ?? '') + "'s Targets" : ''}
            </Text>
            <View style={{ width: 60 }} />
          </View>
          {memberParamsId && <ParametersScreen key={memberParamsId} memberId={memberParamsId} />}
        </SafeAreaView>
      </Modal>

      {/* ── My Age Group Picker ── */}
      <Modal visible={showAgePicker} animationType="fade" transparent>
        <View style={ac.ageOverlay}>
          <View style={ac.ageSheet}>
            <Text style={ac.ageSheetTitle}>My Age Group</Text>
            <Text style={ac.ageSheetSub}>Loads science-based nutrient targets</Text>
            {AGE_GROUPS.map(g => (
              <TouchableOpacity
                key={g}
                style={[ac.ageOption, ageGroup === g && ac.ageOptionActive]}
                onPress={() => { setAgeGroup(g); setShowAgePicker(false); }}
                activeOpacity={0.7}
              >
                <Text style={[ac.ageOptionText, ageGroup === g && ac.ageOptionTextActive]}>
                  {AGE_GROUP_LABEL[g]}
                </Text>
                {ageGroup === g && <Text style={ac.ageCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ac.ageCancelBtn} onPress={() => setShowAgePicker(false)} activeOpacity={0.7}>
              <Text style={ac.ageCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Member Age Group Picker ── */}
      <Modal visible={!!pickerMemberId} animationType="fade" transparent>
        <View style={ac.ageOverlay}>
          <View style={ac.ageSheet}>
            <Text style={ac.ageSheetTitle}>{pickerMember?.name}'s Age Group</Text>
            <Text style={ac.ageSheetSub}>Updates their nutrient targets automatically</Text>
            {AGE_GROUPS.map(g => (
              <TouchableOpacity
                key={g}
                style={[ac.ageOption, pickerMember?.ageGroup === g && ac.ageOptionActive]}
                onPress={() => selectAgeForMember(g)}
                activeOpacity={0.7}
              >
                <Text style={[ac.ageOptionText, pickerMember?.ageGroup === g && ac.ageOptionTextActive]}>
                  {AGE_GROUP_LABEL[g]}
                </Text>
                {pickerMember?.ageGroup === g && <Text style={ac.ageCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ac.ageCancelBtn} onPress={() => setPickerMemberId(null)} activeOpacity={0.7}>
              <Text style={ac.ageCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Family Nutrients Modal ── */}
      <Modal visible={showFamilyNutr} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
          <View style={ac.modalNavBar}>
            <TouchableOpacity style={ac.modalBackBtn} onPress={() => setShowFamilyNutr(false)}>
              <Text style={ac.modalBackText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={ac.modalNavTitle}>Family Nutrients</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>

            {/* Info banner */}
            <View style={ac.fnInfoCard}>
              <Text style={ac.fnInfoTitle}>Same nutrients for everyone</Text>
              <Text style={ac.fnInfoText}>
                Every family member tracks the same set of nutrients, so the max points per day is equal for all kids — just with age-appropriate targets.
              </Text>
            </View>

            {/* Max pts callout */}
            <View style={ac.fnPtsCard}>
              <Text style={ac.fnPtsLabel}>Max points per day</Text>
              <Text style={ac.fnPtsValue}>{familyNutrients.length * 10} pts</Text>
              <Text style={ac.fnPtsSub}>{familyNutrients.length} nutrient{familyNutrients.length !== 1 ? 's' : ''} × 10 pts each</Text>
            </View>

            {/* Nutrient rows */}
            <Text style={ac.fnSectionLabel}>Tracked Nutrients</Text>
            {NUTRIENTS.map(n => {
              const enabled = familyNutrients.includes(n);
              return (
                <View key={n} style={[ac.fnNutrientCard, enabled && { borderLeftWidth: 4, borderLeftColor: N_COLOR[n] }]}>
                  <View style={[ac.fnNutrientIcon, { backgroundColor: N_COLOR[n] + '22' }]}>
                    <Text style={ac.fnNutrientEmoji}>{N_EMOJI[n]}</Text>
                  </View>
                  <View style={ac.fnNutrientInfo}>
                    <Text style={ac.fnNutrientName}>{N_LABEL[n]}</Text>
                    {enabled ? (
                      <Text style={ac.fnNutrientSub} numberOfLines={1}>{nutrientMemberSummary(n)}</Text>
                    ) : (
                      <Text style={ac.fnNutrientSub}>Not tracked · toggle to enable for all</Text>
                    )}
                  </View>
                  <Switch
                    value={enabled}
                    onValueChange={val => toggleFamilyNutrient(n, val)}
                    trackColor={{ false: '#E5E5EA', true: N_COLOR[n] }}
                    thumbColor="#fff"
                  />
                </View>
              );
            })}

            <Text style={ac.fnFootnote}>
              Changes apply to all family members immediately. Members on Auto-set get DRI values; Custom members keep their manual values.
            </Text>
          </ScrollView>
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

  memberRow:          { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  memberAvatar:       { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  memberAvatarEmoji:  { fontSize: 24 },
  memberInfo:         { flex: 1 },
  memberName:         { fontSize: 15, fontWeight: '700', color: DARK, marginBottom: 4 },
  memberRoleText:     { fontSize: 12, color: '#8E8E93' },
  ageChip:            { alignSelf: 'flex-start', backgroundColor: DARK + '11', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  ageChipText:        { fontSize: 12, fontWeight: '700', color: DARK },
  memberControls:     { alignItems: 'flex-end', gap: 6 },
  memberAutoRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberAutoLabel:    { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
  memberSettingsBtn:  { backgroundColor: BG, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  memberSettingsBtnText:{ fontSize: 12, fontWeight: '700', color: DARK },

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

  ageOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  ageSheet:           { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 360 },
  ageSheetTitle:      { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 4 },
  ageSheetSub:        { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  ageOption:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 8, backgroundColor: BG },
  ageOptionActive:    { backgroundColor: DARK },
  ageOptionText:      { flex: 1, fontSize: 16, fontWeight: '600', color: DARK },
  ageOptionTextActive:{ color: '#fff' },
  ageCheck:           { fontSize: 16, color: YELLOW, fontWeight: '800' },
  ageCancelBtn:       { marginTop: 8, alignItems: 'center', paddingVertical: 14 },
  ageCancelText:      { fontSize: 16, fontWeight: '600', color: '#8E8E93' },

  // Family Nutrients modal
  fnInfoCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: YELLOW },
  fnInfoTitle:      { fontSize: 14, fontWeight: '700', color: DARK, marginBottom: 6 },
  fnInfoText:       { fontSize: 13, color: '#8E8E93', lineHeight: 20 },
  fnPtsCard:        { backgroundColor: DARK, borderRadius: 18, padding: 18, marginBottom: 20, alignItems: 'center' },
  fnPtsLabel:       { fontSize: 12, color: '#AEAEB2', fontWeight: '600', marginBottom: 4 },
  fnPtsValue:       { fontSize: 38, fontWeight: '800', color: YELLOW },
  fnPtsSub:         { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  fnSectionLabel:   { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 10 },
  fnNutrientCard:   { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  fnNutrientIcon:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fnNutrientEmoji:  { fontSize: 22 },
  fnNutrientInfo:   { flex: 1 },
  fnNutrientName:   { fontSize: 15, fontWeight: '700', color: DARK },
  fnNutrientSub:    { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  fnFootnote:       { fontSize: 12, color: '#AEAEB2', textAlign: 'center', marginTop: 8, lineHeight: 18 },
});
