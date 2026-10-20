import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login, continueAsGuest } = useAuth();
  const { isDark, toggleTheme }    = useTheme();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const s = makeStyles(isDark);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) Alert.alert('Login Failed', result.error);
  };

  const handleGuest = async () => {
    setLoading(true);
    const result = await continueAsGuest();
    setLoading(false);
    if (!result.success) Alert.alert('Error', result.error);
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>🏠</Text>
          <Text style={s.title}>3D Home Designer</Text>
          <Text style={s.subtitle}>Design your dream home with AI</Text>
          <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
            <Text style={s.themeBtnText}>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</Text>
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome Back</Text>

          <Text style={s.label}>Email Address</Text>
          <TextInput
            style={s.input}
            placeholder="your@email.com"
            placeholderTextColor={isDark ? '#555' : '#aaa'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>Password</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? '#555' : '#aaa'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={s.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryText}>Sign In →</Text>
            }
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.btnGuest} onPress={handleGuest} disabled={loading}>
            <Text style={s.btnGuestText}>👤 Continue as Guest</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.linkRow} onPress={() => navigation.navigate('Signup')}>
            <Text style={s.linkText}>
              Don't have an account?{' '}
              <Text style={s.linkHighlight}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.badge}>
          <Text style={s.badgeText}>🎁 Sign up and get 50 free tokens!</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#0d1117' : '#0f3460' },
  scroll:    { flexGrow: 1, justifyContent: 'center', padding: 24 },

  header:   { alignItems: 'center', marginBottom: 32 },
  logo:     { fontSize: 64 },
  title:    { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#a8b2d8', marginTop: 4 },
  themeBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  themeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: isDark ? '#161b22' : '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? '#21262d' : 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: isDark ? '#e6edf3' : '#0f3460', marginBottom: 20 },
  label:     { fontSize: 13, fontWeight: '600', color: isDark ? '#8b949e' : '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: isDark ? '#30363d' : '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color:            isDark ? '#e6edf3' : '#222',
    marginBottom: 16,
    backgroundColor:  isDark ? '#0d1117' : '#fafafa',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  eyeBtn:      { padding: 14, marginLeft: 8 },
  eyeText:     { fontSize: 18 },

  btnPrimary:     { backgroundColor: '#e94560', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  btnDisabled:    { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: isDark ? '#21262d' : '#eee' },
  dividerText: { marginHorizontal: 12, color: isDark ? '#555' : '#aaa', fontSize: 12 },

  btnGuest:     { borderWidth: 1.5, borderColor: isDark ? '#64ffda' : '#0f3460', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnGuestText: { color: isDark ? '#64ffda' : '#0f3460', fontWeight: '700', fontSize: 14 },

  linkRow:       { marginTop: 18, alignItems: 'center' },
  linkText:      { color: isDark ? '#8b949e' : '#888', fontSize: 13 },
  linkHighlight: { color: '#e94560', fontWeight: '700' },

  badge: {
    marginTop: 20,
    backgroundColor: 'rgba(100,255,218,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100,255,218,0.3)',
  },
  badgeText: { color: '#64ffda', fontSize: 13, fontWeight: '600' },
});
