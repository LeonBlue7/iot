# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库工作时提供指导，全程使用中文交互。

## 项目概述

物联网智能办公空调控制系统，支持MQTT设备接入、数据存储和REST API。

### 技术栈
- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL + Redis
- **MQTT Broker**：EMQX 5.21
- **前端**：
  - 微信小程序（移动端用户界面）
  - React + Vite + Ant Design（管理后台）
  - **容器化部署**：Docker+dockercompose

## 常用命令

### 后端开发
```bash
cd backend
npm install          # 安装依赖
npm run dev          # 开发模式启动
npm run build        # 编译生产版本
npm run start        # 生产模式启动
npm run test         # 运行测试
npx prisma studio    # 打开数据库管理界面
```

### 数据库
```bash
npx prisma migrate dev    # 创建并运行迁移
npx prisma generate       # 生成Prisma Client
```

### 管理后台前端
```bash
cd admin-web
npm install          # 安装依赖
npm run dev          # 开发模式启动
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 代码检查
npm run test         # 运行单元测试
npm run test:coverage # 运行测试并生成覆盖率报告
```

## 项目结构

```
/home/leon/projects/iot/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── models/            # 数据模型
│   │   ├── routes/            # 路由定义
│   │   ├── services/          # 业务逻辑
│   │   │   ├── mqtt/         # MQTT服务
│   │   │   ├── device/       # 设备服务
│   │   │   └── alarm/        # 告警服务
│   │   ├── utils/            # 工具函数
│   │   └── app.ts            # 应用入口
│   ├── prisma/                # 数据库迁移
│   └── tests/                 # 测试文件
├── admin-web/                  # 管理后台前端
│   ├── src/
│   │   ├── components/        # 通用组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard/    # 仪表盘
│   │   │   ├── Devices/      # 设备管理
│   │   │   ├── Alarms/       # 告警管理
│   │   │   ├── Stats/        # 数据统计
│   │   │   └── Login/        # 登录页面
│   │   ├── services/          # API服务
│   │   ├── store/             # 状态管理(Zustand)
│   │   ├── hooks/             # 自定义Hooks
│   │   └── types/             # TypeScript类型定义
│   ├── e2e/                   # E2E测试
│   └── dist/                  # 构建输出
├── miniprogram/               # 微信小程序
│   ├── pages/                 # 页面
│   ├── components/            # 组件
│   └── utils/                 # 工具函数
└── docs/                      # 文档
```

## MQTT通信

- 上行主题：`/up/{deviceID}/{action}`
- 下行主题：`/down/{deviceID}/{action}`
- 消息格式：JSON
- 设备ID：4G模组IMEI号

### 上行主题（设备→服务器）
| 主题 | 说明 | Payload示例 |
|------|------|-------------|
| `/up/{deviceID}/login` | 设备上线 | `{"IMEI":"xxx","ICCID":"xxx"}` |
| `/up/{deviceID}/datas` | 数据上送 | `{"temp":25.5,"humi":60,...}` |
| `/up/{deviceID}/parameter` | 参数上送 | 参数配置数据 |
| `/up/{deviceID}/getdatas_reply` | 数据刷新响应 | 实时数据 |
| `/up/{deviceID}/getparam_reply` | 参数刷新响应 | 参数配置 |
| `/up/{deviceID}/ctr_reply` | 控制响应 | 控制结果 |
| `/up/{deviceID}/set_reply` | 设置响应 | 设置结果 |
| `/up/{deviceID}/ntp_reply` | 校时响应 | 校时结果 |

### 下行主题（服务器→设备）
| 主题 | 说明 | Payload示例 |
|------|------|-------------|
| `/down/{deviceID}/login_reply` | 上线响应 | `{"result":0}` |
| `/down/{deviceID}/datas_reply` | 数据上送响应 | `{"result":0}` |
| `/down/{deviceID}/parameter_reply` | 参数上送响应 | `{"result":0}` |
| `/down/{deviceID}/getdatas` | 请求数据 | `{}` |
| `/down/{deviceID}/getparam` | 请求参数 | `{}` |
| `/down/{deviceID}/ctr` | 远程控制 | `{"action":"on"}` |
| `/down/{deviceID}/set` | 参数设置 | 参数JSON |
| `/down/{deviceID}/ntp` | 远程校时 | `{}` |

## API端点

### 设备管理
- `GET /api/devices` - 获取设备列表
- `GET /api/devices/:id` - 获取设备详情
- `GET /api/devices/:id/realtime` - 获取实时数据
- `GET /api/devices/:id/history` - 获取历史数据
- `PUT /api/devices/:id` - 更新设备信息

### 设备控制
- `POST /api/devices/:id/control` - 远程控制
- `PUT /api/devices/:id/params` - 设置参数
- `GET /api/devices/:id/params` - 获取参数配置

### 告警管理
- `GET /api/alarms` - 获取告警列表
- `PUT /api/alarms/:id/acknowledge` - 确认告警

### 数据统计
- `GET /api/stats/overview` - 概览统计
- `GET /api/stats/trend` - 趋势数据

## 编码规范

- 使用TypeScript严格模式
- 遵循ESLint和Prettier配置
- 函数必须有显式返回类型
- 错误处理要完整
- 测试覆盖率要求80%+

## 部署信息

- 服务器：腾讯云 Ubuntu 22.04 LTS + Docker 26
- 域名：www.jxbonner.cloud
- MQTT Broker：EMQX 5.21，SSL已配置
