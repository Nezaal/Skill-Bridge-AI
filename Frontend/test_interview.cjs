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
  
  await page.route('**/api/auth/get-me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: { id: "u123", username: "Test User" } })
  }));

  await page.route('**/api/interview/report/*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      matchScore: 90,
      technicalQuestions: [{ question: "A", answer: "B", intention: "C" }],
      behaviourQuestions: [{ question: "X", answer: "Y", intention: "Z" }],
      preparationPlan: [{ day: 1, focus: "F", tasks: ["T"] }],
      skillGaps: [{ skill: "S", severity: "low" }]
    })
  }));

  await page.route('**/api/interview', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([])
  }));

  await page.goto('http://localhost:5173/interview/123');
  await page.waitForTimeout(2000);
  
  console.log("Reloading interview page...");
  await page.reload();
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
