// src/hooks/usePwaUpdate.js
import { useEffect, useRef, useState } from "react";

export function usePwaUpdate() {
  const waitingWorker = useRef(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    let mounted = true;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingWorker.current = newWorker;
              if (mounted) setHasUpdate(true);
            }
          });
        });
      });
    }
    return () => { mounted = false; };
  }, []);

  const updateApp = () => {
    if (waitingWorker.current) {
      waitingWorker.current.postMessage({ type: "SKIP_WAITING" });
    }
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  }, []);

  return { hasUpdate, updateApp };
}
