// app/(tabs)/device.tsx

import { Image } from 'expo-image'; // 1. 导入 expo-image 的 Image 组件
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Provider as PaperProvider, Switch, Text, Title } from 'react-native-paper';

export default function DeviceScreen() {
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    <PaperProvider>
      <View style={styles.container}>

        {/* 2. 将 GIF 放置在页面的视觉中心 */}
        <View style={styles.gifContainer}>
          <Image
            style={styles.gif}
            source={require('@/assets/images/device_rotation.gif')}
            contentFit="contain" // 确保 GIF 完整显示不被裁剪
            transition={80} // 图片加载时有一个1秒的淡入效果，更平滑
          />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>我的光影宠物</Title>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>状态: 未连接</Text>
              <Text style={styles.statusText}>电量: --%</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="投影控制" />
          <Card.Content>
            <View style={styles.controlRow}>
              <Text style={styles.controlText}>激光投影</Text>
              <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
            </View>
          </Card.Content>
        </Card>

      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // 增加顶部内边距，给GIF留出空间
    backgroundColor: '#cdced2ff',
  },
  // 3. 为 GIF 添加样式
  gifContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gif: {
    width: 400,
    height: 200,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: 16,
    color: '#555',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  controlText: {
    fontSize: 18,
  },
});