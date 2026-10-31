# BOB_FE — apklike

UI는 `BoB_handoff/prototype/*.html`, 기능은 `BOB_ANDROID` APK의 API·저장 동작을 기준으로 구현하는 브랜치입니다.
원래 `feat/frontend-mvp` 및 `fix/expo-cart-upload-review` 브랜치는 변경하지 않습니다.

## 실행

```bash
git switch apklike
npm ci
npx expo start --go --clear
```

PC와 Android 휴대폰을 같은 Wi-Fi에 연결하고 새 QR을 Expo Go로 읽습니다.
네트워크에서 연결이 막히면 `npx expo start --go --clear --tunnel`을 사용합니다.

기본 API는 `https://bob-be.vercel.app`입니다. `.env.local` 생성은 필수가 아닙니다.
기존 환경변수 `EXPO_PUBLIC_API_BASE_URL`에 다른 주소가 있으면 수정하세요.
이 브랜치의 실제 앱 흐름은 AI mock이나 가상 로컬 물품을 사용하지 않습니다.

## 동작

- 홈·전체 물품·목표·지갑·리포트는 APK와 같은 서버 API를 조회합니다.
- 사진·URL·직접 입력 → 초안 확인 → 구매 이유·마감일 → 기간/할인 미리보기 → 최종 등록 순서입니다.
- 새 사진은 기존 초안에 추가하거나 이전 사진 초안만 교체할 수 있습니다. 실패·취소로 기존 내용이 사라지지 않습니다.
- 최종 등록 성공 뒤 초안만 비우고 서버 홈을 다시 읽습니다. 뒤로 이동하거나 다른 사진을 등록해도 기존 서버 물품을 지우지 않습니다.
- 최초 세션 요청을 하나로 합치고 인증 오류가 나도 기존 계정을 유지합니다.
- LOCAL 질문·답변은 기기에 보관하고 완료된 관찰의 요약에만 전송합니다.
- 기존 Expo의 로컬 저장소를 삭제하지 않습니다. 서버에 전송되지 않은 가상 물품은 자동 이전하지 않습니다.

## 검증

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo export --platform all --output-dir dist
```

브라우저 통합 테스트는 `scripts/apklike-smoke.cjs`입니다. Playwright와 Chrome이 설치된 환경에서 실행하며,
API를 테스트 응답으로 대체하므로 실제 서버 기록을 만들지 않습니다.
별도 설치를 사용할 때는 `PLAYWRIGHT_MODULE`과 `CHROME_PATH`를 지정합니다.

Android Expo Go 실기기에서 모든 기능을 확인한 버전은 아직 아닙니다.
특히 Expo Go의 원격 푸시 제한 및 APK의 백그라운드 알림 처리 차이는 [인계 문서](docs/apklike-parity.md)를 확인하세요.
화면별 HTML 대응과 서버 응답에 따른 표시 규칙은 [UI 기준](docs/html-ui.md)에 정리했습니다.

이번 UI 수정은 로컬 `apklike`에 저장합니다. 요청 없이 GitHub에 push하지 않습니다.
