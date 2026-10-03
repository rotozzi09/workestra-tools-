import React, { useState, useEffect } from "react";
import { WifiOff, CloudOff } from "lucide-react";

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/90 text-white px-3.5 py-2 text-xs font-mono font-semibold shadow-lg backdrop-blur-xs border border-amber-400/30 animate-in fade-in slide-in-from-bottom-2">
      <span className="size-2 rounded-full bg-white animate-ping" />
      <WifiOff className="size-3.5" />
      <span>Modo Offline — Workestra Tools carregado do cache</span>
    </div>
  );
};
