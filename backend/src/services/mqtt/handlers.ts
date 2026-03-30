// src/services/mqtt/handlers.ts
import prisma from '../../utils/database.js';
import redis, { CacheKeys, CacheTTL } from '../../utils/redis.js';
import logger from '../../utils/logger.js';
import { z } from 'zod';

// ====================
// Zod 验证 Schema
// ====================

/**
 * 设备登录消息验证
 * IMEI 必须为 15 位数字 (标准 IMEI 格式)
 * ICCID 为 19-20 位数字 (SIM 卡标识)
 */
const loginSchema = z.object({
  IMEI: z.string().regex(/^\d{15}$/, 'IMEI 必须为 15 位数字'),
  ICCID: z.string().regex(/^\d{19,20}$/, 'ICCID 格式错误').optional(),
});

/**
 * 传感器数据消息验证
 * 所有传感器值都有合理的范围限制
 */
const sensorDataSchema = z.object({
  temp: z.number().min(-50).max(100).optional(), // 温度：-50°C 到 100°C
  humi: z.number().min(0).max(100).optional(), // 湿度：0% 到 100%
  curr: z.number().min(0).max(10000).optional(), // 电流：0 到 10000mA
  sig: z.number().min(0).max(100).optional(), // 信号强度：0 到 100
  acState: z.number().min(0).max(1).optional(), // 空调状态：0 或 1
  acErr: z.number().min(0).max(255).optional(), // 空调故障码：0-255
  tempAlm: z.number().min(0).max(1).optional(), // 温度告警：0 或 1
  humiAlm: z.number().min(0).max(1).optional(), // 湿度告警：0 或 1
  ts: z.number().positive().optional(), // 时间戳：正数
});

/**
 * 设备参数消息验证
 * 所有参数都有合理的范围限制
 */
const parameterSchema = z.object({
  mode: z.number().min(0).max(1).optional(), // 模式：0 手动/1 自动
  summerTempOn: z.number().min(0).max(50).optional().nullable(), // 夏季开启温度
  summerTempSet: z.number().min(0).max(50).optional().nullable(), // 夏季设定温度
  summerTempOff: z.number().min(0).max(50).optional().nullable(), // 夏季关闭温度
  winterTempOn: z.number().min(0).max(50).optional().nullable(), // 冬季开启温度
  winterTempSet: z.number().min(0).max(50).optional().nullable(), // 冬季设定温度
  winterTempOff: z.number().min(0).max(50).optional().nullable(), // 冬季关闭温度
  winterStart: z.number().min(1).max(12).optional().nullable(), // 冬季开始月份
  winterEnd: z.number().min(1).max(12).optional().nullable(), // 冬季结束月份
  acOffInterval: z.number().min(0).max(3600).optional().nullable(), // 空调关闭间隔 (秒)
  workTime: z.string().max(50).optional().nullable(), // 工作时间段
  overtime1: z.string().max(50).optional().nullable(), // 加班时间 1
  overtime2: z.string().max(50).optional().nullable(), // 加班时间 2
  overtime3: z.string().max(50).optional().nullable(), // 加班时间 3
  acCode: z.number().min(0).max(255).optional().nullable(), // 空调码
  acMode: z.number().min(0).max(255).optional().nullable(), // 空调模式
  acFanSpeed: z.number().min(0).max(255).optional().nullable(), // 空调风速
  acDirection: z.number().min(0).max(255).optional().nullable(), // 空调风向
  acLight: z.number().min(0).max(1).optional().nullable(), // 空调灯光
  minCurrent: z.number().min(0).max(10000).optional().nullable(), // 最小电流
  alarmEnabled: z.number().min(0).max(1).optional().nullable(), // 告警使能
  tempHighLimit: z.number().min(-50).max(100).optional().nullable(), // 温度上限
  tempLowLimit: z.number().min(-50).max(100).optional().nullable(), // 温度下限
  humiHighLimit: z.number().min(0).max(100).optional().nullable(), // 湿度上限
  humiLowLimit: z.number().min(0).max(100).optional().nullable(), // 湿度下限
  uploadInterval: z.number().min(1).max(3600).optional().nullable(), // 上传间隔 (秒)
  version: z.number().min(0).optional().nullable(), // 版本号
  resetTimes: z.number().min(0).optional().nullable(), // 重置次数
});

// ====================
// 类型导出
// ====================

export type LoginData = z.infer<typeof loginSchema>;
export type SensorData = z.infer<typeof sensorDataSchema>;
export type ParameterData = z.infer<typeof parameterSchema>;

// ====================
// 辅助函数
// ====================

/**
 * 解析 MQTT 主题
 * 期望格式：/up/{deviceId}/{action}
 */
function parseTopic(topic: string): { deviceId: string; action: string } | null {
  const parts = topic.split('/');
  if (parts.length !== 4 || parts[0] !== '' || parts[1] !== 'up') {
    return null;
  }
  const deviceId = parts[2];
  const action = parts[3];

  if (!deviceId || !/^\d{15}$/.test(deviceId)) {
    logger.warn(`Invalid deviceId format: ${deviceId}`);
    return null;
  }

  if (!action) {
    logger.warn(`Missing action in topic: ${topic}`);
    return null;
  }

  return { deviceId, action };
}

/**
 * 创建告警记录
 */
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
  logger.info(`Alarm created for device`, { deviceId, type, value, threshold });
}

/**
 * 检查传感器数据是否触发告警
 */
async function checkAlarms(deviceId: string, data: SensorData): Promise<void> {
  const params = await prisma.deviceParam.findUnique({
    where: { deviceId },
    select: {
      alarmEnabled: true,
      tempHighLimit: true,
      tempLowLimit: true,
      humiHighLimit: true,
      humiLowLimit: true,
    },
  });

  if (!params || params.alarmEnabled !== 1) {
    return;
  }

  // 温度告警检查
  if (data.temp !== undefined && data.temp !== null) {
    if (params.tempHighLimit && data.temp > params.tempHighLimit) {
      await createAlarm(deviceId, 'TEMP_HIGH', data.temp, params.tempHighLimit);
    }
    if (params.tempLowLimit && data.temp < params.tempLowLimit) {
      await createAlarm(deviceId, 'TEMP_LOW', data.temp, params.tempLowLimit);
    }
  }

  // 湿度告警检查
  if (data.humi !== undefined && data.humi !== null) {
    if (params.humiHighLimit && data.humi > params.humiHighLimit) {
      await createAlarm(deviceId, 'HUMI_HIGH', data.humi, params.humiHighLimit);
    }
    if (params.humiLowLimit && data.humi < params.humiLowLimit) {
      await createAlarm(deviceId, 'HUMI_LOW', data.humi, params.humiLowLimit);
    }
  }
}

// ====================
// MQTT 消息处理器
// ====================

/**
 * 处理设备登录消息
 *
 * 验证 IMEI/ICCID 格式，更新设备在线状态
 * 如果 deviceId 与 IMEI 不匹配，记录警告但不拒绝
 */
export async function handleLogin(deviceId: string, payload: string): Promise<void> {
  let data: LoginData;

  try {
    const parsed: unknown = JSON.parse(payload);
    const result = loginSchema.safeParse(parsed);

    if (!result.success) {
      logger.warn(`Login validation failed for ${deviceId}`, {
        errors: result.error.errors.map(e => e.message).join(', '),
      });
      return;
    }

    data = result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.warn(`Invalid JSON in login payload from ${deviceId}`);
      return;
    }
    logger.error(`Error parsing login payload for ${deviceId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  // 验证 deviceId 与 IMEI 匹配
  if (deviceId !== data.IMEI) {
    logger.warn(`Device ID mismatch: topic=${deviceId}, IMEI=${data.IMEI}`);
    // 继续处理，但记录警告
  }

  try {
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
    logger.info(`Device logged in successfully`, { deviceId });
  } catch (error) {
    logger.error(`Database error handling login for ${deviceId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // 重新抛出以便上层处理
  }
}

/**
 * 处理设备数据上传消息
 *
 * 验证传感器数据范围，存储到数据库，检查告警
 */
export async function handleDataUpload(deviceId: string, payload: string): Promise<void> {
  let data: SensorData;

  try {
    const parsed: unknown = JSON.parse(payload);
    const result = sensorDataSchema.safeParse(parsed);

    if (!result.success) {
      logger.warn(`Data validation failed for ${deviceId}`, {
        errors: result.error.errors.map(e => e.message).join(', '),
      });
      return;
    }

    data = result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.warn(`Invalid JSON in data payload from ${deviceId}`);
      return;
    }
    logger.error(`Error parsing data payload for ${deviceId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  try {
    // 先确保设备存在（自动创建设备记录）
    await prisma.device.upsert({
      where: { id: deviceId },
      update: { lastSeenAt: new Date(), online: true },
      create: { id: deviceId, online: true, lastSeenAt: new Date() },
    });

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

    // 异步检查告警（不阻塞主流程）
    checkAlarms(deviceId, data).catch(err => {
      logger.error(`Error checking alarms for ${deviceId}`, {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    logger.debug(`Data received from device`, { deviceId, temp: data.temp, humi: data.humi });
  } catch (error) {
    logger.error(`Database error handling data from ${deviceId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // 重新抛出以便上层处理
  }
}

/**
 * 处理设备参数上传消息
 *
 * 验证参数范围，存储到数据库和缓存
 */
export async function handleParameterUpload(deviceId: string, payload: string): Promise<void> {
  let data: ParameterData;

  try {
    const parsed: unknown = JSON.parse(payload);
    const result = parameterSchema.safeParse(parsed);

    if (!result.success) {
      logger.warn(`Parameter validation failed for ${deviceId}`, {
        errors: result.error.errors.map(e => e.message).join(', '),
      });
      return;
    }

    data = result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logger.warn(`Invalid JSON in parameter payload from ${deviceId}`);
      return;
    }
    logger.error(`Error parsing parameter payload for ${deviceId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }

  try {
    // 先确保设备存在（自动创建设备记录）
    await prisma.device.upsert({
      where: { id: deviceId },
      update: { lastSeenAt: new Date(), online: true },
      create: { id: deviceId, online: true, lastSeenAt: new Date() },
    });

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
        version: data.version ?? 0,
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

    logger.debug(`Parameters received from device`, { deviceId, version: params.version });
  } catch (error) {
    logger.error(`Database error handling parameters from ${deviceId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // 重新抛出以便上层处理
  }
}

/**
 * MQTT 消息分发处理器
 *
 * 解析主题，验证格式，分发到对应的处理器
 */
export function handleMessage(topic: string, payload: Buffer): void {
  const parsed = parseTopic(topic);
  if (!parsed) {
    logger.warn(`Invalid topic format: ${topic}`);
    return;
  }

  const { deviceId, action } = parsed;
  const payloadStr = payload.toString();

  logger.debug(`Message received`, { topic, deviceId, action });

  switch (action) {
    case 'login':
      handleLogin(deviceId, payloadStr).catch(err => {
        logger.error(`Unhandled login error for ${deviceId}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      });
      break;
    case 'datas':
    case 'getdatas_reply':
      handleDataUpload(deviceId, payloadStr).catch(err => {
        logger.error(`Unhandled data error for ${deviceId}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      });
      break;
    case 'parameter':
    case 'getparam_reply':
      handleParameterUpload(deviceId, payloadStr).catch(err => {
        logger.error(`Unhandled parameter error for ${deviceId}`, {
          error: err instanceof Error ? err.message : String(err),
        });
      });
      break;
    case 'ctr_reply':
    case 'set_reply':
    case 'ntp_reply':
      logger.debug(`Response from device`, { deviceId, action });
      break;
    default:
      logger.warn(`Unknown action from device`, { deviceId, action });
  }
}