import { addDays, addMonths, daysInMonth, diffDays } from '@/lib/date';
import { fillName, formatDigits, formatMonth, formatMonthDay, formatWon, formatWonShort, josa, parseWon } from '@/lib/format';

describe('formatWon / formatWonShort', () => {
  it('천 단위 구분', () => {
    expect(formatWon(1234567)).toBe('1,234,567원');
    expect(formatWon(-7000)).toBe('-7,000원');
  });

  it('짧은 금액 표기', () => {
    expect(formatWonShort(23_000)).toBe('2.3만 원');
    expect(formatWonShort(120_000)).toBe('12만 원');
    expect(formatWonShort(7_000)).toBe('7천 원');
    expect(formatWonShort(6_500)).toBe('6,500원');
    expect(formatWonShort(950)).toBe('950원');
    expect(formatWonShort(10_000_000)).toBe('1,000만 원');
  });
});

describe('josa / fillName', () => {
  it('받침에 맞는 조사', () => {
    expect(josa('피규어', '이/가')).toBe('피규어가');
    expect(josa('이어폰', '이/가')).toBe('이어폰이');
    expect(josa('가디건', '을/를')).toBe('가디건을');
    expect(josa('의자', '을/를')).toBe('의자를');
    expect(josa('PS5', '이/가')).toBe('PS5가');
  });

  it('템플릿 채우기', () => {
    expect(fillName('오늘 {name이/가} 생각났나요? {name}', '의자')).toBe('오늘 의자가 생각났나요? 의자');
    expect(fillName('{name을/를} 할 시간', '보드게임')).toBe('보드게임을 할 시간');
  });
});

describe('date', () => {
  it('월·연도 경계', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-10-25', '2026-11-08')).toBe(14);
    expect(diffDays('2026-11-08', '2026-10-25')).toBe(-14);
    expect(daysInMonth('2028-02')).toBe(29);
  });
});

describe('금액 입력·날짜 표시', () => {
  it('parseWon / formatDigits', () => {
    expect(parseWon('1,400,000원')).toBe(1_400_000);
    expect(parseWon('abc')).toBeNull();
    expect(parseWon('')).toBeNull();
    expect(formatDigits(1_400_000)).toBe('1,400,000');
    expect(formatDigits(null)).toBe('');
  });

  it('formatMonthDay / formatMonth', () => {
    expect(formatMonthDay('2026-11-06')).toBe('11월 6일');
    expect(formatMonth('2026-01')).toBe('1월');
  });
});

describe('josa 으로/로', () => {
  it('받침 없음·ㄹ 받침은 로, 그 외 받침은 으로', () => {
    expect(josa('할인·한정 판매', '으로/로')).toBe('할인·한정 판매로');
    expect(josa('추가 할인', '으로/로')).toBe('추가 할인으로');
    expect(josa('SNS·광고', '으로/로')).toBe('SNS·광고로');
    expect(josa('실제 필요', '으로/로')).toBe('실제 필요로');
    expect(josa('연필', '으로/로')).toBe('연필로');
    expect(josa('의류', '은/는')).toBe('의류는');
    expect(josa('디지털기기', '은/는')).toBe('디지털기기는');
  });
});

describe('addMonths', () => {
  it('연도 경계', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });
});
