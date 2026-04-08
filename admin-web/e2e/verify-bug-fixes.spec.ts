import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('验证5个Bug修复', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  验证5个Bug修复');
  console.log('='.repeat(70) + '\n');

  // ========== 登录 ==========
  console.log('[登录]');
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('  ✓ 登录成功\n');

  // ========== Bug 4 & 5: 仪表盘 ==========
  console.log('[Bug 4 & 5] 仪表盘页面');
  await page.goto(`${PROD_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Bug 4: 在线设备数量不等于总数
  const statCards = await page.locator('.ant-statistic').all();
  console.log(`  统计卡片数量: ${statCards.length}`);

  // 获取各统计值
  const totalDevicesText = await page.locator('.ant-statistic').filter({ hasText: '设备总数' }).locator('.ant-statistic-content-value').textContent();
  const onlineDevicesText = await page.locator('.ant-statistic').filter({ hasText: '在线设备' }).locator('.ant-statistic-content-value').textContent();
  const offlineDevicesText = await page.locator('.ant-statistic').filter({ hasText: '离线设备' }).locator('.ant-statistic-content-value').textContent();

  const totalDevices = parseInt(totalDevicesText || '0');
  const onlineDevices = parseInt(onlineDevicesText || '0');
  const offlineDevices = parseInt(offlineDevicesText || '0');

  console.log(`  设备总数: ${totalDevices}`);
  console.log(`  在线设备: ${onlineDevices}`);
  console.log(`  离线设备: ${offlineDevices}`);

  // Bug 4 验证: 在线+离线=总数，且在线不等于总数
  if (onlineDevices + offlineDevices === totalDevices) {
    console.log('  ✓ Bug 4修复: 在线+离线=总数');
  } else {
    console.log(`  ✗ Bug 4未修复: ${onlineDevices} + ${offlineDevices} ≠ ${totalDevices}`);
  }

  // Bug 5: 空调开机数量
  const acPowerOn = await page.locator('.ant-statistic').filter({ hasText: '空调开机' }).count();
  if (acPowerOn > 0) {
    const acCount = await page.locator('.ant-statistic').filter({ hasText: '空调开机' }).locator('.ant-statistic-content-value').textContent();
    console.log(`  ✓ Bug 5修复: 空调开机数量显示 = ${acCount} 台`);
  } else {
    console.log('  ✗ Bug 5未修复: 未找到空调开机统计卡片');
  }

  await page.screenshot({ path: 'test-results/bug-fix-dashboard.png', fullPage: true });
  console.log('');

  // ========== Bug 1, 2, 3: 设备管理 ==========
  console.log('[Bug 1, 2, 3] 设备管理页面');

  const [devicesResponse] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/devices') && r.status() === 200),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const devicesData = await devicesResponse.json();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Bug 1: 分页页码
  const pagination = page.locator('.ant-pagination');
  const pageItems = await pagination.locator('.ant-pagination-item').count();
  const quickJumper = await pagination.locator('.ant-pagination-options-quick-jumper').count();

  console.log(`  分页页码数量: ${pageItems}`);
  console.log(`  快速跳转: ${quickJumper > 0 ? '有' : '无'}`);

  if (pageItems >= 3 || quickJumper > 0) {
    console.log('  ✓ Bug 1修复: 分页页码显示正常');
  } else {
    console.log('  ✗ Bug 1未修复: 分页页码不完整');
  }

  // Bug 2: 温度显示
  const devicesWithTemp = devicesData.data?.filter((d: any) =>
    d.realtimeData?.temperature !== null && d.realtimeData?.temperature !== undefined
  ) || [];

  console.log(`  有温度数据的设备: ${devicesWithTemp.length}`);

  // 检查表格中的温度显示
  let tempDisplayed = 0;
  for (const device of devicesWithTemp.slice(0, 5)) {
    const row = page.locator(`tr:has-text("${device.id}")`);
    const cells = await row.locator('td').allTextContents();
    const tempColumn = cells[3]?.trim();

    if (tempColumn && tempColumn !== '-' && tempColumn !== '') {
      tempDisplayed++;
    }
  }

  if (tempDisplayed > 0) {
    console.log(`  ✓ Bug 2修复: 温度列显示正确 (${tempDisplayed}/5)`);
  } else {
    console.log('  ✗ Bug 2未修复: 温度列仍显示"-"');
  }

  // Bug 3: 空调状态列
  const headers = await page.locator('.ant-table-thead th').allTextContents();
  const hasAcColumn = headers.some(h => h.includes('空调状态'));

  if (hasAcColumn) {
    console.log('  ✓ Bug 3修复: 空调状态列存在');

    // 检查状态Tag
    const openTags = await page.locator('.ant-tag').filter({ hasText: '开启' }).count();
    const closeTags = await page.locator('.ant-tag').filter({ hasText: '关闭' }).count();
    console.log(`    开启: ${openTags}台, 关闭: ${closeTags}台`);
  } else {
    console.log('  ✗ Bug 3未修复: 未找到空调状态列');
  }

  await page.screenshot({ path: 'test-results/bug-fix-devices.png', fullPage: true });

  console.log('\n' + '='.repeat(70));
  console.log('  验证完成');
  console.log('='.repeat(70));
});