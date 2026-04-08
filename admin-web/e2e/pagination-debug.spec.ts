import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('Debug pagination issues', async ({ page }) => {
  console.log('\n' + '='.repeat(70));
  console.log('  分页问题诊断测试');
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
  const [devicesResponse] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/devices') && r.status() === 200),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const initialData = await devicesResponse.json();
  console.log('初始API响应:');
  console.log(`  total: ${initialData.total}`);
  console.log(`  data.length: ${initialData.data?.length}`);
  console.log(`  page: ${initialData.page}`);
  console.log(`  limit: ${initialData.limit}`);

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 检查表格行数
  const rows = await page.locator('.ant-table-tbody tr').count();
  console.log(`\n表格显示行数: ${rows}`);

  // 检查分页器状态
  const paginationInfo = await page.locator('.ant-pagination').textContent();
  console.log(`分页器信息: ${paginationInfo}`);

  // Bug 1: 检查分页页码
  const pageItems = await page.locator('.ant-pagination-item').count();
  console.log(`\n分页页码数量: ${pageItems}`);

  if (pageItems >= 3) {
    console.log('✓ 分页页码显示正常 (>=3个)');
  } else if (pageItems > 0) {
    console.log(`⚠️ 分页页码数量不足 (${pageItems}个)`);
  } else {
    console.log('✗ 无分页页码');
  }

  // Bug 2: 检查快速跳转
  const quickJumper = await page.locator('.ant-pagination-options-quick-jumper').count();
  console.log(`快速跳转: ${quickJumper > 0 ? '有' : '无'}`);

  // Bug 3: 测试切换每页条数
  console.log('\n测试切换每页条数...');

  // 找到每页条数选择器
  const pageSizeSelector = page.locator('.ant-pagination-options .ant-select');
  if (await pageSizeSelector.count() > 0) {
    await pageSizeSelector.click();
    await page.waitForTimeout(500);

    // 点击 100 条选项
    const option100 = page.locator('.ant-select-dropdown .ant-select-item').filter({ hasText: '100' });
    if (await option100.count() > 0) {
      console.log('点击 "100 条/页" 选项...');

      // 监听API请求
      const [newResponse] = await Promise.all([
        page.waitForResponse(r =>
          r.url().includes('/api/devices') &&
          r.url().includes('limit=100') &&
          r.status() === 200,
          { timeout: 10000 }
        ).catch(() => null),
        option100.click()
      ]);

      await page.waitForTimeout(2000);

      if (newResponse) {
        const newData = await newResponse.json();
        console.log(`\n切换后API响应:`);
        console.log(`  limit: ${newData.limit}`);
        console.log(`  data.length: ${newData.data?.length}`);
        console.log('✓ API请求成功发出 limit=100');
      } else {
        console.log('✗ 未检测到 limit=100 的API请求');

        // 检查当前表格行数
        const currentRows = await page.locator('.ant-table-tbody tr').count();
        console.log(`当前表格行数: ${currentRows}`);
      }
    } else {
      console.log('✗ 未找到 "100 条/页" 选项');
    }
  } else {
    console.log('✗ 未找到每页条数选择器');
  }

  // Bug 4: 测试翻页
  console.log('\n测试翻页...');

  const page2Button = page.locator('.ant-pagination-item-2');
  if (await page2Button.count() > 0) {
    const [page2Response] = await Promise.all([
      page.waitForResponse(r =>
        r.url().includes('/api/devices') &&
        r.url().includes('page=2') &&
        r.status() === 200,
        { timeout: 10000 }
      ).catch(() => null),
      page2Button.click()
    ]);

    await page.waitForTimeout(2000);

    if (page2Response) {
      const page2Data = await page2Response.json();
      console.log(`\n第2页API响应:`);
      console.log(`  page: ${page2Data.page}`);
      console.log(`  data.length: ${page2Data.data?.length}`);
      console.log('✓ 翻页功能正常');
    } else {
      console.log('✗ 翻页时未检测到 page=2 的API请求');
    }
  } else {
    console.log('⚠️ 第2页按钮不存在');
  }

  // 截图
  await page.screenshot({ path: 'test-results/pagination-debug.png', fullPage: true });
  console.log('\n截图: test-results/pagination-debug.png');

  console.log('\n' + '='.repeat(70));
});