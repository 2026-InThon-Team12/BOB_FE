/* Run against `expo export --platform all` with a Playwright installation.
 * Fixtures intercept every production API request: no real user data is written.
 */
const http = require('node:http');
const { Buffer } = require('node:buffer');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve('dist');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) file = path.join(root, 'index.html');
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
    const errors = [],
      calls = [],
      items = [];
    let photo = 0,
      unauthenticated = false,
      goal = null,
      budget = null;
    const expenses = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const today = {
      date: new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10),
      pre_purchase_questions: [],
      purchase_questions: [],
      decisions: [],
      reviews: [],
    };
    await page.route('**/api/v1/**', async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        endpoint = url.pathname.replace('/api/v1', '');
      calls.push([request.method(), endpoint]);
      let status = 200,
        body = {};
      if (endpoint === '/guest-sessions') body = { access_token: 'browser-test-account', guest_id: 'browser-test' };
      else if (unauthenticated) {
        status = 401;
        body = { error: { message: 'expired' } };
      } else if (endpoint === '/home') body = { simulations: items, today, goal };
      else if (endpoint === '/today') body = today;
      else if (endpoint === '/cart-extractions') {
        photo++;
        body = {
          items: [{ name: `사진 ${photo} 상품`, price: 45000, category: 'DIGITAL', source: 'SCREENSHOT' }],
          warnings: [],
          analysis_method: 'ocr',
        };
      } else if (endpoint === '/registration-previews')
        body = { items: [{ duration_days: 7, start_date: '2026-11-02' }] };
      else if (endpoint === '/items/batch') {
        const payload = request.postDataJSON();
        const created = payload.items.map((i, n) => ({
          ...i,
          id: `item-${items.length + n}`,
          simulation: {
            id: `sim-${items.length + n}`,
            status: 'SCHEDULED',
            duration_days: 7,
            start_date: '2026-11-02',
          },
        }));
        items.push(...created);
        body = { items: created };
      } else if (endpoint === '/items') body = { items };
      else if (endpoint === '/goals/setup') body = { mode: 'FIRST', candidates: [] };
      else if (endpoint === '/goals/shelf') body = { count: 0, total_target_amount: 0, items: [] };
      else if (endpoint === '/goals/preview') body = { starting_saved_amount: 0, remaining_amount: 100000 };
      else if (endpoint === '/goals' && request.method() === 'POST') {
        goal = { ...request.postDataJSON(), id: 'goal-1', saved_amount: 0, remaining_amount: 100000 };
        body = goal;
      } else if (endpoint.startsWith('/budgets/') && request.method() === 'PUT') {
        budget = request.postDataJSON();
        body = budget;
      } else if (endpoint === '/wallet')
        body = {
          budget_required: !budget,
          plan: budget,
          remaining_amount: budget
            ? budget.income -
              budget.food -
              budget.living -
              budget.transport -
              budget.savings -
              expenses.reduce((s, e) => s + e.amount, 0)
            : null,
        };
      else if (endpoint === '/expenses' && request.method() === 'POST') {
        const e = { ...request.postDataJSON(), id: 'expense-1', source: 'MANUAL' };
        expenses.push(e);
        body = e;
      } else if (endpoint.startsWith('/expenses/') && request.method() === 'DELETE') {
        expenses.splice(0);
      } else if (endpoint === '/expenses') body = { items: expenses };
      else if (endpoint.endsWith('/local-question'))
        body = {
          id: 'q1',
          question_date: today.date,
          question: '오늘 얼마나 사용할까요?',
          template_code: 'DAYS',
          answer_spec: { type: 'INTEGER', minimum: 0, maximum: 30 },
        };
      else if (endpoint === '/reports')
        body = {
          empty: true,
          registered_count: items.length,
          bye_count: 0,
          saved_amount: 0,
          categories: [],
          purchase_reasons: [],
        };
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const click = async (label) => {
      await page.getByRole('button', { name: label, exact: true }).click();
    };
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: '사고 싶은 물건 등록하기 +', exact: true }).waitFor();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    );
    async function pick() {
      const chooser = page.waitForEvent('filechooser');
      await click('사진에서 가져오기');
      await (await chooser).setFiles({ name: 'cart.png', mimeType: 'image/png', buffer: png });
    }
    for (let n = 1; n <= 2; n++) {
      await click('사고 싶은 물건 등록하기 +');
      await pick();
      await page.getByRole('textbox', { name: '물품명', exact: true }).waitFor();
      await click('구매 이유 선택하기');
      await page.getByLabel('실제로 필요해서', { exact: true }).click();
      await click('기간 확인하고 다음으로');
      await click('시뮬레이션 시작하기');
      await page.getByRole('button', { name: '사고 싶은 물건 등록하기 +', exact: true }).waitFor();
      assert.equal(items.length, n);
    }
    await page.reload();
    await page.getByText('사진 1 상품', { exact: true }).waitFor();
    await page.getByText('사진 2 상품', { exact: true }).waitFor();
    fs.mkdirSync(path.resolve('.expo/apklike-qa'), { recursive: true });
    await page.screenshot({ path: '.expo/apklike-qa/home.png', fullPage: true });
    await click('내 물품 전체 기록 보기');
    await page.getByText('사진 1 상품', { exact: true }).waitFor();
    await page.getByText('사진 2 상품', { exact: true }).waitFor();
    await click('뒤로');
    unauthenticated = true;
    await click('새로고침');
    await page
      .getByText('계정 인증을 확인할 수 없어요. 앱 데이터를 지우지 말고 다시 시도해 주세요.', { exact: true })
      .waitFor();
    assert.equal(calls.filter(([, endpoint]) => endpoint === '/guest-sessions').length, 1);
    unauthenticated = false;
    await click('새로고침');
    for (const label of ['목표', '지갑', '리포트', '홈']) {
      await click(label);
      await page.waitForLoadState('networkidle');
    }
    await click('목표');
    await click('목표 설정·변경하기');
    await page.getByRole('textbox', { name: '목표 물품명', exact: true }).fill('테스트 목표');
    await page.getByRole('textbox', { name: '목표 금액 (원)', exact: true }).fill('100000');
    await click('시작 금액 미리 보기');
    await click('이 목표로 시작하기');
    await page.getByText('테스트 목표', { exact: true }).waitFor();
    await click('지갑');
    for (const [label, value] of [
      ['월 수입', '1000000'],
      ['필수 식비', '10000'],
      ['생활비', '200000'],
      ['교통비', '50000'],
      ['계획 저축액', '100000'],
    ])
      await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    await click('저장');
    await page.getByText('640,000원', { exact: true }).waitFor();
    await click('+ 따로 쓴 돈 기록');
    await page.getByRole('textbox', { name: '지출 이름', exact: true }).fill('테스트 지출');
    await page.getByRole('textbox', { name: '금액 (원)', exact: true }).fill('5000');
    await click('저장');
    await page.getByText('635,000원', { exact: true }).waitFor();
    await click('삭제');
    await click('확정하기');
    await page.getByText('640,000원', { exact: true }).waitFor();
    today.pre_purchase_questions.push({ simulation_id: 'sim-0', name: '사진 1 상품' });
    await click('홈');
    await click('오늘의 돌아보기 · 1');
    await click('오늘의 질문 열기');
    await page.getByRole('textbox', { name: '숫자 답변 (0 ~ 30)', exact: true }).fill('12');
    await click('오늘의 답변 저장');
    await page.getByRole('button', { name: '답변 완료 · 수정하기', exact: true }).waitFor();
    await page.reload();
    await click('답변 완료 · 수정하기');
    assert.equal(await page.getByRole('textbox', { name: '숫자 답변 (0 ~ 30)', exact: true }).inputValue(), '12');
    assert.equal(calls.filter(([, p]) => p.endsWith('/local-question')).length, 1);
    assert.equal(calls.filter(([, p]) => p.includes('/answers')).length, 0);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify({
        passed: true,
        registeredItems: items.length,
        guestSessions: 1,
        apiRequests: calls.length,
        screenshot: '.expo/apklike-qa/home.png',
      }),
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
