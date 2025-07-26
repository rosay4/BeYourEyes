// hooks/useMiniMaxSocket.ts
import { useEffect, useRef, useState } from 'react';

// 定义消息的数据结构
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

// 定义 WebSocket 连接状态
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// MiniMax API 的配置接口
interface MiniMaxConfig {
  groupId: string;
  botId: string;
  apiKey: string;
}

export const useMiniMaxSocket = ({ groupId, botId, apiKey }: MiniMaxConfig) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // --- 1. 建立连接 ---
    const url = `wss://api.minimax.chat/v1/text/chatcompletion_v2?GroupId=${groupId}&BotId=${botId}`;
    
    setConnectionStatus('connecting');
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log("WebSocket 连接成功！");
      setConnectionStatus('connected');
    };

    // --- 2. 监听消息 ---
    ws.current.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);

      // 检查是否有错误信息
      if (receivedData.base_resp && receivedData.base_resp.status_code !== 0) {
        console.error("MiniMax API Error:", receivedData.base_resp.status_msg);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: `出错了: ${receivedData.base_resp.status_msg}`, sender: 'bot' }]);
        setIsTyping(false);
        return;
      }

      // 处理流式响应
      if (receivedData.reply && receivedData.choices) {
        setIsTyping(false); // 收到回复，停止“输入中”状态
        const fullReply = receivedData.choices[0].messages[0].text;
        
        // 更新最后一条机器人的消息
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot') {
            lastMessage.text = fullReply; // 用完整的回复覆盖
          }
          return newMessages;
        });
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket 错误:", error);
      setConnectionStatus('error');
      setIsTyping(false);
    };

    ws.current.onclose = () => {
      console.log("WebSocket 连接关闭。");
      setConnectionStatus('disconnected');
      setIsTyping(false);
    };

    // --- 3. 清理函数 ---
    return () => {
      ws.current?.close();
    };
  }, [groupId, botId]); // 当 ID 变化时重新连接

  // --- 4. 发送消息的函数 ---
  const sendMessage = (text: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) {
      console.error("WebSocket 未连接，无法发送消息。");
      return;
    }

    // 构造用户消息并更新UI
    const userMessage: ChatMessage = { id: Date.now().toString(), text, sender: 'user' };
    // 立即添加一个空的机器人消息占位符，用于接收流式回复
    const botPlaceholder: ChatMessage = { id: (Date.now() + 1).toString(), text: '...', sender: 'bot' };
    setMessages(prev => [...prev, userMessage, botPlaceholder]);
    setIsTyping(true);

    // 构造发送给 MiniMax 的完整请求体
    const requestPayload = {
      action: "chat",
      // 这是关键：将 API Key 作为请求体的一部分发送
      authorization: {
        "api_key": apiKey
      },
      messages: [{ "sender_type": "USER", "text": text }],
      bot_setting: [
        {
          "bot_name": "AI",
          "content": "你是 MiniMax 的 AI 智能助理"
        }
      ],
      stream: true, // 开启流式响应
      model: "abab5.5-chat"
    };

    ws.current.send(JSON.stringify(requestPayload));
  };

  return { messages, connectionStatus, isTyping, sendMessage };
};