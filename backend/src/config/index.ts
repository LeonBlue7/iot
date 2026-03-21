import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// 开发环境下生成随机密钥（避免使用默认密钥）
function generateDefaultSecret(): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }
  // 开发环境生成随机密钥并警告
  const secret = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  WARNING: JWT_SECRET not set. Using random secret (will change on restart).');
  console.warn('⚠️  Please set JWT_SECRET in .env file for production.');
  return secret;
}

interface Config {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
  };
  mqtt: {
    brokerUrl: string;
    username: string;
    password: string;
    clientId: string;
    caCertPath?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  wechat: {
    appId: string;
    secret: string;
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
  },
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL ?? '',
    username: process.env.MQTT_USERNAME ?? '',
    password: process.env.MQTT_PASSWORD ?? '',
    clientId: process.env.MQTT_CLIENT_ID ?? 'iot_server_',
    caCertPath: process.env.MQTT_CA_CERT_PATH,
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? generateDefaultSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APPID ?? '',
    secret: process.env.WECHAT_SECRET ?? '',
  },
};

export default config;