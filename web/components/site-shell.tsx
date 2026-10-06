"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";

const LOADING_SEEN_KEY = "anas-loading-seen";

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [showSite, setShowSite] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(LOADING_SEEN_KEY);

    if (alreadySeen === "true") {
      setLoading(false);
      setShowSite(true);
    }
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem(LOADING_SEEN_KEY, "true");

    setLoading(false);

    setTimeout(() => {
      setShowSite(true);
    }, 700);
  }, []);

  return (
    <>
      {loading && <LoadingScreen onComplete={handleComplete} />}

      {showSite && (
        <div className="animate-in fade-in duration-700">
          {children}
        </div>
      )}
    </>
  );
}