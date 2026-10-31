This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## BOB 프로젝트 규칙

전체 설계는 `~/.claude/plans/happy-noodling-sonnet.md`, 팀원 확인 사항은 상위 폴더의 `팀원_확인사항.md`에 있다.

- **질문·답변 원문은 로컬 저장**하고 결과 요약 시에만 전송한다. 사용자 승인에 따라 품목 등록·구매 결정·구매 후 점검·푸시 토큰은 서버에도 반영한다. 예산·목표·지출은 현재 로컬 원장이다.
- **BE 클라이언트** `src/api/`: 응답은 `unknown`으로 받은 뒤 `src/ai` 또는 `src/data/actions`에서 검증한다. 화면·뷰모델에서는 직접 import 금지(ESLint).
- **레이어**: `src/app`(화면 JSX) → `src/features`(뷰모델 훅) → `src/data`(로컬 스토어) / `src/ai`. `src/components`는 props만 받는다. `src/lib/calc`, `src/config`는 순수 TS. 경계는 `eslint.config.js`의 `no-restricted-imports`가 강제한다.
- **디자인 교체 지점**: `src/theme/tokens.ts`(토큰) → `src/components/ui`(프리미티브) → 화면 JSX. 화면·뷰모델에는 색·글꼴·간격 리터럴 금지 (`Stack`/`Text` props나 `makeStyles`의 theme 값을 쓴다).
- **문구**는 `src/constants/copy.ts`, **정책 값**은 `src/config/policy.ts`, **환경 변수**는 `src/config/env.ts`에서만 읽는다.
- 아이콘은 `components/ui/Icon`의 이름으로만 쓴다(직접 lucide import 금지).
- `/dev` 화면(시간 이동, 시드, UI 카탈로그)은 `EXPO_PUBLIC_DEMO=true`일 때만 열린다.
