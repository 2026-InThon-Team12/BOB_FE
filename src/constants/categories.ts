import { CATEGORY_IDS, type CategoryId } from '@/types';

/** 카테고리 표시 라벨 (기능 정의서 순서) */
export const CATEGORY_LABELS: Record<CategoryId, string> = {
  daily: '일상/생활',
  clothing: '의류',
  furniture: '가구/인테리어',
  appliance: '가전제품',
  digital: '디지털기기',
  hobby: '취미',
  game: '게임',
  beauty: '뷰티/미용',
  food: '식품',
  etc: '기타',
};

export const CATEGORIES = CATEGORY_IDS.map((id) => ({ id, label: CATEGORY_LABELS[id] }));
