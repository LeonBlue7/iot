import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Verify temperature display for devices with data', async ({ page }) => {
  console.log('\n=== Verify Temperature Display ===\n');

  // Login
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  const loginBtn = page.locator('button').filter({ hasText: /登\s*录/ });
  await loginBtn.click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ Logged in\n');

  // Get devices with temperature data
  const [devicesResponse] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/devices') &&
      resp.url().includes('includeRealtime=true')
    ),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const devicesBody = await devicesResponse.json();
  const devices = devicesBody.data;

  // Find devices with temperature data
  const devicesWithTemp = devices.filter(d =>
    d.realtimeData?.temperature !== null && d.realtimeData?.temperature !== undefined
  );

  console.log(`Found ${devicesWithTemp.length} devices with temperature data\n`);

  if (devicesWithTemp.length === 0) {
    console.log('No devices with temperature data to test');
    return;
  }

  // Check if the device list shows temperature for these devices
  for (const device of devicesWithTemp.slice(0, 3)) {
    const deviceId = device.id;
    const expectedTemp = device.realtimeData.temperature;

    console.log(`Checking device ${deviceId}:`);
    console.log(`  API temperature: ${expectedTemp}°C`);

    // Find the row for this device
    const deviceRow = page.locator(`tr:has-text("${deviceId}")`);
    const rowCells = await deviceRow.locator('td').allTextContents();

    console.log(`  Table row content: ${rowCells.slice(0, 6).join(' | ')}`);

    // Check if temperature column shows the value (column 3)
    const tempColumn = rowCells[3]?.trim();
    if (tempColumn && tempColumn !== '-' && tempColumn !== '') {
      console.log(`  ✓ Temperature displayed: ${tempColumn}`);
    } else {
      console.log(`  ✗ Temperature NOT displayed (column shows: "${tempColumn}")`);
    }
    console.log('');
  }

  // Navigate to device detail for the first device with temp
  const testDevice = devicesWithTemp[0];
  console.log(`\n=== Device Detail: ${testDevice.id} ===`);

  await page.goto(`${PROD_URL}/devices/${testDevice.id}`);
  await page.waitForLoadState('networkidle');

  // Check realtime data card
  const pageContent = await page.textContent('body');

  // Look for temperature value
  const tempMatch = pageContent?.match(/(\d+\.?\d*)\s*°C/);
  if (tempMatch) {
    console.log(`  ✓ Temperature found in detail page: ${tempMatch[0]}`);
  } else {
    console.log(`  ✗ Temperature NOT found in detail page`);

    // Check for "暂无数据" text
    if (pageContent?.includes('暂无') || pageContent?.includes('- °C')) {
      console.log(`  Page shows placeholder/no data indicator`);
    }
  }

  // Look for humidity
  const humiMatch = pageContent?.match(/(\d+\.?\d*)\s*%/);
  if (humiMatch) {
    console.log(`  ✓ Humidity found: ${humiMatch[0]}`);
  }

  // Check recorded time
  const recordedMatch = pageContent?.match(/记录时间[：:]\s*(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}:\d{2})/);
  if (recordedMatch) {
    console.log(`  Recorded time: ${recordedMatch[1]}`);
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/temp-display-verify.png', fullPage: true });
  console.log('\nScreenshot saved');
});