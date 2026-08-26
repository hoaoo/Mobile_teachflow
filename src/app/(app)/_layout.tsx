import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="classroom/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết lớp học',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="classroom/create"
        options={{
          headerShown: true,
          title: 'Tạo lớp học mới',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="student/[id]"
        options={{
          headerShown: true,
          title: 'Hồ sơ học sinh',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="student/create"
        options={{
          headerShown: true,
          title: 'Thêm học sinh mới',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
    </Stack>
  );
}
