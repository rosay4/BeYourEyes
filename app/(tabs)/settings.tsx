// app/(tabs)/settings.tsx
import SettingsListItem from '@/components/SettingsListItem'; // 导入我们创建的组件
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Appbar } from 'react-native-paper';

// --- 分组组件，用于视觉分隔 ---
const SettingsGroup: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.group}>
    {title && <Text style={styles.groupTitle}>{title.toUpperCase()}</Text>}
    <View style={styles.groupContainer}>
      {children}
    </View>
  </View>
);

export default function SettingsScreen() {
  // 临时性的点击处理函数，只弹出一个提示
  const handlePress = (featureName: string) => {
    Alert.alert("功能待开发", `${featureName} 功能正在全力开发中，敬请期待！`);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header elevated>
        <Appbar.Content title="设置" />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>

        {/* --- 分组 1: 硬件设置 --- */}
        <SettingsGroup title="硬件设置">
          <SettingsListItem
            icon="bluetooth-b"
            iconColor="#007AFF"
            label="蓝牙设备管理"
            onPress={() => handlePress("蓝牙管理")}
          />
          <SettingsListItem
            icon="lightbulb"
            iconColor="#FABB05"
            label="投影亮度与模式"
            onPress={() => handlePress("亮度与模式")}
          />
          <SettingsListItem
            icon="sync-alt"
            iconColor="#34A853"
            label="固件更新 (OTA)"
            onPress={() => handlePress("固件更新")}
          />
        </SettingsGroup>

        {/* --- 分组 2: 内容管理 --- */}
        <SettingsGroup title="内容管理">
          <SettingsListItem
            icon="file-import"
            iconColor="#34C759"
            label="导入动画"
            onPress={() => handlePress("导入动画")}
          />
          <SettingsListItem
            icon="trash"
            iconColor="#FF3B30"
            label="清空所有自创作品"
            onPress={() => handlePress("清空作品")}
          />
        </SettingsGroup>

        {/* --- 分组 3: 关于 --- */}
        <SettingsGroup title="关于">
          <SettingsListItem
            icon="info-circle"
            iconColor="#5856D6"
            label="关于 LumiPet"
            onPress={() => handlePress("关于 LumiPet")}
          />
          <SettingsListItem
            icon="star"
            iconColor="#FF9500"
            label="评价此应用"
            onPress={() => handlePress("评价应用")}
          />
          <SettingsListItem
            icon="comment-dots"
            iconColor="#8E8E93"
            label="反馈与建议"
            onPress={() => handlePress("反馈与建议")}
          />
        </SettingsGroup>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // 苹果设置页面的经典背景色
  },
  scrollViewContent: {
    paddingVertical: 20,
  },
  group: {
    marginBottom: 30,
  },
  groupTitle: {
    fontSize: 13,
    color: '#6D6D72',
    marginLeft: 16,
    marginBottom: 8,
  },
  groupContainer: {
    backgroundColor: '#fff',
    // 模拟分割线
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
});