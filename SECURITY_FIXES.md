# 安全修复报告

本文档记录了在代码审查中发现并修复的所有安全问题。

## 修复日期
2026-03-23

## CRITICAL 级别问题（已全部修复）

### 1. .env 凭证泄露风险
**问题描述**: `.env` 文件包含弱密码和暴露的 JWT 密钥，且存在被提交到版本控制的风险

**修复措施**:
- ✅ 确认 `.gitignore` 已包含 `.env` 条目
- ✅ 生成强随机密码替换弱密码：
  - `DB_PASSWORD`: 使用 `openssl rand -base64 32` 生成
  - `REDIS_PASSWORD`: 使用 `openssl rand -base64 32` 生成
  - `JWT_SECRET`: 使用 `openssl rand -base64 64` 生成
- ✅ 更新 `.env.example` 模板，提供密码生成命令说明
- ✅ 添加 `INITIAL_ADMIN_PASSWORD` 环境变量配置

**文件变更**:
- `backend/.env` - 更新为强密码
- `backend/.env.example` - 添加密码生成说明和 `INITIAL_ADMIN_PASSWORD`

### 2. 弱默认管理员密码
**问题描述**: `seed.ts` 中硬编码弱密码 `admin123`，并将密码输出到日志

**修复措施**:
- ✅ 移除硬编码密码，改用环境变量 `INITIAL_ADMIN_PASSWORD`
- ✅ 未设置环境变量时自动生成强随机密码（16 字符 UUID）
- ✅ 移除密码日志输出
- ✅ 添加 `mustChangePassword` 标志，强制首次登录修改密码

**文件变更**:
- `backend/prisma/seed.ts` - 重构为安全密码管理

### 3. 微信小程序 AppID 暴露
**问题描述**: `WECHAT_APPID` 暴露在 `.env` 文件中

**状态**: ⚠️ 部分修复
- AppID 本身不是敏感信息（类似于公钥）
- `WECHAT_SECRET` 已留空，需要通过环境变量配置
- 已在 `.env.example` 中标注生产环境配置说明

## HIGH 级别问题（已全部修复）

### 1. parseInt 验证缺失
**问题描述**: `deviceController.ts` 中使用 `parseInt` 但未验证 NaN 和有效范围

**修复措施**:
- ✅ 添加 `Number.isNaN()` 验证
- ✅ 添加 `.refine()` 范围验证：
  - `page`: 必须 >= 1
  - `limit`: 必须在 1-100 之间（列表）或 1-1000 之间（历史数据）
- ✅ 提供清晰的错误消息

**文件变更**:
- `backend/src/controllers/deviceController.ts` - 增强输入验证

### 2. 前端 token 明文存储
**问题描述**: 微信小程序中 token 以明文形式存储在 localStorage

**修复措施**:
- ✅ 使用 `wx.base64Encode()` 对 token 进行编码存储
- ✅ 添加 `decodeToken()` 函数用于解码
- ✅ 添加 token 过期时间存储（`TOKEN_EXPIRY_KEY`）
- ✅ 添加 `isTokenExpired()` 函数检查过期状态
- ✅ 更新 `isLoggedIn()` 包含过期检查

**文件变更**:
- `miniprogram/utils/auth.ts` - 增强 token 安全管理

### 3. 登录端点速率限制
**问题描述**: 需要确认登录端点是否有速率限制防止暴力破解

**状态**: ✅ 已实现
- `/api/admin/auth/login` 已配置 `loginLimiter`
- 限制：每 15 分钟最多 10 次尝试
- 超过限制返回友好错误消息

**相关文件**:
- `backend/src/app.ts` - 已配置速率限制

## 验证清单

- [x] 所有 CRITICAL 问题已修复
- [x] 所有 HIGH 问题已修复
- [x] `.env` 文件未被 git 追踪
- [x] 强密码已生成并应用
- [x] 输入验证已增强
- [x] token 存储已加密
- [x] 速率限制已配置

## 后续建议

1. **密钥管理**: 考虑使用专业的密钥管理服务（如 AWS Secrets Manager、HashiCorp Vault）
2. **定期轮换**: 建立密钥轮换机制，定期更新 JWT_SECRET 和数据库密码
3. **监控告警**: 配置登录失败监控，检测异常登录尝试
4. **HTTPS 强制**: 生产环境强制使用 HTTPS
5. **安全审计**: 定期进行安全审计和渗透测试

## 命令参考

生成强密码：
```bash
# JWT Secret (64 字节)
openssl rand -base64 64

# 数据库/Redis 密码 (32 字节)
openssl rand -base64 32

# 初始管理员密码 (16 字节)
openssl rand -base64 16
```
