import {
  CalendarCheck,
  Ellipsis,
  GraduationCap,
  House,
  IndianRupee,
  Layers,
  MessageCircle,
  NotebookPen,
  PartyPopper,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** The five tabs in the phone's bottom bar. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/students", label: "Students", icon: Users },
  { href: "/fees", label: "Fees", icon: IndianRupee },
  { href: "/more", label: "More", icon: Ellipsis },
];

/** Pages reached from "More" on phones; shown directly in the desktop sidebar. */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/tests", label: "Tests & marks", icon: NotebookPen },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/batches", label: "Batches", icon: Layers },
  { href: "/holidays", label: "Holidays", icon: PartyPopper },
  { href: "/reminders", label: "Reminder log", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

/** "/students/123" is inside the Students tab; "/" only matches exactly. */
export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The More tab also lights up on the pages it links to. */
export function isMoreActive(pathname: string) {
  return (
    isActive(pathname, "/more") || SECONDARY_NAV.some((item) => isActive(pathname, item.href))
  );
}
