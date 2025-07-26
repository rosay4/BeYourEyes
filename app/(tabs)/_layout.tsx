// app/(tabs)/_layout.tsx
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

// 自定义带动画的 Tab 按钮
function CustomTabBarButton({ children, onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
      {focused && (
        <View style={{
          width: 6,
          height: 6,
          backgroundColor: '#007AFF',
          borderRadius: 3,
          marginTop: 4,
        }} />
      )}
    </Pressable>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return <Ionicons size={26} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8629ffff',
        headerShown: false,
        animation: 'shift',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 16,
          right: 16,
          borderRadius: 20,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          ...Platform.select({
            android: {
              overflow: 'hidden',
            },
          }),
        },
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="device"
        options={{
          title: '设备',
          tabBarIcon: ({ color }) => <TabBarIcon name="hardware-chip-outline" color={color} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="creator"
        options={{
          title: '创作',
          tabBarIcon: ({ color }) => <TabBarIcon name="brush-outline" color={color} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
            <Tabs.Screen
        name="ai_chat"
        options={{
          title: '助手',
          tabBarIcon: ({ color }) => <FontAwesome5 size={24} name="robot" color={color} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: '作品',
          tabBarIcon: ({ color }) => <TabBarIcon name="albums-outline" color={color} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings-outline" color={color} />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />
    </Tabs>
  );
}