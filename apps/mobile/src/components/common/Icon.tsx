import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Film,
  Globe,
  Heart,
  Home,
  Image as ImageIcon,
  Images,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Palette,
  Pause,
  Play,
  Plus,
  Scaling,
  Search,
  Send,
  Settings,
  SquarePlay,
  Star,
  SwitchCamera,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
  ZapOff,
} from "lucide-react-native";

import { iconSize, iconStroke, useTheme } from "../../lib/theme";

// 아이콘을 쓰는 유일한 통로. 색·크기·굵기를 화면마다 손으로 적지 않게 한다.
//
// 왜 만들었나: 같은 화면 안에서도 값이 갈렸다. 카메라 조작 버튼 3개가
// 27/2.5 · 24/2.4 · 28/2.2 로 제각각이었고, 검색창의 돋보기(18/2.4)와
// 지우기 X(16/2.8)도 나란히 있는데 굵기가 달랐다.
// 값 자체를 정리해도 새 화면에서 또 손으로 적으면 되돌아가므로, 통로를 하나로 둔다.
const ICONS = {
  arrowLeft: ArrowLeft,
  bell: Bell,
  book: BookOpen,
  bookmark: Bookmark,
  camera: Camera,
  check: Check,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  eye: Eye,
  film: Film,
  globe: Globe,
  heart: Heart,
  home: Home,
  image: ImageIcon,
  images: Images,
  lock: Lock,
  messageCircle: MessageCircle,
  more: MoreHorizontal,
  palette: Palette,
  pause: Pause,
  play: Play,
  plus: Plus,
  scaling: Scaling,
  search: Search,
  send: Send,
  settings: Settings,
  squarePlay: SquarePlay,
  star: Star,
  switchCamera: SwitchCamera,
  trash: Trash2,
  volumeOff: VolumeX,
  volumeOn: Volume2,
  x: X,
  zap: Zap,
  zapOff: ZapOff,
} as const;

export type IconName = keyof typeof ICONS;
export type IconTone =
  | "accent"
  | "danger"
  | "faint"
  | "muted"
  | "onAccent"
  | "onMedia"
  | "star"
  | "text";

type IconProps = {
  /** 하트·북마크·별처럼 채워지는 아이콘의 활성 상태 */
  filled?: boolean;
  name: IconName;
  size?: keyof typeof iconSize;
  stroke?: keyof typeof iconStroke;
  /** 색 역할. 값이 아니라 쓰임으로 고른다 */
  tone?: IconTone;
};

export function Icon({
  filled = false,
  name,
  size = "md",
  stroke = "regular",
  tone = "text",
}: IconProps) {
  const { colors } = useTheme();
  const Glyph = ICONS[name];

  // 미디어(사진·영상) 위 아이콘은 테마와 무관하게 밝은 색으로 고정한다.
  const toneColors: Record<IconTone, string> = {
    accent: colors.accent,
    danger: colors.danger,
    faint: colors.textFaint,
    muted: colors.muted,
    onAccent: colors.onAccent,
    onMedia: colors.onMediaGlyph,
    star: colors.star,
    text: colors.text,
  };
  const color = toneColors[tone];

  return (
    <Glyph
      color={color}
      fill={filled ? color : "transparent"}
      size={iconSize[size]}
      strokeWidth={iconStroke[stroke]}
    />
  );
}
