"use client";

import { useCallback, useState } from "react";
import LoadingScreen from "@/components/loading-screen";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [showSite, setShowSite] = useState(false);

  const handleComplete = useCallback(() => {
    setLoading(false);

    setTimeout(() => {
      setShowSite(true);
    }, 700);
  }, []);

  return (
    <>
      {loading && <LoadingScreen onComplete={handleComplete} />}

      {showSite && (
        <div className="animate-in fade-in duration-700">{children}</div>
      )}
    </>
  );
}
