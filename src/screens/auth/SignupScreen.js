import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signup(email.trim(), password, name.trim());
    setLoading(false);

    if (!result.success) {
      Alert.alert('Sign Up Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Get 50 free tokens on sign up!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign Up</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Smith"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="At least 6 characters"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter your password"
            placeholderTextColor="#aaa"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnPrimaryText}>Create Account →</Text>
            }
          </TouchableOpacity>

          <View style={styles.tokenBadge}>
            <Text style={styles.tokenText}>
              🎁 You'll receive 50 free tokens upon registration!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f3460' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  header: { alignItems: 'center', marginBottom: 28 },
  logo:     { fontSize: 56 },
  title:    { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#64ffda', marginTop: 4, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0f3460', marginBottom: 20 },

  label:    { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#222',
    marginBottom: 16,
    backgroundColor: '#fafafa',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  eyeBtn:   { padding: 14, marginLeft: 8 },
  eyeText:  { fontSize: 18 },

  btnPrimary: {
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled:    { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  tokenBadge: {
    marginTop: 14,
    backgroundColor: '#f0fff8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#b2f5e0',
  },
  tokenText: { color: '#1a7a4a', fontSize: 12, textAlign: 'center', fontWeight: '600' },

  linkRow:       { marginTop: 16, alignItems: 'center' },
  linkText:      { color: '#888', fontSize: 13 },
  linkHighlight: { color: '#e94560', fontWeight: '700' },
});
