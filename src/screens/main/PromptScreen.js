import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { parsePrompt, getPromptSuggestions } from '../../services/api';

export default function PromptScreen({ navigation }) {
  const [prompt, setPrompt]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [result, setResult]           = useState(null);   // parsed design data
  const [error, setError]             = useState('');

  // Load suggestions on mount
  useEffect(() => {
    getPromptSuggestions()
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {});
  }, []);

  const handleParse = async () => {
    if (!prompt.trim()) {
      setError('Please describe your house first.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await parsePrompt(prompt.trim());

      if (data.needs_form || !data.rooms?.length) {
        // AI could not parse — redirect to guided form
        setError('Your description was a bit unclear. Please use the guided form instead.');
        setLoading(false);
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to process prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // User confirms the AI result → go to DesignForm pre-filled
  const handleConfirm = () => {
    navigation.navigate('DesignForm', { prefill: result });
  };

  const handleUseForm = () => {
    navigation.navigate('DesignForm');
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>AI Design</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerIcon}>🤖</Text>
          <Text style={s.headerTitle}>Describe Your Dream Home</Text>
          <Text style={s.headerSub}>
            Type a description and our AI will extract the room layout for you
          </Text>
        </View>

        {/* Prompt Input */}
        <View style={s.inputCard}>
          <TextInput
            style={s.textArea}
            placeholder="e.g. I want a 3 bedroom house with a modern kitchen, 2 bathrooms, a large lounge and a garage..."
            placeholderTextColor="#aaa"
            value={prompt}
            onChangeText={(v) => { setPrompt(v); setError(''); setResult(null); }}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={s.charCount}>{prompt.length}/1000</Text>
        </View>

        {/* Error */}
        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={s.useFormBtn} onPress={handleUseForm}>
              <Text style={s.useFormBtnText}>Use Guided Form Instead →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Generate Button */}
        <TouchableOpacity
          style={[s.btnGenerate, loading && s.btnDisabled]}
          onPress={handleParse}
          disabled={loading}
        >
          {loading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.btnGenerateText}>  AI is processing...</Text>
            </View>
          ) : (
            <Text style={s.btnGenerateText}>✨ Generate Design</Text>
          )}
        </TouchableOpacity>

        {/* Suggestions */}
        {!result && suggestions.length > 0 && (
          <View style={s.suggestionsSection}>
            <Text style={s.suggestionsTitle}>💡 Try these examples</Text>
            {suggestions.map((sug, i) => (
              <TouchableOpacity
                key={i}
                style={s.suggestionChip}
                onPress={() => { setPrompt(sug); setError(''); setResult(null); }}
              >
                <Text style={s.suggestionText}>{sug}</Text>
                <Text style={s.suggestionArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AI Result */}
        {result && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Text style={s.resultHeaderIcon}>✅</Text>
              <Text style={s.resultHeaderText}>AI Extracted Your Design!</Text>
            </View>

            {/* Project info */}
            <View style={s.resultInfo}>
              <Text style={s.resultTitle}>🏠 {result.project_name}</Text>
              <View style={s.resultRow}>
                <Text style={s.resultKey}>Style</Text>
                <Text style={s.resultVal}>{result.style?.charAt(0).toUpperCase() + result.style?.slice(1)}</Text>
              </View>
              <View style={s.resultRow}>
                <Text style={s.resultKey}>Floors</Text>
                <Text style={s.resultVal}>{result.floors}</Text>
              </View>
              {result.total_area && (
                <View style={s.resultRow}>
                  <Text style={s.resultKey}>Area</Text>
                  <Text style={s.resultVal}>{result.total_area} sq ft</Text>
                </View>
              )}
            </View>

            {/* Rooms list */}
            <Text style={s.roomsHeading}>Rooms Detected</Text>
            <View style={s.roomsList}>
              {result.rooms.map((room, i) => (
                <View key={i} style={s.roomChip}>
                  <Text style={s.roomChipIcon}>{room.icon}</Text>
                  <Text style={s.roomChipLabel}>{room.label}</Text>
                  <Text style={s.roomChipCount}>× {room.count}</Text>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <TouchableOpacity style={s.btnConfirm} onPress={handleConfirm}>
              <Text style={s.btnConfirmText}>Looks Good — Save This Design ✅</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnEdit} onPress={handleUseForm}>
              <Text style={s.btnEditText}>Edit in Guided Form →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Divider */}
        <View style={s.dividerRow}>
          <View style={s.divLine} />
          <Text style={s.divText}>or</Text>
          <View style={s.divLine} />
        </View>

        <TouchableOpacity style={s.btnForm} onPress={handleUseForm}>
          <Text style={s.btnFormText}>📋 Use Guided Form Instead</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f4f6fb' },
  scroll:     { padding: 20, paddingBottom: 40 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn:     { padding: 4 },
  backBtnText: { color: '#a8b2d8', fontSize: 14, fontWeight: '600' },
  topTitle:    { color: '#fff', fontSize: 16, fontWeight: '800' },

  header:      { alignItems: 'center', marginBottom: 24 },
  headerIcon:  { fontSize: 48, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0f3460', textAlign: 'center' },
  headerSub:   { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 20 },

  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  textArea: {
    fontSize: 14,
    color: '#222',
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: '#aaa', marginTop: 6 },

  errorBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ffd0d0',
    marginBottom: 12,
  },
  errorText:      { color: '#c0392b', fontSize: 13, marginBottom: 10 },
  useFormBtn:     { backgroundColor: '#0f3460', borderRadius: 8, padding: 10, alignItems: 'center' },
  useFormBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  btnGenerate: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnDisabled:     { opacity: 0.6 },
  btnGenerateText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loadingRow:      { flexDirection: 'row', alignItems: 'center' },

  suggestionsSection: { marginBottom: 24 },
  suggestionsTitle:   { fontSize: 14, fontWeight: '700', color: '#0f3460', marginBottom: 10 },
  suggestionChip: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  suggestionText:  { flex: 1, fontSize: 13, color: '#444', lineHeight: 18 },
  suggestionArrow: { color: '#e94560', fontWeight: '800', fontSize: 16, marginLeft: 8 },

  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#64ffda',
  },
  resultHeader:     { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  resultHeaderIcon: { fontSize: 24, marginRight: 8 },
  resultHeaderText: { fontSize: 16, fontWeight: '800', color: '#0f3460' },

  resultInfo:  { backgroundColor: '#f8faff', borderRadius: 10, padding: 14, marginBottom: 14 },
  resultTitle: { fontSize: 16, fontWeight: '800', color: '#0f3460', marginBottom: 10 },
  resultRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultKey:   { fontSize: 13, color: '#888' },
  resultVal:   { fontSize: 13, color: '#222', fontWeight: '700' },

  roomsHeading: { fontSize: 14, fontWeight: '700', color: '#0f3460', marginBottom: 10 },
  roomsList:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  roomChipIcon:  { fontSize: 16 },
  roomChipLabel: { fontSize: 12, fontWeight: '600', color: '#0f3460' },
  roomChipCount: { fontSize: 12, fontWeight: '800', color: '#e94560' },

  btnConfirm:     { backgroundColor: '#0f3460', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnEdit:        { borderWidth: 1.5, borderColor: '#0f3460', borderRadius: 12, padding: 12, alignItems: 'center' },
  btnEditText:    { color: '#0f3460', fontWeight: '700', fontSize: 13 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divLine:    { flex: 1, height: 1, backgroundColor: '#ddd' },
  divText:    { marginHorizontal: 12, color: '#aaa', fontSize: 13 },

  btnForm:     { borderWidth: 1.5, borderColor: '#0f3460', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnFormText: { color: '#0f3460', fontWeight: '700', fontSize: 14 },
});
