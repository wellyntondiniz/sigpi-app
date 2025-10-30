import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="imoveis"
        options={{
          title: 'Imóveis',
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alugueis" // sem acento para casar com o arquivo
        options={{
          title: 'Aluguéis',
          tabBarIcon: ({ color, size }) => <Ionicons name="key" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size ?? 24} color={color} />,
        }}
      />
    </Tabs>
  );
}
