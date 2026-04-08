import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('复现：搜索和详情后设备数量变回50的问题', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  复现问题：搜索和详情后设备数量变化');
  console.log('='.repeat(70) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ 登录成功\n');

  // Step 1: 初始状态检查
  console.log('=== Step 1: 初始状态检查 ===');
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  let rows = await page.locator('.ant-table-tbody tr').count();
  let totalText = await page.locator('.ant-pagination-total-text').textContent();
  console.log(`初始: ${rows} 行, ${totalText}`);

  // 检查温度显示
  const tempCells = await page.locator('.ant-table-tbody tr td:nth-child(4)').allTextContents();
  const tempValues = tempCells.filter(t => t !== '-').length;
  console.log(`有温度数据的行数: ${tempValues}`);

  // Step 2: 切换到100条
  console.log('\n=== Step 2: 切换到100条/页 ===');
  await page.locator('.ant-pagination .ant-select-selector').click();
  await page.waitForTimeout(300);
  await page.locator('.ant-select-dropdown .ant-select-item').filter({ hasText: '100' }).click();
  await page.waitForTimeout(3000);

  rows = await page.locator('.ant-table-tbody tr').count();
  console.log(`切换后: ${rows} 行`);

  // Step 3: 进行搜索
  console.log('\n=== Step 3: 进行搜索 ===');

  // 输入搜索关键字
  const searchInput = page.locator('input[placeholder*="设备ID"]').first();
  if (await searchInput.count() > 0) {
    await searchInput.fill('866');
    await page.waitForTimeout(500);

    // 点击搜索按钮
    const searchBtn = page.locator('button').filter({ hasText: '搜索' }).first();
    await searchBtn.click();
    await page.waitForTimeout(3000);

    rows = await page.locator('.ant-table-tbody tr').count();
    totalText = await page.locator('.ant-pagination-total-text').textContent();
    console.log(`搜索后: ${rows} 行, ${totalText}`);

    // Step 4: 重置搜索
    console.log('\n=== Step 4: 重置搜索 ===');
    const resetBtn = page.locator('button').filter({ hasText: '重置' }).first();
    await resetBtn.click();
    await page.waitForTimeout(3000);

    rows = await page.locator('.ant-table-tbody tr').count();
    totalText = await page.locator('.ant-pagination-total-text').textContent();
    console.log(`重置后: ${rows} 行, ${totalText}`);
  } else {
    console.log('未找到搜索输入框');
  }

  // Step 5: 查看设备详情
  console.log('\n=== Step 5: 查看设备详情 ===');

  // 点击第一个设备的详情按钮
  const detailBtn = page.locator('button').filter({ hasText: '详情' }).first();
  await detailBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log(`进入详情页，URL: ${page.url()}`);

  // Step 6: 返回列表
  console.log('\n=== Step 6: 返回列表 ===');
  const backBtn = page.locator('button').filter({ hasText: '返回' });
  if (await backBtn.count() > 0) {
    await backBtn.click();
  } else {
    // 点击面包屑或直接导航
    await page.goto(`${PROD_URL}/devices`);
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  rows = await page.locator('.ant-table-tbody tr').count();
  totalText = await page.locator('.ant-pagination-total-text').textContent();
  const pageSizeText = await page.locator('.ant-pagination-options .ant-select-selection-item').textContent();

  console.log(`返回后: ${rows} 行, ${totalText}, 每页: ${pageSizeText}`);

  // 检查温度显示
  const tempCellsAfter = await page.locator('.ant-table-tbody tr td:nth-child(4)').allTextContents();
  const tempValuesAfter = tempCellsAfter.filter(t => t !== '-').length;
  console.log(`有温度数据的行数: ${tempValuesAfter}`);

  // 截图
  await page.screenshot({ path: 'test-results/after-detail-return.png', fullPage: true });

  // 问题判断
  console.log('\n' + '='.repeat(70));
  console.log('  问题判断');
  console.log('='.repeat(70));

  if (rows === 50 && pageSizeText?.includes('100')) {
    console.log('\n✗ Bug确认: 每页设置是100条，但只显示50条数据！');
  } else if (rows === 50) {
    console.log('\n⚠️  每页设置被重置为50条');
  } else {
    console.log(`\n✓ 正常: 显示${rows}条`);
  }

  if (tempValues > 0 && tempValuesAfter === 0) {
    console.log('✗ Bug确认: 温度数据丢失！');
  } else if (tempValuesAfter > 0) {
    console.log(`✓ 温度显示正常: ${tempValuesAfter}行有温度数据`);
  }
});