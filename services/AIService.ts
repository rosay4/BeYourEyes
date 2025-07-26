// services/AIService.ts

// 注意这里我们从 'expo-constants' 读取环境变量
const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJMS0RTIiwiVXNlck5hbWUiOiJMS0RTIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5NDg5MjQ5MTE3NTgwOTA2NTYiLCJQaG9uZSI6IjE5MzAxMzk2NjI3IiwiR3JvdXBJRCI6IjE5NDg5MjQ5MTE3NDk3MDIwNDgiLCJQYWdlTmFtZSI6IiIsIk1haWwiOiIiLCJDcmVhdGVUaW1lIjoiMjAyNS0wNy0yNyAwNDo1OTo1NSIsIlRva2VuVHlwZSI6MSwiaXNzIjoibWluaW1heCJ9.wYkthN1W5hJMeyHq8hJD1A9VjrpRZ92f5DgX95KQh3i4TUTjkZas1Y54PrpWYXajH-_Ob6OpzU_198JOTBF9v0c-TAn5w5FhP8msfq0KuAoZdsNzFIFTqqwc7p70HFt0sBkFLs4f3MqraxTNUCg9ttY6d0x7edt-7x_t5j0TkuCzdLVte4GBvxjiIhDK9itcU6ez-yCGjUu1gPnyOvBmkifxfpyX9pR84kssVs7H2GRYs4S4_iZvP8M-UrIww4c92fmNVOFsEpICiLiXm4913K4r90569joZoye22vtSZxjet8orf1267aJvBn2FF7Qi73PznXokP-kVQhDQOw7A9g";
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