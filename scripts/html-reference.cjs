const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const references = [
  'Main',
  'AddMethod',
  'ScanReview',
  'AddReason',
  'DailyCheck',
  'SimResult',
  'PostCheck',
  'DiscountTrap',
  'Goal',
  'GoalSetup',
  'GoalSetupFirst',
  'GoalDone',
  'GoalShelf',
  'Budget',
  'Report',
];
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    });
    const fontRoot = path.resolve('node_modules/@expo-google-fonts/ibm-plex-sans-kr');
    const fonts = {
      400: '400Regular/IBMPlexSansKR_400Regular.ttf',
      500: '500Medium/IBMPlexSansKR_500Medium.ttf',
      600: '600SemiBold/IBMPlexSansKR_600SemiBold.ttf',
      700: '700Bold/IBMPlexSansKR_700Bold.ttf',
    };
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({
        contentType: 'text/css',
        body: Object.keys(fonts)
          .map(
            (w) =>
              `@font-face {font-family: 'IBM Plex Sans KR'; font-weight:${w};src:url(https://bob-font.local/${w}.ttf)}`,
          )
          .join('\n'),
      }),
    );
    await page.route('https://bob-font.local/**', (route) => {
      const weight = path.basename(new URL(route.request().url()).pathname, '.ttf');
      return route.fulfill({
        headers: { 'Access-Control-Allow-Origin': '*' },
        contentType: 'font/ttf',
        body: fs.readFileSync(path.join(fontRoot, fonts[weight])),
      });
    });
    fs.mkdirSync('.expo/html-reference', { recursive: true });
    for (const name of references) {
      await page.goto(
        pathToFileURL(path.resolve('../BoB_handoff/prototype', `${name}.html`)).href + '?embed',
      );
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#dc-root > div').screenshot({ path: `.expo/html-reference/${name}.png` });
    }
    console.log(`Captured ${references.length} HTML references`);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
