import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { useAuth }  from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTokenBalance } from '../../services/api';

export default function HomeScreen({ navigation }) {
  const { user, isGuest, logout }  = useAuth();
  const { isDark, theme, toggleTheme } = useTheme();
  const [tokenBalance, setTokenBalance] = useState(isGuest ? 10 : 50);

  // Load real token balance from backend
  useEffect(() => {
    getTokenBalance()
      .then((data) => setTokenBalance(data.balance))
      .catch(() => {});
  }, []);

  // Refresh balance when screen comes back into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getTokenBalance()
        .then((data) => setTokenBalance(data.balance))
        .catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => { await logout(); };

  const s = makeStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>
              Welcome, {isGuest ? 'Guest' : (user?.displayName || 'User')} 👋
            </Text>
            <Text style={s.subGreeting}>
              {isGuest
                ? 'Create an account to unlock 50 free tokens!'
                : 'Start designing your dream home today.'}
            </Text>
          </View>

          {/* Dark mode toggle */}
          <View style={s.themeToggle}>
            <Text style={s.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: '#0f3460' }}
              thumbColor={isDark ? '#64ffda' : '#e94560'}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>
        </View>

        {/* Top action row */}
        <View style={s.topRow}>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>🚪 Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Token Balance Card */}
        <View style={s.tokenCard}>
          <Text style={s.tokenLabel}>💎 Your Token Balance</Text>
          <Text style={s.tokenCount}>{tokenBalance}</Text>
          <Text style={s.tokenSub}>
            {isGuest ? 'Guest trial tokens' : 'Use tokens to generate designs'}
          </Text>
          {isGuest && (
            <TouchableOpacity
              style={s.upgradeBtn}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={s.upgradeBtnText}>Create Account → Get 50 Tokens 🎁</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section Title */}
        <Text style={s.sectionTitle}>What would you like to build?</Text>

        {/* Action Cards */}
        <View style={s.actionGrid}>
          <TouchableOpacity
            style={s.actionCard}
            onPress={() => navigation.navigate('Prompt')}
          >
            <Text style={s.actionIcon}>✏️</Text>
            <Text style={s.actionTitle}>Design by Prompt</Text>
            <Text style={s.actionDesc}>Describe your home in words</Text>
            <View style={s.costBadge}>
              <Text style={s.costBadgeText}>5 tokens</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.actionCard}
            onPress={() => navigation.navigate('DesignForm')}
          >
            <Text style={s.actionIcon}>📋</Text>
            <Text style={s.actionTitle}>Guided Form</Text>
            <Text style={s.actionDesc}>Step-by-step room builder</Text>
            <View style={s.costBadge}>
              <Text style={s.costBadgeText}>5 tokens</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionCard, s.actionCardWide]}
            onPress={() => navigation.navigate('MyModels')}
          >
            <Text style={s.actionIcon}>📁</Text>
            <Text style={s.actionTitle}>My Models</Text>
            <Text style={s.actionDesc}>View your saved designs</Text>
            <View style={[s.costBadge, { backgroundColor: isDark ? '#1a3a1a' : '#f0fff0' }]}>
              <Text style={[s.costBadgeText, { color: '#2a7a2a' }]}>Free</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionCard, s.actionCardWide]}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={s.actionIcon}>💳</Text>
            <Text style={s.actionTitle}>Plans & Tokens</Text>
            <Text style={s.actionDesc}>Upgrade your plan or top up tokens</Text>
            <View style={[s.costBadge, { backgroundColor: isDark ? '#2a1a3a' : '#f5f0ff' }]}>
              <Text style={[s.costBadgeText, { color: '#7a2aaa' }]}>Stripe</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Coming Soon */}
        <View style={s.comingSoon}>
          <Text style={s.comingSoonText}>
            🖨️ 3D Printer Integration — Connect via WiFi/USB
          </Text>
        </View>

        {/* Theme info */}
        <View style={s.themeInfo}>
          <Text style={s.themeInfoText}>
            {isDark ? '🌙 Dark Mode is ON' : '☀️ Light Mode is ON'} — tap the toggle to switch
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Dynamic styles based on theme
const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  scroll:    { padding: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting:    { fontSize: 20, fontWeight: '800', color: theme.text },
  subGreeting: { fontSize: 13, color: theme.textSub, marginTop: 4 },

  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.card,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  themeIcon: { fontSize: 16 },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  logoutBtn: {
    backgroundColor: theme.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  logoutText: { color: theme.accent, fontWeight: '700', fontSize: 12 },

  tokenCard: {
    backgroundColor: theme.token,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
    alignItems: 'center',
  },
  tokenLabel: { color: '#a8b2d8', fontSize: 13, marginBottom: 4 },
  tokenCount: { fontSize: 56, fontWeight: '800', color: theme.tokenText },
  tokenSub:   { color: '#a8b2d8', fontSize: 12, marginTop: 4 },
  upgradeBtn: {
    marginTop: 14,
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  upgradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 14,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 18,
    width: '47%',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  actionCardWide: { width: '100%' },
  actionIcon:  { fontSize: 28, marginBottom: 8 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 4 },
  actionDesc:  { fontSize: 12, color: theme.textSub, marginBottom: 10 },
  costBadge: {
    backgroundColor: isDarkBadgeBg(theme),
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  costBadgeText: { fontSize: 11, color: theme.accent, fontWeight: '700' },

  comingSoon: {
    backgroundColor: theme.comingSoon,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.comingSoonBorder,
    marginBottom: 12,
  },
  comingSoonText: { color: theme.comingSoonText, fontSize: 12, textAlign: 'center', fontWeight: '600' },

  themeInfo: {
    backgroundColor: theme.badge,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.badgeBorder,
    marginBottom: 20,
    alignItems: 'center',
  },
  themeInfoText: { color: theme.badgeText, fontSize: 11, fontWeight: '600' },
});

// Helper
function isDarkBadgeBg(theme) {
  return theme.bg === '#0d1117' ? '#2a1010' : '#fff0f3';
}
