// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react'; // 1. 导入 useEffect
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// --- 这是我们新增的导入部分 ---
import initialAnimationsData from '@/assets/data/official_animations.json'; // 2. 确保你的文件名是这个
import StorageService, { SavedAnimation } from '@/services/StorageService';
// ------------------------------

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // --- 这是我们新增的核心逻辑 ---
  useEffect(() => {
    const initializeAppData = async () => {
      try {
        // 检查本地是否已经有任何动画
        const existingAnimations = await StorageService.getMyAnimations();
        
        // 如果没有任何动画 (说明是新用户或清除了数据)
        if (existingAnimations.length === 0) {
          console.log("检测到首次启动或数据为空，正在加载预设动画...");
          
          // 我们需要确保预设数据的格式是正确的
          // 这里的类型断言告诉 TypeScript 我们确定这个 JSON 文件的结构是正确的
          const animationsToLoad: SavedAnimation[] = initialAnimationsData as SavedAnimation[];
          
          // 将预设动画保存到本地存储
          await StorageService.saveAllAnimations(animationsToLoad);
          
          console.log(`${animationsToLoad.length} 个预设动画已成功加载。`);
        } else {
          console.log("用户已有数据，跳过预设加载。");
        }
      } catch (error) {
        console.error("初始化应用数据时出错:", error);
      }
    };

    // 只有当字体加载完成后，才执行初始化逻辑
    // 这样可以避免在App准备好之前就进行文件操作
    if (loaded) {
      initializeAppData();
    }
  }, [loaded]); // 3. 依赖于 `loaded` 状态
  // --- 逻辑结束 ---


  if (!loaded) {
    // 如果字体还没加载好，什么都不渲染 (启动画面会继续显示)
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});