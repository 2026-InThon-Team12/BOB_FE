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
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [],
      calls = [],
      items = [];
    let photo = 0,
      unauthenticated = false,
      goal = null,
      budget = null;
    const expenses = [];
    let impulse = {};
    const review = {
      id: 'purchase-1',
      item_name: '사진 1 상품',
      price: 45000,
      review_start: '2026-10-18',
      review_end: '2026-11-01',
    };
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
      if (endpoint === '/guest-sessions')
        body = { access_token: 'browser-test-account', guest_id: 'browser-test' };
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
      } else if (/^\/items\/[^/]+$/.test(endpoint)) body = items.find((i) => i.id === endpoint.split('/')[2]);
      else if (endpoint.endsWith('/result-summary'))
        body = {
          result: {
            answered_days: 1,
            expected_used_days: 12,
            unsure_days: 0,
            unanswered_days: 6,
            expected_cost_per_used_day: 3750,
          },
          ai_summary: { summary: '필요했던 날을 기준으로 신중히 결정해 보세요.' },
        };
      else if (endpoint.endsWith('/result')) body = { answered_days: 1 };
      else if (endpoint.startsWith('/items/') && endpoint.endsWith('/decision')) {
        const item = items.find((i) => i.id === endpoint.split('/')[2]);
        Object.assign(item, request.postDataJSON());
        body = item;
      } else if (endpoint === '/discount-previews')
        body = {
          needed: { subtotal: 45000, discount: 0, shipping: 0, total: 45000 },
          all: { subtotal: 55000, discount: 5500, shipping: 0, total: 49500 },
          extra_spending: 4500,
        };
      else if (endpoint === '/impulses') {
        impulse = {
          ...request.postDataJSON(),
          id: 'impulse-1',
          message: '참으면 목표가 하루 가까워져요.',
          if_resisted_on: '2026-11-10',
          if_purchased_on: '2026-11-11',
        };
        body = impulse;
      } else if (endpoint === '/impulses/impulse-1/decision') {
        Object.assign(impulse, request.postDataJSON());
        body = impulse;
      } else if (endpoint === '/purchases/purchase-1/review') {
        Object.assign(review, {
          review: request.postDataJSON(),
          expected_days_in_review_window: 7,
          actual_days_estimate: 2.5,
          difference_percentage_points: -32,
          verdict: '예상보다 적게 사용했어요.',
        });
        body = review;
      } else if (endpoint === '/items') body = { items };
      else if (endpoint === '/goals/setup') body = { mode: 'FIRST', candidates: [] };
      else if (endpoint === '/goals/shelf')
        body = {
          count: goal?.achieved ? 1 : 0,
          total_target_amount: goal?.achieved ? goal.target_amount : 0,
          items: goal?.achieved ? [goal] : [],
        };
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
      else if (endpoint === '/simulations/sim-choice/local-question')
        body = {
          question_date: today.date,
          template_code: 'YES_NO',
          question: '오늘 이 물건을 쓰고 싶었나요?',
          answer_spec: {
            type: 'CHOICE',
            options: [
              { code: 'YES', label: '있었어요' },
              { code: 'NO', label: '딱히 없었어요' },
              { code: 'UNSURE', label: '잘 모르겠어요' },
            ],
          },
        };
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
          categories: [
            {
              category: 'DIGITAL',
              sample_count: 2,
              predicted_days: 10,
              actual_days_min: 3,
              actual_days_max: 6,
            },
          ],
          purchase_reasons: [
            { reason: 'NECESSITY', registered_count: 3, decided_count: 2, abandonment_rate: 0.5 },
          ],
          discovery: { message: '디지털기기는 예상보다 적게 사용했어요.' },
        };
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    fs.mkdirSync(path.resolve('.expo/apklike-qa'), { recursive: true });
    const shot = async (name) => {
      await page.waitForLoadState('networkidle');
      await page.locator('[aria-live="polite"]').waitFor({ state: 'hidden', timeout: 5000 });
      await page.evaluate(() => {
        document.activeElement?.blur();
        document.querySelectorAll('*').forEach((n) => {
          if (n.scrollTop) n.scrollTop = 0;
        });
      });
      await page.screenshot({ path: `.expo/apklike-qa/${name}.png` });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        `horizontal overflow: ${name}`,
      );
    };
    const click = async (label) => {
      try {
        await page
          .getByRole(['홈', '목표', '지갑', '리포트'].includes(label) ? 'tab' : 'button', {
            name: label,
            exact: true,
          })
          .click({ timeout: 10000 });
      } catch (error) {
        await page.screenshot({ path: '.expo/apklike-qa/failure.png' });
        console.log(await page.locator('body').innerText());
        console.log(
          await page
            .locator('[role]')
            .evaluateAll((nodes) => nodes.map((n) => [n.getAttribute('role'), n.getAttribute('aria-label')])),
        );
        throw error;
      }
    };
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    );
    async function pick() {
      const chooser = page.waitForEvent('filechooser');
      await click('장바구니 스크린샷');
      await (await chooser).setFiles({ name: 'cart.png', mimeType: 'image/png', buffer: png });
    }
    for (let n = 1; n <= 2; n++) {
      await click('물건 등록');
      if (n === 1) await shot('AddMethod');
      await pick();
      await page.getByRole('button', { name: '등록하고 이유 고르기', exact: true }).waitFor();
      if (n === 1) await shot('ScanReview');
      await click('등록하고 이유 고르기');
      await page.getByLabel('실제로 필요해서', { exact: true }).click();
      if (n === 1) await shot('AddReason');
      await click('기간 확인하고 다음으로');
      await click('시뮬레이션 시작하기');
      await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
      assert.equal(items.length, n);
    }
    await page.reload();
    await page.getByText('사진 1 상품', { exact: true }).waitFor();
    await page.getByText('사진 2 상품', { exact: true }).waitFor();
    fs.mkdirSync(path.resolve('.expo/apklike-qa'), { recursive: true });
    await page.screenshot({ path: '.expo/apklike-qa/home.png', fullPage: true });
    await click('내 물품 전체 기록');
    await page.getByText('사진 1 상품', { exact: true }).waitFor();
    await page.getByText('사진 2 상품', { exact: true }).waitFor();
    await click('뒤로');
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    unauthenticated = true;
    await page.reload();
    await page
      .getByText('계정 인증을 확인할 수 없어요. 앱 데이터를 지우지 말고 다시 시도해 주세요.', { exact: true })
      .waitFor();
    assert.equal(calls.filter(([, endpoint]) => endpoint === '/guest-sessions').length, 1);
    unauthenticated = false;
    await click('새로고침');
    for (const label of ['목표', '지갑', '리포트', '홈']) {
      await click(label);
      await shot({ 목표: 'Goal-empty', 지갑: 'Budget-empty', 리포트: 'Report-empty', 홈: 'Main' }[label]);
    }
    await click('목표');
    await click('목표 바꾸기');
    await page.getByRole('textbox', { name: '목표 물품명', exact: true }).fill('테스트 목표');
    await page.getByRole('textbox', { name: '목표 금액 (원)', exact: true }).fill('100000');
    await shot('GoalSetupFirst');
    await click('시작 금액 미리 보기');
    await click('이 목표로 시작하기');
    await page.getByText('테스트 목표', { exact: true }).waitFor();
    await shot('Goal');
    await click('지갑');
    for (const [label, value] of [
      ['월 수입', '1000000'],
      ['필수 식비', '10000'],
      ['생활비', '200000'],
      ['교통비', '50000'],
      ['계획 저축액', '100000'],
    ])
      await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    await click('돈 계획 저장하기');
    await page.getByText('640,000원', { exact: true }).waitFor();
    await click('기록하기');
    await page.getByRole('textbox', { name: '지출 이름', exact: true }).fill('테스트 지출');
    await page.getByRole('textbox', { name: '금액 (원)', exact: true }).fill('5000');
    await click('저장');
    await page.getByText('635,000원', { exact: true }).waitFor();
    await shot('Budget');
    await click('삭제');
    await click('확정하기');
    await page.getByText('640,000원', { exact: true }).waitFor();
    today.pre_purchase_questions.push({ simulation_id: 'sim-0', name: '사진 1 상품' });
    await click('홈');
    await click('1분 만에 답하기');
    await click('오늘의 질문 열기');
    await page.getByRole('textbox', { name: '숫자 답변 (0 ~ 30)', exact: true }).fill('12');
    await shot('DailyCheck-integer');
    await click('오늘의 답변 저장');
    await page.getByRole('button', { name: '답변 완료 · 수정하기', exact: true }).waitFor();
    await page.reload();
    await click('답변 완료 · 수정하기');
    assert.equal(
      await page.getByRole('textbox', { name: '숫자 답변 (0 ~ 30)', exact: true }).inputValue(),
      '12',
    );
    assert.equal(calls.filter(([, p]) => p.endsWith('/local-question')).length, 1);
    assert.equal(calls.filter(([, p]) => p.includes('/answers')).length, 0);
    await click('뒤로');
    await page.getByRole('button', { name: '답변 완료 · 수정하기', exact: true }).waitFor();
    await click('뒤로');
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    // Finished simulation keeps the API summary and the Buy/Bye confirmation contract.
    items[0].simulation.status = 'COMPLETED';
    await click('사진 1 상품 기록 보기');
    await page.getByText('응답 요약', { exact: true }).waitFor();
    await shot('SimResult');
    await click('Bye 안 살래요');
    await click('확정하기');
    assert.equal(items[0].decision, 'GIVE_UP');
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    // APK post-purchase frequency codes; report is supplied by the server.
    today.reviews.push(review);
    today.pre_purchase_questions.splice(0, today.pre_purchase_questions.length, {
      simulation_id: 'sim-choice',
      name: '선택형 질문 상품',
    });
    await page.reload();
    await click('실제 사용 돌아보기');
    await page.getByLabel('가끔 1~4일', { exact: true }).click();
    await click('저장');
    await page.getByText('예상보다 적게 사용했어요.', { exact: true }).waitFor();
    await shot('PostCheck');
    assert.equal(review.review.frequency, 'SOMETIMES');
    await click('뒤로');
    await page.getByRole('button', { name: '실제 사용 돌아보기', exact: true }).waitFor();
    await click('뒤로');
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    await click('1분 만에 답하기');
    await click('오늘의 질문 열기');
    await page.getByRole('button', { name: '있었어요', exact: true }).waitFor();
    await shot('DailyCheck');
    await click('있었어요');
    await page.getByRole('button', { name: '답변 완료 · 수정하기', exact: true }).waitFor();
    await click('뒤로');
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    await click('목표');
    await page.getByLabel('커피 4,800원', { exact: true }).click();
    await page.getByRole('button', { name: '참을게요 · 게이지 +4,800원', exact: true }).waitFor();
    await shot('Impulse');
    await click('참을게요 · 게이지 +4,800원');
    await page.getByRole('button', { name: '방금 결정 취소하기', exact: true }).waitFor();
    assert.equal(impulse.decision, 'RESISTED');
    await click('방금 결정 취소하기');
    assert.equal(impulse.decision, 'CANCELLED');
    await click('뒤로');
    await page.getByRole('tab', { name: '홈', exact: true }).waitFor();
    await click('홈');
    await click('물건 등록');
    await pick();
    await click('등록하고 이유 고르기');
    await page.getByLabel('일정 금액 이상 담으면 추가 할인을 받을 수 있어서', { exact: true }).click();
    await click('기간 확인하고 다음으로');
    for (const [label, value] of [
      ['최소 구매 금액', '50000'],
      ['할인율 또는 할인 금액', '10'],
      ['배송비', '0'],
    ])
      await page.getByRole('textbox', { name: label, exact: true }).fill(value);
    await page.getByRole('switch', { name: '사진 3 상품', exact: true }).click();
    await click('결제 금액 비교하기');
    await page.getByText('할인 함정이에요', { exact: true }).waitFor();
    await shot('DiscountTrap');
    await click('선택한 물건만 시작하기');
    await page.getByRole('button', { name: '물건 등록', exact: true }).waitFor();
    assert.equal(items.length, 3);
    goal = {
      ...goal,
      achieved: true,
      saved_amount: 100000,
      progress_percent: 100,
      achieved_on: today.date,
      elapsed_days: 10,
      resisted_count: 5,
      most_resisted_item: '커피',
      can_shop: true,
      source_url: 'https://example.com/product',
    };
    await click('목표');
    await page.getByText('목표를 다 채웠어요', { exact: true }).waitFor();
    await shot('GoalDone');
    await click('나의 진열장');
    await page.getByLabel('테스트 목표', { exact: true }).click();
    await shot('GoalShelf');
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
