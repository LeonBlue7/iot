import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(300000);

test('打开浏览器手动验证分页', async ({ page }) => {
  console.log('\n打开浏览器，请在浏览器中手动验证...\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

  // 导航到设备管理
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');

  console.log('已打开设备管理页面');
  console.log('浏览器将保持打开120秒供您验证...\n');
  console.log('请测试：');
  console.log('1. 点击分页器右侧的下拉框');
  console.log('2. 选择 "100 条/页"');
  console.log('3. 观察表格是否变为100行');
  console.log('4. 观察分页页码是否变化\n');

  await page.waitForTimeout(120000);
});