import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('Check if production backend has MQTT parsing fix', async ({ page }) => {
  console.log('\n=== Verify Production Backend MQTT Fix ===\n');

  // Login
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  const loginBtn = page.locator('button').filter({ hasText: /登\s*录/ });
  await loginBtn.click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ Logged in\n');

  // Get device list with realtime data
  const [devicesResponse] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/devices') &&
      resp.url().includes('includeRealtime=true')
    ),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const devicesBody = await devicesResponse.json();
  const devices = devicesBody.data;

  console.log(`Total devices: ${devices.length}`);
  console.log('Checking for temperature data...\n');

  // Check devices with and without temperature
  let withTemp = 0;
  let withoutTemp = 0;
  let mostRecentRecordedAt: string | null = null;
  let mostRecentDevice: string | null = null;

  for (const device of devices) {
    if (device.realtimeData?.temperature !== null && device.realtimeData?.temperature !== undefined) {
      withTemp++;
      console.log(`  ✓ ${device.id}: temp=${device.realtimeData.temperature}°C, recorded=${device.realtimeData.recordedAt}`);
    } else {
      withoutTemp++;
      // Track most recent NULL data
      if (device.realtimeData?.recordedAt) {
        if (!mostRecentRecordedAt || new Date(device.realtimeData.recordedAt) > new Date(mostRecentRecordedAt)) {
          mostRecentRecordedAt = device.realtimeData.recordedAt;
          mostRecentDevice = device.id;
        }
      }
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Devices with temperature: ${withTemp}`);
  console.log(`Devices without temperature: ${withoutTemp}`);
  console.log(`Most recent NULL data: ${mostRecentDevice} at ${mostRecentRecordedAt}`);

  // Check if most recent data is from today (April 7)
  if (mostRecentRecordedAt) {
    const recordDate = new Date(mostRecentRecordedAt);
    const today = new Date();
    const diffMs = today.getTime() - recordDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    console.log(`\nTime since most recent NULL data: ${diffHours.toFixed(1)} hours`);

    if (diffHours < 1) {
      console.log('\n⚠️ CRITICAL: Recent MQTT data (within 1 hour) still has NULL values!');
      console.log('This indicates the MQTT parsing fix is NOT deployed to production.');
    } else if (diffHours > 24) {
      console.log('\n✓ Most recent NULL data is from >24 hours ago.');
      console.log('Either: (1) Fix is deployed but devices havent sent new data,');
      console.log('       (2) Or fix is deployed and devices have sent data with correct values.');
      if (withTemp > 0) {
        console.log('\n✓ CONFIRMED: Some devices have temperature data - MQTT parsing is working!');
      }
    }
  }

  // If no devices have temperature, check one device detail
  if (withTemp === 0) {
    const testDeviceId = devices[0]?.id;
    if (testDeviceId) {
      console.log(`\n=== Checking device ${testDeviceId} detail ===`);

      // Try to request fresh data via API
      // Note: This requires the "request-data" endpoint which may not exist in production
      try {
        const requestDataResponse = await page.evaluate(async (id) => {
          const response = await fetch(`/api/devices/${id}/request-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          return { status: response.status, ok: response.ok };
        }, testDeviceId);

        console.log(`Request data API status: ${requestDataResponse.status}`);

        if (requestDataResponse.ok) {
          console.log('Waiting 30 seconds for device to respond...');
          await page.waitForTimeout(30000);

          // Check realtime API again
          const realtimeCheck = await page.evaluate(async (id) => {
            const response = await fetch(`/api/devices/${id}/realtime`);
            return response.json();
          }, testDeviceId);

          console.log('\nAfter refresh:');
          console.log('  Temperature:', realtimeCheck.data?.temperature);
          console.log('  RecordedAt:', realtimeCheck.data?.recordedAt);

          if (realtimeCheck.data?.temperature !== null) {
            console.log('\n✓ SUCCESS: Device sent data with correct temperature!');
          } else {
            console.log('\n✗ Still NULL - Device may not have responded or parsing issue persists.');
          }
        }
      } catch (err) {
        console.log('Request data API not available (expected if using older backend version)');
      }
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/mqtt-fix-check.png', fullPage: true });
});