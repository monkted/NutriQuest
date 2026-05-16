import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useApp, Goal, GoalType, calcWeekPoints, TAB_BAR_HEIGHT } from './store';

const YELLOW = '#FFD60A';
const DARK   = '#1C1C1E';
const BG     = '#F5F5F5';

export default function GoalsScreen() {
  const { role, goals, setGoals, entries, params, history } = useApp();

  const [modalVisible,  setModalVisible]  = useState(false);
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [fTitle,        setFTitle]        = useState('');
  const [fType,         setFType]         = useState<GoalType>('individual');
  const [fPointsTarget, setFPointsTarget] = useState('');
  const [fReward,       setFReward]       = useState('');

  const weekPts = calcWeekPoints(history, entries, params);

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
        weeklyPointsTarget: pts, reward: fReward.trim(), priorPoints: 0,
      }]);
    }
    setModalVisible(false);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    setDeleteConfirm(null);
  };

  return (
    <SafeAreaView style={gs.root}>
      <View style={gs.header}>
        <View>
          <Text style={gs.headerTitle}>🎯 Weekly Goals</Text>
          <Text style={gs.headerSub}>{role === 'parent' ? 'Manage family goals' : 'Your goals this week'}</Text>
        </View>
        <View style={[gs.rolePill, { backgroundColor: role === 'parent' ? '#5856D6' : '#34C759' }]}>
          <Text style={gs.rolePillText}>{role === 'parent' ? '👨‍👩 Parent' : '🧒 Kid'}</Text>
        </View>
      </View>

      {/* This week's points banner */}
      <View style={gs.todayBanner}>
        <View style={gs.todayLeft}>
          <Text style={gs.todayLabel}>This week's points</Text>
          <Text style={gs.todayHint}>Applied to all active goals</Text>
        </View>
        <Text style={gs.todayPts}>{weekPts} pts</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_HEIGHT + 24 }}>
        {goals.length === 0 && (
          <View style={gs.emptyState}>
            <Text style={gs.emptyEmoji}>🎯</Text>
            <Text style={gs.emptyTitle}>No goals yet</Text>
            <Text style={gs.emptySub}>{role === 'parent' ? 'Tap + Add Goal below.' : 'Ask a parent to set goals for you!'}</Text>
          </View>
        )}

        {goals.map(goal => {
          const progress = Math.min(weekPts / goal.weeklyPointsTarget, 1);
          const complete = weekPts >= goal.weeklyPointsTarget;

          return (
            <View key={goal.id} style={[gs.goalCard, complete && gs.goalCardComplete]}>
              {/* Badges */}
              <View style={gs.badgeRow}>
                <View style={[gs.typeBadge, { backgroundColor: goal.type === 'group' ? '#5856D622' : '#FF950022' }]}>
                  <Text style={[gs.typeBadgeText, { color: goal.type === 'group' ? '#5856D6' : '#FF9500' }]}>
                    {goal.type === 'group' ? '👨‍👩 Group' : '⭐ Individual'}
                  </Text>
                </View>
                {complete && (
                  <View style={gs.completeBadge}>
                    <Text style={gs.completeBadgeText}>✓ Complete!</Text>
                  </View>
                )}
              </View>

              {/* Title + actions */}
              <View style={gs.titleRow}>
                <Text style={gs.goalTitle} numberOfLines={1}>{goal.title}</Text>
                {role === 'parent' && (
                  <View style={gs.actions}>
                    <TouchableOpacity style={gs.editBtn} onPress={() => openEdit(goal)}>
                      <Text style={gs.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={gs.deleteBtn} onPress={() => setDeleteConfirm(goal.id)}>
                      <Text style={gs.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={gs.rewardText}>🏆 {goal.reward}</Text>

              {/* Progress */}
              <View style={gs.progressRow}>
                <Text style={gs.progressLabel}>Weekly progress</Text>
                <Text style={gs.progressValue}>{weekPts} / {goal.weeklyPointsTarget} pts</Text>
              </View>
              <View style={gs.progressTrack}>
                <View style={[gs.progressFill, {
                  width: `${progress * 100}%` as any,
                  backgroundColor: complete ? '#34C759' : YELLOW,
                }]} />
              </View>
            </View>
          );
        })}

        {role === 'parent' && goals.length < 3 && (
          <TouchableOpacity style={gs.addBtn} onPress={openAdd}>
            <Text style={gs.addBtnText}>+ Add Goal</Text>
          </TouchableOpacity>
        )}
        {role === 'parent' && goals.length >= 3 && (
          <Text style={gs.maxNote}>Maximum of 3 goals per week.</Text>
        )}
      </ScrollView>

      {/* Delete confirm */}
      <Modal visible={!!deleteConfirm} transparent animationType="fade">
        <View style={gs.confirmOverlay}>
          <View style={gs.confirmBox}>
            <Text style={gs.confirmTitle}>Delete this goal?</Text>
            <Text style={gs.confirmSub}>This can't be undone.</Text>
            <View style={gs.confirmBtns}>
              <TouchableOpacity style={gs.confirmCancel} onPress={() => setDeleteConfirm(null)}>
                <Text style={gs.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={gs.confirmDelete} onPress={() => deleteGoal(deleteConfirm!)}>
                <Text style={gs.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={gs.overlay}>
          <View style={gs.sheet}>
            <Text style={gs.sheetTitle}>{editingGoal ? 'Edit Goal ✏️' : 'New Goal 🎯'}</Text>

            <Text style={gs.fieldLabel}>Goal Title</Text>
            <TextInput style={gs.input} placeholder="e.g. Protein Power Week" placeholderTextColor="#aaa" value={fTitle} onChangeText={setFTitle} />

            <Text style={gs.fieldLabel}>Goal Type</Text>
            <View style={gs.typeRow}>
              <TouchableOpacity style={[gs.typeChip, fType === 'individual' && { backgroundColor: '#FF9500' }]} onPress={() => setFType('individual')}>
                <Text style={[gs.typeChipText, fType === 'individual' && { color: '#fff' }]}>⭐ Individual</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.typeChip, fType === 'group' && { backgroundColor: '#5856D6' }]} onPress={() => setFType('group')}>
                <Text style={[gs.typeChipText, fType === 'group' && { color: '#fff' }]}>👨‍👩 Group</Text>
              </TouchableOpacity>
            </View>
            <Text style={gs.typeHint}>
              {fType === 'individual' ? 'Each kid hits the target independently.' : "Everyone's daily points are pooled together."}
            </Text>

            <Text style={gs.fieldLabel}>Points to Complete</Text>
            <TextInput style={gs.input} placeholder="e.g. 70" placeholderTextColor="#aaa" keyboardType="numeric" value={fPointsTarget} onChangeText={setFPointsTarget} />

            <Text style={gs.fieldLabel}>Reward 🏆</Text>
            <TextInput style={gs.input} placeholder="e.g. $10 allowance" placeholderTextColor="#aaa" value={fReward} onChangeText={setFReward} />

            <View style={gs.modalBtns}>
              <TouchableOpacity style={gs.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={gs.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={gs.saveBtn} onPress={saveGoal}>
                <Text style={gs.saveText}>Save Goal ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const gs = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: DARK },
  headerSub:   { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  rolePill:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  rolePillText:{ fontSize: 13, fontWeight: '700', color: '#fff' },

  todayBanner: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  todayLeft:   { flex: 1 },
  todayLabel:  { fontSize: 14, fontWeight: '700', color: DARK },
  todayPts:    { fontSize: 28, fontWeight: '800', color: '#FF9500' },
  todayHint:   { fontSize: 11, color: '#AEAEB2', marginTop: 2 },

  emptyState:  { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:  { fontSize: 52, marginBottom: 12 },
  emptyTitle:  { fontSize: 20, fontWeight: '700', color: DARK, marginBottom: 8 },
  emptySub:    { fontSize: 14, color: '#8E8E93', textAlign: 'center' },

  goalCard:         { backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  goalCardComplete: { borderWidth: 2, borderColor: '#34C759' },
  badgeRow:         { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  typeBadgeText:    { fontSize: 12, fontWeight: '700' },
  completeBadge:    { backgroundColor: '#34C75922', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  completeBadgeText:{ fontSize: 12, fontWeight: '700', color: '#34C759' },
  titleRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  goalTitle:        { flex: 1, fontSize: 18, fontWeight: '800', color: DARK },
  actions:          { flexDirection: 'row', gap: 8 },
  editBtn:          { backgroundColor: '#F2F2F7', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  editBtnText:      { fontSize: 13, fontWeight: '700', color: '#007AFF' },
  deleteBtn:        { backgroundColor: '#FFF0F0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  deleteBtnText:    { fontSize: 13, fontWeight: '700', color: '#FF3B30' },
  rewardText:       { fontSize: 14, color: '#8E8E93', marginBottom: 14 },
  progressRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:    { fontSize: 13, color: '#8E8E93' },
  progressValue:    { fontSize: 13, fontWeight: '700', color: DARK },
  progressTrack:    { height: 10, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: 5 },

  addBtn:     { backgroundColor: YELLOW, borderRadius: 18, paddingVertical: 16, alignItems: 'center', shadowColor: YELLOW, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  addBtnText: { fontSize: 17, fontWeight: '800', color: DARK },
  maxNote:    { textAlign: 'center', color: '#AEAEB2', fontSize: 13, marginTop: 8 },

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
  typeRow:     { flexDirection: 'row', gap: 10, marginBottom: 6 },
  typeChip:    { flex: 1, padding: 12, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center' },
  typeChipText:{ fontSize: 14, fontWeight: '700', color: DARK },
  typeHint:    { fontSize: 12, color: '#8E8E93', marginBottom: 10 },
  modalBtns:   { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, padding: 15, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText:  { fontSize: 16, fontWeight: '700', color: DARK },
  saveBtn:     { flex: 1, padding: 15, borderRadius: 16, backgroundColor: YELLOW, alignItems: 'center' },
  saveText:    { fontSize: 16, fontWeight: '800', color: DARK },
});
