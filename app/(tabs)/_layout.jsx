import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

// Palette de couleurs moderne
const MODERN_COLORS = {
  background: '#F9FAFB',
  backgroundDark: '#111827',
  primary: '#1E3A8A',
  primaryDark: '#1F2937',
  accent: '#10B981',
  text: '#111827',
  textDark: '#FFFFFF',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB'
};

const TabsLayout = () => {
  console.log("📱 Tabs Layout chargé");
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? MODERN_COLORS.primaryDark : MODERN_COLORS.primary
        },
        headerTintColor: MODERN_COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? MODERN_COLORS.backgroundDark : MODERN_COLORS.white,
          borderTopColor: MODERN_COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        },
        tabBarActiveTintColor: MODERN_COLORS.primary,
        tabBarInactiveTintColor: MODERN_COLORS.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        lazy: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="🏠" color={color} size={size} />
          ),
          headerTitle: 'CleanSpot',
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Signalements',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="📋" color={color} size={size} />
          ),
          headerTitle: 'Tes signalements',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="👤" color={color} size={size} />
          ),
          headerTitle: 'Ton profil',
        }}
      />
    </Tabs>
  );
};

// Simple icon component using emojis
const TabIcon = ({ name, color, size }) => {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: size || 24, color: color || '#666' }}>
      {name}
    </Text>
  );
};

export default TabsLayout;
