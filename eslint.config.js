// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const { fixupConfigRules } = require('@eslint/compat');
const expoConfig = require('eslint-config-expo/flat');

/**
 * 레이어 규칙 (계획서 "아키텍처 원칙" 참고)
 *   app → features → data / ai
 *   app → components → theme
 *   features → lib/calc · config
 * 디자인 교체가 쉽도록 화면·뷰모델·기능 컴포넌트에는 시각 스타일 리터럴을 쓰지 않는다.
 */

const STYLE_PROPS =
  'color|backgroundColor|borderColor|borderTopColor|borderBottomColor|tintColor|shadowColor|' +
  'fontSize|lineHeight|fontWeight|fontFamily|letterSpacing|' +
  'padding|paddingHorizontal|paddingVertical|paddingTop|paddingBottom|paddingLeft|paddingRight|' +
  'margin|marginHorizontal|marginVertical|marginTop|marginBottom|marginLeft|marginRight|' +
  'gap|rowGap|columnGap|borderRadius';

const noVisualLiterals = [
  'error',
  {
    selector: 'Literal[value=/^#([0-9a-fA-F]{3,8})$/]',
    message: '색상은 theme 토큰(theme.color.*)을 사용하세요.',
  },
  {
    selector: 'Literal[value=/^(rgb|rgba|hsl|hsla)\\(/]',
    message: '색상은 theme 토큰(theme.color.*)을 사용하세요.',
  },
  {
    selector: `Property[key.name=/^(${STYLE_PROPS})$/] > Literal`,
    message: '색·글꼴·간격 값은 theme 토큰이나 UI 프리미티브(Stack, Text …)의 props로 지정하세요.',
  },
];

const restrict = (patterns) => ['error', { patterns }];

const stateLibs = { group: ['zustand', 'zustand/*'], message: '상태는 @/data의 selector 훅과 action만 사용하세요.' };
const dataInternals = {
  group: ['@/data/*'],
  message: '@/data 내부 파일 대신 @/data(index)에서 공개한 API만 사용하세요.',
};
const beClient = {
  group: ['@/api', '@/api/*'],
  message: '데이터는 로컬 저장이 원본입니다. BE 클라이언트는 @/ai(real)에서만 사용하세요.',
};
const aiInternals = {
  group: ['@/ai/*'],
  message: 'AI 구현체(mock/real/fallback)를 직접 쓰지 말고 @/ai(index)를 사용하세요.',
};

module.exports = defineConfig([
  // Expo의 React/import 플러그인은 ESLint 10의 규칙 API에 맞춰 실행한다.
  ...fixupConfigRules(expoConfig),
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },

  // 화면: 뷰모델과 컴포넌트를 배치만 한다
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': noVisualLiterals,
      'no-restricted-imports': restrict([stateLibs, dataInternals, aiInternals, beClient]),
    },
  },

  // 뷰모델: 숫자와 상태를 돌려준다. UI를 import하지 않는다
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': noVisualLiterals,
      'no-restricted-imports': restrict([
        stateLibs,
        dataInternals,
        aiInternals,
        beClient,
        { group: ['@/components/*', '@/app/*'], message: '뷰모델은 UI를 알지 못해야 합니다.' },
      ]),
    },
  },

  // 컴포넌트: props만 받는다. 데이터·AI·라우터를 모른다
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict([
        stateLibs,
        {
          group: ['@/data', '@/data/*', '@/ai', '@/ai/*', '@/api', '@/api/*', '@/features/*', '@/app/*', 'expo-router'],
          message: '컴포넌트는 props만 받습니다. 데이터·AI·내비게이션은 화면에서 연결하세요.',
        },
      ]),
    },
  },
  {
    files: ['src/components/feature/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': noVisualLiterals },
  },

  // 순수 계산·정책: 프레임워크에 의존하지 않는다 (테스트 대상)
  {
    files: ['src/lib/calc/**/*.ts', 'src/config/**/*.ts'],
    rules: {
      'no-restricted-imports': restrict([
        {
          group: ['react', 'react-native', 'expo*', '@/data', '@/data/*', '@/ai', '@/ai/*', '@/api', '@/api/*', '@/components/*', '@/features/*', '@/app/*', '@/theme', '@/theme/*'],
          message: '계산·정책 모듈은 순수 TypeScript로 유지합니다.',
        },
      ]),
    },
  },

  // 테스트: 여러 레이어를 함께 검증하므로 레이어 규칙을 적용하지 않는다
  {
    files: ['**/__tests__/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}', 'jest.setup.ts'],
    rules: { 'no-restricted-imports': 'off', 'no-restricted-syntax': 'off' },
  },

  // 테마: 다른 레이어에 의존하지 않는다
  {
    files: ['src/theme/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': restrict([
        { group: ['@/*'], message: '테마는 다른 앱 레이어를 import하지 않습니다.' },
      ]),
    },
  },
]);
