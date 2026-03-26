// src/services/mqtt/client.ts
import mqtt, { MqttClient } from 'mqtt';
import fs from 'fs';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

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
          logger.info('Loaded MQTT CA certificate', { path: caCertPath });
        } catch (error) {
          logger.error('Failed to load MQTT CA certificate', {
            path: caCertPath,
            error: error instanceof Error ? error.message : String(error),
          });
          if (config.nodeEnv === 'production') {
            reject(new Error(`Failed to load MQTT CA certificate from ${caCertPath}`));
            return;
          }
        }
      }

      this.client = mqtt.connect(config.mqtt.brokerUrl, options);

      this.client.on('connect', () => {
        logger.info('MQTT connected', { broker: config.mqtt.brokerUrl });
        this.reconnectAttempts = 0;
        resolve(this.client!);
      });

      this.client.on('error', (err) => {
        logger.error('MQTT connection error', { error: err.message });
        if (this.reconnectAttempts === 0) {
          reject(err);
        }
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        logger.warn('MQTT reconnecting', { attempt: this.reconnectAttempts });
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('MQTT max reconnect attempts reached');
          this.client?.end();
        }
      });

      this.client.on('close', () => {
        logger.info('MQTT connection closed');
      });

      this.client.on('offline', () => {
        logger.warn('MQTT offline');
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
          logger.debug('Subscribed to topic', { topic });
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
          logger.debug('Unsubscribed from topic', { topic });
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
        logger.info('MQTT client ended');
        resolve();
      });
    });
  }
}

export const mqttClient = new MQTTClient();
export default mqttClient;