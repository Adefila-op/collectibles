import { Link, useLocation } from "react-router-dom";
import { Home, Search, Plus, Repeat2, User } from "lucide-react";

export function BottomNav() {
  const { pathname } = useLocation();
  const is = (p: string) => pathname === p;

  const Item = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: typeof Home;
    label: string;
  }) => (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
        is(to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
      {label}
    </Link>
  );

  return (
    <div className="sticky bottom-0 z-10 mt-auto border-t border-border bg-card/85 px-5 py-2.5 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <Item to="/" icon={Home} label="Home" />
        <Item to="/explore" icon={Search} label="Explore" />
        <Link
          to="/list"
          className="-mt-7 grid h-12 w-12 place-items-center rounded-full bg-primary-grad text-white shadow-glow animate-pulse-ring"
        >
          <Plus className="h-5 w-5" />
        </Link>
        <Item to="/swap" icon={Repeat2} label="Swap" />
        <Item to="/profile" icon={User} label="Profile" />
      </div>
    </div>
  );
}
