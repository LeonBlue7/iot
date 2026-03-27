# API 文档

物联网智能办公空调控制系统 REST API 接口文档。

**Base URL**: `https://www.jxbonner.cloud/api`

## 认证

> ⚠️ **注意**: 当前版本尚未实现认证中间件，生产环境部署前必须添加。

所有受保护的端点需要在请求头中携带 JWT Token:

```
Authorization: Bearer <your_jwt_token>
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误类型",
  "message": "详细错误信息"
}
```

### 分页响应

```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## 设备管理 API

### 获取设备列表

```http
GET /api/devices
```

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 50 |
| online | boolean | 否 | 按在线状态筛选 |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "862471030000001",
      "productId": "product_001",
      "name": "办公室空调 1",
      "simCard": "89860...",
      "online": true,
      "lastSeenAt": "2026-03-21T10:30:00Z",
      "createdAt": "2026-01-01T00:00:00Z",
      "params": {
        "mode": 1,
        "summerTempOn": 28.0,
        "summerTempSet": 26.0,
        "summerTempOff": 24.0
      }
    }
  ]
}
```

---

### 获取设备详情

```http
GET /api/devices/:id
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 设备 IMEI 号 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "862471030000001",
    "productId": "product_001",
    "name": "办公室空调 1",
    "online": true,
    "lastSeenAt": "2026-03-21T10:30:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**错误响应** (404):

```json
{
  "success": false,
  "error": "Not Found",
  "message": "Device 862471030000001 not found"
}
```

---

### 获取实时数据

```http
GET /api/devices/:id/realtime
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 12345,
    "deviceId": "862471030000001",
    "temperature": 25.5,
    "humidity": 60,
    "current": 500,
    "signalStrength": 85,
    "acState": 1,
    "acError": 0,
    "tempAlarm": 0,
    "humiAlarm": 0,
    "recordedAt": "2026-03-21T10:30:00Z"
  }
}
```

---

### 获取历史数据

```http
GET /api/devices/:id/history
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startTime | string | 是 | 开始时间 (ISO 8601) |
| endTime | string | 是 | 结束时间 (ISO 8601) |
| limit | number | 否 | 返回记录数，默认 100 |

**请求示例**:

```
GET /api/devices/862471030000001/history?startTime=2026-03-20T00:00:00Z&endTime=2026-03-21T23:59:59Z&limit=50
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "deviceId": "862471030000001",
      "temperature": 25.5,
      "humidity": 60,
      "current": 500,
      "signalStrength": 85,
      "acState": 1,
      "recordedAt": "2026-03-21T10:30:00Z"
    }
  ]
}
```

---

### 更新设备信息

```http
PUT /api/devices/:id
```

**请求体**:

```json
{
  "name": "新设备名称",
  "productId": "product_002"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "862471030000001",
    "name": "新设备名称",
    "productId": "product_002",
    "online": true,
    "lastSeenAt": "2026-03-21T10:30:00Z"
  }
}
```

---

### 远程控制设备

```http
POST /api/devices/:id/control
```

**请求体**:

```json
{
  "action": "on"
}
```

**支持的动作**:

| 动作 | 说明 |
|------|------|
| `on` | 开启空调 |
| `off` | 关闭空调 |
| `reset` | 重启设备 |

**响应示例**:

```json
{
  "success": true,
  "message": "控制命令已发送"
}
```

---

### 获取设备参数

```http
GET /api/devices/:id/params
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "deviceId": "862471030000001",
    "mode": 1,
    "summerTempOn": 28.0,
    "summerTempSet": 26.0,
    "summerTempOff": 24.0,
    "winterTempOn": 18.0,
    "winterTempSet": 22.0,
    "winterTempOff": 20.0,
    "workTime": "08:00-18:00",
    "acCode": 1,
    "acMode": 0,
    "acFanSpeed": 1,
    "tempHighLimit": 35,
    "tempLowLimit": 10,
    "humiHighLimit": 80,
    "humiLowLimit": 20
  }
}
```

---

### 更新设备参数

```http
PUT /api/devices/:id/params
```

**请求体**:

```json
{
  "mode": 1,
  "summerTempOn": 28.0,
  "summerTempSet": 26.0,
  "summerTempOff": 24.0,
  "winterTempOn": 18.0,
  "winterTempSet": 22.0,
  "winterTempOff": 20.0,
  "tempHighLimit": 35,
  "tempLowLimit": 10,
  "humiHighLimit": 80,
  "humiLowLimit": 20
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "deviceId": "862471030000001",
    "mode": 1,
    "summerTempOn": 28.0,
    "version": 2
  }
}
```

---

## 认证 API

### 管理员登录

```http
POST /api/admin/auth/login
```

**请求体**:

```json
{
  "username": "admin",
  "password": "password123"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "email": "admin@example.com",
      "roleIds": [1]
    }
  }
}
```

---

### 获取当前用户信息

```http
GET /api/admin/auth/me
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "email": "admin@example.com",
    "roleIds": [1]
  }
}
```

---

### 登出

```http
POST /api/admin/auth/logout
```

**响应示例**:

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 分组管理 API

### 获取分组列表

```http
GET /api/groups
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "一楼办公区",
      "description": "一楼所有空调设备",
      "sortOrder": 0,
      "createdAt": "2026-03-26T10:00:00Z",
      "updatedAt": "2026-03-26T10:00:00Z",
      "_count": {
        "devices": 5
      }
    }
  ]
}
```

---

### 获取分组详情

```http
GET /api/groups/:id
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "一楼办公区",
    "description": "一楼所有空调设备",
    "sortOrder": 0,
    "createdAt": "2026-03-26T10:00:00Z",
    "updatedAt": "2026-03-26T10:00:00Z",
    "devices": [
      {
        "id": "862471030000001",
        "name": "办公室空调 1",
        "online": true
      }
    ]
  }
}
```

---

### 创建分组

```http
POST /api/groups
```

**请求体**:

```json
{
  "name": "二楼办公区",
  "description": "二楼所有空调设备",
  "sortOrder": 1
}
```

**响应示例** (201):

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "二楼办公区",
    "description": "二楼所有空调设备",
    "sortOrder": 1,
    "createdAt": "2026-03-26T11:00:00Z",
    "updatedAt": "2026-03-26T11:00:00Z"
  },
  "message": "Group created"
}
```

---

### 更新分组

```http
PUT /api/groups/:id
```

**请求体**:

```json
{
  "name": "二楼会议区",
  "description": "二楼会议室空调"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "二楼会议区",
    "description": "二楼会议室空调",
    "sortOrder": 1
  },
  "message": "Group updated"
}
```

---

### 删除分组

```http
DELETE /api/groups/:id
```

**注意**: 如果分组下有设备，将返回 400 错误。

**响应示例**:

```json
{
  "success": true,
  "message": "Group deleted"
}
```

**错误响应** (400):

```json
{
  "success": false,
  "error": "Cannot delete group with devices"
}
```

---

### 设置分组设备

```http
PUT /api/groups/:id/devices
```

**请求体**:

```json
{
  "deviceIds": ["862471030000001", "862471030000002"]
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "Devices assigned to group"
}
```

---

## 告警管理 API

### 获取告警列表

```http
GET /api/alarms
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | string | 否 | 按设备 ID 筛选 |
| status | number | 否 | 按状态筛选 (0:未处理，1:已确认，2:已解决) |
| startTime | string | 否 | 开始时间 |
| endTime | string | 否 | 结束时间 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "deviceId": "862471030000001",
      "alarmType": "TEMP_HIGH",
      "alarmValue": 36.5,
      "threshold": 35.0,
      "status": 0,
      "createdAt": "2026-03-21T10:30:00Z"
    }
  ],
  "total": 1
}
```

**响应头**:

```
X-Total-Count: 100
```

---

### 确认告警

```http
PUT /api/alarms/:id/acknowledge
```

**路径参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 告警记录 ID |

**请求体**:

```json
{
  "operator": "admin"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "deviceId": "862471030000001",
    "alarmType": "TEMP_HIGH",
    "status": 1,
    "acknowledgedBy": "admin",
    "acknowledgedAt": "2026-03-21T11:00:00Z"
  }
}
```

---

### 解决告警

```http
PUT /api/alarms/:id/resolve
```

**请求体**:

```json
{
  "operator": "admin"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "deviceId": "862471030000001",
    "alarmType": "TEMP_HIGH",
    "status": 2,
    "resolvedBy": "admin",
    "resolvedAt": "2026-03-21T12:00:00Z"
  }
}
```

---

## 数据统计 API

### 获取概览统计

```http
GET /api/stats/overview
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "totalDevices": 10,
    "onlineDevices": 8,
    "offlineDevices": 2,
    "totalAlarms": 25,
    "unacknowledgedAlarms": 3,
    "todayDataPoints": 11520
  }
}
```

---

### 获取趋势数据

```http
GET /api/stats/trend
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | string | 否 | 设备 ID |
| startTime | string | 否 | 开始时间 |
| endTime | string | 否 | 结束时间 |
| metric | string | 否 | 指标类型 (temperature, humidity, current) |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2026-03-21T00:00:00Z",
      "temperature": 24.5,
      "humidity": 55
    },
    {
      "timestamp": "2026-03-21T01:00:00Z",
      "temperature": 24.8,
      "humidity": 56
    }
  ]
}
```

---

### 获取日统计

```http
GET /api/stats/daily
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 否 | 日期 (YYYY-MM-DD)，默认今天 |
| deviceId | string | 否 | 设备 ID |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "date": "2026-03-21",
    "avgTemperature": 25.3,
    "avgHumidity": 58,
    "maxTemperature": 28.5,
    "minTemperature": 22.0,
    "alarmCount": 2,
    "totalDataPoints": 288
  }
}
```

---

## HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 速率限制

| 端点类型 | 限制 |
|----------|------|
| 读取操作 | 30 请求/15 分钟 |
| 控制操作 | 5 请求/分钟 |
| 参数设置 | 10 请求/分钟 |

超过限制将返回 `429 Too Many Requests` 响应。

---

## WebSocket 实时更新 (TODO)

> 计划功能：通过 WebSocket 推送设备状态变化、实时告警等。

```javascript
const ws = new WebSocket('wss://www.jxbonner.cloud/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('收到更新:', data);
};
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| DEVICE_NOT_FOUND | 设备不存在 |
| DEVICE_OFFLINE | 设备离线 |
| INVALID_ACTION | 无效的控制动作 |
| PARAM_VALIDATION_ERROR | 参数验证失败 |
| ALARM_NOT_FOUND | 告警记录不存在 |
| RATE_LIMIT_EXCEEDED | 超出速率限制 |
| UNAUTHORIZED | 未授权访问 |
| INTERNAL_ERROR | 服务器内部错误 |
