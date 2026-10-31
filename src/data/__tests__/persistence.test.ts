import AsyncStorage from '@react-native-async-storage/async-storage';

import { addItems, exportBackup, importBackup, loadDemoSeed, parseBackup, resetAllData } from '@/data';
import { CURRENT_VERSION, migrate, MigrationError } from '@/data/migrations';
import { getState, useDataStore } from '@/data/store';
import { STORAGE_KEY } from '@/data/storage';

beforeEach(() => resetAllData());

describe('백업 / 복원', () => {
  it('내보내고 지운 뒤 가져오면 같은 데이터', () => {
    loadDemoSeed();
    const before = getState();
    const json = exportBackup();
    resetAllData();
    expect(Object.keys(getState().items)).toHaveLength(0);

    const result = importBackup(json);
    expect(result.ok).toBe(true);
    expect(getState()).toEqual(before);
  });

  it('잘못된 파일은 거부하고 현재 데이터를 유지', () => {
    addItems([{ name: '의자', price: 45_000, category: 'hobby', reasons: [], source: 'manual' }]);
    const count = Object.keys(getState().items).length;

    expect(parseBackup('not json')).toEqual({ ok: false, reason: 'JSON 형식이 아니에요.' });
    expect(importBackup(JSON.stringify({ app: 'other', version: 1, exportedAt: '', data: {} })).ok).toBe(false);
    expect(
      importBackup(JSON.stringify({ app: 'bob', version: CURRENT_VERSION, exportedAt: '', data: { items: 1 } })),
    ).toEqual({ ok: false, reason: '백업 내용이 손상됐어요.' });
    const future = parseBackup(JSON.stringify({ app: 'bob', version: CURRENT_VERSION + 1, exportedAt: '', data: {} }));
    expect(future.ok).toBe(false);

    expect(Object.keys(getState().items)).toHaveLength(count);
  });
});

describe('마이그레이션', () => {
  it('현재 버전은 그대로, 미래 버전은 오류', () => {
    const data = { items: {} };
    expect(migrate(data, CURRENT_VERSION)).toBe(data);
    expect(() => migrate(data, CURRENT_VERSION + 1)).toThrow(MigrationError);
  });
});

describe('저장 데이터 불러오기', () => {
  it('정상 데이터는 그대로 불러온다', async () => {
    loadDemoSeed();
    const saved = getState();
    resetAllData(); // 초기화도 저장소에 쓰므로, 저장 데이터는 그 뒤에 넣는다
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state: saved, version: CURRENT_VERSION }));
    await useDataStore.persist.rehydrate();
    expect(getState().items).toEqual(saved.items);
  });

  it('검증에 실패하면 원본을 따로 보관하고 초기 상태로 시작', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { items: 'broken' }, version: CURRENT_VERSION }));
    await useDataStore.persist.rehydrate();
    await new Promise((r) => setTimeout(r, 0));

    expect(getState().items).toEqual({});
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.some((k) => k.startsWith('bob-data-corrupt-'))).toBe(true);
    warn.mockRestore();
  });
});
