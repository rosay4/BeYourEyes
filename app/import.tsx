// app/import.tsx

import { SavedAnimation } from '@/services/StorageService';
import VideoProcessingService from '@/services/VideoProcessingService';
import Slider from '@react-native-community/slider';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button, Provider as PaperProvider } from 'react-native-paper';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ImportScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('');
  const router = useRouter();
  
  const videoPlayer = useRef<Video>(null);

  // --- 视频选择逻辑 ---
  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("你需要授权才能访问相册！");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      setStartTime(0);
      setDurationMillis(result.assets[0].duration || 0); // 直接从 picker 结果获取时长，更快
    }
  };
  
  // --- 时间格式化 ---
  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- 视频处理与跳转核心逻辑 ---
  const handleNextStep = async () => {
    if (!videoUri) return;

    try {
      setLoadingText('正在抽取视频帧 (1/3)');
      setIsLoading(true);
      const startTimeInSeconds = startTime / 1000;
      const frameUris = await VideoProcessingService.extractFrames(videoUri, startTimeInSeconds);

      setLoadingText(`正在像素化 ${frameUris.length} 帧 (2/3)`);
      const processedFrames: string[] = [];

      for (const frameUri of frameUris) {
        const pixelData = await VideoProcessingService.pixelateImage(frameUri);
        
        let frameString = "";
        let rowString = "";
        pixelData.forEach((grayValue) => {
          rowString += grayValue > 128 ? '1' : '0';
          if (rowString.length === 8) {
            frameString += (frameString ? ',' : '') + rowString;
            rowString = "";
          }
        });
        processedFrames.push(frameString);
      }
      
      setLoadingText('处理完成！(3/3)');
      const tempDir = frameUris[0].substring(0, frameUris[0].lastIndexOf('/'));
      await FileSystem.deleteAsync(tempDir, { idempotent: true });
      
      // **核心修复：创建符合 SavedAnimation 规范的临时对象**
      const importedAnimation: SavedAnimation = {
        id: `imported_${Date.now()}`,
        name: "[导入] 未命名动画",
        createdAt: new Date().toISOString(),
        data: {
          fps: 8,
          loop: true,
          frames: processedFrames,
        }
      };
      
      const animationJson = JSON.stringify(importedAnimation);
      setIsLoading(false);

      // 传递完整的 SavedAnimation 对象
      router.replace({ pathname: '/(tabs)/creator', params: { importedAnimation: animationJson } });

    } catch (error) {
      setIsLoading(false);
      alert("视频处理失败，请查看终端日志获取详情。");
      console.error("处理视频时发生错误:", error);
    }
  };

  // --- 视频播放器状态更新回调 ---
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
      // 关键修复：使用类型守卫来安全地访问属性
      if (status.isLoaded) {
          // 在这个代码块里，TypeScript 知道 status 是 AVPlaybackStatusSuccess 类型
          setDurationMillis(status.durationMillis || 0);
      } else {
          if (status.error) {
              console.error("视频加载失败:", status.error);
              alert("视频加载失败，请尝试其他文件。");
              setVideoUri(null); // 加载失败则重置
          }
      }
  };

  return (
    <PaperProvider>
      <Modal transparent={true} animationType="fade" visible={isLoading}>
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator animating={true} color="#1E90FF" size="large" />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>从视频导入动画</Text>
        
        {!videoUri ? (
          <Button icon="video" mode="contained" onPress={pickVideo}>
            从相册选择视频
          </Button>
        ) : (
          <>
            <View style={styles.videoContainer}>
              <Video
                ref={videoPlayer}
                style={styles.video}
                source={{ uri: videoUri }}
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              />
            </View>

            <View style={styles.controlsContainer}>
              <Text style={styles.timeLabel}>视频总长: {formatTime(durationMillis)}</Text>
              <Text style={styles.timeLabel}>
                选择片段: <Text style={styles.bold}>{formatTime(startTime)}</Text> - <Text style={styles.bold}>{formatTime(startTime + 2000)}</Text>
              </Text>
              
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={Math.max(0, durationMillis - 2000)}
                value={startTime}
                onValueChange={setStartTime}
                minimumTrackTintColor="#1E90FF"
                maximumTrackTintColor="#000000"
              />

              <View style={styles.buttonRow}>
                 <Button icon="replay" mode="outlined" onPress={pickVideo}>重新选择</Button>
                 <Button 
                    icon="arrow-right-bold-box" 
                    mode="contained" 
                    onPress={handleNextStep}
                    disabled={isLoading || !videoUri}
                  >
                   下一步
                  </Button>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </PaperProvider>
  );
}

// ... 样式代码和之前完全一样 ...
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  videoContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.6, backgroundColor: '#000', marginBottom: 20 },
  video: { alignSelf: 'stretch', flex: 1 },
  controlsContainer: { width: '100%', paddingHorizontal: 10 },
  timeLabel: { textAlign: 'center', fontSize: 16, marginVertical: 5 },
  bold: { fontWeight: 'bold' },
  slider: { width: '100%', height: 40, marginVertical: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, width: '100%' },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  activityIndicatorWrapper: {
    backgroundColor: '#FFFFFF',
    height: 140, // 稍微增高以容纳更长的文字
    width: 140,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  loadingText: {
    marginTop: 15,
    textAlign: 'center'
  }
});