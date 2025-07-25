// app/import.tsx

import Slider from '@react-native-community/slider';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { Dimensions, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ActivityIndicator, Button, Provider as PaperProvider } from 'react-native-paper';
import VideoProcessingService from '../services/VideoProcessingService';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ImportScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | {}>({});
  const [durationMillis, setDurationMillis] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false); 
  
  const videoPlayer = useRef<Video>(null);

  // 1. 选择视频的函数
  const pickVideo = async () => {
    // 请求相册权限
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("你需要授权才能访问相册！");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false, // 禁止编辑，我们自己处理
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      // 选择新视频后重置时间
      setStartTime(0);
    }
  };
  
  // 2. 格式化时间显示的辅助函数
  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 3. 处理下一步的函数 (目前只打印信息)
  const handleNextStep = async () => {
    if (!videoUri) return;
    
    setIsLoading(true); // 开始加载
    try {
      const startTimeInSeconds = startTime / 1000;
      const frameUris = await VideoProcessingService.extractFrames(videoUri, startTimeInSeconds);
      
      // 成功！
      setIsLoading(false);
      alert(`成功抽取出 ${frameUris.length} 帧图片！请在终端查看文件路径。`);
      console.log("抽取的帧URI列表:", frameUris);
      // 在下一阶段，我们会把这个 frameUris 传递给图像处理步骤
      
    } catch (error) {
      // 失败
      setIsLoading(false);
      alert("视频处理失败，请查看终端日志获取详情。");
      console.error("处理视频时发生错误:", error);
    }
  };

  return (
    <PaperProvider>
            {/* 加载动画的模态窗口 */}
      <Modal
        transparent={true}
        animationType="none"
        visible={isLoading}
      >
        <View style={styles.modalBackground}>
          <View style={styles.activityIndicatorWrapper}>
            <ActivityIndicator animating={true} color="#1E90FF" size="large" />
            <Text style={styles.loadingText}>正在处理视频...</Text>
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
                useNativeControls={false} // 我们自己做控制
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onPlaybackStatusUpdate={(newStatus) => {
                  setStatus(newStatus);
                  // 当视频加载完成时，获取总时长
                  if (newStatus.isLoaded) {
                    // 2. 如果是成功状态，TypeScript 现在就确定 newStatus 是 AVPlaybackStatusSuccess 类型
                    // 在这个代码块里，你可以安全地访问 durationMillis
                    setDurationMillis(newStatus.durationMillis || 0);
                } else {
                    // 3. 如果 isLoaded 是 false，说明是“失败”状态
                    // 在这个代码块里，你可以安全地访问 error
                    if (newStatus.error) {
                    console.error("视频加载失败:", newStatus.error);
                    // 你可以在这里设置一个错误状态，并在UI上显示给用户
                    }
                }
                }}
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
                maximumValue={Math.max(0, durationMillis - 2000)} // 确保选择范围不会超出视频总长
                value={startTime}
                onValueChange={(value) => setStartTime(value)}
                minimumTrackTintColor="#1E90FF"
                maximumTrackTintColor="#000000"
              />

              <View style={styles.buttonRow}>
                 <Button icon="replay" mode="outlined" onPress={pickVideo}>重新选择</Button>
                 <Button 
                    icon="arrow-right-bold-box" 
                    mode="contained" 
                    onPress={handleNextStep}
                    disabled={!videoUri}
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
    height: 120,
    width: 120,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 10
  }
});