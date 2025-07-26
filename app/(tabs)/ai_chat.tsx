// app/(tabs)/ai_chat.tsx

import AIService, { ChatMessage } from '@/services/AIService';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Appbar, IconButton, Provider as PaperProvider, Snackbar, TextInput } from 'react-native-paper';

export default function AIChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'MM-Chat is a large language model from MiniMax.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const TAB_BAR_HEIGHT = 50;

  // --- 这是被恢复的、完整的 handleSend 函数 ---
  const handleSend = useCallback(async () => {
    // 1. 如果正在加载或者输入框为空，则直接返回，不做任何事
    if (isLoading || !inputText.trim()) {
      return;
    }

    // 2. 创建一条新的用户消息
    const newUserMessage: ChatMessage = { role: 'user', content: inputText.trim() };
    
    // 3. 将新消息添加到当前消息列表，并立即更新UI
    //    这里使用函数式更新，以确保我们总是在最新的状态上进行修改
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    // 4. 清空输入框，并设置加载状态为 true
    setInputText('');
    setIsLoading(true);
    setError(null); // 清除之前的错误信息

    try {
      // 5. 调用 AI 服务获取回复。注意：我们传递的是包含新用户消息的完整列表
      const aiResponse = await AIService.getChatCompletion(updatedMessages);
      const newAiMessage: ChatMessage = { role: 'assistant', content: aiResponse.trim() };

      // 6. 将 AI 的回复添加到消息列表，更新UI
      setMessages(prev => [...prev, newAiMessage]);

    } catch (e: any) {
      // 7. 如果发生错误，记录错误信息以便 Snackbar 显示
      setError(e.message || '发生未知错误');
      // 可选：将用户刚刚发送失败的消息从列表中移除，或者标记为发送失败
      // 这里为了简单起见，我们暂时不处理，只显示错误提示
    } finally {
      // 8. 无论成功还是失败，最后都要将加载状态设为 false
      setIsLoading(false);
    }
  }, [inputText, messages, isLoading]); // 依赖项，确保函数能获取到最新的 state

  return (
    <PaperProvider>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} 
      >
        <Appbar.Header elevated>
          <Appbar.Content title="智能助手" subtitle="由 MiniMax 驱动" />
        </Appbar.Header>

        <FlatList
          data={messages.filter(msg => msg.role !== 'system')}
          renderItem={({ item }) => (
            <View style={[styles.messageContainer, item.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer]}>
              <Text style={item.role === 'user' ? styles.userMessageText : styles.assistantMessageText}>{item.content}</Text>
            </View>
          )}
          keyExtractor={(item, index) => `${item.role}-${index}`} // 使用更稳定的 key
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
        //   inverted
        />
        
        {isLoading && <ActivityIndicator style={styles.loadingIndicator} />}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="和我说点什么吧..."
            mode="outlined"
            multiline
            disabled={isLoading} // 当正在加载时，禁用输入框
          />
          <IconButton
            icon="send"
            size={24}
            mode="contained"
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          />
        </View>
           <View style={{ height: TAB_BAR_HEIGHT }} />
        <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={5000} action={{label: '重试', onPress: handleSend}}>
          {error}
        </Snackbar>

      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

// ... 样式代码和之前一样 ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f7' },
  chatArea: { flex: 1 },
  chatContent: { paddingVertical: 10, paddingHorizontal: 10 },
  messageContainer: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 30 },
  userMessageContainer: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  assistantMessageContainer: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E5E5EA' },
  userMessageText: { fontSize: 16, color: 'white' },
  assistantMessageText: { fontSize: 16, color: 'black' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA', backgroundColor: '#FFFFFF' },
  textInput: { flex: 1, marginRight: 10, backgroundColor: '#f0f2f7' },
  loadingIndicator: { marginVertical: 10 },
});