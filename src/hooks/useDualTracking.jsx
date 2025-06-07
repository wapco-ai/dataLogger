
import { useState, useRef, useEffect } from "react";

// تابع برای خواندن northAngle - فقط اگر صریحاً ست شده باشه
const getNorthAngle = () => {
  const value = localStorage.getItem('northAngle');
  // ✅ فقط اگر مقدار معتبر باشه و نه صفر
  return (value && Number(value) !== 0) ? Number(value) : null;
};

// Helper: محاسبه موقعیت جدید بر اساس جهت و فاصله (متر)
function moveLatLng({ latitude, longitude }, headingDeg, distanceMeters) {
  const R = 6378137; // شعاع زمین به متر
  
  // تبدیل جهت به رادیان (0° = شمال، 90° = شرق)
  const bearingRad = headingDeg * Math.PI / 180;
  
  // محاسبه موقعیت جدید با در نظر گیری کرویت زمین
  const deltaLat = (distanceMeters * Math.cos(bearingRad)) / R;
  const deltaLng = (distanceMeters * Math.sin(bearingRad)) / 
                   (R * Math.cos(latitude * Math.PI / 180));
  
  return {
    latitude: latitude + deltaLat * (180 / Math.PI),
    longitude: longitude + deltaLng * (180 / Math.PI)
  };
}

// فیلتر میانگین‌گیری برای کاهش نویز سنسور
function smoothValue(newValue, history, maxHistory = 5) {
  history.push(newValue);
  if (history.length > maxHistory) history.shift();
  return history.reduce((sum, val) => sum + val, 0) / history.length;
}

// تشخیص حالت حرکت
function detectMovementMode(speed) {
  if (speed < 0.3) return 'stationary';
  if (speed < 2) return 'walking';
  if (speed < 8) return 'running';
  return 'vehicle';
}

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);

  const lastDrRef = useRef(null);
  const lastGpsRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const headingRef = useRef(0);
  const headingHistoryRef = useRef([]);

  // Listen to device orientation
  useEffect(() => {
    const handleOrientation = (event) => {
      if (typeof event.alpha === "number") {
        // فیلتر نویز سنسور
        const smoothedHeading = smoothValue(
          event.alpha, 
          headingHistoryRef.current, 
          3
        );
        headingRef.current = smoothedHeading;
      }
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
        
        // ذخیره آخرین موقعیت GPS
        lastGpsRef.current = { latitude, longitude, timestamp };

        let dr = lastDrRef.current;
        
        if (!dr) {
          // نقطه شروع - موقعیت اولیه
          dr = { latitude, longitude, timestamp };
        } else if (lastTimestampRef.current) {
          const dt = (timestamp - lastTimestampRef.current) / 1000; // ثانیه
          
          // استفاده از سرعت GPS یا سرعت پیش‌فرض
          let usedSpeed = typeof speed === "number" && speed > 0 ? speed : 0.8;
          const movementMode = detectMovementMode(usedSpeed);
          
          // تنظیم سرعت بر اساس حالت حرکت
          if (movementMode === 'stationary') {
            usedSpeed = 0;
          }
          
          const moved = usedSpeed * dt; // متر

          // 🔧 محاسبه صحیح جهت تصحیح‌شده
          const northAngle = getNorthAngle();
          let correctedHeading = headingRef.current;
          
          if (northAngle !== null) {
            // ✅ فرمول صحیح برای تصحیح جهت
            correctedHeading = (headingRef.current - northAngle + 360) % 360;
          }
          
          // ✅ حرکت حتی برای مسافت‌های کوچک‌تر
          if (moved > 0.05) { // حداقل 5 سانتی‌متر
            dr = moveLatLng(dr, correctedHeading, moved);
          }
        }
        
        lastDrRef.current = dr;
        lastTimestampRef.current = timestamp;
        
        // اضافه کردن نقطه جدید
        setPoints((pts) => [
          ...pts,
          {
            gps: { 
              latitude, 
              longitude, 
              accuracy, 
              speed, 
              heading, 
              timestamp 
            },
            dr: { 
              latitude: dr.latitude, 
              longitude: dr.longitude, 
              timestamp 
            },
          },
        ]);
      },
      (error) => {
        console.warn("GPS Error:", error);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
        timeout: 15000 
      }
    );
    
    return () => {
      navigator.geolocation.clearWatch(watchId);
      lastDrRef.current = null;
      lastGpsRef.current = null;
      lastTimestampRef.current = null;
      headingHistoryRef.current = [];
    };
  }, [tracking]);

  const start = () => {
    setPoints([]);
    setTracking(true);
    lastDrRef.current = null;
    lastGpsRef.current = null;
    lastTimestampRef.current = null;
    headingHistoryRef.current = [];
    
    // دریافت موقعیت اولیه
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

  // ✅ تابع کالیبراسیون دستی - ذخیره مقدار معتبر
  const calibrateHeadingOffset = () => {
    const currentHeading = headingRef.current;
    if (currentHeading !== null && currentHeading !== undefined) {
      localStorage.setItem('northAngle', currentHeading.toString());
      // ✅ فورس update برای نمایش
      window.dispatchEvent(new Event('storage'));
      return currentHeading;
    }
    return 0;
  };

  // دریافت افست فعلی
  const getOffset = () => {
    const northAngle = getNorthAngle();
    return northAngle || 0;
  };

  return { 
    tracking, 
    points, 
    start, 
    stop, 
    calibrateHeadingOffset,
    offset: getOffset()
  };
}
