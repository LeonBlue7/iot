import { test } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(300000);

test('Open browser for user to verify', async ({ page }) => {
  console.log('\n打开浏览器，请查看页面...\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

  // 导航到设备管理页面
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');

  // 等待用户查看
  console.log('已打开设备管理页面');
  console.log('浏览器将保持打开60秒供您查看...\n');
  await page.waitForTimeout(60000);
});