import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

interface TabIconProps {
  label: string;
  symbol: string;
  focused: boolean;
}

function TabIcon({ label, symbol, focused }: TabIconProps) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.symbol, focused && styles.symbolFocused]}>{symbol}</Text>
      <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="classrooms"
        options={{
          title: 'Lớp học',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Lớp học" symbol="🏫" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="homeroom"
        options={{
          title: 'Chủ nhiệm',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Chủ nhiệm" symbol="🌟" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Học sinh',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Học sinh" symbol="👥" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Tài khoản" symbol="👤" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 62,
    paddingTop: 6,
    paddingBottom: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  symbolFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  labelFocused: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
