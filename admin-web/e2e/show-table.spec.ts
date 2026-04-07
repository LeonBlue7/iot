import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Show exact table content', async ({ page }) => {
  console.log('\n=== 设备管理页面表格内容 ===\n');

  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

  // 强制刷新设备管理页面
  await page.goto(`${PROD_URL}/devices`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 获取所有表格行
  const rows = await page.locator('.ant-table-tbody tr').all();
  console.log(`表格共 ${rows.length} 行\n`);

  // 打印前15行的完整内容
  console.log('表格内容（前15行）:');
  console.log('-'.repeat(100));

  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    const cells = await row.locator('td').allTextContents();

    // 列结构: [checkbox] [设备ID] [名称] [温度] [状态] [启用] [操作]
    const deviceId = cells[1]?.trim();
    const name = cells[2]?.trim();
    const temp = cells[3]?.trim();
    const status = cells[4]?.trim();

    console.log(`行${i + 1}: 设备ID=${deviceId.padEnd(18)} 名称=${(name || '未命名').padEnd(8)} 温度=${temp.padEnd(6)} 状态=${status}`);
  }

  console.log('-'.repeat(100));

  // 统计温度显示情况
  let withTemp = 0;
  let withoutTemp = 0;

  for (const row of rows) {
    const cells = await row.locator('td').allTextContents();
    const temp = cells[3]?.trim();
    if (temp && temp !== '-' && temp !== '') {
      withTemp++;
    } else {
      withoutTemp++;
    }
  }

  console.log(`\n统计: 有温度=${withTemp}, 无温度=${withoutTemp}`);

  // 截图
  await page.screenshot({ path: 'test-results/table-content.png', fullPage: false });
  console.log('\n截图: test-results/table-content.png');
});