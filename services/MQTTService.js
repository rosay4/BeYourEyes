// services/MQTTService.js
import mqtt from 'mqtt';

let client;

// --- 在这里配置你的 MQTT 服务器信息 ---
const BROKER_URL = 'ws://192.168.43.239:9001/mqtt'; // ！！必须替换成你的服务器地址
const TOPIC_TO_PUBLISH = 'LumiPet/pattern/set'; // 我们要发送数据到的主题

const options = {
  // clean: true, // true: 不接收离线消息
  // connectTimeout: 4000, // 超时时间
  username: 'mqtt', // 如果有用户名密码
  password: 'mqtt',
};
// ------------------------------------

class MQTTService {
  connect(callbacks = {}) {
    const { onConnect, onError, onClose } = callbacks;
    
    if (client && client.connected) {
      if (onConnect) onConnect(client);
      return;
    }

      client = mqtt.connect(BROKER_URL, options);
    
      client.on('connect', () => {
      console.log('MQTT 连接成功!');
      if (onConnect) onConnect(client);
    });

    client.on('error', (err) => {
      console.error('MQTT 连接错误: ', err);
      if (onError) onError(err);
      client.end(); // 出错时也确保关闭
    });

    // !! 关键新增：监听 'close' 事件
    client.on('close', () => {
      console.log('MQTT 连接已关闭。');
      if (onClose) onClose();
    });
  }

  publish(topic, message) {
    if (client && client.connected) {
      client.publish(topic, message, { qos: 0 }, (error) => {
        if (error) {
          console.error('发布失败:', error);
        } else {
          console.log(`成功发布消息到主题 [${topic}]:`, message);
        }
      });
    } else {
      console.error('MQTT 未连接，无法发布消息。');
    }
  }

  disconnect() {
    if (client) {
      client.end();
      client = null;
    }
  }
}

// 导出单例，确保整个 App 只有一个 MQTT 服务实例
export default new MQTTService();