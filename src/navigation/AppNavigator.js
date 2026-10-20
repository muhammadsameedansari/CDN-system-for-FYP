// App Navigator — decides which screen to show based on auth state
// Logged in → HomeScreen | Not logged in → Auth screens

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen          from '../screens/auth/LoginScreen';
import SignupScreen         from '../screens/auth/SignupScreen';
import HomeScreen           from '../screens/main/HomeScreen';
import DesignFormScreen     from '../screens/main/DesignFormScreen';
import PromptScreen         from '../screens/main/PromptScreen';
import ModelViewerScreen    from '../screens/main/ModelViewerScreen';
import MyModelsScreen       from '../screens/main/MyModelsScreen';
import SubscriptionScreen   from '../screens/main/SubscriptionScreen';

const Stack = createNativeStackNavigator();

// Loading spinner while Firebase checks auth state
function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color="#e94560" />
    </View>
  );
}

// Auth stack — shown when user is NOT logged in
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,          // no default header — custom UI
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login"  component={LoginScreen}  />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// App stack — shown when user IS logged in (or guest)
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home"         component={HomeScreen} />
      <Stack.Screen name="DesignForm"   component={DesignFormScreen} />
      <Stack.Screen name="Prompt"       component={PromptScreen} />
      <Stack.Screen name="ModelViewer"  component={ModelViewerScreen} />
      <Stack.Screen name="MyModels"     component={MyModelsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
    </Stack.Navigator>
  );
}

// Root navigator — switches between Auth and App stacks
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f3460',
  },
});
