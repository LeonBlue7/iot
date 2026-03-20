// src/services/mqtt/publishers.ts
import mqttClient from './client.js';
import { handleMessage } from './handlers.js';
import prisma from '../../utils/database.js';

const UP_TOPIC_PATTERN = '/up/+/+';
const DOWN_TOPIC_PREFIX = '/down';

function getDownTopic(deviceId: string, action: string): string {
  return `${DOWN_TOPIC_PREFIX}/${deviceId}/${action}`;
}

export async function sendLoginReply(deviceId: string, result: number = 0): Promise<void> {
  const topic = getDownTopic(deviceId, 'login_reply');
  await mqttClient.publish(topic, { result });
  console.log(`Login reply sent to ${deviceId}`);
}

export async function sendDataReply(deviceId: string, result: number = 0): Promise<void> {
  const topic = getDownTopic(deviceId, 'datas_reply');
  await mqttClient.publish(topic, { result });
}

export async function requestToDevice(deviceId: string): Promise<void> {
  const topic = getDownTopic(deviceId, 'getdatas');
  await mqttClient.publish(topic, {});
  console.log(`Data request sent to ${deviceId}`);
}

export async function requestParameters(deviceId: string): Promise<void> {
  const topic = getDownTopic(deviceId, 'getparam');
  await mqttClient.publish(topic, {});
  console.log(`Parameter request sent to ${deviceId}`);
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

  console.log(`Control command sent to ${deviceId}: ${action}`);
}

export async function setDeviceParameters(
  deviceId: string,
  params: Record<string, unknown>
): Promise<void> {
  const topic = getDownTopic(deviceId, 'set');
  await mqttClient.publish(topic, params);
  console.log(`Set parameters sent to ${deviceId}`);
}

export async function sendNtpCommand(deviceId: string): Promise<void> {
  const topic = getDownTopic(deviceId, 'ntp');
  const timestamp = Math.floor(Date.now() / 1000);
  await mqttClient.publish(topic, { time: timestamp });
  console.log(`NTP command sent to ${deviceId}`);
}

export async function initMQTTService(): Promise<void> {
  const client = await mqttClient.connect();
  await mqttClient.subscribe(UP_TOPIC_PATTERN);

  client.on('message', (topic, payload) => {
    handleMessage(topic, payload);
  });

  console.log('MQTT service initialized');
}

export { UP_TOPIC_PATTERN, getDownTopic };