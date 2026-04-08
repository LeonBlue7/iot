# API 文档

物联网智能办公空调控制系统 REST API 接口文档。

**Base URL**: `https://www.jxbonner.cloud/api`

> **最后更新**: 2026-04-08（添加 request-data/request-params 端点）

## 系统架构

系统采用四层层级管理架构：

```
Customer (客户)
    └── Zone (分区)
            └── Group (分组)
                    └── Device (设备)
```

这种层级结构支持多租户场景，允许按客户、分区、分组进行设备管理。

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

## 客户管理 API

> 四层层级管理的顶层：Customer (客户)

### 获取客户列表

```http
GET /api/customers
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "客户A",
      "contact": "联系人",
      "phone": "13800138000",
      "address": "地址信息",
      "createdAt": "2026-03-26T10:00:00Z",
      "_count": {
        "zones": 3
      }
    }
  ]
}
```

---

### 获取客户详情

```http
GET /api/customers/:id
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "客户A",
    "contact": "联系人",
    "phone": "13800138000",
    "address": "地址信息",
    "zones": [
      {
        "id": 1,
        "name": "一楼办公区"
      }
    ]
  }
}
```

---

### 创建客户

```http
POST /api/customers
```

**请求体**:

```json
{
  "name": "新客户",
  "contact": "联系人",
  "phone": "13800138000",
  "address": "地址信息"
}
```

---

### 更新客户

```http
PUT /api/customers/:id
```

---

### 删除客户

```http
DELETE /api/customers/:id
```

**注意**: 如果客户下有分区，将返回 400 错误。

---

## 分区管理 API

> 四层层级管理的第二层：Zone (分区)

### 获取分区列表

```http
GET /api/zones
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "一楼办公区",
      "customerId": 1,
      "customer": {
        "id": 1,
        "name": "客户A"
      },
      "_count": {
        "groups": 5
      }
    }
  ]
}
```

---

### 获取特定客户的分区

```http
GET /api/zones/customer/:customerId
```

---

### 获取分区详情

```http
GET /api/zones/:id
```

---

### 创建分区

```http
POST /api/zones
```

**请求体**:

```json
{
  "name": "二楼办公区",
  "customerId": 1
}
```

---

### 更新分区

```http
PUT /api/zones/:id
```

---

### 删除分区

```http
DELETE /api/zones/:id
```

**注意**: 如果分区下有分组，将返回 400 错误。

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

### 请求设备上报传感器数据

```http
POST /api/devices/:id/request-data
```

发送 MQTT 指令请求设备立即上报传感器数据（温度、湿度、电流等）。

**响应示例**:

```json
{
  "success": true,
  "message": "数据请求已发送"
}
```

---

### 请求设备上报配置参数

```http
POST /api/devices/:id/request-params
```

发送 MQTT 指令请求设备立即上报配置参数。

**响应示例**:

```json
{
  "success": true,
  "message": "参数请求已发送"
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

### Token 刷新

```http
POST /api/admin/auth/refresh
```

**请求体**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "7d"
  }
}
```

---

## 用户管理 API

> 管理员用户管理，包含 CRUD 和客户分配功能。
> 所有端点需要认证和相应权限。

### 获取用户列表

```http
GET /api/admin/users
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| customerId | number | 否 | 按客户筛选 |
| enabled | boolean | 否 | 按启用状态筛选 |
| search | string | 否 | 关键词搜索 |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "email": "admin@example.com",
      "enabled": true,
      "isSuperAdmin": true,
      "createdAt": "2026-03-26T10:00:00Z"
    }
  ]
}
```

---

### 获取用户详情

```http
GET /api/admin/users/:id
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
    "enabled": true,
    "isSuperAdmin": true
  }
}
```

---

### 创建用户

```http
POST /api/admin/users
```

**请求体**:

```json
{
  "username": "newuser",
  "password": "password123",
  "name": "新用户",
  "email": "newuser@example.com",
  "customerId": 1,
  "isSuperAdmin": false
}
```

**响应示例** (201):

```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "newuser",
    "name": "新用户",
    "email": "newuser@example.com"
  }
}
```

---

### 更新用户

```http
PUT /api/admin/users/:id
```

**请求体**:

```json
{
  "name": "更新后的名称",
  "email": "updated@example.com",
  "enabled": true
}
```

---

### 删除用户

```http
DELETE /api/admin/users/:id
```

> **注意**: 只有超级管理员可以删除用户，且不能删除自己。

**响应示例**:

```json
{
  "success": true,
  "message": "用户已删除"
}
```

---

### 获取用户的客户列表

```http
GET /api/admin/users/:id/customers
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "customerId": 1,
      "customerName": "客户A",
      "role": "manager"
    }
  ]
}
```

---

### 分配客户给用户

```http
POST /api/admin/users/:id/customers
```

**请求体**:

```json
{
  "customerId": 1,
  "role": "viewer"
}
```

**响应示例** (201):

```json
{
  "success": true,
  "data": {
    "userId": 2,
    "customerId": 1,
    "role": "viewer"
  }
}
```

---

### 移除用户客户分配

```http
DELETE /api/admin/users/:id/customers/:customerId
```

**响应示例**:

```json
{
  "success": true,
  "message": "已移除客户分配"
}
```

---

## 分组管理 API

> 四层层级管理的第三层：Group (分组)
> 分组必须属于某个分区 (Zone)

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
      "zoneId": 1,
      "zone": {
        "id": 1,
        "name": "一楼分区",
        "customerId": 1
      },
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

### 获取特定分区的分组

```http
GET /api/groups/zone/:zoneId
```

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "会议室",
      "zoneId": 1
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
  "zoneId": 1,
  "description": "二楼所有空调设备",
  "sortOrder": 1
}
```

**注意**: `zoneId` 为必填字段，分组必须属于某个分区。
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

## 批量操作 API

> 批量操作允许同时对多个设备执行控制、参数设置、移动等操作。

### 批量控制设备

```http
POST /api/batch/control
```

**请求体**:

```json
{
  "deviceIds": ["862471030000001", "862471030000002"],
  "action": "on"
}
```

**支持的动作**:

| 动作 | 说明 |
|------|------|
| `on` | 批量开启空调 |
| `off` | 批量关闭空调 |
| `reset` | 批量重启设备 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "results": [
      { "deviceId": "862471030000001", "status": "success" },
      { "deviceId": "862471030000002", "status": "success" }
    ]
  }
}
```

---

### 批量参数设置

```http
POST /api/batch/params
```

**请求体**:

```json
{
  "deviceIds": ["862471030000001", "862471030000002"],
  "params": {
    "mode": 1,
    "summerTempOn": 28.0,
    "summerTempSet": 26.0
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

---

### 批量移动到分组

```http
POST /api/batch/move
```

**请求体**:

```json
{
  "deviceIds": ["862471030000001", "862471030000002"],
  "groupId": 5
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

---

### 批量启用/禁用

```http
POST /api/batch/toggle
```

**请求体**:

```json
{
  "deviceIds": ["862471030000001", "862471030000002"],
  "enabled": true
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

---

### 设备搜索

```http
GET /api/batch/search
```

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 关键词搜索（名称、IMEI） |
| customerId | number | 否 | 按客户筛选 |
| zoneId | number | 否 | 按分区筛选 |
| groupId | number | 否 | 按分组筛选 |
| online | boolean | 否 | 按在线状态筛选 |
| enabled | boolean | 否 | 按启用状态筛选 |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "862471030000001",
      "name": "办公室空调 1",
      "online": true,
      "groupId": 5
    }
  ]
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
| API 总请求 | 300 请求/15 分钟（生产环境） |
| 登录端点 | 50 请求/15 分钟（防暴力破解） |
| 开发环境 | 1000 请求/15 分钟 |

超过限制将返回 `429 Too Many Requests` 响应。

> **注意**: 测试环境自动跳过速率限制（`X-Test-Mode: true` 头或 `SKIP_RATE_LIMIT=true` 环境变量）。

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
