import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const PLANS = [
  { id: 'free',       name: 'Free',       tokens: 50,    price: '$0',     period: '/month',  color: '#64ffda', features: ['50 tokens/month', '3D model generation', 'Basic support'] },
  { id: 'starter',    name: 'Starter',    tokens: 500,   price: '$9.99',  period: '/month',  color: '#e94560', features: ['500 tokens/month', '3D model generation', 'Simulation access', 'Priority support'] },
  { id: 'pro',        name: 'Pro',        tokens: 2000,  price: '$29.99', period: '/month',  color: '#ffd700', features: ['2000 tokens/month', 'Unlimited 3D models', 'Full simulation', '3D printer access', '24/7 support'] },
  { id: 'enterprise', name: 'Enterprise', tokens: 99999, price: 'Custom', period: '',        color: '#a78bfa', features: ['Unlimited tokens', 'Team collaboration', 'API access', 'Dedicated support', 'Custom features'] },
];

const TOPUPS = [
  { tokens: 100,  price: '$2.99'  },
  { tokens: 500,  price: '$9.99'  },
  { tokens: 1000, price: '$17.99' },
];

export default function SubscriptionScreen({ navigation }) {
  const { isDark, theme } = useTheme();
  const [loading, setLoading]       = useState(false);
  const [currentPlan] = useState('free');

  const handleSubscribe = (plan) => {
    if (plan.id === 'free') return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '🎉 Stripe Test Mode',
        `This is a demo payment for ${plan.name} plan.\n\nIn production, Stripe checkout would open here.\n\nTest card: 4242 4242 4242 4242`,
        [{ text: 'Got it!' }]
      );
    }, 1500);
  };

  const handleTopUp = (topup) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        '💳 Top-up Demo',
        `Stripe would charge ${topup.price} for ${topup.tokens} tokens.\n\nTest card: 4242 4242 4242 4242`,
        [{ text: 'Got it!' }]
      );
    }, 1000);
  };

  const s = makeStyles(isDark, theme);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Plans & Tokens</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Current balance */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>💎 Your Balance</Text>
          <Text style={s.balanceNum}>--</Text>
          <Text style={s.balanceSub}>tokens remaining</Text>
          <View style={s.planBadge}>
            <Text style={s.planBadgeText}>Current: {currentPlan.toUpperCase()} PLAN</Text>
          </View>
        </View>

        {/* Subscription Plans */}
        <Text style={s.sectionTitle}>📋 Subscription Plans</Text>
        {PLANS.map((plan) => (
          <View key={plan.id} style={[s.planCard, currentPlan === plan.id && s.planCardActive]}>
            {currentPlan === plan.id && (
              <View style={s.currentBadge}>
                <Text style={s.currentBadgeText}>✓ Current</Text>
              </View>
            )}
            <View style={s.planHeader}>
              <View style={[s.planDot, { backgroundColor: plan.color }]} />
              <Text style={s.planName}>{plan.name}</Text>
              <View style={{ flex: 1 }} />
              <Text style={s.planPrice}>{plan.price}</Text>
              <Text style={s.planPeriod}>{plan.period}</Text>
            </View>

            <Text style={s.planTokens}>
              {plan.tokens >= 99999 ? '∞ Unlimited' : `${plan.tokens.toLocaleString()} tokens/month`}
            </Text>

            <View style={s.featureList}>
              {plan.features.map((f, i) => (
                <Text key={i} style={s.featureItem}>✓ {f}</Text>
              ))}
            </View>

            {plan.id !== 'free' && plan.id !== currentPlan && (
              <TouchableOpacity
                style={[s.subscribeBtn, { backgroundColor: plan.color === '#ffd700' ? '#b8860b' : plan.color === '#a78bfa' ? '#7c3aed' : plan.color }]}
                onPress={() => handleSubscribe(plan)}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.subscribeBtnText}>
                      {plan.id === 'enterprise' ? 'Contact Us' : `Subscribe — ${plan.price}/mo`}
                    </Text>
                }
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Token Top-ups */}
        <Text style={s.sectionTitle}>⚡ One-time Token Top-up</Text>
        <View style={s.topupRow}>
          {TOPUPS.map((t, i) => (
            <TouchableOpacity key={i} style={s.topupCard} onPress={() => handleTopUp(t)}>
              <Text style={s.topupTokens}>+{t.tokens}</Text>
              <Text style={s.topupLabel}>tokens</Text>
              <Text style={s.topupPrice}>{t.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stripe note */}
        <View style={s.stripeNote}>
          <Text style={s.stripeNoteText}>
            🔒 Payments powered by Stripe (Test Mode){'\n'}
            No real charges — demo only
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (isDark, theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  topBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f3460', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:   { padding: 4 },
  backBtnText: { color: '#a8b2d8', fontSize: 14, fontWeight: '600' },
  topTitle:  { color: '#fff', fontSize: 16, fontWeight: '800' },
  scroll:    { padding: 16 },

  balanceCard: { backgroundColor: '#0f3460', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  balanceLabel:{ color: '#a8b2d8', fontSize: 13, marginBottom: 4 },
  balanceNum:  { fontSize: 56, fontWeight: '800', color: '#64ffda' },
  balanceSub:  { color: '#a8b2d8', fontSize: 12, marginTop: 4 },
  planBadge:   { marginTop: 12, backgroundColor: 'rgba(100,255,218,0.15)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(100,255,218,0.3)' },
  planBadgeText: { color: '#64ffda', fontSize: 11, fontWeight: '700' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 12 },

  planCard: { backgroundColor: theme.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1.5, borderColor: theme.cardBorder },
  planCardActive: { borderColor: '#64ffda' },
  currentBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#64ffda', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  currentBadgeText: { fontSize: 10, fontWeight: '800', color: '#0f3460' },
  planHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  planDot:     { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  planName:    { fontSize: 17, fontWeight: '800', color: theme.text },
  planPrice:   { fontSize: 20, fontWeight: '800', color: theme.text },
  planPeriod:  { fontSize: 12, color: theme.textSub, marginLeft: 2, marginTop: 4 },
  planTokens:  { fontSize: 13, color: '#64ffda', fontWeight: '700', marginBottom: 10 },
  featureList: { gap: 4, marginBottom: 14 },
  featureItem: { fontSize: 12, color: theme.textSub },
  subscribeBtn:{ borderRadius: 12, padding: 14, alignItems: 'center' },
  subscribeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  topupRow:    { flexDirection: 'row', gap: 10, marginBottom: 20 },
  topupCard:   { flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder },
  topupTokens: { fontSize: 22, fontWeight: '800', color: '#e94560' },
  topupLabel:  { fontSize: 11, color: theme.textSub, marginBottom: 6 },
  topupPrice:  { fontSize: 15, fontWeight: '700', color: theme.text },

  stripeNote:  { backgroundColor: isDark ? '#161b22' : '#f8f9fa', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder, marginBottom: 20 },
  stripeNoteText: { color: theme.textSub, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
