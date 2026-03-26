// src/services/mqtt/publishers.ts
import mqttClient from './client.js';
import { handleMessage } from './handlers.js';
import prisma from '../../utils/database.js';
import logger from '../../utils/logger.js';

const UP_TOPIC_PATTERN = '/up/+/+';
const DOWN_TOPIC_PREFIX = '/down';

function getDownTopic(deviceId: string, action: string): string {
  return `${DOWN_TOPIC_PREFIX}/${deviceId}/${action}`;
}

export async function sendLoginReply(deviceId: string, result: number = 0): Promise<void> {
  const topic = getDownTopic(deviceId, 'login_reply');
  await mqttClient.publish(topic, { result });
  logger.debug('Login reply sent', { deviceId });
}

export async function sendDataReply(deviceId: string, result: number = 0): Promise<void> {
  const topic = getDownTopic(deviceId, 'datas_reply');
  await mqttClient.publish(topic, { result });
}

export async function requestToDevice(deviceId: string): Promise<void> {
  const topic = getDownTopic(deviceId, 'getdatas');
  await mqttClient.publish(topic, {});
  logger.debug('Data request sent', { deviceId });
}

export async function requestParameters(deviceId: string): Promise<void> {
  const topic = getDownTopic(deviceId, 'getparam');
  await mqttClient.publish(topic, {});
  logger.debug('Parameter request sent', { deviceId });
}

export type ControlAction = 'on' | 'off' | 'reset';

export async function sendControlCommand(
  deviceId: string,
  action: ControlAction
): Promise<void> {
  const topic = getDownTopic(deviceId, 'ctr');
  await mqttClient.publish(topic, { action });

  await prisma.controlLog.create({
    data: {
      deviceId,
      action,
      operator: 'system',
    },
  });

  logger.info('Control command sent', { deviceId, action });
}

export async function setDeviceParameters(
  deviceId: string,
  params: Record<string, unknown>
): Promise<void> {
  const topic = getDownTopic(deviceId, 'set');
  await mqttClient.publish(topic, params);
  logger.debug('Set parameters sent', { deviceId });
}

export async function sendNtpCommand(deviceId: string): Promise<void> {
  const topic = getDownTopic(deviceId, 'ntp');
  const timestamp = Math.floor(Date.now() / 1000);
  await mqttClient.publish(topic, { time: timestamp });
  logger.debug('NTP command sent', { deviceId });
}

export async function initMQTTService(): Promise<void> {
  const client = await mqttClient.connect();
  await mqttClient.subscribe(UP_TOPIC_PATTERN);

  client.on('message', (topic, payload) => {
    handleMessage(topic, payload);
  });

  logger.info('MQTT service initialized');
}

export { UP_TOPIC_PATTERN, getDownTopic };