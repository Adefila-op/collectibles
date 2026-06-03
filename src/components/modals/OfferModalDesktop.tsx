import { OfferModal } from "@/components/modals/OfferModal";

interface OfferModalDesktopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artId?: string;
  onTopUpClick?: () => void;
}

export function OfferModalDesktop({ open, onOpenChange, artId }: OfferModalDesktopProps) {
  return <OfferModal open={open} onOpenChange={onOpenChange} artId={artId} />;
}
