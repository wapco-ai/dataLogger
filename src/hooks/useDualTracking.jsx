
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

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);

  const lastDrRef = useRef(null);
  const lastGpsRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const headingRef = useRef(0);
  const headingHistoryRef = useRef([]);

  // ⚙️ تنظیمات سرعت ثابت (بدون وابستگی به GPS)
  const [movementType, setMovementType] = useState('default');
  
  const FIXED_SPEED_SETTINGS = {
    walking: 1.4,      // 1.4 m/s = 5.04 km/h
    running: 3.0,      // 3.0 m/s = 10.8 km/h  
    cycling: 5.0,      // 5.0 m/s = 18 km/h
    driving: 8.3,      // 8.3 m/s = 30 km/h
    default: 1.2       // 1.2 m/s = 4.32 km/h
  };

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
        
        // ✅ تعریف متغیرها در scope اصلی
        let usedSpeed = 0;
        let correctedHeading = headingRef.current;
        let moved = 0;
        
        if (!dr) {
          // نقطه شروع - موقعیت اولیه
          dr = { latitude, longitude, timestamp };
        } else if (lastTimestampRef.current) {
          const dt = (timestamp - lastTimestampRef.current) / 1000; // ثانیه
          
          // ✅ استفاده از سرعت ثابت (بدون تاثیر GPS speed)
          usedSpeed = FIXED_SPEED_SETTINGS[movementType] || FIXED_SPEED_SETTINGS.default;
          
          console.log(`🚶 سرعت ثابت: ${usedSpeed} m/s (${(usedSpeed * 3.6).toFixed(1)} km/h), نوع: ${movementType}`);
          
          moved = usedSpeed * dt; // متر

          // 🔧 محاسبه صحیح جهت تصحیح‌شده
          const northAngle = getNorthAngle();
          
          if (northAngle !== null) {
            // ✅ فرمول صحیح برای تصحیح جهت (همسو با NorthAngleArrow)
            correctedHeading = (northAngle - headingRef.current + 360) % 360;
          }
          
          // ✅ حرکت مداوم (حتی برای مسافت‌های کوچک)
          if (moved > 0.01) { // حداقل 1 سانتی‌متر
            dr = moveLatLng(dr, correctedHeading, moved);
            console.log(`📍 حرکت: ${moved.toFixed(3)}m در جهت ${correctedHeading.toFixed(1)}°`);
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
              speed, // GPS speed را برای مقایسه نگه می‌داریم
              heading, 
              timestamp 
            },
            dr: { 
              latitude: dr.latitude, 
              longitude: dr.longitude, 
              timestamp,
              // ✅ اضافه کردن metadata برای debug
              usedSpeed: usedSpeed,
              movementType: movementType,
              correctedHeading: correctedHeading,
              rawHeading: headingRef.current,
              moved: moved
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
  }, [tracking, movementType]); // ✅ اضافه کردن movementType به dependencies

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
          dr: { 
            latitude, 
            longitude, 
            timestamp,
            usedSpeed: 0,
            movementType: movementType,
            correctedHeading: headingRef.current,
            rawHeading: headingRef.current,
            moved: 0
          }
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

  // ✅ توابع جدید برای کنترل سرعت
  const setMovementSpeed = (type) => {
    if (FIXED_SPEED_SETTINGS[type]) {
      setMovementType(type);
      console.log(`🎯 نوع حرکت تغییر کرد: ${type} (${FIXED_SPEED_SETTINGS[type]} m/s = ${(FIXED_SPEED_SETTINGS[type] * 3.6).toFixed(1)} km/h)`);
    } else {
      console.warn(`❌ نوع حرکت نامعتبر: ${type}`);
    }
  };

  const getCurrentSpeed = () => {
    return FIXED_SPEED_SETTINGS[movementType] || FIXED_SPEED_SETTINGS.default;
  };

  const getAvailableSpeeds = () => {
    return Object.keys(FIXED_SPEED_SETTINGS).map(key => ({
      key,
      speed: FIXED_SPEED_SETTINGS[key],
      kmh: (FIXED_SPEED_SETTINGS[key] * 3.6).toFixed(1),
      label: {
        walking: 'پیاده‌روی',
        running: 'دویدن', 
        cycling: 'دوچرخه‌سواری',
        driving: 'رانندگی',
        default: 'پیش‌فرض'
      }[key] || key
    }));
  };

  // ✅ تابع برای دریافت جهت کالیبره‌شده
  const getCalibratedHeading = () => {
    const northAngle = getNorthAngle();
    if (northAngle !== null) {
      return (northAngle - headingRef.current + 360) % 360;
    }
    return headingRef.current;
  };

  // ✅ دریافت آخرین DR heading
  const getDrHeading = () => {
    if (points.length > 0) {
      return points[points.length - 1]?.dr?.correctedHeading || 0;
    }
    return getCalibratedHeading();
  };

  // ✅ محاسبه جهت حرکت GPS
  const getMovementDirection = () => {
    if (points.length < 2) return 0;
    
    const current = points[points.length - 1]?.gps;
    const previous = points[points.length - 2]?.gps;
    
    if (!current || !previous) return 0;
    
    const dLat = current.latitude - previous.latitude;
    const dLng = current.longitude - previous.longitude;
    
    if (dLat === 0 && dLng === 0) return 0;
    
    let bearing = Math.atan2(dLng, dLat) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  return {
    tracking,
    points,
    start,
    stop,
    calibrateHeadingOffset,
    offset: getOffset(),
    // ✅ توابع کنترل سرعت
    movementType,
    setMovementSpeed,
    getCurrentSpeed,
    getAvailableSpeeds,
    fixedSpeedSettings: FIXED_SPEED_SETTINGS,
    // ✅ توابع جهت‌یابی
    getCalibratedHeading,
    getDrHeading,
    getMovementDirection,
    currentHeading: headingRef.current
  };
}

export { moveLatLng };
