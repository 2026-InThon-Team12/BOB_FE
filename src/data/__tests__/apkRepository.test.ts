import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError } from '@/api';
import { ApkRepository } from '@/data/apkRepository';
import { draftPayload, newDraft, object, seoulDate, validAnswer, type Json, type Task } from '@/lib/apkDomain';

beforeEach(async () => {
  await AsyncStorage.clear();
});
function server() {
  const items: Json[] = [];
  const call = jest.fn(async (opts: { method: string; path: string; json?: unknown }): Promise<unknown> => {
    if (opts.path === '/items/batch') {
      const incoming = object(opts.json).items as Json[];
      const created = incoming.map((item) => ({
        ...item,
        id: `server-${items.length + 1 + incoming.indexOf(item)}`,
      }));
      items.push(...created);
      return { items: created };
    }
    if (opts.path === '/home') return { simulations: [...items], today: {}, goal: null };
    if (opts.path.startsWith('/items?')) return { items: [...items] };
    return {};
  });
  const repo = new ApkRepository(call, async () => 'same-account', AsyncStorage);
  return { repo, call, items };
}
const confirmed = (name: string) => ({
  ...newDraft({
    name,
    price: 45000,
    category: 'DIGITAL',
    source: 'SCREENSHOT',
  }),
  reasons: ['NECESSITY'],
});

it('photo A registration → back → photo B registration → restart retains both server items', async () => {
  const { repo, call } = server();
  await repo.init();
  await repo.setDrafts([confirmed('A')]);
  await repo.register();
  expect(repo.local.drafts).toEqual([]);
  await repo.acceptDrafts({ items: [{ name: 'B', price: 45000, source: 'SCREENSHOT' }] }, true);
  await repo.setDrafts(repo.local.drafts.map((d) => ({ ...d, reasons: ['NECESSITY'] })));
  await repo.register();
  const restarted = new ApkRepository(call, async () => 'same-account', AsyncStorage);
  await restarted.init();
  expect((await restarted.request('GET', '/home')).simulations).toEqual([
    expect.objectContaining({ name: 'A' }),
    expect.objectContaining({ name: 'B' }),
  ]);
  expect((await restarted.request('GET', '/items?limit=100')).items).toHaveLength(2);
  const batches = call.mock.calls.filter(([o]) => o.path === '/items/batch');
  expect(object(batches[0][0]).headers).not.toEqual(object(batches[1][0]).headers);
});
it('replacement only changes screenshot drafts after successful analysis; failure retains all drafts', async () => {
  const { repo } = server();
  await repo.init();
  const manual = newDraft({ name: 'manual' }),
    photo = confirmed('old photo');
  await repo.setDrafts([manual, photo]);
  await expect(repo.acceptDrafts({ items: [], warnings: ['SELECTION_UNVERIFIED'] }, true)).rejects.toThrow();
  expect(repo.local.drafts).toEqual([manual, photo]);
  await repo.acceptDrafts({ items: [{ name: 'new photo', source: 'SCREENSHOT' }] }, true);
  expect(repo.local.drafts.map((d) => d.name)).toEqual(['manual', 'new photo']);
  await repo.acceptDrafts({
    items: [{ name: 'extra photo', source: 'SCREENSHOT' }],
  });
  expect(repo.local.drafts.map((d) => d.name)).toEqual(['manual', 'new photo', 'extra photo']);
});
it('failed registration survives restart and reuses its idempotency key', async () => {
  const call = jest
    .fn()
    .mockRejectedValueOnce(new ApiError('offline', 'network'))
    .mockResolvedValue({ items: [{ id: 'saved' }] });
  const repo = new ApkRepository(call, async () => 'account', AsyncStorage);
  await repo.init();
  await repo.setDrafts([confirmed('A')]);
  await expect(repo.register()).rejects.toThrow();
  const restarted = new ApkRepository(call, async () => 'account', AsyncStorage);
  await restarted.init();
  expect(restarted.local.drafts[0].name).toBe('A');
  await restarted.register();
  expect(call.mock.calls[0][0].headers).toEqual(call.mock.calls[1][0].headers);
  expect(restarted.local.drafts).toHaveLength(0);
});
it('LOCAL question answers stay on device and are only uploaded for completed summary', async () => {
  const task: Task = {
    kind: 'simulations',
    subjectId: 's1',
    name: 'A',
    date: seoulDate(),
  };
  const call = jest
    .fn()
    .mockResolvedValueOnce({
      id: 'q1',
      question_date: task.date,
      question: 'Q',
      template_code: 'DAYS',
      answer_spec: { type: 'INTEGER', minimum: 0, maximum: 30 },
    })
    .mockResolvedValueOnce({
      result: { answered_days: 1 },
      ai_summary: { summary: 'summary' },
    });
  const repo = new ApkRepository(call, async () => 'account', AsyncStorage);
  await repo.init();
  await repo.question(task);
  await repo.answer(task, { number_value: 12 });
  expect(call).toHaveBeenCalledTimes(1);
  const restarted = new ApkRepository(call, async () => 'account', AsyncStorage);
  await restarted.init();
  expect((await restarted.question(task)).answer).toEqual({ number_value: 12 });
  const item = {
    simulation: {
      id: 's1',
      status: 'COMPLETED',
      end_date_exclusive: task.date,
    },
  };
  await restarted.summary(item);
  await restarted.summary(item);
  expect(call).toHaveBeenCalledTimes(2);
  expect(call.mock.calls[1][0]).toMatchObject({
    path: '/simulations/s1/result-summary',
    json: {
      responses: [
        {
          date: task.date,
          template_code: 'DAYS',
          question: 'Q',
          answer: { number_value: 12 },
        },
      ],
    },
  });
});
it('does not silently reset device records when account changes', async () => {
  const { repo, call } = server();
  await repo.init();
  await repo.setDrafts([confirmed('keep')]);
  const different = new ApkRepository(call, async () => 'different-account', AsyncStorage);
  await expect(different.init()).rejects.toThrow();
  const restored = new ApkRepository(call, async () => 'same-account', AsyncStorage);
  await restored.init();
  expect(restored.local.drafts[0].name).toBe('keep');
});
it('registration payload matches APK and excludes response-only image crops', () => {
  const d = {
    ...confirmed(' A '),
    crop: 'not-uploaded',
    reasons: ['OTHER', 'DISCOUNT_LIMITED'],
    other: ' reason ',
    deadline: seoulDate(),
  };
  expect(draftPayload(d)).toEqual({
    name: 'A',
    price: 45000,
    category: 'DIGITAL',
    source: 'SCREENSHOT',
    question_mode: 'LOCAL',
    purchase_reasons: ['DISCOUNT_LIMITED', 'OTHER'],
    reason_other_text: 'reason',
    sale_ends_on: seoulDate(),
  });
});
it('validates all four APK answer forms and rejects ambiguous answers', () => {
  expect(validAnswer({ options: [{ code: 'YES' }] }, { choice_code: 'YES' })).toBe(true);
  expect(validAnswer({ type: 'INTEGER', minimum: 0, maximum: 30 }, { number_value: 31 })).toBe(false);
  expect(validAnswer({ type: 'TEXT', max_length: 3 }, { text_value: 'abc' })).toBe(true);
  expect(
    validAnswer(
      { type: 'OBJECT', fields: { when: { options: [{ code: 'TODAY' }] } } },
      { object_value: { when: 'TODAY' } },
    ),
  ).toBe(true);
  expect(validAnswer({ type: 'TEXT' }, { text_value: 'a', number_value: 1 })).toBe(false);
});
