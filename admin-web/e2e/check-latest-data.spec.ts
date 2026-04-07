import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(120000);

test('Check latest sensor_data records', async ({ page }) => {
  console.log('\n=== Check Latest Sensor Data ===\n');

  // Login
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  const loginBtn = page.locator('button').filter({ hasText: /登\s*录/ });
  await loginBtn.click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ Logged in\n');

  // Go to device detail for a device that we know is online
  // Use the device ID from the logs: 866965081723709
  const deviceId = '866965081723709';

  await page.goto(`${PROD_URL}/devices/${deviceId}`);
  await page.waitForLoadState('networkidle');

  // Find the "刷新" button to request fresh data from device
  const refreshBtn = page.locator('button').filter({ hasText: '刷新' });

  // Click refresh and wait for API response
  const [realtimeResponse] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes(`/api/devices/${deviceId}/realtime`) &&
      resp.status() === 200,
      { timeout: 10000 }
    ).catch(() => null),
    refreshBtn.click()
  ]);

  // Wait for device to send MQTT data (give it 30 seconds)
  console.log('Waiting 30 seconds for device to respond...');
  await page.waitForTimeout(30000);

  // Check realtime API again
  const realtimeData = await page.evaluate(async (id) => {
    const response = await fetch(`/api/devices/${id}/realtime`);
    return response.json();
  }, deviceId);

  console.log('\nRealtime data after refresh:');
  console.log('  Device:', deviceId);
  console.log('  Temperature:', realtimeData.data?.temperature);
  console.log('  Humidity:', realtimeData.data?.humidity);
  console.log('  RecordedAt:', realtimeData.data?.recordedAt);
  console.log('  Full:', JSON.stringify(realtimeData.data, null, 2));

  // Check device list for this device's temperature
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');

  // Find the row for this device
  const deviceRow = page.locator(`tr:has-text("${deviceId}")`);
  const rowCells = await deviceRow.locator('td').all();

  console.log('\nDevice row cells:');
  for (let i = 0; i < rowCells.length; i++) {
    const text = await rowCells[i].textContent();
    console.log(`  列${i}: ${text?.trim().substring(0, 30)}`);
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/after-refresh.png', fullPage: true });

  // Now check multiple devices' latest data
  const [listResponse] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/devices') &&
      resp.status() === 200
    ),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const listBody = await listResponse.json();

  console.log('\n=== Checking all devices for temperature data ===');
  let devicesWithTemp = 0;
  let devicesWithNullTemp = 0;

  for (const device of listBody.data) {
    if (device.realtimeData?.temperature !== null && device.realtimeData?.temperature !== undefined) {
      devicesWithTemp++;
      console.log(`  ✓ ${device.id}: temp=${device.realtimeData.temperature}°C`);
    } else {
      devicesWithNullTemp++;
    }
  }

  console.log(`\nDevices with temperature data: ${devicesWithTemp}`);
  console.log(`Devices with NULL temperature: ${devicesWithNullTemp}`);

  if (devicesWithTemp === 0) {
    console.log('\n⚠️  No devices have temperature data! MQTT data parsing may still be broken.');
  } else {
    console.log('\n✓ Some devices have temperature data. MQTT is working correctly.');
  }
});