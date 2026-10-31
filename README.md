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

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 필요한 값을 설정합니다.

```dotenv
# 데모·개발자 도구 노출
EXPO_PUBLIC_DEMO=true

# 실제 AI 백엔드 사용
EXPO_PUBLIC_AI_MODE=real

# real 모드에서 사용할 백엔드 주소
EXPO_PUBLIC_API_BASE_URL=https://bob-be.vercel.app
```

`.env`에는 민감한 값을 넣을 수 있으므로 Git에 커밋하지 않습니다.

### 3. 앱 실행

```bash
# Expo 개발 서버
npm start

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
