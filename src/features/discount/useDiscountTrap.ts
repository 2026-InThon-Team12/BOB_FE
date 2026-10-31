import { reflectionCopy } from '@/constants/copy';
/**
 * 할인 함정 확인 (기능 5, 명세서 4.11)
 * - 등록 흐름에서 오면 같은 묶음(batch)의 물건으로, 등록 방법의 바로가기로 오면 직접 담아서 계산한다.
 * - 입력·스위치를 바꾸면 즉시 다시 계산한다.
 */
import { useMemo, useRef, useState } from 'react';

import { policy } from '@/config/policy';
import { completeDiscountRegistration, useRegistrationItems } from '@/data';
import { discountCheck } from '@/lib/calc';
import { createId } from '@/lib/id';
import type { DiscountRule } from '@/types';

export type TrapLine = {
  key: string;
  /** 등록한 물건이면 그 id (끄고 확정하면 미등록 초안 제거) */
  itemId?: string;
  name: string;
  price: number;
  imageUri?: string;
  /** 처음에 "할인 때문에 담은 물건"이었는지 (꼬리표) */
  addedForDiscount: boolean;
};

export function useDiscountTrap(batchId: string | undefined, registrationKey?: string) {
  const items = useRegistrationItems();
  const [registering, setRegistering] = useState(false);
  const inFlight = useRef(false);
  const batchLines = useMemo<TrapLine[]>(
    () =>
      batchId
        ? items
            .filter((i) => i.batchId === batchId && i.status === 'simulating')
            // 같은 묶음은 등록 시각이 같아서 id(생성 순서)로 정렬
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((i) => ({
              key: i.id,
              itemId: i.id,
              name: i.name,
              price: i.price,
              imageUri: i.imageUri,
              addedForDiscount: i.reasons.includes('bundle_discount'),
            }))
        : [],
    [items, batchId],
  );

  const [manualLines, setManualLines] = useState<TrapLine[]>([]);
  const lines = batchId ? batchLines : manualLines;

  // 초기값: "추가 할인" 이유가 있는 물건은 꺼짐, 나머지는 켜짐
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isOn = (l: TrapLine) => overrides[l.key] ?? !l.addedForDiscount;

  const { defaultMin, defaultPct, defaultWon, freeShipMin, shipFee } = policy.discount;
  const [minAmount, setMinAmount] = useState<number | null>(defaultMin);
  const [value, setValue] = useState<number | null>(defaultPct);
  const [unit, setUnit] = useState<DiscountRule['unit']>('pct');
  // 무료배송 (명세서 4.11): 켜면 기준 금액, 끄면 배송비를 입력
  const [freeShipOn, setFreeShipOn] = useState(true);
  const [freeMin, setFreeMin] = useState<number | null>(freeShipMin);
  const [fee, setFee] = useState<number | null>(shipFee);

  const rule: DiscountRule = {
    minAmount: minAmount ?? 0,
    value: value ?? 0,
    unit,
    freeShipOn,
    freeShipMin: freeMin ?? 0,
    shipFee: fee ?? 0,
  };
  const check = discountCheck({ lines: lines.map((l) => ({ name: l.name, price: l.price, planned: isOn(l) })), rule });

  const validation = minAmount === null || minAmount < 0 || value === null || value < 0 || (unit === 'pct' && value > 100) || fee === null || fee < 0 || (freeShipOn && (freeMin === null || freeMin <= 0)) ? reflectionCopy.discountInvalid : null;
  return {
    validation,
    registering,
    fromBatch: !!batchId,
    lines: lines.map((l) => ({ ...l, on: isOn(l) })),
    toggle: (key: string) => {
      const line = lines.find((l) => l.key === key);
      if (line) setOverrides((o) => ({ ...o, [key]: !isOn(line) }));
    },
    minAmount,
    setMinAmount,
    value,
    setValue,
    unit,
    /** 단위를 바꾸면 기본값 (% = 10, 원 = 3,000) */
    setUnit: (u: DiscountRule['unit']) => {
      if (u === unit) return;
      setUnit(u);
      setValue(u === 'pct' ? defaultPct : defaultWon);
    },
    freeShipOn,
    setFreeShipOn,
    freeMin,
    setFreeMin,
    fee,
    setFee,
    shipFee: rule.shipFee,
    check,
    addManualLine: (name: string, price: number) =>
      setManualLines((ls) => [...ls, { key: createId('ln_'), name, price, addedForDiscount: false }]),
    removeManualLine: (key: string) => setManualLines((ls) => ls.filter((l) => l.key !== key)),
    /** Register reviewed conditions before removing excluded drafts. */
    confirm: async (decision: 'NEEDED' | 'ALL'): Promise<number | null> => {
      if (inFlight.current || validation) return null;
      inFlight.current = true;
      setRegistering(true);
      try {
        const batchItems = lines.flatMap((line) => {
          const item = items.find((candidate) => candidate.id === line.itemId);
          return item ? [item] : [];
        });
        return await completeDiscountRegistration(batchItems, {
          rule,
          neededIds: lines.filter(isOn).flatMap((line) => line.itemId ? [line.itemId] : []),
          decision,
        }, registrationKey);
      } finally {
        inFlight.current = false;
        setRegistering(false);
      }
    },
  };
}
