// app/(tabs)/creator.tsx

import MQTTService from '@/services/MQTTService';
import { Link } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, PanResponder, StyleSheet, Text, View
} from 'react-native';
import { Button, Provider as PaperProvider, Snackbar } from 'react-native-paper';

const createEmptyGrid = () => Array.from({ length: 8 }, () => Array(8).fill(0));

type MqttStatusType = '已连接' | '连接中...' | '连接失败' | '未连接';

const STATUS_COLORS: Record<MqttStatusType, string> = {
  '已连接': '#34A853', // 绿色
  '连接中...': '#FABB05', // 黄色
  '连接失败': '#EA4335', // 红色
  '未连接': '#7f8c8d', // 灰色
};

export default function CreatorScreen() {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [mqttStatus, setMqttStatus] = useState<MqttStatusType>('未连接');
  
  const canvasLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const lastUpdatedCell = useRef('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

    const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // --- 使用 useEffect 来管理 MQTT 连接的生命周期 ---
  useEffect(() => {
    setMqttStatus('连接中...');
    MQTTService.connect({
      onConnect: () => setMqttStatus('已连接'),
      onError: () => setMqttStatus('连接失败'),
      onClose: () => setMqttStatus('未连接'), // 核心修复！
    });

    // 返回一个清理函数，当组件卸载（用户离开屏幕）时会被调用
    return () => {
      MQTTService.disconnect();
    };
  }, []); // 空数组 [] 意味着这个 effect 只在组件首次加载时运行一次

  const handleClear = () => {
    setGrid(createEmptyGrid());
  };

  // const handleSend = () => {
  //   console.log("准备发送的图案数据:");
  //   const dataString = grid.map(row => row.join('')).join('\n');
  //   console.log(dataString);
  //   alert("图案数据已打印到你的电脑终端！");
  // };

  const handleSend = () => {
    if (mqttStatus !== '已连接') {
      showSnackbar('错误：MQTT 未连接，无法发送！');
      return;
    }
    const message = grid.map(row => row.join('')).join(',');
    MQTTService.publish('LumiPet/pattern/set', message);
    
    // !! 使用 Snackbar 替代 alert
    showSnackbar('图案数据已通过 MQTT 发送！');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        updateCellFromTouch(gestureState.x0, gestureState.y0);
      },
      onPanResponderMove: (evt, gestureState) => {
        updateCellFromTouch(gestureState.moveX, gestureState.moveY);
      },
      onPanResponderRelease: () => {
        lastUpdatedCell.current = '';
      },
    })
  ).current;

  const updateCellFromTouch = (touchX:number, touchY:number) => {
    const { x, y, width, height } = canvasLayout.current;
    const relativeX = touchX - x;
    const relativeY = touchY - y;

    if (relativeX >= 0 && relativeX <= width && relativeY >= 0 && relativeY <= height) {
      const colIndex = Math.floor(relativeX / (width / 8));
      const rowIndex = Math.floor(relativeY / (height / 8));

      // 确保行列索引在有效范围内 [0, 7]
      if (rowIndex < 0 || rowIndex > 7 || colIndex < 0 || colIndex > 7) return;

      const currentCellID = `${rowIndex}-${colIndex}`;
      if (lastUpdatedCell.current !== currentCellID) {
        lastUpdatedCell.current = currentCellID;
        
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => [...row]);
          
          // --- 核心修改在这里！ ---
          // 从“只点亮”逻辑，变为“切换亮暗”逻辑
          newGrid[rowIndex][colIndex] = newGrid[rowIndex][colIndex] === 0 ? 1 : 0; 
          // --- 修改结束 ---

          return newGrid;
        });
      }
    }
  };

  return (
<PaperProvider>
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLORS[mqttStatus] || '#000' }]} />
          <Text style={styles.statusText}>MQTT: {mqttStatus}</Text>
          {mqttStatus === '连接中...' && <ActivityIndicator size="small" style={{ marginLeft: 10 }} color="#000" />}
        </View>
      <Text style={styles.title}>创作画布</Text>

      <View
        style={styles.canvas}
        onLayout={(event) => { canvasLayout.current = event.nativeEvent.layout; }}
        {...panResponder.panHandlers}
      >
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cellValue, colIndex) => (
              <View
                key={colIndex}
                style={[styles.cell, cellValue === 1 ? styles.cellOn : styles.cellOff]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.toolbar}>
        <Button icon="delete-sweep" mode="contained" onPress={handleClear} style={styles.button}>清空</Button>
        <Button
          icon="send"
          mode="contained"
          onPress={handleSend}
          style={styles.button}
          // 当未连接时，禁用发送按钮
          disabled={mqttStatus !== '已连接'}
        >
          发送
        </Button>
        <Link href="/import" asChild>
        <Button
          icon="movie-open"
          mode="contained"
          style={styles.button}
        >
          导入
        </Button>
      </Link>
      </View>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000} // 持续3秒
          style={styles.snackbar}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </PaperProvider>
    );
}


// 样式代码保持不变...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  statusContainer: {
    position: 'absolute',
    top: 60, // 距离顶部安全距离
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 4, // Android 上的阴影
    shadowColor: '#000', // iOS 上的阴影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  canvas: {
    width: 320,
    height: 320,
    backgroundColor: '#2c3e50', // 更柔和的深色
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#bdc3c7'
  },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, margin: 2, borderRadius: 4 },
  cellOn: { backgroundColor: '#2ecc71' }, // 柔和的绿色
  cellOff: { backgroundColor: '#34495e' },
  toolbar: { flexDirection: 'row', marginTop: 25 },
  button: { marginHorizontal: 10, borderRadius: 20 },
  snackbar: {
    backgroundColor: '#34495e',
    marginBottom: 80, // 把它抬高，避免被底部导航栏遮挡
  }
});