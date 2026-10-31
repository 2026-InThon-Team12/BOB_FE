import type { ComponentProps } from 'react';

import { formatDigits, parseWon } from '@/lib/format';

import { Input } from './Input';

type Props = Omit<ComponentProps<typeof Input>, 'value' | 'onChangeText' | 'keyboardType' | 'suffix'> & {
  value: number | null;
  onChangeValue: (value: number | null) => void;
};

/** 원 단위 금액 입력 (천 단위 쉼표 자동, 숫자 키패드) */
export function MoneyInput({ value, onChangeValue, ...rest }: Props) {
  return (
    <Input
      {...rest}
      value={formatDigits(value)}
      onChangeText={(text) => onChangeValue(parseWon(text))}
      keyboardType="number-pad"
      inputMode="numeric"
      suffix="원"
    />
  );
}
