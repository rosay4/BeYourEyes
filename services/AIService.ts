// services/AIService.ts

// 注意这里我们从 'expo-constants' 读取环境变量
const API_KEY = process.env.EXPO_PUBLIC_MINIMAX_API_KEY;
const API_URL = "https://api.minimax.chat/v1/text/chatcompletion_v2"; // 已修正域名

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class AIService {
  async getChatCompletion(messages: ChatMessage[]): Promise<string> {
    if (!API_KEY) {
      throw new Error("MiniMax API Key 未配置！请检查你的 .env 文件。");
    }

    const headers = {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    };

    const payload = {
      "model": "abab5.5-chat", // 使用更新的模型，或你需要的模型
      "messages": messages,
      "stream": false
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API 请求失败，状态码: ${response.status}. 详情: ${errorBody}`);
      }

      const data = await response.json();
      
      if (data && data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      } else {
        throw new Error("API 返回了无效的数据结构。");
      }

    } catch (error) {
      console.error("调用 MiniMax API 时出错:", error);
      throw error; // 将错误继续抛出，让UI层处理
    }
  }
}

export default new AIService();