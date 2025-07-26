/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#111827',
    background: '#f8fafc', // 柔和的白色背景
    tint: tintColorLight,
    icon: '#687980',
    tabIconDefault: '#687980',
    tabIconSelected: tintColorLight,
    card: '#ffffff', // 卡片颜色
    border: '#e2e8f0', // 边框颜色
    primary: '#3b82f6', // 主题蓝色
    accent: '#10b981', // 强调绿色 (成功/点亮)
    danger: '#ef4444', // 危险红色 (删除/失败)
  },
  dark: {
    text: '#ecf0f1',
    background: '#1e293b', // 深蓝灰背景
    tint: tintColorDark,
    icon: '#94a3b8',
    tabIconDefault: '#94a3b8',
    tabIconSelected: tintColorDark,
    card: '#334155', // 深色卡片
    border: '#475569', // 深色边框
    primary: '#60a5fa',
    accent: '#34d399',
    danger: '#f87171',
  },
};
