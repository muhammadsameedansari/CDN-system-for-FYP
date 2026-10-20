import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { saveDesign } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Constants ─────────────────────────────────────────────────────────────

const STYLES = [
  { id: 'modern',       label: 'Modern',       icon: '🏙️' },
  { id: 'traditional',  label: 'Traditional',  icon: '🏡' },
  { id: 'minimalist',   label: 'Minimalist',   icon: '⬜' },
  { id: 'industrial',   label: 'Industrial',   icon: '🏭' },
];

const ROOM_TYPES = [
  { id: 'bedroom',    label: 'Bedroom',    icon: '🛏️' },
  { id: 'kitchen',    label: 'Kitchen',    icon: '🍳' },
  { id: 'washroom',   label: 'Washroom',   icon: '🚿' },
  { id: 'lounge',     label: 'Lounge',     icon: '🛋️' },
  { id: 'dining',     label: 'Dining Room',icon: '🍽️' },
  { id: 'garage',     label: 'Garage',     icon: '🚗' },
  { id: 'garden',     label: 'Garden',     icon: '🌿' },
  { id: 'office',     label: 'Home Office',icon: '💼' },
];

const TOTAL_STEPS = 4;

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <View style={si.row}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const step   = i + 1;
        const active = step === current;
        const done   = step < current;
        return (
          <React.Fragment key={step}>
            <View style={[si.circle, active && si.activeCircle, done && si.doneCircle]}>
              <Text style={[si.num, (active || done) && si.numLight]}>
                {done ? '✓' : step}
              </Text>
            </View>
            {i < TOTAL_STEPS - 1 && (
              <View style={[si.line, done && si.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const si = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  circle:      { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#ccc', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  activeCircle:{ borderColor: '#e94560', backgroundColor: '#e94560' },
  doneCircle:  { borderColor: '#0f3460', backgroundColor: '#0f3460' },
  num:         { fontSize: 13, fontWeight: '700', color: '#aaa' },
  numLight:    { color: '#fff' },
  line:        { flex: 1, height: 2, backgroundColor: '#eee', marginHorizontal: 4 },
  lineDone:    { backgroundColor: '#0f3460' },
});

// ── Step 1 — House Info ────────────────────────────────────────────────────
function Step1({ data, onChange }) {
  return (
    <View>
      <Text style={s.stepTitle}>Basic Information</Text>
      <Text style={s.stepSub}>Tell us about your house</Text>

      <Text style={s.label}>Project Name</Text>
      <TextInput
        style={s.input}
        placeholder="e.g. My Dream Home"
        placeholderTextColor="#aaa"
        value={data.projectName}
        onChangeText={(v) => onChange('projectName', v)}
      />

      <Text style={s.label}>Number of Floors</Text>
      <View style={s.pillRow}>
        {['1', '2', '3', '4+'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.pill, data.floors === f && s.pillActive]}
            onPress={() => onChange('floors', f)}
          >
            <Text style={[s.pillText, data.floors === f && s.pillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Architectural Style</Text>
      <View style={s.styleGrid}>
        {STYLES.map((st) => (
          <TouchableOpacity
            key={st.id}
            style={[s.styleCard, data.style === st.id && s.styleCardActive]}
            onPress={() => onChange('style', st.id)}
          >
            <Text style={s.styleIcon}>{st.icon}</Text>
            <Text style={[s.styleLabel, data.style === st.id && s.styleLabelActive]}>
              {st.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Total Area (sq ft) — Optional</Text>
      <TextInput
        style={s.input}
        placeholder="e.g. 2000"
        placeholderTextColor="#aaa"
        value={data.totalArea}
        onChangeText={(v) => onChange('totalArea', v)}
        keyboardType="numeric"
      />
    </View>
  );
}

// ── Step 2 — Room Selection ────────────────────────────────────────────────
function Step2({ data, onChange }) {
  const toggle = (roomId) => {
    const current = data.selectedRooms || [];
    const exists  = current.find((r) => r.id === roomId);
    if (exists) {
      onChange('selectedRooms', current.filter((r) => r.id !== roomId));
    } else {
      const roomType = ROOM_TYPES.find((r) => r.id === roomId);
      onChange('selectedRooms', [...current, { id: roomId, label: roomType.label, icon: roomType.icon, count: 1 }]);
    }
  };

  const updateCount = (roomId, delta) => {
    const current = data.selectedRooms || [];
    onChange('selectedRooms', current.map((r) => {
      if (r.id !== roomId) return r;
      const newCount = Math.max(1, r.count + delta);
      return { ...r, count: newCount };
    }));
  };

  const isSelected = (roomId) =>
    (data.selectedRooms || []).some((r) => r.id === roomId);

  const getCount = (roomId) => {
    const room = (data.selectedRooms || []).find((r) => r.id === roomId);
    return room ? room.count : 1;
  };

  return (
    <View>
      <Text style={s.stepTitle}>Select Rooms</Text>
      <Text style={s.stepSub}>Tap to add rooms to your house</Text>

      <View style={s.roomGrid}>
        {ROOM_TYPES.map((room) => {
          const selected = isSelected(room.id);
          return (
            <View key={room.id} style={s.roomWrapper}>
              <TouchableOpacity
                style={[s.roomCard, selected && s.roomCardActive]}
                onPress={() => toggle(room.id)}
              >
                <Text style={s.roomIcon}>{room.icon}</Text>
                <Text style={[s.roomLabel, selected && s.roomLabelActive]}>
                  {room.label}
                </Text>
                {selected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>

              {/* Count selector shown only when selected */}
              {selected && (
                <View style={s.countRow}>
                  <TouchableOpacity
                    style={s.countBtn}
                    onPress={() => updateCount(room.id, -1)}
                  >
                    <Text style={s.countBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.countNum}>{getCount(room.id)}</Text>
                  <TouchableOpacity
                    style={s.countBtn}
                    onPress={() => updateCount(room.id, 1)}
                  >
                    <Text style={s.countBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {(data.selectedRooms || []).length > 0 && (
        <View style={s.summaryBox}>
          <Text style={s.summaryText}>
            ✅ {(data.selectedRooms || []).reduce((a, r) => a + r.count, 0)} rooms selected
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Step 3 — Dimensions ────────────────────────────────────────────────────
function Step3({ data, onChange }) {
  const rooms = data.selectedRooms || [];

  const updateDimension = (roomId, index, field, value) => {
    const updated = rooms.map((room) => {
      if (room.id !== roomId) return room;
      const dims = room.dimensions ? [...room.dimensions] : Array(room.count).fill(null).map(() => ({ length: '', width: '', height: '' }));
      dims[index] = { ...dims[index], [field]: value };
      return { ...room, dimensions: dims };
    });
    onChange('selectedRooms', updated);
  };

  const getDim = (room, index, field) => {
    if (!room.dimensions || !room.dimensions[index]) return '';
    return room.dimensions[index][field] || '';
  };

  if (rooms.length === 0) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyIcon}>🏠</Text>
        <Text style={s.emptyText}>No rooms selected. Go back and select rooms first.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={s.stepTitle}>Room Dimensions</Text>
      <Text style={s.stepSub}>Enter dimensions in feet (optional)</Text>

      {rooms.map((room) =>
        Array.from({ length: room.count }).map((_, idx) => (
          <View key={`${room.id}-${idx}`} style={s.dimCard}>
            <Text style={s.dimTitle}>
              {room.icon} {room.label}{room.count > 1 ? ` #${idx + 1}` : ''}
            </Text>
            <View style={s.dimRow}>
              <View style={s.dimField}>
                <Text style={s.dimLabel}>Length (ft)</Text>
                <TextInput
                  style={s.dimInput}
                  placeholder="20"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={getDim(room, idx, 'length')}
                  onChangeText={(v) => updateDimension(room.id, idx, 'length', v)}
                />
              </View>
              <View style={s.dimField}>
                <Text style={s.dimLabel}>Width (ft)</Text>
                <TextInput
                  style={s.dimInput}
                  placeholder="15"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={getDim(room, idx, 'width')}
                  onChangeText={(v) => updateDimension(room.id, idx, 'width', v)}
                />
              </View>
              <View style={s.dimField}>
                <Text style={s.dimLabel}>Height (ft)</Text>
                <TextInput
                  style={s.dimInput}
                  placeholder="10"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  value={getDim(room, idx, 'height')}
                  onChangeText={(v) => updateDimension(room.id, idx, 'height', v)}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ── Step 4 — Review ────────────────────────────────────────────────────────
function Step4({ data }) {
  const rooms = data.selectedRooms || [];
  const totalRooms = rooms.reduce((a, r) => a + r.count, 0);

  return (
    <View>
      <Text style={s.stepTitle}>Review Your Design</Text>
      <Text style={s.stepSub}>Confirm the details before generating</Text>

      {/* Summary card */}
      <View style={s.reviewCard}>
        <Text style={s.reviewTitle}>🏠 {data.projectName || 'My House'}</Text>

        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Style</Text>
          <Text style={s.reviewVal}>
            {STYLES.find((st) => st.id === data.style)?.label || '—'}
          </Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Floors</Text>
          <Text style={s.reviewVal}>{data.floors || '—'}</Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Total Area</Text>
          <Text style={s.reviewVal}>
            {data.totalArea ? `${data.totalArea} sq ft` : 'Not specified'}
          </Text>
        </View>
        <View style={s.reviewRow}>
          <Text style={s.reviewKey}>Total Rooms</Text>
          <Text style={s.reviewVal}>{totalRooms}</Text>
        </View>
      </View>

      {/* Room list */}
      <Text style={s.reviewSubheading}>Room Breakdown</Text>
      {rooms.map((room) => (
        <View key={room.id} style={s.reviewRoomRow}>
          <Text style={s.reviewRoomIcon}>{room.icon}</Text>
          <Text style={s.reviewRoomName}>{room.label}</Text>
          <Text style={s.reviewRoomCount}>× {room.count}</Text>
        </View>
      ))}

      {/* Token cost */}
      <View style={s.tokenCostBox}>
        <Text style={s.tokenCostLabel}>Estimated Token Cost</Text>
        <Text style={s.tokenCostVal}>
          {10 + Math.max(0, totalRooms - 3) * 2} tokens
        </Text>
        <Text style={s.tokenCostNote}>
          Base 10 tokens + 2 per extra room beyond 3
        </Text>
      </View>
    </View>
  );
}

// ── Main DesignFormScreen ──────────────────────────────────────────────────
export default function DesignFormScreen({ navigation, route }) {
  const { user } = useAuth();

  const [step, setStep]       = useState(1);
  const [saving, setSaving]   = useState(false);

  // Pre-fill from AI prompt if passed via navigation params
  const prefill = route?.params?.prefill;
  const [formData, setFormData] = useState({
    projectName:   prefill?.project_name  || '',
    floors:        prefill?.floors        || '1',
    style:         prefill?.style         || 'modern',
    totalArea:     prefill?.total_area ? String(prefill.total_area) : '',
    selectedRooms: prefill?.rooms         || [],
  });

  const onChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Validate before moving to next step
  const validateStep = () => {
    if (step === 1) {
      if (!formData.projectName.trim()) {
        Alert.alert('Required', 'Please enter a project name.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.selectedRooms.length) {
        Alert.alert('Required', 'Please select at least one room.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSave = async () => {
    setSaving(true);
    console.log('Save button clicked, formData:', JSON.stringify(formData));
    try {
      const payload = {
        firebase_uid:   user?.uid || 'dev_user_123',
        project_name:   formData.projectName,
        floors:         formData.floors,
        style:          formData.style,
        total_area:     formData.totalArea ? parseFloat(formData.totalArea) : null,
        rooms:          formData.selectedRooms,
        status:         'draft',
      };
      console.log('Sending payload:', JSON.stringify(payload));
      const result = await saveDesign(payload);
      console.log('Save success:', result);
      // Navigate to 3D Viewer with design data
      navigation.navigate('ModelViewer', {
        designId:    result.id,
        rooms:       formData.selectedRooms,
        projectName: formData.projectName,
        style:       formData.style,
      });
    } catch (err) {
      console.error('Save error full:', err);
      let msg = 'Failed to save design.';
      if (typeof err === 'string') {
        msg = err;
      } else if (err?.message) {
        msg = err.message;
      } else if (err?.detail) {
        msg = err.detail;
      } else {
        msg = JSON.stringify(err);
      }
      console.error('Save error msg:', msg);
      if (typeof window !== 'undefined') {
        window.alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = ['House Info', 'Rooms', 'Dimensions', 'Review'];

  return (
    <SafeAreaView style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>New Design</Text>
        <Text style={s.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <StepIndicator current={step} />

        {/* Active step label */}
        <View style={s.stepBadge}>
          <Text style={s.stepBadgeText}>{stepLabels[step - 1]}</Text>
        </View>

        {/* Step content */}
        {step === 1 && <Step1 data={formData} onChange={onChange} />}
        {step === 2 && <Step2 data={formData} onChange={onChange} />}
        {step === 3 && <Step3 data={formData} onChange={onChange} />}
        {step === 4 && <Step4 data={formData} />}
      </ScrollView>

      {/* Bottom navigation */}
      <View style={s.bottomBar}>
        {step > 1 && (
          <TouchableOpacity style={s.btnSecondary} onPress={handleBack}>
            <Text style={s.btnSecondaryText}>← Previous</Text>
          </TouchableOpacity>
        )}

        {step < TOTAL_STEPS ? (
          <TouchableOpacity
            style={[s.btnPrimary, step === 1 && { flex: 1 }]}
            onPress={handleNext}
          >
            <Text style={s.btnPrimaryText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.btnPrimary, saving && s.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryText}>Save Design ✅</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f4f6fb' },
  scroll:     { padding: 20, paddingBottom: 40 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn:      { padding: 4 },
  backBtnText:  { color: '#a8b2d8', fontSize: 14, fontWeight: '600' },
  topTitle:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  stepLabel:    { color: '#a8b2d8', fontSize: 12 },

  // Step badge
  stepBadge: {
    backgroundColor: '#e94560',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  stepBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Step titles
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#0f3460', marginBottom: 4 },
  stepSub:   { fontSize: 13, color: '#888', marginBottom: 24 },

  // Labels & inputs
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#222',
    marginBottom: 16,
  },

  // Floor pills
  pillRow:       { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pill:          { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fff' },
  pillActive:    { backgroundColor: '#e94560', borderColor: '#e94560' },
  pillText:      { fontSize: 14, fontWeight: '600', color: '#555' },
  pillTextActive:{ color: '#fff' },

  // Style cards
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  styleCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#eee',
  },
  styleCardActive: { borderColor: '#e94560', backgroundColor: '#fff5f7' },
  styleIcon:       { fontSize: 28, marginBottom: 6 },
  styleLabel:      { fontSize: 13, fontWeight: '600', color: '#555' },
  styleLabelActive:{ color: '#e94560' },

  // Room grid
  roomGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  roomWrapper: { width: '47%' },
  roomCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#eee', position: 'relative',
  },
  roomCardActive:  { borderColor: '#0f3460', backgroundColor: '#f0f4ff' },
  roomIcon:        { fontSize: 30, marginBottom: 6 },
  roomLabel:       { fontSize: 12, fontWeight: '600', color: '#555', textAlign: 'center' },
  roomLabelActive: { color: '#0f3460' },
  checkmark: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#0f3460', color: '#fff',
    fontSize: 10, fontWeight: '800',
    width: 18, height: 18, borderRadius: 9,
    textAlign: 'center', lineHeight: 18,
  },
  countRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 6, gap: 10,
  },
  countBtn:     { backgroundColor: '#0f3460', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', lineHeight: 22 },
  countNum:     { fontSize: 15, fontWeight: '800', color: '#0f3460', minWidth: 20, textAlign: 'center' },

  // Summary
  summaryBox:  { backgroundColor: '#f0fff8', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#b2f5e0', marginTop: 4 },
  summaryText: { color: '#1a7a4a', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  // Dimensions
  dimCard:  { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  dimTitle: { fontSize: 14, fontWeight: '700', color: '#0f3460', marginBottom: 12 },
  dimRow:   { flexDirection: 'row', gap: 8 },
  dimField: { flex: 1 },
  dimLabel: { fontSize: 11, color: '#888', marginBottom: 4, fontWeight: '600' },
  dimInput: {
    backgroundColor: '#fafafa', borderWidth: 1.5, borderColor: '#e0e0e0',
    borderRadius: 8, padding: 10, fontSize: 13, color: '#222', textAlign: 'center',
  },

  // Review
  reviewCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: '#eee',
  },
  reviewTitle:     { fontSize: 18, fontWeight: '800', color: '#0f3460', marginBottom: 14 },
  reviewRow:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  reviewKey:       { fontSize: 13, color: '#888', fontWeight: '600' },
  reviewVal:       { fontSize: 13, color: '#222', fontWeight: '700' },
  reviewSubheading:{ fontSize: 15, fontWeight: '700', color: '#0f3460', marginBottom: 10 },
  reviewRoomRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  reviewRoomIcon:  { fontSize: 22, marginRight: 10 },
  reviewRoomName:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#333' },
  reviewRoomCount: { fontSize: 14, fontWeight: '800', color: '#e94560' },

  // Token cost
  tokenCostBox: {
    backgroundColor: '#0f3460', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 12,
  },
  tokenCostLabel: { color: '#a8b2d8', fontSize: 12, marginBottom: 4 },
  tokenCostVal:   { color: '#64ffda', fontSize: 32, fontWeight: '800' },
  tokenCostNote:  { color: '#a8b2d8', fontSize: 11, marginTop: 4, textAlign: 'center' },

  // Empty state
  emptyState:  { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:   { fontSize: 48, marginBottom: 12 },
  emptyText:   { color: '#888', fontSize: 14, textAlign: 'center' },

  // Bottom nav
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  btnPrimary:      { flex: 1, backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnDisabled:     { opacity: 0.6 },
  btnPrimaryText:  { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnSecondary:    { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#0f3460' },
  btnSecondaryText:{ color: '#0f3460', fontWeight: '700', fontSize: 15 },
});
