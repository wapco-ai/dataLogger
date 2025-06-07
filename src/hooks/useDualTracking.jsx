
import { useState, useRef, useEffect } from "react";

// Helper: محاسبه موقعیت جدید بر اساس جهت و فاصله (متر)
function moveLatLng({ latitude, longitude }, headingDeg, distanceMeters) {
  const R = 6378137; // شعاع زمین به متر
  
  const bearingRad = headingDeg * Math.PI / 180;
  
  const deltaLat = (distanceMeters * Math.cos(bearingRad)) / R;
  const deltaLng = (distanceMeters * Math.sin(bearingRad)) / 
                   (R * Math.cos(latitude * Math.PI / 180));
  
  return {
    latitude: latitude + deltaLat * (180 / Math.PI),
    longitude: longitude + deltaLng * (180 / Math.PI)
  };
}

// 🔥 تشخیص حرکت واقعی از GPS - اولویت اول  
function detectGPSMovement(currentPos, lastPos, timeInterval) {
  if (!lastPos || !currentPos || timeInterval <= 0) {
    return { 
      isMoving: false, 
      speed: 0, 
      distance: 0, 
      accuracy: 999, 
      hasGoodAccuracy: false 
    };
  }
  
  // محاسبه فاصله Haversine
  const R = 6371000; // شعاع زمین به متر
  const dLat = (currentPos.latitude - lastPos.latitude) * Math.PI / 180;
  const dLng = (currentPos.longitude - lastPos.longitude) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lastPos.latitude * Math.PI / 180) * 
            Math.cos(currentPos.latitude * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const speed = distance / timeInterval; // m/s
  
  // آستانه‌های واقع‌بینانه
  const SPEED_THRESHOLD = 0.5; // m/s = 1.8 km/h
  const DISTANCE_THRESHOLD = 2; // متر - برای فیلتر نویز GPS
  const ACCURACY_THRESHOLD = 15; // متر - فقط GPS با دقت خوب
  
  // بررسی دقت GPS
  const hasGoodAccuracy = (!currentPos.accuracy || currentPos.accuracy <= ACCURACY_THRESHOLD);
  
  const isMoving = hasGoodAccuracy && 
                   speed > SPEED_THRESHOLD && 
                   distance > DISTANCE_THRESHOLD;
  
  return { 
    isMoving, 
    speed: isMoving ? speed : 0,
    distance,
    accuracy: currentPos.accuracy || 999,
    hasGoodAccuracy
  };
}

// 🔥 تشخیص حرکت از motion sensors - فقط پشتیبان
function detectSensorMovement(acceleration, rotationRate) {
  // مقادیر پیش‌فرض
  const defaultResult = { 
    isMoving: false, 
    confidence: 0, 
    acceleration: 0, 
    rotation: 0 
  };
  
  if (!acceleration) {
    return defaultResult;
  }
  
  // محاسبه شتاب کل
  const totalAccel = Math.sqrt(
    (acceleration.x || 0) * (acceleration.x || 0) +
    (acceleration.y || 0) * (acceleration.y || 0) +
    (acceleration.z || 0) * (acceleration.z || 0)
  );
  
  // حذف گرانش زمین
  const gravity = 9.81;
  const netAccel = Math.abs(totalAccel - gravity);
  
  // محاسبه چرخش کل
  let totalRotation = 0;
  if (rotationRate) {
    totalRotation = Math.sqrt(
      (rotationRate.alpha || 0) * (rotationRate.alpha || 0) +
      (rotationRate.beta || 0) * (rotationRate.beta || 0) +
      (rotationRate.gamma || 0) * (rotationRate.gamma || 0)
    );
  }
  
  // آستانه‌های سخت‌گیرانه برای sensors
  const ACCEL_THRESHOLD = 1.5; // m/s² - افزایش آستانه
  const ROTATION_THRESHOLD = 10; // deg/s - افزایش آستانه
  
  const isMovingByAccel = netAccel > ACCEL_THRESHOLD;
  const isMovingByRotation = totalRotation > ROTATION_THRESHOLD;
  
  const confidence = Math.min(
    (netAccel / ACCEL_THRESHOLD + totalRotation / ROTATION_THRESHOLD) / 2, 
    1
  );
  
  return {
    isMoving: isMovingByAccel || isMovingByRotation,
    confidence,
    acceleration: netAccel, // ✅ همیشه مقدار دارد
    rotation: totalRotation
  };
}

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);
  const [waitingForAccuracy, setWaitingForAccuracy] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(999);

  const lastDrRef = useRef(null);
  const lastGpsRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const headingRef = useRef(0);
  const isInitializedRef = useRef(false); // 🔥 پرچم اولیه‌سازی
  
  // 🔥 متغیرهای تشخیص حرکت
  const accelerationRef = useRef(null);
  const rotationRateRef = useRef(null);
  const movementHistoryRef = useRef([]);
  const currentSpeedRef = useRef(0);
  const isMovingRef = useRef(false);

  // آستانه دقت GPS برای شروع ردیابی
  const REQUIRED_ACCURACY = 800; // متر

  // Listen to device orientation (برای جهت)
  useEffect(() => {
    const handleOrientation = (event) => {
      if (typeof event.alpha === "number") {
        headingRef.current = event.alpha;
      }
    };
    
    // درخواست مجوز orientation در iOS
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener("deviceorientation", handleOrientation, true);
        }
      }).catch(console.warn);
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }
    
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  // Listen to device motion (برای تشخیص حرکت)
  useEffect(() => {
    const handleMotion = (event) => {
      accelerationRef.current = event.accelerationIncludingGravity;
      rotationRateRef.current = event.rotationRate;
    };
    
    // درخواست مجوز motion در iOS
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(permissionState => {
        if (permissionState === 'granted') {
          window.addEventListener("devicemotion", handleMotion, true);
        }
      }).catch(console.warn);
    } else {
      window.addEventListener("devicemotion", handleMotion, true);
    }
    
    return () => window.removeEventListener("devicemotion", handleMotion, true);
  }, []);

  useEffect(() => {
    if (!tracking) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;
        
        const currentGps = { latitude, longitude, timestamp, accuracy, speed };
        
        // 🔥 آپدیت دقت فعلی
        setCurrentAccuracy(accuracy || 999);
        
        // 🔥 بررسی اینکه آیا دقت کافی داریم یا نه
        if (!isInitializedRef.current) {
          if (!accuracy || accuracy > REQUIRED_ACCURACY) {
            console.log(`⏳ انتظار دقت GPS... فعلی: ${accuracy?.toFixed(1) || 'نامشخص'}m (نیاز: ${REQUIRED_ACCURACY}m)`);
            setWaitingForAccuracy(true);
            return; // خروج و انتظار دقت بهتر
          } else {
            // دقت کافی رسید - اولیه‌سازی
            console.log(`✅ دقت GPS کافی رسید: ${accuracy.toFixed(1)}m`);
            console.log(`🎯 تنظیم نقطه مرجع: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            
            lastDrRef.current = { latitude, longitude, timestamp };
            lastGpsRef.current = { latitude, longitude, timestamp, accuracy, speed };
            lastTimestampRef.current = timestamp;
            isInitializedRef.current = true;
            setWaitingForAccuracy(false);
            
            // اضافه کردن نقطه اولیه
            setPoints([{
              gps: { latitude, longitude, accuracy, speed, heading, timestamp },
              dr: { 
                latitude, 
                longitude, 
                timestamp,
                calculatedSpeed: 0,
                finalSpeed: 0,
                isMoving: false,
                movementMethod: "Initial Reference Point",
                moved: 0,
                heading: headingRef.current,
                gpsMovement: { isMoving: false, speed: 0, distance: 0, accuracy, hasGoodAccuracy: true },
                sensorMovement: { isMoving: false, confidence: 0, acceleration: 0, rotation: 0 },
                movementHistory: []
              }
            }]);
            
            console.log(`🚀 ردیابی شروع شد با نقطه مرجع دقیق`);
            return;
          }
        }
        
        // 🔥 ادامه ردیابی عادی (فقط اگر اولیه‌سازی شده باشد)
        let dr = lastDrRef.current;
        let calculatedSpeed = 0;
        let moved = 0;
        let isMoving = false;
        let movementMethod = "none";
        let gpsMovement = { isMoving: false, speed: 0, distance: 0 };
        let sensorMovement = { isMoving: false, confidence: 0 };
        
        if (lastTimestampRef.current && lastGpsRef.current) {
          const dt = (timestamp - lastTimestampRef.current) / 1000; // ثانیه
          
          // 🔥 اولویت 1: تشخیص حرکت از GPS
          gpsMovement = detectGPSMovement(currentGps, lastGpsRef.current, dt);
          
          // 🔥 اولویت 2: تشخیص حرکت از sensors (فقط اگر GPS مشکل دارد)
          sensorMovement = detectSensorMovement(
            accelerationRef.current, 
            rotationRateRef.current
          );
          
          // 🔥 تصمیم‌گیری نهایی
          if (gpsMovement.hasGoodAccuracy) {
            // GPS دقت خوب دارد - فقط از GPS استفاده کن
            isMoving = gpsMovement.isMoving;
            calculatedSpeed = gpsMovement.speed;
            movementMethod = `GPS (${gpsMovement.accuracy}m)`;
          } else if (sensorMovement.isMoving && sensorMovement.confidence > 0.8) {
            // GPS دقت ضعیف دارد - از sensors استفاده کن
            isMoving = true;
            calculatedSpeed = Math.min(sensorMovement.acceleration * 0.3, 1.5); // محافظه‌کارانه
            movementMethod = `Sensors (${sensorMovement.confidence.toFixed(2)})`;
          } else {
            // هیچ‌کدام قانع‌کننده نیستند
            isMoving = false;
            calculatedSpeed = 0;
            movementMethod = "Stationary";
          }
          
          // 🔥 فیلتر تاریخچه - باید 3 از 5 نمونه آخر موافق باشند
          movementHistoryRef.current.push(isMoving);
          if (movementHistoryRef.current.length > 5) {
            movementHistoryRef.current.shift();
          }
          
          const movingCount = movementHistoryRef.current.filter(Boolean).length;
          const finalIsMoving = movingCount >= 3; // 3 از 5 نمونه
          
          currentSpeedRef.current = finalIsMoving ? calculatedSpeed : 0;
          isMovingRef.current = finalIsMoving;
          
          // 🔥 لاگ دیباگ
          console.log(`🔍 تشخیص حرکت:`);
          console.log(`  GPS: ${gpsMovement.isMoving ? '✅' : '❌'} (${gpsMovement.speed.toFixed(2)} m/s, ${gpsMovement.distance.toFixed(1)}m, دقت: ${gpsMovement.accuracy}m)`);
          console.log(`  Sensors: ${sensorMovement.isMoving ? '✅' : '❌'} (اعتماد: ${sensorMovement.confidence.toFixed(2)}, شتاب: ${sensorMovement.acceleration.toFixed(2)})`);
          console.log(`  تاریخچه: [${movementHistoryRef.current.map(m => m ? '1' : '0').join(',')}] (${movingCount}/5)`);
          console.log(`  نهایی: ${finalIsMoving ? '🏃 در حرکت' : '⏸️ ثابت'} - ${movementMethod}`);
          console.log(`  سرعت نهایی: ${currentSpeedRef.current.toFixed(3)} m/s`);
          console.log(`---`);
          
          moved = currentSpeedRef.current * dt;
          
          // 🔥 حرکت فقط اگر واقعاً در حال حرکت باشد
          if (finalIsMoving && moved > 0.01) { // حداقل 1 سانتی‌متر
            // محاسبه جهت بدون تصحیح GPS
            let pureHeading = headingRef.current;
            const northAngle = localStorage.getItem('northAngle');
            if (northAngle && Number(northAngle) !== 0) {
              pureHeading = (Number(northAngle) - headingRef.current + 360) % 360;
            }
            
            dr = moveLatLng(dr, pureHeading, moved);
            console.log(`📍 حرکت DR: ${moved.toFixed(4)}m در جهت ${pureHeading.toFixed(1)}°`);
          } else {
            console.log(`⏸️ DR ثابت - حرکت: ${moved.toFixed(4)}m`);
          }
        }
        
        lastDrRef.current = dr;
        lastGpsRef.current = currentGps;
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
              timestamp,
              // metadata کامل
              calculatedSpeed: calculatedSpeed,
              finalSpeed: currentSpeedRef.current,
              isMoving: isMovingRef.current,
              movementMethod: movementMethod,
              moved: moved,
              heading: headingRef.current,
              gpsMovement: gpsMovement,
              sensorMovement: sensorMovement,
              movementHistory: [...movementHistoryRef.current]
            },
          },
        ]);
      },
      (error) => {
        console.warn("GPS Error:", error);
        setWaitingForAccuracy(false);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 1000, // کاهش maximumAge برای داده‌های تازه‌تر
        timeout: 10000 
      }
    );
    
    return () => {
      navigator.geolocation.clearWatch(watchId);
      // پاک کردن تمام ref ها
      lastDrRef.current = null;
      lastGpsRef.current = null;
      lastTimestampRef.current = null;
      movementHistoryRef.current = [];
      currentSpeedRef.current = 0;
      isMovingRef.current = false;
      isInitializedRef.current = false;
    };
  }, [tracking]);

  const start = () => {
    setPoints([]);
    setTracking(true);
    setWaitingForAccuracy(true);
    setCurrentAccuracy(999);
    
    // ریست کردن تمام متغیرها
    lastDrRef.current = null;
    lastGpsRef.current = null;
    lastTimestampRef.current = null;
    movementHistoryRef.current = [];
    currentSpeedRef.current = 0;
    isMovingRef.current = false;
    isInitializedRef.current = false; // 🔥 ریست پرچم اولیه‌سازی
    
    console.log("🚀 شروع ردیابی - انتظار دقت GPS...");
    console.log(`📋 آستانه‌ها:`);
    console.log(`  GPS ضروری: دقت < ${REQUIRED_ACCURACY}m`);
    console.log(`  GPS حرکت: سرعت > 0.5 m/s, فاصله > 2m, دقت < 15m`);
    console.log(`  Sensors: شتاب > 1.5 m/s², چرخش > 10 deg/s`);
    console.log(`  فیلتر: 3 از 5 نمونه آخر موافق`);
  };
  
  const stop = () => {
    setTracking(false);
    setWaitingForAccuracy(false);
    isInitializedRef.current = false;
    console.log("🛑 توقف ردیابی");
  };

  // کالیبراسیون دستی
  const calibrateHeadingOffset = () => {
    const currentHeading = headingRef.current;
    if (currentHeading !== null && currentHeading !== undefined) {
      localStorage.setItem('northAngle', currentHeading.toString());
      window.dispatchEvent(new Event('storage'));
      console.log(`🧭 کالیبراسیون: ${currentHeading.toFixed(1)}°`);
      return currentHeading;
    }
    return 0;
  };

  // API جدید
  const getCurrentStatus = () => {
    return {
      isMoving: isMovingRef.current,
      speed: currentSpeedRef.current,
      speedKmh: (currentSpeedRef.current * 3.6).toFixed(1),
      heading: headingRef.current,
      movementHistory: [...movementHistoryRef.current],
      waitingForAccuracy,
      currentAccuracy,
      isInitialized: isInitializedRef.current
    };
  };

  const getOffset = () => {
    const northAngle = localStorage.getItem('northAngle');
    return (northAngle && Number(northAngle) !== 0) ? Number(northAngle) : 0;
  };

  return {
    tracking,
    points,
    start,
    stop,
    calibrateHeadingOffset,
    offset: getOffset(),
    // API جدید
    getCurrentStatus,
    currentSpeed: currentSpeedRef.current,
    currentHeading: headingRef.current,
    isMoving: isMovingRef.current,
    // 🔥 state های جدید
    waitingForAccuracy,
    currentAccuracy,
    isInitialized: isInitializedRef.current,
    requiredAccuracy: REQUIRED_ACCURACY
  };
}

export { moveLatLng };
