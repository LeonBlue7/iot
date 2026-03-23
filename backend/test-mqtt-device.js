// 模拟 MQTT 设备测试脚本
const mqtt = require('mqtt');

// 使用 15 位数字 IMEI 格式（标准 IMEI 格式）
const DEVICE_ID = '123456789012345';
const BROKER_URL = 'mqtt://localhost:1883';

console.log('=== MQTT 设备模拟器 ===');
console.log(`设备 ID: ${DEVICE_ID}`);
console.log(`Broker: ${BROKER_URL}`);
console.log('');

// 连接 MQTT Broker
const client = mqtt.connect(BROKER_URL, {
  clientId: `test_device_${Date.now()}`,
  clean: true,
  reconnectPeriod: 1000,
});

client.on('connect', () => {
  console.log('✓ MQTT 连接成功');

  // 订阅下行主题
  const downTopics = [
    `/down/${DEVICE_ID}/#`,
  ];

  downTopics.forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`订阅失败：${topic}`, err);
      } else {
        console.log(`✓ 订阅主题：${topic}`);
      }
    });
  });

  // 发布登录消息
  const loginMessage = {
    IMEI: DEVICE_ID,
    ICCID: '89860123456789012345',
  };

  client.publish(`/up/${DEVICE_ID}/login`, JSON.stringify(loginMessage), (err) => {
    if (err) {
      console.error('发送登录消息失败:', err);
    } else {
      console.log(`✓ 发送登录消息：${JSON.stringify(loginMessage)}`);
    }
  });

  // 模拟定时上送数据
  let count = 0;
  const dataInterval = setInterval(() => {
    count++;

    const sensorData = {
      temp: parseFloat((25 + Math.random() * 5).toFixed(1)),  // 25-30°C
      humi: parseFloat((50 + Math.random() * 10).toFixed(1)), // 50-60%RH
      curr: Math.floor(100 + Math.random() * 50), // 100-150mA
      sig: Math.floor(20 + Math.random() * 30), // 20-50dBm
      acState: Math.random() > 0.1 ? 1 : 0,
      acErr: 0,
    };

    client.publish(`/up/${DEVICE_ID}/datas`, JSON.stringify(sensorData), (err) => {
      if (err) {
        console.error('发送数据失败:', err);
      } else {
        console.log(`✓ 上送数据 #${count}: ${JSON.stringify(sensorData)}`);
      }
    });

    if (count >= 3) {
      clearInterval(dataInterval);

      // 等待一段时间后断开
      setTimeout(() => {
        client.end();
        console.log('\n✓ 测试完成，已断开连接');
        process.exit(0);
      }, 3000);
    }
  }, 2000);
});

client.on('message', (topic, message) => {
  console.log(`← 收到消息 [${topic}]: ${message.toString()}`);

  // 处理服务器下发的控制命令
  try {
    const payload = JSON.parse(message.toString());
    console.log(`  解析后的 payload:`, payload);
  } catch (e) {
    // 忽略解析错误
  }
});

client.on('error', (err) => {
  console.error('MQTT 错误:', err);
  process.exit(1);
});

client.on('offline', () => {
  console.log('MQTT 离线');
});

// 优雅退出
process.on('SIGINT', () => {
  client.end();
  console.log('\n已断开连接');
  process.exit(0);
});
