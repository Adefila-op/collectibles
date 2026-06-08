import { Link } from "react-router-dom";
import logo from "@/assets/collectible-logo.svg";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  light?: boolean;
  bgColor?: string; // Dynamic background color
};

export function BrandLogo({
  className = "",
  markClassName = "h-10 w-10",
  textClassName = "font-display text-xl font-black",
  light = false,
  bgColor = "bg-white",
}: BrandLogoProps) {
  return (
    <Link to="/" className={`inline-flex items-center gap-3 ${className}`} aria-label="COllectible home">
      <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl ${bgColor} shadow-soft ${markClassName}`}>
        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
      </span>
      <span className={`${textClassName} ${light ? "text-white" : "text-slate-950"}`}>COllectible</span>
    </Link>
  );
}
