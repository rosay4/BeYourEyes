// services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@LumiPetAnimations';

export interface AnimationData {
  fps: number;
  loop: boolean;
  frames: string[];
}

export interface SavedAnimation {
  id: string; // 用创建时的时间戳作为唯一ID
  name: string;
  createdAt: string;
  data: AnimationData;
}

class StorageService {
  async getMyAnimations(): Promise<SavedAnimation[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error("读取动画失败", e);
      return [];
    }
  }

  async saveAnimation(name: string, animationData: AnimationData): Promise<void> {
    try {
      const currentAnimations = await this.getMyAnimations();
      const newAnimation: SavedAnimation = {
        id: Date.now().toString(),
        name,
        createdAt: new Date().toISOString(),
        data: animationData,
      };
      const newAnimations = [...currentAnimations, newAnimation];
      const jsonValue = JSON.stringify(newAnimations);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("保存动画失败", e);
    }
  }

  async deleteAnimation(id: string): Promise<void> {
    try {
      const currentAnimations = await this.getMyAnimations();
      const newAnimations = currentAnimations.filter(anim => anim.id !== id);
      const jsonValue = JSON.stringify(newAnimations);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("删除动画失败", e);
    }
  }
   // **新增方法 1: 更新单个动画**
  async updateAnimation(updatedAnimation: SavedAnimation): Promise<void> {
    try {
      const currentAnimations = await this.getMyAnimations();
      const newAnimations = currentAnimations.map(anim =>
        anim.id === updatedAnimation.id ? updatedAnimation : anim
      );
      const jsonValue = JSON.stringify(newAnimations);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("更新动画失败", e);
    }
  }

  // **新增方法 2: 保存整个动画数组**
  async saveAllAnimations(animations: SavedAnimation[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(animations);
      await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error("保存整个列表失败", e);
    }
  }
}

export default new StorageService();