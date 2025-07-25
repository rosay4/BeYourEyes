// app/(tabs)/device.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Provider as PaperProvider, Switch, Text, Title } from 'react-native-paper';

export default function DeviceScreen() {
  // 这是一个假数据，用来模拟开关的状态
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);

  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);

  return (
    // PaperProvider 是 react-native-paper 必须的
    <PaperProvider>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>我的光影宠物</Title>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>状态: 已连接</Text>
              <Text style={styles.statusText}>电量: 92%</Text>
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
            {/* 之后我们会在这里添加亮度和速度的滑块 */}
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
    backgroundColor: '#f0f2f5', // 换个柔和的背景色
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