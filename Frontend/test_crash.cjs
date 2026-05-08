const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', exception => {
    console.log(`Uncaught exception: "${exception}"`);
  });
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(2000);
  
  // Try navigating or reloading
  console.log("Reloading...");
  await page.reload();
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
