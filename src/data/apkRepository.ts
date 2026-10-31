import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedRequest, ensureGuestSession, type ImageUpload } from '@/api';
import { apkCopy as c } from '@/constants/apkCopy';
import { createId } from '@/lib/id';
import {
  draftPayload,
  newDraft,
  object,
  rows,
  seoulDate,
  str,
  taskKey,
  validAnswer,
  validDraft,
  type Draft,
  type Json,
  type Task,
} from '@/lib/apkDomain';

type Local = {
  account: string;
  drafts: Draft[];
  records: Record<string, Json>;
  pending: Record<string, string>;
  crops: Record<string, string>;
  summaries: Record<string, { fingerprint: string; end: string; data: Json }>;
};
type Transport = typeof authenticatedRequest;
const emptyLocal = (account: string): Local => ({
  account,
  drafts: [],
  records: {},
  pending: {},
  crops: {},
  summaries: {},
});
const LOCAL_KEY = 'bob-apklike-local-v1';
export class ApkRepository {
  local = emptyLocal('');
  private initPending?: Promise<void>;
  private writing: Promise<void> = Promise.resolve();
  constructor(
    private transport: Transport = authenticatedRequest,
    private session = ensureGuestSession,
    private storage = AsyncStorage,
  ) {}
  init(): Promise<void> {
    if (!this.initPending)
      this.initPending = (async () => {
        const account = await this.session();
        const saved = await this.storage.getItem(LOCAL_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Local;
          // Account changes must be explicit. Never silently discard existing records.
          if (parsed.account !== account) throw new Error(c.auth);
          this.local = { ...emptyLocal(account), ...parsed };
        } else this.local = emptyLocal(account);
      })().catch((error) => {
        this.initPending = undefined;
        throw error;
      });
    return this.initPending;
  }
  persist() {
    const snapshot = JSON.stringify(this.local);
    const next = this.writing.catch(() => {}).then(() => this.storage.setItem(LOCAL_KEY, snapshot));
    this.writing = next;
    return next;
  }
  async request(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    json?: Json,
    idempotent = false,
  ): Promise<Json> {
    await this.init();
    const fingerprint = JSON.stringify([method, path, json]);
    if (idempotent && !this.local.pending[fingerprint]) {
      this.local.pending[fingerprint] = createId('apk_');
      await this.persist();
    }
    const result = object(
      await this.transport({
        method,
        path,
        json,
        ...(idempotent ? { headers: { 'Idempotency-Key': this.local.pending[fingerprint] } } : {}),
      }),
    );
    if (idempotent) {
      delete this.local.pending[fingerprint];
      await this.persist();
    }
    return result;
  }
  async setDrafts(drafts: Draft[]) {
    this.local.drafts = drafts;
    await this.persist();
  }
  async acceptDrafts(response: Json, replace = false) {
    const warnings = Array.isArray(response.warnings) ? response.warnings : [];
    if (warnings.includes('NO_SELECTED_ITEMS')) throw new Error(c.noSelection);
    if (warnings.includes('SELECTION_UNVERIFIED')) throw new Error(c.unverified);
    if (warnings.includes('TOO_MANY_SELECTED_ITEMS')) throw new Error(c.tooMany);
    const incoming = rows(response.items).map(newDraft);
    if (!incoming.length) throw new Error(c.missingItems);
    const retained = replace ? this.local.drafts.filter((d) => d.source !== 'SCREENSHOT') : this.local.drafts;
    if (retained.length + incoming.length > 20) throw new Error(c.tooMany);
    await this.setDrafts([...retained, ...incoming]);
  }
  async extract(image: ImageUpload, replace: boolean) {
    await this.init();
    const result = object(
      await this.transport({
        method: 'POST',
        path: '/cart-extractions',
        image: { upload: image },
      }),
    );
    await this.acceptDrafts(result, replace);
    return result;
  }
  batchBody(): Json {
    return { items: this.local.drafts.map(draftPayload) };
  }
  async register(decision?: string, rule?: Json) {
    if (!this.local.drafts.length || !this.local.drafts.every(validDraft)) throw new Error(c.invalidDraft);
    const body = this.batchBody();
    if (decision) {
      if (!rule) throw new Error(c.invalidDraft);
      body.discount_review = {
        rule,
        needed_item_indexes: this.local.drafts.flatMap((d, i) => (d.needed ? [i] : [])),
        decision,
      };
    }
    const result = await this.request('POST', '/items/batch', body, true);
    const actual = decision === 'NEEDED' ? this.local.drafts.filter((d) => d.needed) : this.local.drafts;
    rows(result.items).forEach((item, i) => {
      if (actual[i]?.crop) this.local.crops[str(item.id)] = actual[i].crop;
    });
    await this.setDrafts([]);
    return result;
  }
  records(kind: string, id: string) {
    return Object.values(this.local.records)
      .filter((q) => q.local_kind === kind && q.local_subject === id)
      .sort((a, b) => str(a.question_date).localeCompare(str(b.question_date)));
  }
  async question(t: Task) {
    await this.init();
    const existing = this.local.records[taskKey(t)];
    if (existing) return existing;
    const history = this.records(t.kind, t.subjectId)
      .filter((q) => str(q.question_date) < t.date)
      .slice(-365);
    const q = await this.request('POST', `/${t.kind}/${encodeURIComponent(t.subjectId)}/local-question`, {
      recent_templates: history.map((h) => ({
        date: h.question_date,
        template_code: h.template_code,
      })),
    });
    if (q.question_date !== t.date) throw new Error(c.staleQuestion);
    this.local.records[taskKey(t)] = {
      ...q,
      local_kind: t.kind,
      local_subject: t.subjectId,
    };
    await this.persist();
    return this.local.records[taskKey(t)];
  }
  async answer(t: Task, answer: Json) {
    if (t.date !== seoulDate()) throw new Error(c.staleQuestion);
    const q = this.local.records[taskKey(t)];
    if (!q || !validAnswer(object(q.answer_spec), answer)) throw new Error(c.invalidAnswer);
    this.local.records[taskKey(t)] = { ...q, answer };
    await this.persist();
  }
  async summary(item: Json) {
    const sim = object(item.simulation),
      id = str(sim.id);
    const payload = {
      responses: this.records('simulations', id)
        .filter((q) => q.answer != null)
        .map((q) => ({
          date: q.question_date,
          template_code: q.template_code,
          question: q.question,
          answer: q.answer,
        })),
    };
    const fingerprint = JSON.stringify(payload),
      end = str(sim.end_date_exclusive),
      cached = this.local.summaries[id];
    if (cached?.fingerprint === fingerprint && cached.end === end) return cached.data;
    if (sim.status === 'COMPLETED' && !['BUY', 'GIVE_UP'].includes(str(item.decision))) {
      const data = await this.request('POST', `/simulations/${encodeURIComponent(id)}/result-summary`, payload);
      this.local.summaries[id] = { fingerprint, end, data };
      await this.persist();
      return data;
    }
    return {
      result: await this.request('GET', `/simulations/${encodeURIComponent(id)}/result`),
    };
  }
}
export const apkRepository = new ApkRepository();
