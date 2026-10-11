import type { ReactNode } from "react";
import { Button as ShadcnButton } from "@/components/ui/button";

interface ButtonProps {
  children: ReactNode;
}

export function Button({ children }: ButtonProps) {
  return (
    <ShadcnButton
      className="retro rounded-none border-2 border-foreground font-bold shadow-[4px_4px_0px_0px_currentColor] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_currentColor]"
    >
      {children}
    </ShadcnButton>
  );
}