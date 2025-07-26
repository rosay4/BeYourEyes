// app/(tabs)/creator.tsx

import MQTTService, { TOPIC_ANIMATION_LIST_SET, TOPIC_ANIMATION_PLAY_SET } from '@/services/MQTTService'; // 使用路径别名，更清晰
import StorageService, { SavedAnimation } from '@/services/StorageService';
import Slider from '@react-native-community/slider'; // 导入滑块
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { Button, Dialog, IconButton, Provider as PaperProvider, Portal, Snackbar, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- 辅助函数与常量 ---
const createEmptyGrid = () => Array.from({ length: 8 }, () => Array(8).fill(0));
type MqttStatusType = '已连接' | '连接中...' | '连接失败' | '未连接';
const STATUS_COLORS: Record<MqttStatusType, string> = { '已连接': '#34A853', '连接中...': '#FABB05', '连接失败': '#EA4335', '未连接': '#7f8c8d' };

// --- 小组件：时间轴上的单帧预览 ---
const FramePreview = ({ frameData, isSelected }: { frameData: number[][], isSelected: boolean }) => (
  <View style={[styles.framePreview, isSelected && styles.framePreviewSelected]}>
    {frameData.map((row, rIdx) => (
      <View key={rIdx} style={styles.framePreviewRow}>
        {row.map((cell, cIdx) => (
          <View key={cIdx} style={[styles.framePreviewCell, cell === 1 && styles.framePreviewCellOn]} />
        ))}
      </View>
    ))}
  </View>
);

// --- 主屏幕组件 ---
export default function CreatorScreen() {
  // --- 状态管理 (State) ---
  const router = useRouter(); // 获取 router 实例
  const params = useLocalSearchParams();
  const [frames, setFrames] = useState<number[][][]>([createEmptyGrid()]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [mqttStatus, setMqttStatus] = useState<MqttStatusType>('未连接');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const insets = useSafeAreaInsets(); // 2. 在组件顶部调用 Hook
  const [currentAnimationName, setCurrentAnimationName] = useState<string | null>(null);

  // 动画播放器状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const animationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameIndexRef = useRef(currentFrameIndex);
  // 新增 Dialog 相关的 state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [animationName, setAnimationName] = useState('');
  
  // 画布与手势状态
  const canvasLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const lastUpdatedCell = useRef('');

  // --- 回调与副作用 (Callbacks & Effects) ---
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };
    useEffect(() => {
    frameIndexRef.current = currentFrameIndex;
  }, [currentFrameIndex]);

    useEffect(() => {
        setMqttStatus('连接中...');
        MQTTService.connect({
            onConnect: () => setMqttStatus('已连接'),
            onError: () => setMqttStatus('连接失败'),
            onClose: () => setMqttStatus('未连接'),
        });
        // 组件卸载时，自动断开连接
        return () => { MQTTService.disconnect(); };
    }, []);

      useEffect(() => {
        if (params.importedAnimation && typeof params.importedAnimation === 'string') {
            try {
                const imported: SavedAnimation  = JSON.parse(params.importedAnimation);
                if (imported && imported.data && Array.isArray(imported.data.frames)) {
                  const framesToLoad = imported.data.frames.map(f => f.split(',').map(r => r.split('').map(Number)));
                  setFrames(framesToLoad);
                   setFps(imported.data.fps);
                  setCurrentAnimationName(imported.name); // **记录名称**
                  setCurrentFrameIndex(0);
                  showSnackbar(`已加载: "${imported.name}"`);
                    router.setParams({ importedAnimation: undefined });
                }
            } catch (e) {
                console.error("解析导入的帧失败:", e);
                showSnackbar('错误：加载动画数据失败！');
            }
        }
    }, [params.importedAnimation]);

  // 动画播放器的核心逻辑
  useEffect(() => {
    if (isPlaying) {
      animationInterval.current = setInterval(() => {
        setCurrentFrameIndex(prevIndex => (prevIndex + 1) % frames.length);
      }, 1000 / fps);
    } else {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    }
    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, [isPlaying, fps, frames.length]);

  // --- 事件处理函数 ---
  const handlePlayPause = () => {
  // 1. 获取即将要变成的播放状态
  const nextIsPlayingState = !isPlaying;

  // 2. 如果即将要开始播放，则发送 MQTT 消息
  if (nextIsPlayingState) {
    if (mqttStatus === '已连接') {
      // MQTT 已连接：发送预览命令
      const nameToSend = currentAnimationName || `[预览]`;
      MQTTService.publish(TOPIC_ANIMATION_PLAY_SET, nameToSend);
    } else {
      // MQTT 未连接：只弹出一个无伤大雅的提示
      showSnackbar('MQTT 未连接，仅 App 内预览');
    }
  }
  
  // 3. 最后，执行状态更新
  setIsPlaying(nextIsPlayingState);
  };

  const handleCellUpdate = useCallback((rowIndex: number, colIndex: number) => {
    setFrames(prevFrames => {
      const newFrames = prevFrames.map(frame => frame.map(row => [...row]));
      const currentFrame = newFrames[currentFrameIndex];
      if (currentFrame && currentFrame[rowIndex] && currentFrame[rowIndex][colIndex] !== undefined) {
          currentFrame[rowIndex][colIndex] = currentFrame[rowIndex][colIndex] === 0 ? 1 : 0;
      }
      return newFrames;
    });
  }, [currentFrameIndex]);

  const addNewFrame = () => {
    setFrames(prevFrames => [...prevFrames, createEmptyGrid()]);
    setCurrentFrameIndex(frames.length); // 切换到新创建的帧
  };

  const deleteCurrentFrame = () => {
    if (frames.length <= 1) {
      showSnackbar("不能删除最后一帧！");
      return;
    }
    setFrames(prevFrames => {
      const newFrames = prevFrames.filter((_, index) => index !== currentFrameIndex);
      setCurrentFrameIndex(prevIndex => Math.max(0, prevIndex - 1));
      return newFrames;
    });
  };

  const clearCurrentFrame = () => {
    setFrames(prevFrames => {
      const newFrames = [...prevFrames];
      newFrames[currentFrameIndex] = createEmptyGrid();
      return newFrames;
    });
    showSnackbar(`第 ${currentFrameIndex + 1} 帧已清空`);
  };

  // 新增保存逻辑
  const handleSave = async () => {
    if (!animationName.trim()) {
      showSnackbar("动画名称不能为空！");
      return;
    }
    const animationData = { fps, loop: true, frames: frames.map(grid => grid.map(row => row.join('')).join(',')) };
    await StorageService.saveAnimation(animationName, animationData);
    setCurrentAnimationName(animationName);
    setDialogVisible(false);
    setAnimationName('');
    showSnackbar(`动画 "${animationName}" 已保存！`);
  };

  const sendAnimation = () => {
    if (mqttStatus !== '已连接') { showSnackbar('错误：MQTT 未连接!'); return; }
    const nameToSend = currentAnimationName || `[预览] 未命名动画`;
    const animationData = { name: nameToSend, fps, frames: frames.map(grid => grid.map(row => row.join('')).join(',')) };
    const message = JSON.stringify(animationData);
    MQTTService.publish(TOPIC_ANIMATION_LIST_SET, message);
    showSnackbar('动画数据已通过 MQTT 发送！');
  };

  // --- 手势响应器 ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => updateCellFromTouch(gestureState.x0, gestureState.y0),
      onPanResponderMove: (evt, gestureState) => updateCellFromTouch(gestureState.moveX, gestureState.moveY),
      onPanResponderRelease: () => { lastUpdatedCell.current = ''; },
    })
  ).current;

  const updateCellFromTouch = (touchX: number, touchY: number) => {
    const { x, y, width, height } = canvasLayout.current;
    if (!width || !height) return;
    const relativeX = touchX - x; const relativeY = touchY - y;
    if (relativeX >= 0 && relativeX <= width && relativeY >= 0 && relativeY <= height) {
      const colIndex = Math.floor(relativeX / (width / 8));
      const rowIndex = Math.floor(relativeY / (height / 8));
      if (rowIndex < 0 || rowIndex > 7 || colIndex < 0 || colIndex > 7) return;
      const currentCellID = `${rowIndex}-${colIndex}`;
      if (lastUpdatedCell.current !== currentCellID) {
        lastUpdatedCell.current = currentCellID;
               setFrames(prevFrames => {
           // --- 性能优化开始 ---

          // 1. 创建一个新的 frames 数组的浅拷贝 (只复印书的目录)
          const newFrames = [...prevFrames]; 
          
          // 2. 从 Ref 读取正确的、当前的帧索引
          const indexToUpdate = frameIndexRef.current;
          
          // 3. 检查要更新的帧是否存在
          if (!newFrames[indexToUpdate]) return prevFrames; // 如果不存在，直接返回旧状态

          // 4. 只对需要修改的那一帧进行深拷贝 (只复印我们要修改的那一页)
          const frameToUpdate = newFrames[indexToUpdate].map(row => [...row]);
          
          // 5. 在新复印的这一页上进行修改
          if (frameToUpdate[rowIndex] && frameToUpdate[rowIndex][colIndex] !== undefined) {
            frameToUpdate[rowIndex][colIndex] = frameToUpdate[rowIndex][colIndex] === 0 ? 1 : 0;
          }
          
          // 6. 把修改好的新页面，放回到新目录的正确位置
          newFrames[indexToUpdate] = frameToUpdate;
          
          // 7. 返回这个高效更新后的新目录
          return newFrames; 
        });
      }
    }
  };

  // --- 渲染 (Render) ---
  return (
    <PaperProvider>
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLORS[mqttStatus] }]} />
          <Text style={styles.statusText}>MQTT: {mqttStatus}</Text>
          {mqttStatus === '连接中...' && <ActivityIndicator size="small" style={{ marginLeft: 10 }} color="#000" />}
        </View>

        <Text style={styles.title}>动画编辑器</Text>

        <View style={styles.canvas} onLayout={(e) => { canvasLayout.current = e.nativeEvent.layout; }} {...panResponder.panHandlers}>
          {frames[currentFrameIndex]?.map((row, rIdx) => (
            <View key={rIdx} style={styles.row}>
              {row.map((cell, cIdx) => <View key={cIdx} style={[styles.cell, cell === 1 ? styles.cellOn : styles.cellOff]} />)}
            </View>
          ))}
        </View>

        {/* --- 动画时间轴 --- */}
        <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>时间轴 (当前第 {currentFrameIndex + 1} / {frames.length} 帧)</Text>
            <View style={styles.timelineContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {frames.map((frame, index) => (
                        <TouchableOpacity key={index} onPress={() => setCurrentFrameIndex(index)}>
                            <FramePreview frameData={frame} isSelected={index === currentFrameIndex} />
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.addFrameButton} onPress={addNewFrame}>
                        <IconButton icon="plus" iconColor="#fff" size={30} />
                    </TouchableOpacity>
                </ScrollView>
                <IconButton icon="delete" style={styles.deleteFrameButton} size={20} onPress={deleteCurrentFrame} />
            </View>
        </View>

        {/* --- 播放器控制 --- */}
        <View style={styles.playerSection}>
            <Text style={styles.sectionTitle}>播放器</Text>
            <View style={styles.playerControls}>
                <Button icon={isPlaying ? "pause" : "play"} mode="contained-tonal" onPress={handlePlayPause}>
                    {isPlaying ? "暂停" : "播放"}
                </Button>
                <View style={styles.sliderContainer}>
                    <Text>速度 (FPS): {fps}</Text>
                    <Slider
                        style={{ width: 180, height: 40 }}
                        minimumValue={1}
                        maximumValue={24}
                        step={1}
                        value={fps}
                        onValueChange={setFps}
                    />
                </View>
            </View>
        </View>
        
        {/* --- 主工具栏 --- */}
        <View style={[styles.toolbar, { bottom: insets.bottom + 150 }]}>
          <Button icon="delete-sweep" onPress={clearCurrentFrame}>清空本帧</Button>
          <Button icon="sync" mode="contained" onPress={sendAnimation} disabled={mqttStatus !== '已连接'}>同步</Button>
          <Button icon="content-save" onPress={() => setDialogVisible(true)}>保存</Button>
          <Link href="/import" asChild>
            <Button icon="movie-open">导入</Button>
          </Link>
        </View>
         {/* --- 保存对话框 --- */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>保存动画</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="为你的动画取个名字"
              value={animationName}
              onChangeText={setAnimationName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>取消</Button>
            <Button onPress={handleSave}>保存</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

        <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={styles.snackbar}>
          {snackbarMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
}

// --- 样式表 (Stylesheet) ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', backgroundColor: '#f0f2f5', paddingTop: 90 },
  statusContainer: { position: 'absolute', top: 45, flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statusText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15 },
  canvas: { width: 320, height: 320, backgroundColor: '#2c3e50', borderRadius: 12, borderWidth: 4, borderColor: '#bdc3c7' },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, margin: 2, borderRadius: 20 },
  cellOn: { backgroundColor: '#f3d22fff' },
  cellOff: { backgroundColor: '#34495e' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start', marginLeft: 20, marginBottom: 5 },
  timelineSection: { width: '100%', marginTop: 15 },
  timelineContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20 },
  framePreview: { width: 60, height: 60, backgroundColor: '#7f8c8d', borderRadius: 6, padding: 4, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  framePreviewSelected: { borderColor: '#3498db' },
  framePreviewRow: { flex: 1, flexDirection: 'row' },
  framePreviewCell: { flex: 1, borderRadius: 5, margin: 0.5, backgroundColor: '#34495e' },
  framePreviewCellOn: { backgroundColor: '#2ecc71' },
  addFrameButton: { width: 60, height: 60, borderRadius: 6, backgroundColor: '#95a5a6', justifyContent: 'center', alignItems: 'center' },
  deleteFrameButton: { backgroundColor: '#e74c3c', borderRadius: 20, marginLeft: 5 },
  playerSection: { width: '100%', marginTop: 15, paddingHorizontal: 20 },
  playerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderContainer: { alignItems: 'center' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', position: 'absolute', paddingHorizontal: 10,},
  snackbar: { backgroundColor: '#34495e', marginBottom: 80 },
});