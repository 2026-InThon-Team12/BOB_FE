let counter = 0;

/** 로컬 전용 id (서버가 없으므로 충돌 가능성만 낮으면 충분하다) */
export function createId(prefix = ''): string {
  counter = (counter + 1) % 1_296;
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}${time}${counter.toString(36).padStart(2, '0')}${rand}`;
}
