import { useState, useRef, useEffect } from "react";

// Helper: compute new position in meters based on heading and distance
function moveLatLng({ latitude, longitude }, headingDeg, distanceMeters) {
  const R = 6378137; // Earth radius in meters
  const dRad = headingDeg * (Math.PI / 180);
  const newLat = latitude(distanceMeters * Math.cos(dRad)) / R * (180 / Math.PI);
  const newLng =
    longitude
      (distanceMeters * Math.sin(dRad)) /
    (R * Math.cos(latitude * Math.PI / 180)) *
    (180 / Math.PI);
  return { latitude: newLat, longitude: newLng };
}

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]); // [{ gps: {...}, dr: {...} }]
  const lastDrRef = useRef(null);
  const lastGpsRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const headingRef = useRef(0);

  useEffect(() => {
    const handleOrientation = (event) => {
      if (typeof event.alpha === "number") headingRef.current = event.alpha;
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  useEffect(() => {
    if (!tracking) return;

    // Start dual logging
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;

        // Store current GPS as last known
        lastGpsRef.current = { latitude, longitude, timestamp };

        // Dead reckoning estimate:
        let dr = lastDrRef.current;
        if (!dr) {
          dr = { latitude, longitude, timestamp };
        } else if (lastTimestampRef.current) {
          const dt = (timestamp - lastTimestampRef.current) / 1000; // seconds
          const usedSpeed =
            typeof speed === "number" && speed > 0
              ? speed
              : 1; // default to 1 m/s if not available
          const moved = usedSpeed * dt; // meters
          // dr = moveLatLng(dr, headingRef.current, moved);
          const invertedHeading = (360 - headingRef.current) % 360;
          dr = moveLatLng(dr, invertedHeading, moved);

          // const gpsHeading =
          //   typeof heading === "number" && !isNaN(heading) ? heading : null;
          // const finalHeading = gpsHeading !== null ? gpsHeading : deviceHeading;
          // dr = moveLatLng(dr, finalHeading, moved);
        }

        lastDrRef.current = dr;
        lastTimestampRef.current = timestamp;

        setPoints((pts) => [
          ...pts,
          {
            gps: { latitude, longitude, accuracy, speed, heading, timestamp },
            dr: { latitude: dr.latitude, longitude: dr.longitude, timestamp },
          },
        ]);
      },
      (error) => {
        // Optionally log an error point
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
      lastDrRef.current = null;
      lastGpsRef.current = null;
      lastTimestampRef.current = null;
    };
  }, [tracking]);

  // Control methods
  const start = () => {
    setPoints([]);
    setTracking(true);
    lastDrRef.current = null;
    lastGpsRef.current = null;
    lastTimestampRef.current = null;
  };
  const stop = () => {
    setTracking(false);
  };

  return { tracking, points, start, stop };
}
