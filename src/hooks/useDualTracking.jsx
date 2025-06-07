
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

// 🔥 تشخیص حرکت کاملاً مستقل از GPS - فقط از سنسورهای داخلی
function detectMovementFromSensors(acceleration, rotationRate, stepCount, previousStepCount, timeInterval) {
  // ترکیب چند روش برای تشخیص دقیق‌تر حرکت
  
  // 1. تشخیص از شتاب‌سنج
  let accelerationMovement = { isMoving: false, confidence: 0, value: 0 };
  if (acceleration) {
    const totalAccel = Math.sqrt(
      (acceleration.x || 0) ** 2 +
      (acceleration.y || 0) ** 2 +
      (acceleration.z || 0) ** 2
    );
    
    const gravity = 9.81;
    const netAccel = Math.abs(totalAccel - gravity);
    
    // آستانه‌های واقع‌بینانه برای حرکت انسان
    const ACCEL_WALK_THRESHOLD = 0.8;   // پیاده‌روی آهسته
    const ACCEL_FAST_THRESHOLD = 2.5;   // دویدن
    
    if (netAccel > ACCEL_WALK_THRESHOLD) {
      accelerationMovement = {
        isMoving: true,
        confidence: Math.min(netAccel / ACCEL_FAST_THRESHOLD, 1),
        value: netAccel
      };
    }
  }
  
  // 2. تشخیص از ژیروسکوپ (چرخش)
  let rotationMovement = { isMoving: false, confidence: 0, value: 0 };
  if (rotationRate) {
    const totalRotation = Math.sqrt(
      (rotationRate.alpha || 0) ** 2 +
      (rotationRate.beta || 0) ** 2 +
      (rotationRate.gamma || 0) ** 2
    );
    
    const ROTATION_THRESHOLD = 5; // درجه بر ثانیه
    
    if (totalRotation > ROTATION_THRESHOLD) {
      rotationMovement = {
        isMoving: true,
        confidence: Math.min(totalRotation / (ROTATION_THRESHOLD * 4), 1),
        value: totalRotation
      };
    }
  }
  
  // 3. تشخیص از گام‌شمار
  let stepMovement = { isMoving: false, confidence: 0, steps: 0 };
  if (stepCount !== null && previousStepCount !== null && timeInterval > 0) {
    const newSteps = stepCount - previousStepCount;
    const stepsPerSecond = newSteps / timeInterval;
    
    if (newSteps > 0 && stepsPerSecond > 0.3) { // حداقل یک گام در 3 ثانیه
      stepMovement = {
        isMoving: true,
        confidence: Math.min(stepsPerSecond / 2, 1), // 2 گام در ثانیه = اعتماد کامل
        steps: newSteps
      };
    }
  }
  
  // ترکیب نتایج با وزن‌دهی
  const combinedConfidence = (
    accelerationMovement.confidence * 0.4 +
    rotationMovement.confidence * 0.3 +
    stepMovement.confidence * 0.3
  );
  
  const isMoving = combinedConfidence > 0.3; // آستانه نهایی
  
  // محاسبه سرعت تخمینی بر اساس سنسورها
  let estimatedSpeed = 0;
  if (isMoving) {
    if (stepMovement.isMoving) {
      // سرعت بر اساس گام: حدوداً 0.7 متر بر گام، متوسط انسان
      const avgStepLength = 0.7; // متر
      estimatedSpeed = stepMovement.steps * avgStepLength / timeInterval;
    } else if (accelerationMovement.isMoving) {
      // سرعت بر اساس شتاب (تخمینی)
      estimatedSpeed = Math.min(accelerationMovement.value * 0.5, 3.0);
    } else {
      // سرعت پیش‌فرض برای حرکت‌های کند
      estimatedSpeed = 1.0;
    }
    
    // محدود کردن سرعت به محدوده منطقی انسان (0.5 تا 6 متر بر ثانیه)
    estimatedSpeed = Math.max(0.5, Math.min(estimatedSpeed, 6.0));
  }
  
  return {
    isMoving,
    confidence: combinedConfidence,
    estimatedSpeed,
    details: {
      acceleration: accelerationMovement,
      rotation: rotationMovement,
      steps: stepMovement
    }
  };
}

// تابع دریافت تعداد گام (اگر در دسترس باشد)
async function getStepCount() {
  try {
    if ('Pedometer' in window) {
      const pedometer = new window.Pedometer();
      return await pedometer.getStepCount();
    }
    
    // برای Android - Web API
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'accelerometer' });
      if (permission.state === 'granted' && 'StepCounter' in window) {
        return await window.StepCounter.getStepCount();
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Step counter not available:', error);
    return null;
  }
}

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);
  const [waitingForAccuracy, setWaitingForAccuracy] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(999);

  // 🔥 مراجع مستقل از GPS برای Dead Reckoning
  const lastDrRef = useRef(null);
  const lastGpsRef = useRef(null); // فقط برای مقایسه، نه برای DR
  const lastTimestampRef = useRef(null);
  const headingRef = useRef(0);
  const isInitializedRef = useRef(false);
  
  // 🔥 متغیرهای سنسوری مستقل
  const accelerationRef = useRef(null);
  const rotationRateRef = useRef(null);
  const stepCountRef = useRef(null);
  const previousStepCountRef = useRef(null);
  const movementHistoryRef = useRef([]);
  const currentSpeedRef = useRef(0);
  const isMovingRef = useRef(false);

  // آستانه دقت GPS فقط برای نقطه شروع
  const REQUIRED_ACCURACY = 800; // متر

  // Listen to device orientation (برای جهت)
  useEffect(() => {
    const handleOrientation = (event) => {
      if (typeof event.alpha === "number") {
        headingRef.current = event.alpha;
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation, true);
  }, []);

  // Listen to device motion (برای تشخیص حرکت)
  useEffect(() => {
    const handleMotion = (event) => {
      accelerationRef.current = event.accelerationIncludingGravity;
      rotationRateRef.current = event.rotationRate;
    };

    window.addEventListener("devicemotion", handleMotion, true);
    return () => window.removeEventListener("devicemotion", handleMotion, true);
  }, []);

  // 🔥 GPS فقط برای نقطه شروع و مقایسه - بدون تأثیر بر DR
  useEffect(() => {
    if (!tracking) return;
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;
        
        const currentGps = { latitude, longitude, timestamp, accuracy, speed };
        
        // 🔥 آپدیت دقت فعلی
        setCurrentAccuracy(accuracy || 999);
        
        // 🔥 GPS فقط برای تعیین نقطه شروع استفاده می‌شود
        if (!isInitializedRef.current) {
          if (!accuracy || accuracy > REQUIRED_ACCURACY) {
            console.log(`⏳ انتظار دقت GPS برای نقطه شروع... فعلی: ${accuracy?.toFixed(1) || 'نامشخص'}m`);
            setWaitingForAccuracy(true);
            return;
          } else {
            // تنها استفاده از GPS: تعیین نقطه شروع
            console.log(`✅ نقطه شروع از GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            
            lastDrRef.current = { latitude, longitude, timestamp };
            lastGpsRef.current = { latitude, longitude, timestamp, accuracy, speed };
            lastTimestampRef.current = timestamp;
            isInitializedRef.current = true;
            setWaitingForAccuracy(false);
            
            // دریافت تعداد گام اولیه
            const initialStepCount = await getStepCount();
            stepCountRef.current = initialStepCount;
            previousStepCountRef.current = initialStepCount;
            
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
                movementMethod: "🎯 Initial Reference Point (GPS)",
                moved: 0,
                heading: headingRef.current,
                sensorMovement: { 
                  isMoving: false, 
                  confidence: 0, 
                  estimatedSpeed: 0,
                  details: {
                    acceleration: { isMoving: false, confidence: 0, value: 0 },
                    rotation: { isMoving: false, confidence: 0, value: 0 },
                    steps: { isMoving: false, confidence: 0, steps: 0 }
                  }
                },
                stepCount: initialStepCount,
                movementHistory: []
              }
            }]);
            
            console.log(`🚀 Dead Reckoning شروع شد - مستقل از GPS`);
            return;
          }
        }
        
        // 🔥 ادامه ردیابی: GPS فقط برای مقایسه
        let dr = { ...lastDrRef.current };
        let moved = 0;
        let isMoving = false;
        let movementMethod = "🛑 Stationary";
        let sensorMovement = { isMoving: false, confidence: 0, estimatedSpeed: 0 };
        
        if (lastTimestampRef.current) {
          const dt = (timestamp - lastTimestampRef.current) / 1000; // ثانیه
          
          // دریافت تعداد گام جدید
          const currentStepCount = await getStepCount();
          if (currentStepCount !== null) {
            previousStepCountRef.current = stepCountRef.current;
            stepCountRef.current = currentStepCount;
          }
          
          // 🔥 تشخیص حرکت کاملاً مستقل از GPS
          sensorMovement = detectMovementFromSensors(
            accelerationRef.current, 
            rotationRateRef.current,
            stepCountRef.current,
            previousStepCountRef.current,
            dt
          );
          
          isMoving = sensorMovement.isMoving;
          const calculatedSpeed = sensorMovement.estimatedSpeed;
          
          // تعیین روش تشخیص حرکت
          if (isMoving) {
            const { acceleration, rotation, steps } = sensorMovement.details;
            if (steps.isMoving) {
              movementMethod = `🚶 Step Counter (${steps.steps} steps)`;
            } else if (acceleration.isMoving && rotation.isMoving) {
              movementMethod = `📱 Accel+Gyro (${sensorMovement.confidence.toFixed(2)})`;
            } else if (acceleration.isMoving) {
              movementMethod = `📈 Accelerometer (${acceleration.value.toFixed(2)} m/s²)`;
            } else if (rotation.isMoving) {
              movementMethod = `🔄 Gyroscope (${rotation.value.toFixed(1)} °/s)`;
            }
          }
          
          // 🔥 فیلتر تاریخچه حرکت برای کاهش نویز
          movementHistoryRef.current.push(isMoving);
          if (movementHistoryRef.current.length > 5) {
            movementHistoryRef.current.shift();
          }
          
          const movingCount = movementHistoryRef.current.filter(Boolean).length;
          const finalIsMoving = movingCount >= 3; // 3 از 5 نمونه آخر
          
          currentSpeedRef.current = finalIsMoving ? calculatedSpeed : 0;
          isMovingRef.current = finalIsMoving;
          
          moved = currentSpeedRef.current * dt;
          
          // 🔥 حرکت DR بر اساس سنسورهای داخلی
          if (finalIsMoving && moved > 0.01) { // حداقل 1 سانتی‌متر
            // محاسبه جهت تصحیح‌شده
            let pureHeading = headingRef.current;
            const northAngle = localStorage.getItem('northAngle');
            if (northAngle && Number(northAngle) !== 0) {
              pureHeading = (Number(northAngle) - headingRef.current + 360) % 360;
            }
            
            dr = moveLatLng(dr, pureHeading, moved);
            console.log(`🧭 DR Movement: ${moved.toFixed(4)}m @ ${pureHeading.toFixed(1)}° (${movementMethod})`);
          } else {
            console.log(`⏸️ DR Stationary - Movement: ${moved.toFixed(4)}m (${movementHistoryRef.current.map(m => m ? '1' : '0').join(',')})`);
          }
        }
        
        lastDrRef.current = dr;
        lastGpsRef.current = currentGps; // فقط برای مقایسه
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
              calculatedSpeed: sensorMovement.estimatedSpeed,
              finalSpeed: currentSpeedRef.current,
              isMoving: isMovingRef.current,
              movementMethod: movementMethod,
              moved: moved,
              heading: headingRef.current,
              sensorMovement: sensorMovement,
              stepCount: stepCountRef.current,
              movementHistory: [...movementHistoryRef.current]
            }
          }
        ]);
      },
      (error) => {
        console.warn("GPS Error:", error);
        setWaitingForAccuracy(false);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 1000,
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
      stepCountRef.current = null;
      previousStepCountRef.current = null;
    };
  }, [tracking]);

  const start = async () => {
    // درخواست مجوز حسگرها
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEvent.requestPermission();
        if (state !== 'granted') {
          console.warn('Device orientation permission denied');
        }
      } catch (err) {
        console.warn('Device orientation permission error:', err);
      }
    }

    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const state = await DeviceMotionEvent.requestPermission();
        if (state !== 'granted') {
          console.warn('Device motion permission denied');
        }
      } catch (err) {
        console.warn('Device motion permission error:', err);
      }
    }

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
    isInitializedRef.current = false;
    stepCountRef.current = null;
    previousStepCountRef.current = null;
    
    console.log("🚀 شروع Dead Reckoning مستقل از GPS");
    console.log("📱 تشخیص حرکت از: شتاب‌سنج، ژیروسکوپ، گام‌شمار");
    console.log("🎯 GPS فقط برای نقطه شروع و مقایسه");
  };
  
  const stop = () => {
    setTracking(false);
    setWaitingForAccuracy(false);
    isInitializedRef.current = false;
    console.log("🛑 توقف Dead Reckoning");
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

  // API وضعیت
  const getCurrentStatus = () => {
    return {
      isMoving: isMovingRef.current,
      speed: currentSpeedRef.current,
      speedKmh: (currentSpeedRef.current * 3.6).toFixed(1),
      heading: headingRef.current,
      movementHistory: [...movementHistoryRef.current],
      waitingForAccuracy,
      currentAccuracy,
      isInitialized: isInitializedRef.current,
      stepCount: stepCountRef.current
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
    getCurrentStatus,
    currentSpeed: currentSpeedRef.current,
    currentHeading: headingRef.current,
    isMoving: isMovingRef.current,
    waitingForAccuracy,
    currentAccuracy,
    isInitialized: isInitializedRef.current,
    requiredAccuracy: REQUIRED_ACCURACY
  };
}

export { moveLatLng };
