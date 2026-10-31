import { router, type Href } from 'expo-router';

/**
 * 뒤로 갈 화면이 없으면(웹에서 주소로 바로 들어온 경우 등) fallback으로 이동한다.
 * 저장 후 닫는 화면과 상단 뒤로가기 버튼에서 쓴다.
 */
export function goBack(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
