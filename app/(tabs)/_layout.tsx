// app/(tabs)/_layout.tsx
import { MaterialIcons } from '@expo/vector-icons'; // 导入我们刚刚安装的图标库
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // 这里可以统一设置所有标签页的样式
        tabBarActiveTintColor: '#1E90FF', // 选中时的颜色
        headerShown: false, // 我们暂时不显示每个屏幕顶部的标题栏
      }}>
      <Tabs.Screen
        name="device" // 注意：这里的 name 必须和文件名完全对应
        options={{
          title: '设备', // 标签栏上显示的文字
          tabBarIcon: ({ color }) => <MaterialIcons name="devices" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="creator" // 对应 creator.tsx
        options={{
          title: '创作',
          tabBarIcon: ({ color }) => <MaterialIcons name="edit" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store" // 对应 store.tsx
        options={{
          title: '商店',
          tabBarIcon: ({ color }) => <MaterialIcons name="store" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings" // 对应 settings.tsx
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}