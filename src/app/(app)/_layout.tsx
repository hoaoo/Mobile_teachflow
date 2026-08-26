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
      <Stack.Screen
        name="attendance/index"
        options={{
          headerShown: true,
          title: 'Điểm danh & Chuyên cần',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="lesson-plans/index"
        options={{
          headerShown: true,
          title: 'Kế hoạch bài dạy (Giáo án)',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="lesson-plans/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết giáo án',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="lesson-plans/create"
        options={{
          headerShown: true,
          title: 'Soạn giáo án mới',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="lesson-plans/edit"
        options={{
          headerShown: true,
          title: 'Chỉnh sửa giáo án',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="worksheets/index"
        options={{
          headerShown: true,
          title: 'Phiếu học tập & Bài tập',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="worksheets/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết phiếu học tập',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="worksheets/create"
        options={{
          headerShown: true,
          title: 'Tạo phiếu học tập mới',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="worksheets/edit"
        options={{
          headerShown: true,
          title: 'Chỉnh sửa phiếu học tập',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="assessments/index"
        options={{
          headerShown: true,
          title: 'Đánh giá học sinh',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="assessments/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết đợt đánh giá',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="assessments/create"
        options={{
          headerShown: true,
          title: 'Tạo đợt đánh giá mới',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="resources/index"
        options={{
          headerShown: true,
          title: 'Học liệu & Tài nguyên',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="resources/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết tài nguyên',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="resources/create"
        options={{
          headerShown: true,
          title: 'Thêm tài nguyên mới',
          headerBackTitle: 'Hủy',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="ai/index"
        options={{
          headerShown: true,
          title: '✨ Trợ lý AI TeachFlow',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="ai/chat"
        options={{
          headerShown: true,
          title: '💬 Hỏi đáp Trợ lý Sư phạm',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="ai/activity"
        options={{
          headerShown: true,
          title: '🎯 Thiết kế Hoạt động Dạy học',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="ai/student-comment"
        options={{
          headerShown: true,
          title: '✍️ Gợi ý Nhận xét Học sinh',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="ai/homeroom-summary"
        options={{
          headerShown: true,
          title: '🌟 Báo cáo Nề nếp Chủ nhiệm',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
      <Stack.Screen
        name="ai/questions"
        options={{
          headerShown: true,
          title: '❓ Ngân hàng Câu hỏi Bloom',
          headerBackTitle: 'Quay lại',
          headerTintColor: '#0284C7',
          headerTitleStyle: { fontWeight: '700', color: '#0F172A' },
        }}
      />
    </Stack>
  );
}
