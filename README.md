# BOB_FE

> 사고 싶은 순간을 기록하고, 실제 필요와 충동을 구분하도록 돕는 **Buy or Bye(BOB)** 프론트엔드입니다.

BOB는 단순히 소비를 막는 앱이 아닙니다. 구매 전에는 물건이 실제로 필요했을지 일정 기간 질문하고, 구매 후에는 예상 사용량과 실제 사용량을 비교해 사용자가 자신의 소비 습관을 이해하도록 돕습니다.

## 주요 기능

- **구매 시뮬레이션**: 장바구니 캡처, 링크 또는 직접 입력으로 물품을 등록하고 매일 필요 여부를 확인합니다.
- **Buy or Bye 결정**: 사용 예상 일수와 회당 비용을 바탕으로 구매, 포기 또는 보류를 선택합니다.
- **예측과 실제 비교**: 구매한 물품의 실제 사용량을 나중에 점검해 과대예측 경향을 보여줍니다.
- **소비 목표**: 참은 금액을 원하는 목표에 적립하고 예상 달성일을 계산합니다.
- **할인 함정 확인**: 추가 할인을 받기 위해 불필요한 상품을 더 담았는지 계산합니다.
- **리포트와 지갑**: 월별 결정, 지출, 참은 금액과 구매 유발 원인 패턴을 정리합니다.

## 기술 스택

- Expo SDK 58 / React Native / React 19
- TypeScript
- Expo Router
- Zustand + AsyncStorage
- TanStack Query
- Zod
- Jest + ESLint

## 시작하기

### 1. 패키지 설치

Node.js 24 LTS를 권장합니다. Expo SDK 58의 네이티브 패키지는 `npx expo install`로 호환 버전을 유지합니다.

```bash
npm ci
```

ESLint 9와 Expo의 flat config를 사용합니다.
`package.json`의 제한된 `overrides`는 테스트 도구의 지원 종료 패키지를 제거하기 위한 것입니다.
`test-exclude` 8은 오래된 `glob`·`inflight`를, `jsdom` 27은 `whatwg-encoding`을 대체합니다.
jsdom은 Jest 30이 사용하는 `ResourceLoader` API가 유지되는 버전을 사용합니다.

### 2. 환경 변수 설정

기본값은 실제 BoB 서버 연결입니다. `.env` 없이도 사진 분석을 사용할 수 있습니다.
다른 환경을 사용하려면 `.env.example`을 참고해 프로젝트 루트에 `.env.local`을 만듭니다.
기존 `.env*`에 `EXPO_PUBLIC_AI_MODE=mock`이 있다면 `real`로 변경합니다.

```dotenv
# 데모·개발자 도구 노출
EXPO_PUBLIC_DEMO=true

# 실제 AI 백엔드 사용
EXPO_PUBLIC_AI_MODE=real

# real 모드에서 사용할 백엔드 주소
EXPO_PUBLIC_API_BASE_URL=https://bob-be.vercel.app
```

`EXPO_PUBLIC_*`에는 앱에 노출돼도 되는 설정만 넣습니다. 비밀키는 넣지 않습니다.
환경변수를 바꾼 뒤 Expo Go에서 전체 Reload를 실행합니다.

사진 업로드는 APK와 같이 최대 1200만 화소/긴 변 8000px를 유지하고,
작은 스크린샷은 PNG, 큰 파일은 JPEG 품질 조정으로 4,000,000바이트 이하로 전송합니다.
변환된 파일의 MIME·이름을 맞춰 `image` multipart 필드로 업로드합니다.
사진 분석 오류는 샘플 상품이나 다른 오류로 대체하지 않고 재시도 화면에 표시합니다.

#### Android Expo Go에서 사진 선택 직후 연결 오류가 나는 경우

SDK 58에서는 네이티브 기본 `fetch`가 `expo/fetch`입니다.
이 구현은 이전 React Native 방식의 `{ uri, name, type }` multipart 파일을 처리하지 못합니다.
전송 전 변환 오류도 기존 클라이언트에서는 네트워크 오류로 표시됐습니다.
현재는 `expo-file-system`의 `File`과 명시적인 `expo/fetch`로 전송하며,
웹에서는 변환된 `Blob`을 사용합니다. `Content-Type`의 multipart boundary는 fetch가 생성합니다.

업데이트 후 `npx expo start --clear`로 개발 서버를 재시작하고 Expo Go에서 다시 엽니다.
참고: [SDK 58 fetch](https://docs.expo.dev/versions/v58.0.0/sdk/expo/#expofetch-api),
[공식 파일 업로드 방식](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/#uploading-files-using-expofetch).

상품명·가격 인식과 상품 썸네일 추출은 별개입니다.
BE가 `analysis_method: "ocr"`, `PRODUCT_IMAGE_UNAVAILABLE`을 반환하면 상품 이미지는 없습니다.
썸네일 추출에는 BE의 vision 모델 지원 검증이 필요합니다(`BOB_BE`의 `scripts.check_lablup`).
FE는 서버가 제공한 `image_url` 또는 검증된 `image_crop`을 표시합니다.

### 3. 앱 실행

실제 휴대폰에서는 **SDK 58을 지원하는 Expo Go**를 사용합니다.
PC와 휴대폰을 같은 Wi-Fi에 연결한 뒤 아래 명령으로 나온 QR 코드를
Android의 Expo Go 스캐너 또는 iPhone 카메라로 읽습니다. 별도 BoB APK는 설치하지 않습니다.

```powershell
git switch feat/frontend-mvp
git pull --ff-only origin feat/frontend-mvp
npm.cmd ci
npm.cmd run start:go -- --clear
```

다른 Metro 서버가 켜져 있다면 먼저 `Ctrl+C`로 종료하고 새 QR 코드를 사용합니다.
학교·공용 Wi-Fi가 기기 간 통신을 막으면 `npm.cmd run start:go -- --tunnel`을 사용합니다.
터널 도구를 처음 설치할 때 CLI가 설치 동의를 물을 수 있습니다.

`Cannot find native module 'ExpoApplication'`가 나면 Expo Go의 지원 SDK와
이 프로젝트의 SDK 58을 확인하고, 위의 `npm ci`와 캐시 초기화를 실행합니다.
알림 모듈은 필요할 때만 불러오며, 사용할 수 없더라도 나머지 앱은 실행됩니다.
기기 로컬 알림은 지원되는 환경에서 유지합니다. Android Expo Go의 **서버 푸시 수신은 지원되지 않으므로**
이 QR 테스트의 범위에서 제외합니다. [Expo 알림 문서](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)

```bash
# Expo Go 개발 서버
npm run start:go

# 웹
npm run web

# Android
npm run android

# iOS
npm run ios
```

## 검사 명령

```bash
# 타입 검사
npm run typecheck

# 린트
npm run lint

# 테스트
npm test
```

## 프로젝트 구조

```text
src/
├─ app/          # Expo Router 화면과 내비게이션
├─ features/     # 화면별 상태와 뷰모델 훅
├─ components/   # 공통 UI 및 기능 컴포넌트
├─ data/         # 로컬 저장소, 데이터 액션, 마이그레이션
├─ ai/           # Mock·실제 AI 연동과 실패 대체 로직
├─ api/          # 백엔드 API 클라이언트
├─ lib/          # 계산 및 공통 유틸리티
├─ constants/    # 문구, 카테고리, 질문 템플릿
├─ config/       # 정책 및 환경 변수
└─ theme/        # 디자인 토큰과 테마
```

## 데이터와 AI 동작

- 물품 등록은 묶음의 모든 상품에 대해 구매 이유를 고른 뒤 진행합니다. 어느 상품이든
  `일정 금액 이상 담으면 추가 할인` 이유가 있으면 마지막 상품 다음에 할인 함정 화면을 엽니다.
  이 경우 할인 조건·배송 조건·품목 스위치·최종 선택을 `discount_review`로 묶어 등록하며,
  할인 화면에 들어가기 전에는 `/items/batch`를 호출하지 않습니다.
  등록 실패 시 선택 상태를 유지하고, 성공한 뒤에만 제외한 품목을 로컬에서 Bye 처리합니다.
- 사용자 데이터는 기기의 로컬 저장소에 보관합니다.
- `.env`의 `EXPO_PUBLIC_AI_MODE=real`에서 BOB 백엔드로 카테고리·장바구니 인식을 요청합니다.
- `real` 모드의 원격 요청이 실패하면 가능한 기능은 로컬 대체 로직으로 전환됩니다.
- 장바구니 이미지 등 AI 분석용 데이터는 분석 요청에만 사용하고 앱 데이터로 원본을 저장하지 않습니다.

## 협업 방식

기능별 브랜치에서 작업한 뒤 `main` 브랜치로 Pull Request를 생성합니다.

```bash
git switch -c feat/기능명
git add -A
git commit -m "feat: 작업 내용"
git push -u origin feat/기능명
```

## Repository

[2026-InThon-Team12/BOB_FE](https://github.com/2026-InThon-Team12/BOB_FE)
