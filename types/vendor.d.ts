// Ambient declarations for packages whose .d.ts files are absent from the local
// node_modules install. The server build has all types properly installed.
// These stubs suppress VS Code errors without affecting runtime behaviour.

// ── framer-motion ─────────────────────────────────────────────────────────
declare module "framer-motion" {
  import * as React from "react";

  interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileFocus?: any;
    whileInView?: any;
    layout?: any;
    layoutId?: string;
    custom?: any;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
    key?: React.Key;
    [key: string]: any;
  }

  type MotionEl<T extends HTMLElement = HTMLElement> = React.ForwardRefExoticComponent<
    React.HTMLAttributes<T> & MotionProps & React.RefAttributes<T>
  >;

  const motion: {
    div: MotionEl<HTMLDivElement>;
    span: MotionEl<HTMLSpanElement>;
    p: MotionEl<HTMLParagraphElement>;
    h1: MotionEl<HTMLHeadingElement>;
    h2: MotionEl<HTMLHeadingElement>;
    h3: MotionEl<HTMLHeadingElement>;
    h4: MotionEl<HTMLHeadingElement>;
    h5: MotionEl<HTMLHeadingElement>;
    h6: MotionEl<HTMLHeadingElement>;
    ul: MotionEl<HTMLUListElement>;
    ol: MotionEl<HTMLOListElement>;
    li: MotionEl<HTMLLIElement>;
    button: MotionEl<HTMLButtonElement>;
    a: MotionEl<HTMLAnchorElement>;
    img: MotionEl<HTMLImageElement>;
    form: MotionEl<HTMLFormElement>;
    input: MotionEl<HTMLInputElement>;
    textarea: MotionEl<HTMLTextAreaElement>;
    section: MotionEl;
    nav: MotionEl;
    header: MotionEl;
    footer: MotionEl;
    aside: MotionEl;
    main: MotionEl;
    article: MotionEl;
    [key: string]: MotionEl<any>;
  };

  const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    mode?: "sync" | "popLayout" | "wait";
    initial?: boolean;
    onExitComplete?: () => void;
  }>;

  function useAnimation(): any;
  function useMotionValue(initial: any): any;
  function useTransform(...args: any[]): any;
  function useSpring(...args: any[]): any;
  function useInView(ref: any, options?: any): boolean;
  function useScroll(options?: any): any;
  function useReducedMotion(): boolean;
  function useCycle<T>(...items: T[]): [T, () => void];

  export {
    motion,
    AnimatePresence,
    useAnimation,
    useMotionValue,
    useTransform,
    useSpring,
    useInView,
    useScroll,
    useReducedMotion,
    useCycle,
  };
  export type { MotionProps };
}

// ── lucide-react ───────────────────────────────────────────────────────────
declare module "lucide-react" {
  import * as React from "react";

  interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }
  type LucideIcon = React.ForwardRefExoticComponent<
    LucideProps & React.RefAttributes<SVGSVGElement>
  >;

  // Icons used throughout this codebase
  export const Activity: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowDown: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowUp: LucideIcon;
  export const Award: LucideIcon;
  export const BadgePercent: LucideIcon;
  export const BarChart: LucideIcon;
  export const BarChart2: LucideIcon;
  export const Bell: LucideIcon;
  export const BellOff: LucideIcon;
  export const BookOpen: LucideIcon;
  export const Building: LucideIcon;
  export const Calendar: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const ChevronUp: LucideIcon;
  export const Circle: LucideIcon;
  export const Clock: LucideIcon;
  export const Cloud: LucideIcon;
  export const Code: LucideIcon;
  export const Copy: LucideIcon;
  export const CreditCard: LucideIcon;
  export const Database: LucideIcon;
  export const DollarSign: LucideIcon;
  export const Download: LucideIcon;
  export const Edit: LucideIcon;
  export const Edit2: LucideIcon;
  export const Edit3: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const File: LucideIcon;
  export const FileText: LucideIcon;
  export const Filter: LucideIcon;
  export const Flame: LucideIcon;
  export const Gift: LucideIcon;
  export const Globe: LucideIcon;
  export const Globe2: LucideIcon;
  export const HelpCircle: LucideIcon;
  export const Home: LucideIcon;
  export const Image: LucideIcon;
  export const Info: LucideIcon;
  export const Key: LucideIcon;
  export const Layers: LucideIcon;
  export const Layout: LucideIcon;
  export const Link: LucideIcon;
  export const List: LucideIcon;
  export const Loader: LucideIcon;
  export const Loader2: LucideIcon;
  export const Lock: LucideIcon;
  export const LogIn: LucideIcon;
  export const LogOut: LucideIcon;
  export const Mail: LucideIcon;
  export const Map: LucideIcon;
  export const MapPin: LucideIcon;
  export const Menu: LucideIcon;
  export const MessageCircle: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Minus: LucideIcon;
  export const Moon: LucideIcon;
  export const MoreHorizontal: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Package: LucideIcon;
  export const Phone: LucideIcon;
  export const PieChart: LucideIcon;
  export const Play: LucideIcon;
  export const Plus: LucideIcon;
  export const Radio: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Save: LucideIcon;
  export const Search: LucideIcon;
  export const Send: LucideIcon;
  export const Settings: LucideIcon;
  export const Share: LucideIcon;
  export const Shield: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Star: LucideIcon;
  export const Sun: LucideIcon;
  export const Tag: LucideIcon;
  export const Target: LucideIcon;
  export const Terminal: LucideIcon;
  export const Trash: LucideIcon;
  export const Trash2: LucideIcon;
  export const TrendingDown: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Trophy: LucideIcon;
  export const Unlock: LucideIcon;
  export const Upload: LucideIcon;
  export const User: LucideIcon;
  export const UserCheck: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Users: LucideIcon;
  export const Video: LucideIcon;
  export const Wallet: LucideIcon;
  export const Wifi: LucideIcon;
  export const WifiOff: LucideIcon;
  export const X: LucideIcon;
  export const XCircle: LucideIcon;
  export const Zap: LucideIcon;
  export const ZoomIn: LucideIcon;
  export const ZoomOut: LucideIcon;

  // ── Icons missing from TS resolution due to oversized .d.ts export line ──
  export const Archive: LucideIcon;
  export const ArrowDownCircle: LucideIcon;
  export const ArrowDownToLine: LucideIcon;
  export const ArrowLeftRight: LucideIcon;
  export const ArrowRightLeft: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const BadgeCheck: LucideIcon;
  export const BadgeDollarSign: LucideIcon;
  export const Ban: LucideIcon;
  export const Banknote: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Bitcoin: LucideIcon;
  export const Book: LucideIcon;
  export const Bookmark: LucideIcon;
  export const Briefcase: LucideIcon;
  export const Bug: LucideIcon;
  export const Building2: LucideIcon;
  export const Calculator: LucideIcon;
  export const Camera: LucideIcon;
  export const Car: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const CircleDollarSign: LucideIcon;
  export const ClipboardCheck: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const Clock3: LucideIcon;
  export const Coins: LucideIcon;
  export const Cpu: LucideIcon;
  export const Crown: LucideIcon;
  export const Droplets: LucideIcon;
  export const Facebook: LucideIcon;
  export const FileCheck: LucideIcon;
  export const FileImage: LucideIcon;
  export const FileX: LucideIcon;
  export const Fingerprint: LucideIcon;
  export const Flag: LucideIcon;
  export const FlaskConical: LucideIcon;
  export const FolderOpen: LucideIcon;
  export const Gauge: LucideIcon;
  export const Gavel: LucideIcon;
  export const Gem: LucideIcon;
  export const GitBranch: LucideIcon;
  export const GraduationCap: LucideIcon;
  export const Grid: LucideIcon;
  export const Grid3x3: LucideIcon;
  export const Hash: LucideIcon;
  export const Heart: LucideIcon;
  export const HeartHandshake: LucideIcon;
  export const History: LucideIcon;
  export const Inbox: LucideIcon;
  export const Instagram: LucideIcon;
  export const Landmark: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const LayoutGrid: LucideIcon;
  export const Leaf: LucideIcon;
  export const LifeBuoy: LucideIcon;
  export const Linkedin: LucideIcon;
  export const ListChecks: LucideIcon;
  export const MailOpen: LucideIcon;
  export const Medal: LucideIcon;
  export const Megaphone: LucideIcon;
  export const Monitor: LucideIcon;
  export const MoveDown: LucideIcon;
  export const MoveUp: LucideIcon;
  export const Network: LucideIcon;
  export const Package2: LucideIcon;
  export const Palette: LucideIcon;
  export const Pause: LucideIcon;
  export const PauseCircle: LucideIcon;
  export const Pencil: LucideIcon;
  export const Percent: LucideIcon;
  export const PlayCircle: LucideIcon;
  export const PlusCircle: LucideIcon;
  export const Power: LucideIcon;
  export const PowerOff: LucideIcon;
  export const Presentation: LucideIcon;
  export const QrCode: LucideIcon;
  export const RadioTower: LucideIcon;
  export const Receipt: LucideIcon;
  export const RefreshCcw: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const Router: LucideIcon;
  export const School: LucideIcon;
  export const ScrollText: LucideIcon;
  export const SearchX: LucideIcon;
  export const Server: LucideIcon;
  export const Settings2: LucideIcon;
  export const Share2: LucideIcon;
  export const ShieldOff: LucideIcon;
  export const ShoppingBag: LucideIcon;
  export const Sliders: LucideIcon;
  export const Smartphone: LucideIcon;
  export const Sprout: LucideIcon;
  export const StopCircle: LucideIcon;
  export const Store: LucideIcon;
  export const Tablet: LucideIcon;
  export const Tags: LucideIcon;
  export const ThumbsDown: LucideIcon;
  export const ThumbsUp: LucideIcon;
  export const Timer: LucideIcon;
  export const TimerReset: LucideIcon;
  export const ToggleLeft: LucideIcon;
  export const ToggleRight: LucideIcon;
  export const TrendingUpIcon: LucideIcon;
  export const Twitter: LucideIcon;
  export const UploadCloud: LucideIcon;
  export const UserMinus: LucideIcon;
  export const UserRound: LucideIcon;
  export const UserX: LucideIcon;
  export const Utensils: LucideIcon;
  export const Vote: LucideIcon;
  export const Wand2: LucideIcon;
  export const Wrench: LucideIcon;
  export const Youtube: LucideIcon;

  export type { LucideIcon, LucideProps };
}

// ── next/server ────────────────────────────────────────────────────────────
declare module "next/server" {
  import { IncomingMessage } from "http";

  type NextURL = URL & { pathname: string; searchParams: URLSearchParams };

  interface RequestInit {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    signal?: AbortSignal | null;
  }

  export class NextRequest extends Request {
    readonly nextUrl: NextURL;
    readonly cookies: {
      get(name: string): { name: string; value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      set(name: string, value: string): void;
      delete(name: string): void;
      has(name: string): boolean;
      clear(): void;
    };
    readonly ip?: string;
    readonly geo?: {
      city?: string;
      country?: string;
      region?: string;
      latitude?: string;
      longitude?: string;
    };
    readonly url: string;
  }

  type ResponseInit = { status?: number; statusText?: string; headers?: HeadersInit };

  export class NextResponse<TBody = unknown> extends Response {
    readonly cookies: {
      get(name: string): { name: string; value: string } | undefined;
      set(name: string, value: string, options?: Record<string, any>): void;
      delete(name: string): void;
    };
    static json<T = unknown>(body: T, init?: ResponseInit): NextResponse<T>;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    static rewrite(destination: string | URL, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
}

