import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('详细测试分页切换问题', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  分页切换详细测试');
  console.log('='.repeat(70) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ 登录成功\n');

  // 导航到设备管理
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 初始状态
  let rows = await page.locator('.ant-table-tbody tr').count();
  console.log(`初始表格行数: ${rows}`);

  // 测试切换到 100 条 - 关键测试
  console.log('\n--- 测试切换到 100 条/页 (关键测试) ---');

  // 监听所有网络请求
  const requests: { url: string; method: string }[] = [];
  page.on('request', req => {
    if (req.url().includes('/api/devices')) {
      requests.push({ url: req.url(), method: req.method() });
    }
  });

  // 打开下拉框
  await page.locator('.ant-pagination-options .ant-select').click();
  await page.waitForTimeout(500);

  // 使用更精确的选择器
  const option100 = page.getByRole('option', { name: '100 条/页', exact: false });
  console.log(`找到100条选项: ${await option100.count()}`);

  // 点击100条选项
  await option100.click();
  await page.waitForTimeout(5000);

  rows = await page.locator('.ant-table-tbody tr').count();
  console.log(`\n切换后表格行数: ${rows}`);

  const pageItemsAfter100 = await page.locator('.ant-pagination-item').count();
  console.log(`分页页码数量: ${pageItemsAfter100}`);

  console.log('\n网络请求记录:');
  requests.forEach((req, i) => {
    console.log(`  ${i + 1}. [${req.method}] ${req.url}`);
  });

  if (rows === 100) {
    console.log('\n✓ 切换到100条成功');
  } else if (rows === 50) {
    console.log('\n✗ 切换到100条失败！仍然显示50条');
    console.log('   这是Bug：前端没有正确处理100条的情况');
  } else {
    console.log(`\n⚠ 切换到100条，实际显示${rows}条`);
  }

  // 检查分页器是否隐藏
  if (pageItemsAfter100 === 0) {
    console.log('✗ 分页页码消失！这可能是问题所在');
  }

  // 测试切换到 10 条
  console.log('\n--- 测试切换到 10 条/页 ---');
  requests.length = 0; // 清空请求记录

  await page.locator('.ant-pagination-options .ant-select').click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: '10 条/页' }).click();
  await page.waitForTimeout(3000);

  rows = await page.locator('.ant-table-tbody tr').count();
  console.log(`切换后表格行数: ${rows}`);

  console.log('\n网络请求记录:');
  requests.forEach((req, i) => {
    console.log(`  ${i + 1}. [${req.method}] ${req.url}`);
  });

  if (rows === 10) {
    console.log('✓ 切换到10条成功');
  } else {
    console.log(`✗ 切换到10条失败，实际显示${rows}条`);
  }

  // 再次测试切换到 100 条
  console.log('\n--- 再次测试切换到 100 条/页 ---');
  requests.length = 0;

  await page.locator('.ant-pagination-options .ant-select').click();
  await page.waitForTimeout(500);
  await page.getByRole('option', { name: '100 条/页' }).click();
  await page.waitForTimeout(5000);

  rows = await page.locator('.ant-table-tbody tr').count();
  console.log(`切换后表格行数: ${rows}`);

  console.log('\n网络请求记录:');
  requests.forEach((req, i) => {
    console.log(`  ${i + 1}. [${req.method}] ${req.url}`);
  });

  // 截图
  await page.screenshot({ path: 'test-results/pagination-100-test.png', fullPage: true });

  console.log('\n' + '='.repeat(70));
  console.log('  测试结论');
  console.log('='.repeat(70));

  if (rows === 100) {
    console.log('\n✓ 分页功能正常，切换到100条成功');
  } else {
    console.log(`\n✗ 确认存在Bug: 切换到100条时，表格显示${rows}条而非100条`);
  }
});