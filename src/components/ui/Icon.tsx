import {
  ArrowRight,
  Bell,
  Calendar,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CircleQuestionMark,
  Clock,
  House,
  Image,
  Inbox,
  Link,
  Palette,
  Pencil,
  Plus,
  Settings,
  Sparkle,
  Sparkles,
  TriangleAlert,
  Truck,
  Wallet,
  Wrench,
  X,
} from 'lucide-react-native';

import { useTheme, type Theme } from '@/theme';

/**
 * 앱 전체 아이콘은 이 래퍼만 사용한다.
 * 디자이너 아이콘 세트가 나오면 아래 매핑의 구현만 교체한다 (사용처의 name은 그대로).
 */
const registry = {
  // 탭 (시안: 홈 · 목표 · 리포트 · 지갑)
  home: House,
  goal: CircleDot,
  report: ChartColumn,
  wallet: Wallet,
  // 동작
  add: Plus,
  back: ChevronLeft,
  close: X,
  check: Check,
  /** 잘 모르겠어요 */
  help: CircleQuestionMark,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  arrowRight: ArrowRight,
  // 등록 방법
  image: Image,
  camera: Camera,
  link: Link,
  pencil: Pencil,
  // 안내
  bell: Bell,
  clock: Clock,
  calendar: Calendar,
  /** AI가 고른 값 표시 (시안의 ✦) */
  ai: Sparkle,
  sparkles: Sparkles,
  warning: TriangleAlert,
  shipping: Truck,
  empty: Inbox,
  // 개발자 도구
  settings: Settings,
  dev: Wrench,
  palette: Palette,
} as const;

export type IconName = keyof typeof registry;
export type IconSize = keyof Theme['layout']['iconSize'];
export type IconTone = keyof Theme['color']['text'];

type Props = {
  name: IconName;
  size?: IconSize;
  tone?: IconTone;
  /** 탭바처럼 네비게이터가 색을 직접 내려주는 경우에만 사용 */
  color?: string;
};

export function Icon({ name, size = 'md', tone = 'primary', color }: Props) {
  const theme = useTheme();
  const Component = registry[name];
  return (
    <Component
      size={theme.layout.iconSize[size]}
      color={color ?? theme.color.text[tone]}
      strokeWidth={2}
    />
  );
}
