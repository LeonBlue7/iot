// src/services/mqtt/handlers.ts
import prisma from '../../utils/database.js';
import redis, { CacheKeys, CacheTTL } from '../../utils/redis.js';

interface LoginMessage {
  IMEI: string;
  ICCID?: string;
}

interface SensorDataMessage {
  temp?: number;
  humi?: number;
  curr?: number;
  sig?: number;
  acState?: number;
  acErr?: number;
  tempAlm?: number;
  humiAlm?: number;
  ts?: number;
}

interface ParameterMessage {
  mode?: number;
  summerTempOn?: number;
  summerTempSet?: number;
  summerTempOff?: number;
  winterTempOn?: number;
  winterTempSet?: number;
  winterTempOff?: number;
  winterStart?: number;
  winterEnd?: number;
  acOffInterval?: number;
  workTime?: string;
  overtime1?: string;
  overtime2?: string;
  overtime3?: string;
  acCode?: number;
  acMode?: number;
  acFanSpeed?: number;
  acDirection?: number;
  acLight?: number;
  minCurrent?: number;
  alarmEnabled?: number;
  tempHighLimit?: number;
  tempLowLimit?: number;
  humiHighLimit?: number;
  humiLowLimit?: number;
  uploadInterval?: number;
  version?: number;
  resetTimes?: number;
}

function parseTopic(topic: string): { deviceId: string; action: string } | null {
  const parts = topic.split('/');
  if (parts.length !== 4 || parts[0] !== '' || parts[1] !== 'up') {
    return null;
  }
  return { deviceId: parts[2] as string, action: parts[3] as string };
}

export async function handleLogin(deviceId: string, payload: string): Promise<void> {
  try {
    const data: LoginMessage = JSON.parse(payload);

    await prisma.device.upsert({
      where: { id: deviceId },
      update: {
        online: true,
        lastSeenAt: new Date(),
        simCard: data.ICCID ?? null,
      },
      create: {
        id: deviceId,
        online: true,
        lastSeenAt: new Date(),
        simCard: data.ICCID ?? null,
      },
    });

    await redis.set(CacheKeys.deviceOnline(deviceId), '1', 'EX', CacheTTL.deviceOnline);
    console.log(`Device ${deviceId} logged in`);
  } catch (error) {
    console.error(`Error handling login for ${deviceId}:`, error);
  }
}

export async function handleDataUpload(deviceId: string, payload: string): Promise<void> {
  try {
    const data: SensorDataMessage = JSON.parse(payload);

    const sensorData = await prisma.sensorData.create({
      data: {
        deviceId,
        temperature: data.temp,
        humidity: data.humi,
        current: data.curr,
        signalStrength: data.sig,
        acState: data.acState,
        acError: data.acErr,
        tempAlarm: data.tempAlm,
        humiAlarm: data.humiAlm,
        recordedAt: data.ts ? new Date(data.ts * 1000) : new Date(),
      },
    });

    await prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date(), online: true },
    });

    await redis.set(
      CacheKeys.deviceData(deviceId),
      JSON.stringify(sensorData),
      'EX',
      CacheTTL.deviceData
    );

    await checkAlarms(deviceId, data);
    console.log(`Data received from ${deviceId}`);
  } catch (error) {
    console.error(`Error handling data from ${deviceId}:`, error);
  }
}

export async function handleParameterUpload(deviceId: string, payload: string): Promise<void> {
  try {
    const data: ParameterMessage = JSON.parse(payload);

    const params = await prisma.deviceParam.upsert({
      where: { deviceId },
      update: {
        mode: data.mode,
        summerTempOn: data.summerTempOn,
        summerTempSet: data.summerTempSet,
        summerTempOff: data.summerTempOff,
        winterTempOn: data.winterTempOn,
        winterTempSet: data.winterTempSet,
        winterTempOff: data.winterTempOff,
        winterStart: data.winterStart,
        winterEnd: data.winterEnd,
        acOffInterval: data.acOffInterval,
        workTime: data.workTime,
        overtime1: data.overtime1,
        overtime2: data.overtime2,
        overtime3: data.overtime3,
        acCode: data.acCode,
        acMode: data.acMode,
        acFanSpeed: data.acFanSpeed,
        acDirection: data.acDirection,
        acLight: data.acLight,
        minCurrent: data.minCurrent,
        alarmEnabled: data.alarmEnabled,
        tempHighLimit: data.tempHighLimit,
        tempLowLimit: data.tempLowLimit,
        humiHighLimit: data.humiHighLimit,
        humiLowLimit: data.humiLowLimit,
        uploadInterval: data.uploadInterval,
        version: data.version,
        resetTimes: data.resetTimes,
      },
      create: {
        deviceId,
        mode: data.mode ?? 0,
        summerTempOn: data.summerTempOn,
        summerTempSet: data.summerTempSet,
        summerTempOff: data.summerTempOff,
        winterTempOn: data.winterTempOn,
        winterTempSet: data.winterTempSet,
        winterTempOff: data.winterTempOff,
        winterStart: data.winterStart,
        winterEnd: data.winterEnd,
        acOffInterval: data.acOffInterval,
        workTime: data.workTime,
        overtime1: data.overtime1,
        overtime2: data.overtime2,
        overtime3: data.overtime3,
        acCode: data.acCode,
        acMode: data.acMode,
        acFanSpeed: data.acFanSpeed,
        acDirection: data.acDirection,
        acLight: data.acLight,
        minCurrent: data.minCurrent,
        alarmEnabled: data.alarmEnabled,
        tempHighLimit: data.tempHighLimit,
        tempLowLimit: data.tempLowLimit,
        humiHighLimit: data.humiHighLimit,
        humiLowLimit: data.humiLowLimit,
        uploadInterval: data.uploadInterval,
        version: data.version ?? 0,
        resetTimes: data.resetTimes,
      },
    });

    await redis.set(
      CacheKeys.deviceParams(deviceId),
      JSON.stringify(params),
      'EX',
      CacheTTL.deviceParams
    );

    console.log(`Parameters received from ${deviceId}`);
  } catch (error) {
    console.error(`Error handling parameters from ${deviceId}:`, error);
  }
}

async function checkAlarms(deviceId: string, data: SensorDataMessage): Promise<void> {
  const params = await prisma.deviceParam.findUnique({
    where: { deviceId },
  });

  if (!params || params.alarmEnabled !== 1) {
    return;
  }

  if (data.temp !== undefined && data.temp !== null) {
    if (params.tempHighLimit && data.temp > params.tempHighLimit) {
      await createAlarm(deviceId, 'TEMP_HIGH', data.temp, params.tempHighLimit);
    }
    if (params.tempLowLimit && data.temp < params.tempLowLimit) {
      await createAlarm(deviceId, 'TEMP_LOW', data.temp, params.tempLowLimit);
    }
  }

  if (data.humi !== undefined && data.humi !== null) {
    if (params.humiHighLimit && data.humi > params.humiHighLimit) {
      await createAlarm(deviceId, 'HUMI_HIGH', data.humi, params.humiHighLimit);
    }
    if (params.humiLowLimit && data.humi < params.humiLowLimit) {
      await createAlarm(deviceId, 'HUMI_LOW', data.humi, params.humiLowLimit);
    }
  }
}

async function createAlarm(
  deviceId: string,
  type: string,
  value: number,
  threshold: number
): Promise<void> {
  await prisma.alarmRecord.create({
    data: {
      deviceId,
      alarmType: type,
      alarmValue: value,
      threshold,
    },
  });
  console.log(`Alarm created for ${deviceId}: ${type}`);
}

export function handleMessage(topic: string, payload: Buffer): void {
  const parsed = parseTopic(topic);
  if (!parsed) {
    console.warn(`Invalid topic format: ${topic}`);
    return;
  }

  const { deviceId, action } = parsed;
  const payloadStr = payload.toString();

  console.log(`Message received: ${topic}`);

  switch (action) {
    case 'login':
      handleLogin(deviceId, payloadStr);
      break;
    case 'datas':
    case 'getdatas_reply':
      handleDataUpload(deviceId, payloadStr);
      break;
    case 'parameter':
    case 'getparam_reply':
      handleParameterUpload(deviceId, payloadStr);
      break;
    case 'ctr_reply':
    case 'set_reply':
    case 'ntp_reply':
      console.log(`Response from ${deviceId}: ${action}`);
      break;
    default:
      console.warn(`Unknown action: ${action}`);
  }
}