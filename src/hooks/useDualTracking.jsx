import { useState, useRef, useEffect } from "react";
const getNorthAngle = () => {
  const value = localStorage.getItem('northAngle');
  return value ? Number(value) : 0;
};

// Helper: compute new position in meters based on heading and distance
function moveLatLng({ latitude, longitude }, headingDeg, distanceMeters) {
  const R = 6378137;
  const dRad = headingDeg * Math.PI / 180;
  const newLat = latitude + (distanceMeters * Math.cos(dRad)) / R * (180 / Math.PI);
  const newLng = longitude +
    (distanceMeters * Math.sin(dRad)) /
    (R * Math.cos(latitude * Math.PI / 180)) *
    (180 / Math.PI);
  return { latitude: newLat, longitude: newLng };
}

// key for localStorage
const DR_OFFSET_KEY = "dr_heading_offset";

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);
  const [offset, setOffset] = useState(() => {
    const saved = localStorage.getItem(DR_OFFSET_KEY);
    return saved ? Number(saved) : 0;
  });

  const lastDrRef = useRef(null);
  const lastGpsRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const headingRef = useRef(0);

  // Listen to device orientation
  useEffect(() => {
    const handleOrientation = (event) => {
      if (typeof event.alpha === "number") headingRef.current = event.alpha;
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  useEffect(() => {
    if (!tracking) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;
        lastGpsRef.current = { latitude, longitude, timestamp };

        let dr = lastDrRef.current;
        if (!dr) {
          dr = { latitude, longitude, timestamp };
        } else if (lastTimestampRef.current) {
          const dt = (timestamp - lastTimestampRef.current) / 1000; // seconds
          const usedSpeed =
            typeof speed === "number" && speed > 0 ? speed : 1;
          const moved = usedSpeed * dt; // meters

          // حرفه‌ای: از offset ثبت‌شده توسط کاربر استفاده کن
          // دقت کن: ابتدا heading را معکوس می‌کنی (360-alpha) بعد offset را کم می‌کنی
          // const correctedHeading = (360 - headingRef.current - offset + 360) % 360;
          const northAngle = getNorthAngle();
          const correctedHeading = (360 - headingRef.current - (northAngle || offset) + 360) % 360;
          dr = moveLatLng(dr, correctedHeading, moved);
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
      (error) => { /* Handle error */ },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
      lastDrRef.current = null;
      lastGpsRef.current = null;
      lastTimestampRef.current = null;
    };
  }, [tracking, offset]);

  // تابع کالیبراسیون (set offset)
  const calibrateHeadingOffset = () => {
    // فرض: کاربر الان رو به شمال است!
    const newOffset = headingRef.current;
    setOffset(newOffset);
    localStorage.setItem(DR_OFFSET_KEY, String(newOffset));
    alert(`کالیبراسیون انجام شد!\nOffset: ${Math.round(newOffset)}°`);
  };

  const start = () => {
    setPoints([]);
    setTracking(true);
    lastDrRef.current = null;
    lastGpsRef.current = null;
    lastTimestampRef.current = null;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;
        lastGpsRef.current = { latitude, longitude, timestamp };
        lastDrRef.current = { latitude, longitude, timestamp };
        lastTimestampRef.current = timestamp;
        setPoints([{
          gps: { latitude, longitude, accuracy, speed, heading, timestamp },
          dr: { latitude, longitude, timestamp }
        }]);
      },
      (err) => console.warn("Initial GPS fetch failed:", err),
      { enableHighAccuracy: true }
    );
  };
  const stop = () => {
    setTracking(false);
  };

  return { tracking, points, start, stop, calibrateHeadingOffset, offset };
}
