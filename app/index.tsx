// app/index.tsx
import { Redirect } from 'expo-router';

export default function Index() {
  // 当 App 打开根路径 (/) 时，
  // 自动将用户重定向到 /device 页面。
  // /device 页面位于 (tabs) 文件夹下，所以它会自动被渲染在标签页布局中。
  return <Redirect href="/device" />;
}