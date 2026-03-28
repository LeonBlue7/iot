# SSL 证书目录说明

此目录用于存放 Nginx SSL/TLS 证书文件。

## 所需文件

生产环境需要以下证书文件：

```
nginx/ssl/
├── jxbonner.cloud_bundle.pem   # SSL 证书链（包含中间证书）
└── jxbonner.cloud.key          # 私钥文件
```

## 获取 SSL 证书

### 方式一：Let's Encrypt（推荐）

```bash
# 安装 certbot
sudo apt install certbot -y

# 获取证书（先停止 nginx）
sudo certbot certonly --standalone -d www.jxbonner.cloud -d jxbonner.cloud

# 证书将保存在：
# /etc/letsencrypt/live/www.jxbonner.cloud/fullchain.pem
# /etc/letsencrypt/live/www.jxbonner.cloud/privkey.pem

# 复制到项目目录
sudo cp /etc/letsencrypt/live/www.jxbonner.cloud/fullchain.pem nginx/ssl/jxbonner.cloud_bundle.pem
sudo cp /etc/letsencrypt/live/www.jxbonner.cloud/privkey.pem nginx/ssl/jxbonner.cloud.key

# 设置权限
sudo chmod 644 nginx/ssl/jxbonner.cloud_bundle.pem
sudo chmod 600 nginx/ssl/jxbonner.cloud.key
```

### 方式二：商业证书

```bash
# 1. 生成私钥
openssl genrsa -out jxbonner.cloud.key 2048

# 2. 生成 CSR
openssl req -new -key jxbonner.cloud.key -out jxbonner.cloud.csr \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=YourOrg/CN=www.jxbonner.cloud"

# 3. 将 CSR 提交给证书颁发机构

# 4. 下载证书后，合并证书链
cat your_certificate.crt intermediate.crt > jxbonner.cloud_bundle.pem

# 5. 复制到 ssl 目录
cp jxbonner.cloud_bundle.pem nginx/ssl/
cp jxbonner.cloud.key nginx/ssl/
```

### 方式三：自签名证书（仅开发测试）

```bash
# 生成自签名证书（有效期 365 天）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/jxbonner.cloud.key \
  -out nginx/ssl/jxbonner.cloud_bundle.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Dev/CN=localhost"

# ⚠️ 警告：自签名证书仅用于开发测试，不可用于生产环境
```

## 文件权限

```bash
# 证书文件（可读）
chmod 644 nginx/ssl/jxbonner.cloud_bundle.pem

# 私钥文件（仅所有者可读）
chmod 600 nginx/ssl/jxbonner.cloud.key
```

## 自动续期（Let's Encrypt）

```bash
# 添加 crontab 任务
crontab -e

# 每月 1 号凌晨 3 点检查续期
0 3 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/www.jxbonner.cloud/fullchain.pem /opt/iot/nginx/ssl/jxbonner.cloud_bundle.pem && cp /etc/letsencrypt/live/www.jxbonner.cloud/privkey.pem /opt/iot/nginx/ssl/jxbonner.cloud.key && docker-compose -f /opt/iot/docker-compose.prod.yml restart nginx
```

## 验证证书

```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/jxbonner.cloud_bundle.pem -noout -dates

# 检查证书域名
openssl x509 -in nginx/ssl/jxbonner.cloud_bundle.pem -noout -text | grep -A1 "Subject Alternative Name"

# 测试 SSL 连接
openssl s_client -connect www.jxbonner.cloud:443 -servername www.jxbonner.cloud
```

## 注意事项

1. **切勿将私钥提交到版本控制** - 私钥文件已在 `.gitignore` 中排除
2. **定期检查证书有效期** - Let's Encrypt 证书有效期为 90 天
3. **备份证书文件** - 将证书文件备份到安全位置
4. **生产环境必须使用 HTTPS** - HTTP 会被自动重定向到 HTTPS