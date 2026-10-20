import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getMyDesigns, deleteDesign } from '../../services/api';

const ROOM_COLORS = {
  bedroom:'#87CEEB', kitchen:'#FAD787', washroom:'#87FAD0',
  lounge:'#FABA87',  dining:'#DE87FA',  garage:'#BEBEBE',
  garden:'#87FA87',  office:'#FA8787',  default:'#ddd',
};

export default function MyModelsScreen({ navigation }) {
  const { isDark, theme } = useTheme();
  const [designs, setDesigns]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchDesigns(); }, []);

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const data = await getMyDesigns();
      setDesigns(data);
    } catch (e) {
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Design', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDesign(id);
            setDesigns(prev => prev.filter(d => d.id !== id));
          } catch { Alert.alert('Error', 'Could not delete design.'); }
        }
      }
    ]);
  };

  const handleOpen = (design) => {
    navigation.navigate('ModelViewer', {
      designId:    design.id,
      rooms:       design.rooms || [],
      projectName: design.project_name,
      style:       design.style,
    });
  };

  const s = makeStyles(isDark, theme);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>My Models</Text>
        <TouchableOpacity onPress={fetchDesigns} style={s.refreshBtn}>
          <Text style={s.refreshText}>↺</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={s.loadingText}>Loading your designs...</Text>
        </View>
      ) : designs.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🏠</Text>
          <Text style={s.emptyTitle}>No designs yet!</Text>
          <Text style={s.emptyDesc}>Create your first house design</Text>
          <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('DesignForm')}>
            <Text style={s.createBtnText}>+ Create Design</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.count}>{designs.length} design{designs.length > 1 ? 's' : ''} saved</Text>
          {designs.map((design, i) => (
            <View key={design.id || i} style={s.card}>
              {/* Room color strips */}
              <View style={s.colorStrips}>
                {(design.rooms || []).slice(0, 6).map((r, j) => (
                  <View key={j} style={[s.strip, { backgroundColor: ROOM_COLORS[r.id] || '#ddd' }]} />
                ))}
              </View>

              <View style={s.cardBody}>
                <Text style={s.cardTitle}>🏠 {design.project_name}</Text>
                <View style={s.metaRow}>
                  <Text style={s.metaTag}>{design.style}</Text>
                  <Text style={s.metaTag}>{design.floors} floor{design.floors > 1 ? 's' : ''}</Text>
                  <Text style={s.metaTag}>{(design.rooms || []).reduce((a, r) => a + r.count, 0)} rooms</Text>
                </View>

                {/* Room pills */}
                <View style={s.roomPills}>
                  {(design.rooms || []).map((r, j) => (
                    <View key={j} style={[s.pill, { backgroundColor: ROOM_COLORS[r.id] || '#ddd' }]}>
                      <Text style={s.pillText}>{r.label} ×{r.count}</Text>
                    </View>
                  ))}
                </View>

                <Text style={s.date}>
                  {design.created_at ? new Date(design.created_at).toLocaleDateString() : ''}
                </Text>

                {/* Actions */}
                <View style={s.actions}>
                  <TouchableOpacity style={s.openBtn} onPress={() => handleOpen(design)}>
                    <Text style={s.openBtnText}>🏠 Open 3D View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(design.id)}>
                    <Text style={s.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (isDark, theme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.bg },
  topBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f3460', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { padding: 4 },
  backBtnText:  { color: '#a8b2d8', fontSize: 14, fontWeight: '600' },
  topTitle:     { color: '#fff', fontSize: 16, fontWeight: '800' },
  refreshBtn:   { backgroundColor: '#e94560', borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  refreshText:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  scroll:       { padding: 16 },
  count:        { color: theme.textSub, fontSize: 12, marginBottom: 12, fontWeight: '600' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText:  { color: theme.textSub, marginTop: 12 },
  emptyIcon:    { fontSize: 64, marginBottom: 16 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8 },
  emptyDesc:    { fontSize: 14, color: theme.textSub, marginBottom: 24 },
  createBtn:    { backgroundColor: '#e94560', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  createBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },

  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    overflow: 'hidden',
  },
  colorStrips:  { flexDirection: 'row', height: 6 },
  strip:        { flex: 1 },
  cardBody:     { padding: 16 },
  cardTitle:    { fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 8 },
  metaRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metaTag:      { backgroundColor: isDark ? '#21262d' : '#f0f0f0', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, color: theme.textSub, fontWeight: '600', textTransform: 'capitalize' },
  roomPills:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  pill:         { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  pillText:     { fontSize: 11, fontWeight: '700', color: '#1a1a2e' },
  date:         { fontSize: 11, color: theme.textSub, marginBottom: 12 },
  actions:      { flexDirection: 'row', gap: 10 },
  openBtn:      { flex: 1, backgroundColor: '#0f3460', borderRadius: 10, padding: 12, alignItems: 'center' },
  openBtnText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn:    { backgroundColor: isDark ? '#2d1010' : '#fff0f0', borderRadius: 10, padding: 12, alignItems: 'center', width: 48, borderWidth: 1, borderColor: '#e94560' },
  deleteBtnText:{ fontSize: 16 },
});
