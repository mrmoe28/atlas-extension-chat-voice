import * as React from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  User,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Plus,
  ArrowRight,
  Mail,
  ShieldCheck,
  PieChart,
  X,
  Loader2,
  Send,
  Check,
  Bell,
  BarChart3,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";

export const Icons = {
  menu: Menu,
  logout: LogOut,
  plus: Plus,
  arrowRight: ArrowRight,
  mail: Mail,
  shield: ShieldCheck,
  revenue: PieChart,
  invoices: FileText,
  dashboard: LayoutDashboard,
  fileText: FileText,
  users: Users,
  user: User,
  payments: CreditCard,
  creditCard: CreditCard,
  settings: Settings,
  x: X,
  loader: Loader2,
  send: Send,
  check: Check,
  bell: Bell,
  barChart: BarChart3,
  sun: Sun,
  moon: Moon,
  rotate: RefreshCw,
};

export type IconName = keyof typeof Icons;

export function Icon({ name, ...props }: { name: IconName } & React.ComponentProps<"svg">) {
  const Component = Icons[name];
  if (!Component) {
    return null;
  }
  return <Component {...props} />;
}
