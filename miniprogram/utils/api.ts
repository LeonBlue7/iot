// miniprogram/utils/api.ts
// 根据小程序环境版本选择API基础URL
// develop: 开发版, trial: 体验版, release: 正式版
const BASE_URL = (() => {
  const envVersion = __wxConfig.envVersion;
  if (envVersion === 'develop') {
    // 开发环境 - 可根据需要修改为开发服务器地址
    return 'https://www.jxbonner.cloud/api';
  }
  // 体验版和正式版使用生产服务器
  return 'https://www.jxbonner.cloud/api';
})();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 设备相关接口
export interface Device {
  id: string;
  productId?: string | null;
  name?: string | null;
  online: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface SensorData {
  temperature?: number | null;
  humidity?: number | null;
  current?: number | null;
  signalStrength?: number | null;
  acState?: number | null;
  acError?: number | null;
  recordedAt: string;
}

export interface DeviceParams {
  mode: number;
  summerTempOn?: number | null;
  summerTempSet?: number | null;
  summerTempOff?: number | null;
  winterTempOn?: number | null;
  winterTempSet?: number | null;
  winterTempOff?: number | null;
  tempHighLimit?: number | null;
  tempLowLimit?: number | null;
  humiHighLimit?: number | null;
  humiLowLimit?: number | null;
}

export interface AlarmRecord {
  id: number;
  deviceId: string;
  alarmType: string;
  alarmValue?: number | null;
  threshold?: number | null;
  status: number;
  createdAt: string;
}

// 分组相关接口
export interface DeviceGroup {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { devices: number };
}

// API 请求函数
export async function request<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  data?: any
): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as ApiResponse<T>);
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
}

// 设备 API
export async function getDevices(): Promise<Device[]> {
  const result = await request<Device[]>('/devices');
  return result.data ?? [];
}

export async function getDeviceById(id: string): Promise<Device> {
  const result = await request<Device>(`/devices/${id}`);
  return result.data!;
}

export async function getRealtimeData(id: string): Promise<SensorData | null> {
  const result = await request<SensorData>(`/devices/${id}/realtime`);
  return result.data ?? null;
}

export async function getHistoryData(
  id: string,
  startTime: Date,
  endTime: Date,
  limit?: number
): Promise<SensorData[]> {
  const result = await request<SensorData[]>(`/devices/${id}/history`, 'GET', {
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    limit,
  });
  return result.data ?? [];
}

export async function controlDevice(
  id: string,
  action: 'on' | 'off' | 'reset'
): Promise<void> {
  await request(`/devices/${id}/control`, 'POST', { action });
}

export async function getDeviceParams(id: string): Promise<DeviceParams | null> {
  const result = await request<DeviceParams>(`/devices/${id}/params`);
  return result.data ?? null;
}

export async function updateDeviceParams(
  id: string,
  params: Partial<DeviceParams>
): Promise<DeviceParams> {
  const result = await request<DeviceParams>(`/devices/${id}/params`, 'PUT', params);
  return result.data!;
}

// 告警 API
export async function getAlarms(options?: {
  deviceId?: string;
  status?: number;
  limit?: number;
  offset?: number;
}): Promise<{ data: AlarmRecord[]; total: number }> {
  const result = await request<{ data: AlarmRecord[]; total: number }>('/alarms', 'GET', options);
  return {
    data: result.data?.data ?? [],
    total: parseInt((result.data as any)?.total ?? '0', 10),
  };
}

export async function acknowledgeAlarm(id: number): Promise<AlarmRecord> {
  const result = await request<AlarmRecord>(`/alarms/${id}/acknowledge`, 'PUT');
  return result.data!;
}

// 统计 API
export async function getOverviewStats(): Promise<{
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalAlarms: number;
  unacknowledgedAlarms: number;
}> {
  const result = await request<any>('/stats/overview');
  return result.data ?? {};
}

// 分组 API
export async function getGroups(): Promise<DeviceGroup[]> {
  const result = await request<DeviceGroup[]>('/groups');
  return result.data ?? [];
}

export async function getGroupById(id: number): Promise<DeviceGroup> {
  const result = await request<DeviceGroup>(`/groups/${id}`);
  return result.data!;
}
