// app/(tabs)/store.tsx
import StorageService, { SavedAnimation } from '@/services/StorageService';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'; // 1. 导入 Hook
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Appbar, Button, Card, Dialog, IconButton, Provider as PaperProvider, Portal, TextInput } from 'react-native-paper';

// --- 小型动画播放器组件，用于卡片预览 ---
const MiniPlayer = ({ framesData }: { framesData: string[] }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const frames = framesData.map(f => f.split(',').map(r => r.split('').map(Number)));
    if (frames.length <= 1) return;
    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % frames.length);
    }, 150); // 固定一个较慢的预览速度
    return () => clearInterval(interval);
  }, [framesData]);

  const currentFrame = framesData[frameIndex]?.split(',').map(r => r.split('').map(Number));
  
  if (!currentFrame) return <View style={styles.miniPlayer} />;

  return (
    <View style={styles.miniPlayer}>
      {currentFrame.map((row, rIdx) => (
        <View key={rIdx} style={{ flex: 1, flexDirection: 'row' }}>
          {row.map((cell, cIdx) => (
            <View key={cIdx} style={{ flex: 1, backgroundColor: cell === 1 ? '#f3d22fff' : '#34495e', borderRadius: 10, margin: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
};


export default function StoreScreen() {
  const [myAnimations, setMyAnimations] = useState<SavedAnimation[]>([]);
  const [editingAnimation, setEditingAnimation] = useState<SavedAnimation | null>(null);
  const router = useRouter();
  const [newName, setNewName] = useState('');
  const tabBarHeight = useBottomTabBarHeight();

  // 使用 useFocusEffect, 确保每次进入该页面都会刷新列表
  useFocusEffect(
    useCallback(() => {
      loadAnimations();
    }, [])
  );

  const loadAnimations = async () => {
    const animations = await StorageService.getMyAnimations();
    setMyAnimations(animations.reverse()); // 让最新的显示在最前面
  };

    // --- 重命名逻辑 ---
  const handleOpenRenameDialog = (animation: SavedAnimation) => {
    setEditingAnimation(animation);
    setNewName(animation.name);
  };
  
  const handleRenameConfirm = async () => {
    if (!editingAnimation || !newName.trim()) return;
    const updatedAnimation = { ...editingAnimation, name: newName.trim() };
    await StorageService.updateAnimation(updatedAnimation);
    setEditingAnimation(null);
    loadAnimations();
  };

  const handleApply = (animation: SavedAnimation) => {
    const animationJson = JSON.stringify(animation);
    router.replace({ pathname: '/(tabs)/creator', params: { importedAnimation: animationJson } });
  };

  const handleDelete = (animation: SavedAnimation) => {
    Alert.alert(
      "确认删除",
      `你确定要删除动画 "${animation.name}" 吗？此操作不可撤销。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除", style: "destructive",
          onPress: async () => {
            await StorageService.deleteAnimation(animation.id);
            loadAnimations(); // 重新加载列表
          }
        }
      ]
    );
  };
    // --- 关键：为 DraggableFlatList 定义渲染项 ---
  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<SavedAnimation>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={[styles.cardContainer, { backgroundColor: isActive ? '#e0e0e0' : 'transparent' }]}
        >
          <Card style={styles.card}>
            <Card.Title
              title={item.name}
              titleNumberOfLines={1}
              subtitle={`创建于 ${new Date(item.createdAt).toLocaleDateString()}`}
              left={(props) => <IconButton {...props} icon="drag-vertical" size={28} disabled />}
              right={(props) => (
                <View style={{flexDirection: 'row'}}>
                  <IconButton {...props} icon="pencil" onPress={() => handleOpenRenameDialog(item)} />
                  <IconButton {...props} icon="delete" onPress={() => handleDelete(item)} />
                </View>
              )}
            />
            <Card.Content style={styles.cardContent}>
              <MiniPlayer framesData={item.data.frames} />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleApply(item)}
                textColor="#ffffffff">应用到编辑器</Button>
            </Card.Actions>
          </Card>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, []);

   return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header elevated>
          <Appbar.Content title="我的作品" subtitle={`${myAnimations.length} 个已保存`} titleStyle={{fontWeight:'bold'}} />
        </Appbar.Header>

        <DraggableFlatList
          data={myAnimations}
          onDragEnd={({ data }) => {
            setMyAnimations(data); // 立即更新UI，提供流畅反馈
            StorageService.saveAllAnimations(data); // 在后台保存新顺序
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.list,{ paddingBottom: tabBarHeight + 130 }]}
          ListEmptyComponent={<Text style={styles.emptyText}>还没有任何作品，快去创作一个吧！</Text>}
        />

        {/* --- 重命名对话框 --- */}
        <Portal>
          <Dialog visible={!!editingAnimation} onDismiss={() => setEditingAnimation(null)}>
            <Dialog.Title>重命名动画</Dialog.Title>
            <Dialog.Content>
              <TextInput label="新名称" value={newName} onChangeText={setNewName} mode="outlined" />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditingAnimation(null)}>取消</Button>
              <Button onPress={handleRenameConfirm}>确认</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  list: { padding: 10 },
  cardContainer: { borderRadius: 12, marginVertical: 8 },
  card: { marginVertical: 8, backgroundColor: '#d9bcffc0' },
  cardContent: { alignItems: 'center', paddingVertical: 10 },
  miniPlayer: { width: 100, height: 100, backgroundColor: '#2c3e50', borderWidth: 2, borderColor: '#bdc3c7' },
  emptyText: { marginTop: 50, textAlign: 'center', fontSize: 16, color: '#7f8c8d' },
});