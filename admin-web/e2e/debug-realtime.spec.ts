import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(60000);

test('Debug realtime data API', async ({ page }) => {
  console.log('\n=== Debug Realtime Data ===\n');

  // Login first
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  const loginBtn = page.locator('button').filter({ hasText: /登\s*录/ });
  await loginBtn.click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('✓ Logged in\n');

  // Capture API response
  const [response] = await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/api/devices') &&
      resp.url().includes('includeRealtime=true') &&
      resp.status() === 200
    ),
    page.goto(`${PROD_URL}/devices`)
  ]);

  const body = await response.json();
  console.log('API Response URL:', response.url());
  console.log('Devices count:', body.data?.length);
  console.log('Total:', body.total);

  // Check first device
  if (body.data && body.data.length > 0) {
    const firstDevice = body.data[0];
    console.log('\nFirst device:');
    console.log('  ID:', firstDevice.id);
    console.log('  Name:', firstDevice.name);
    console.log('  Online:', firstDevice.online);
    console.log('  realtimeData:', JSON.stringify(firstDevice.realtimeData, null, 4));

    // Check if realtimeData exists
    if (firstDevice.realtimeData) {
      console.log('\n✓ realtimeData present!');
      console.log('  temperature:', firstDevice.realtimeData.temperature);
      console.log('  humidity:', firstDevice.realtimeData.humidity);
    } else {
      console.log('\n✗ realtimeData is NULL or undefined!');
    }
  }

  // Navigate to device detail and check realtime API
  if (body.data && body.data.length > 0) {
    const deviceId = body.data[0].id;

    const [realtimeResponse] = await Promise.all([
      page.waitForResponse(resp =>
        resp.url().includes(`/api/devices/${deviceId}/realtime`) &&
        resp.status() === 200
      ),
      page.goto(`${PROD_URL}/devices/${deviceId}`)
    ]);

    const realtimeBody = await realtimeResponse.json();
    console.log('\nRealtime API Response:');
    console.log('  URL:', realtimeResponse.url());
    console.log('  Body:', JSON.stringify(realtimeBody, null, 2));

    // Check sensor_data table directly by making a fetch request
    const sensorDataCheck = await page.evaluate(async () => {
      // We can't access the database directly, but we can check the UI
      const tempElement = document.querySelector('[data-testid="realtime-temperature"]');
      const humiElement = document.querySelector('[data-testid="realtime-humidity"]');
      return {
        hasTempElement: !!tempElement,
        tempText: tempElement?.textContent,
        hasHumiElement: !!humiElement,
        humiText: humiElement?.textContent,
        bodyText: document.body.textContent?.substring(0, 500)
      };
    });

    console.log('\nUI Check:');
    console.log('  Temperature element:', sensorDataCheck.hasTempElement ? 'YES' : 'NO');
    console.log('  Temperature text:', sensorDataCheck.tempText);
    console.log('  Humidity element:', sensorDataCheck.hasHumiElement ? 'YES' : 'NO');
    console.log('  Humidity text:', sensorDataCheck.humiText);
    console.log('  Body text (first 500):', sensorDataCheck.bodyText?.substring(0, 300));
  }

  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-realtime.png', fullPage: true });
  console.log('\nScreenshot saved to test-results/debug-realtime.png');
});