// app/(tabs)/store.tsx
import { StyleSheet, Text, View } from 'react-native';

export default function StoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>宠物商店</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' }
});