import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Find devices with temperature', async ({ page }) => {
  console.log('\n=== 查找有温度数据的设备 ===\n');

  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

  // 获取API响应
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/devices') && r.status() === 200),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const data = await response.json();

  // 找出有温度的设备
  const devicesWithTemp = data.data.filter(d =>
    d.realtimeData?.temperature !== null && d.realtimeData?.temperature !== undefined
  );

  console.log(`有温度数据的设备: ${devicesWithTemp.length} 台\n`);
  console.log('设备列表:');
  console.log('-'.repeat(80));

  for (const d of devicesWithTemp) {
    const temp = Number(d.realtimeData.temperature).toFixed(1);
    const humi = d.realtimeData.humidity ? Number(d.realtimeData.humidity).toFixed(0) : '-';
    const time = new Date(d.realtimeData.recordedAt).toLocaleString('zh-CN');
    console.log(`  ${d.id}  温度: ${temp}°C  湿度: ${humi}%  记录时间: ${time}`);
  }

  console.log('-'.repeat(80));

  // 这些设备在表格中的位置
  const allDevices = data.data;
  console.log('\n这些设备在当前页的位置:');

  for (const d of devicesWithTemp) {
    const index = allDevices.findIndex(device => device.id === d.id);
    console.log(`  ${d.id} -> 第 ${index + 1} 行`);
  }

  // 检查表格中这些行的显示
  console.log('\n检查表格显示:');
  await page.waitForLoadState('networkidle');

  for (const d of devicesWithTemp.slice(0, 5)) {
    const index = allDevices.findIndex(device => device.id === d.id);
    const row = page.locator('.ant-table-tbody tr').nth(index);
    const cells = await row.locator('td').allTextContents();
    const tempInTable = cells[3]?.trim();

    console.log(`  第${index + 1}行 ${d.id}: 表格温度="${tempInTable}", API温度=${d.realtimeData.temperature}°C`);
  }
});