// src/services/mqtt/client.ts
import mqtt, { MqttClient } from 'mqtt';
import fs from 'fs';
import config from '../../config/index.js';

interface MQTTConfig {
  brokerUrl: string;
  username: string;
  password: string;
  clientId: string;
  caCertPath?: string;
}

class MQTTClient {
  private client: MqttClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): Promise<MqttClient> {
    return new Promise((resolve, reject) => {
      const clientId = config.mqtt.clientId + Date.now();

      // 构建 MQTT 连接选项
      const options: mqtt.IClientOptions = {
        clientId,
        username: config.mqtt.username || undefined,
        password: config.mqtt.password || undefined,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        // 生产环境启用 TLS 证书验证
        rejectUnauthorized: config.nodeEnv === 'production',
      };

      // 如果配置了 CA 证书路径，读取并使用
      const caCertPath = (config.mqtt as MQTTConfig & { caCertPath?: string }).caCertPath;
      if (caCertPath) {
        try {
          options.ca = fs.readFileSync(caCertPath);
          // eslint-disable-next-line no-console
          console.log('Loaded MQTT CA certificate from:', caCertPath);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Failed to load MQTT CA certificate:', error);
          if (config.nodeEnv === 'production') {
            reject(new Error(`Failed to load MQTT CA certificate from ${caCertPath}`));
            return;
          }
        }
      }

      this.client = mqtt.connect(config.mqtt.brokerUrl, options);

      this.client.on('connect', () => {
        // eslint-disable-next-line no-console
        console.log('MQTT connected to', config.mqtt.brokerUrl);
        this.reconnectAttempts = 0;
        resolve(this.client!);
      });

      this.client.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error('MQTT connection error:', err.message);
        if (this.reconnectAttempts === 0) {
          reject(err);
        }
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        // eslint-disable-next-line no-console
        console.log(`MQTT reconnecting... attempt ${this.reconnectAttempts}`);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          // eslint-disable-next-line no-console
          console.error('MQTT max reconnect attempts reached');
          this.client?.end();
        }
      });

      this.client.on('close', () => {
        // eslint-disable-next-line no-console
        console.log('MQTT connection closed');
      });

      this.client.on('offline', () => {
        // eslint-disable-next-line no-console
        console.log('MQTT offline');
      });
    });
  }

  getClient(): MqttClient {
    if (!this.client) {
      throw new Error('MQTT client not initialized. Call connect() first.');
    }
    return this.client;
  }

  async subscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client?.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          reject(err);
        } else {
          // eslint-disable-next-line no-console
          console.log(`Subscribed to: ${topic}`);
          resolve();
        }
      });
    });
  }

  async unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client?.unsubscribe(topic, (err) => {
        if (err) {
          reject(err);
        } else {
          // eslint-disable-next-line no-console
          console.log(`Unsubscribed from: ${topic}`);
          resolve();
        }
      });
    });
  }

  publish(topic: string, message: string | object, qos: 1 | 0 | 2 = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      this.client?.publish(topic, payload, { qos }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async end(): Promise<void> {
    return new Promise((resolve) => {
      this.client?.end(false, undefined, () => {
        // eslint-disable-next-line no-console
        console.log('MQTT client ended');
        resolve();
      });
    });
  }
}

export const mqttClient = new MQTTClient();
export default mqttClient;