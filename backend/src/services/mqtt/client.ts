// src/services/mqtt/client.ts
import mqtt, { MqttClient } from 'mqtt';
import config from '../../config/index.js';

class MQTTClient {
  private client: MqttClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(): Promise<MqttClient> {
    return new Promise((resolve, reject) => {
      const clientId = config.mqtt.clientId + Date.now();

      this.client = mqtt.connect(config.mqtt.brokerUrl, {
        clientId,
        username: config.mqtt.username || undefined,
        password: config.mqtt.password || undefined,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
        rejectUnauthorized: false, // For self-signed certificates
      });

      this.client.on('connect', () => {
        console.log('MQTT connected to', config.mqtt.brokerUrl);
        this.reconnectAttempts = 0;
        resolve(this.client!);
      });

      this.client.on('error', (err) => {
        console.error('MQTT connection error:', err.message);
        if (this.reconnectAttempts === 0) {
          reject(err);
        }
      });

      this.client.on('reconnect', () => {
        this.reconnectAttempts++;
        console.log(`MQTT reconnecting... attempt ${this.reconnectAttempts}`);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('MQTT max reconnect attempts reached');
          this.client?.end();
        }
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
      });

      this.client.on('offline', () => {
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
        console.log('MQTT client ended');
        resolve();
      });
    });
  }
}

export const mqttClient = new MQTTClient();
export default mqttClient;