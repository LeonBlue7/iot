# 物联网管理系统

智能办公空调控制系统，支持MQTT设备接入、数据存储和REST API。

## 技术栈

- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL + Redis
- **MQTT Broker**：EMQX 5.21
- **前端**：微信小程序

## 快速开始

### 后端
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 小程序
```bash
cd miniprogram
# 使用微信开发者工具打开
```

## 项目结构

- `backend/` - Node.js后端服务
- `miniprogram/` - 微信小程序前端
- `docs/` - 项目文档

## License

MIT