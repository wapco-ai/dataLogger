
import { useState, useRef, useEffect } from "react";
let calibrationSamples = [];
let isCalibrating = false;
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


// 🔥 کلاس گام‌شمار با حساسیت قابل تنظیم - جایگزین کلاس قبلی
class AccelerometerStepCounter {
  constructor() {
    this.steps = 0;
    this.lastStepTime = 0;
    this.accelerationHistory = [];

    // 🔥 تنظیمات حساسیت بهبود یافته
    this.threshold = 0.8;        // کاهش از 1.5 به 0.8 برای حساسیت بیشتر
    this.minStepInterval = 200;  // کاهش از 300 به 200 میلی‌ثانیه
    this.windowSize = 8;         // کاهش از 10 به 8 برای پاسخ سریع‌تر
    this.minRequiredSamples = 3; // کاهش از 5 به 3 نمونه

    // آستانه‌های بهبود یافته
    this.baselineThreshold = 0.5; // حداقل تغییرات برای تشخیص
    this.peakRatio = 1.2;        // نسبت peak به میانگین
  }

  // اضافه کردن داده شتاب جدید
  addAccelerationData(acceleration) {
    if (!acceleration || !acceleration.x || !acceleration.y || !acceleration.z) {
      return this.steps;
    }

    const currentTime = Date.now();

    // محاسبه مقدار کل شتاب
    const totalAccel = Math.sqrt(
      acceleration.x ** 2 +
      acceleration.y ** 2 +
      acceleration.z ** 2
    );

    // اضافه کردن به تاریخچه
    this.accelerationHistory.push({
      value: totalAccel,
      timestamp: currentTime
    });

    // نگه داشتن فقط آخرین داده‌ها
    if (this.accelerationHistory.length > this.windowSize) {
      this.accelerationHistory.shift();
    }

    // 🔥 کاهش حداقل نمونه‌های مورد نیاز
    if (this.accelerationHistory.length < this.minRequiredSamples) {
      return this.steps;
    }

    // تشخیص peak (قله) در سیگنال شتاب
    const isStep = this.detectStep(currentTime);

    if (isStep) {
      this.steps++;
      this.lastStepTime = currentTime;
      console.log(`👟 گام ${this.steps} - شتاب: ${totalAccel.toFixed(2)}`);
    }

    return this.steps;
  }

  // 🔥 تشخیص گام بهبود یافته
  detectStep(currentTime) {
    // بررسی حداقل فاصله زمانی بین گام‌ها
    if (currentTime - this.lastStepTime < this.minStepInterval) {
      return false;
    }

    const recentData = this.accelerationHistory.slice(-this.minRequiredSamples);
    if (recentData.length < this.minRequiredSamples) return false;

    // محاسبه میانگین و انحراف معیار
    const values = recentData.map(item => item.value);
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;

    // پیدا کردن maximum در پنجره
    const maxValue = Math.max(...values);
    const maxIndex = values.indexOf(maxValue);

    // 🔥 شرایط بهبود یافته برای تشخیص گام:
    const conditions = [
      // 1. قله باید از آستانه پایه بیشتر باشد
      maxValue > (average + this.baselineThreshold),

      // 2. قله باید نسبت مناسبی با میانگین داشته باشد
      maxValue > (average * this.peakRatio),

      // 3. قله باید از آستانه مطلق بیشتر باشد
      maxValue > (9.81 + this.threshold), // 9.81 = gravity

      // 4. تغییرات نسبی کافی
      (maxValue - Math.min(...values)) > this.threshold
    ];

    // اگر حداقل 2 شرط برقرار باشد
    const satisfiedConditions = conditions.filter(Boolean).length;
    const isValidStep = satisfiedConditions >= 2;

    if (isValidStep) {
      console.log(`🔍 Step detected - Max: ${maxValue.toFixed(2)}, Avg: ${average.toFixed(2)}, Conditions: ${satisfiedConditions}/4`);
    }

    return isValidStep;
  }

  // 🔥 تنظیم سطوح مختلف حساسیت
  setSensitivityLevel(level) {
    switch (level.toLowerCase()) {
      case 'very_high':
      case 'خیلی_زیاد':
        this.threshold = 0.4;
        this.minStepInterval = 150;
        this.baselineThreshold = 0.3;
        this.peakRatio = 1.1;
        break;

      case 'high':
      case 'زیاد':
        this.threshold = 0.6;
        this.minStepInterval = 180;
        this.baselineThreshold = 0.4;
        this.peakRatio = 1.15;
        break;

      case 'medium':
      case 'متوسط':
        this.threshold = 0.8;
        this.minStepInterval = 200;
        this.baselineThreshold = 0.5;
        this.peakRatio = 1.2;
        break;

      case 'low':
      case 'کم':
        this.threshold = 1.2;
        this.minStepInterval = 250;
        this.baselineThreshold = 0.7;
        this.peakRatio = 1.3;
        break;

      default:
        // پیش‌فرض: حساسیت زیاد
        this.threshold = 0.6;
        this.minStepInterval = 180;
        this.baselineThreshold = 0.4;
        this.peakRatio = 1.15;
    }

    console.log(`🎛️ حساسیت گام‌شمار: ${level} - آستانه: ${this.threshold}`);
  }

  // 🔥 تنظیم دستی حساسیت (0.1 تا 2.0)
  setCustomSensitivity(sensitivity) {
    // معکوس sensitivity - هرچه عدد بیشتر، حساسیت بیشتر
    this.threshold = Math.max(0.1, 2.0 - sensitivity);
    this.minStepInterval = Math.max(100, 300 - (sensitivity * 50));
    this.baselineThreshold = Math.max(0.1, 0.8 - (sensitivity * 0.2));
    this.peakRatio = Math.max(1.05, 1.4 - (sensitivity * 0.1));

    console.log(`🎛️ حساسیت دستی: ${sensitivity} - آستانه: ${this.threshold.toFixed(2)}`);
  }

  // ریست کردن شمارنده
  reset() {
    this.steps = 0;
    this.lastStepTime = 0;
    this.accelerationHistory = [];
    console.log('🔄 گام‌شمار ریست شد');
  }

  // دریافت تعداد گام‌ها
  getStepCount() {
    return this.steps;
  }

  // اطلاعات تشخیصی
  getDebugInfo() {
    return {
      steps: this.steps,
      threshold: this.threshold,
      minInterval: this.minStepInterval,
      historySize: this.accelerationHistory.length,
      lastValues: this.accelerationHistory.slice(-3).map(item => item.value.toFixed(2))
    };
  }
}

// 🔥 ایجاد instance با حساسیت بالا
const stepCounter = new AccelerometerStepCounter();
stepCounter.setSensitivityLevel('high'); // تنظیم حساسیت بالا از ابتدا

// 🔥 تابع جدید برای تنظیم حساسیت در زمان اجرا
export function adjustStepSensitivity(level) {
  stepCounter.setSensitivityLevel(level);
  return stepCounter.getDebugInfo();
}

// 🔥 تابع جدید برای تنظیم دستی
export function setCustomStepSensitivity(value) {
  stepCounter.setCustomSensitivity(value);
  return stepCounter.getDebugInfo();
}

// 🔥 دریافت اطلاعات تشخیصی
export function getStepDebugInfo() {
  return stepCounter.getDebugInfo();
}

// 🔥 تابع اصلاح‌شده getStepCount - جایگزین تابع قبلی
async function getStepCount(acceleration = null) {
  try {
    // اول سعی می‌کنیم از API های native استفاده کنیم
    if ('Pedometer' in window) {
      const pedometer = new window.Pedometer();
      const nativeSteps = await pedometer.getStepCount();
      if (nativeSteps !== null) {
        console.log(`📱 Native step count: ${nativeSteps}`);
        return nativeSteps;
      }
    }

    // برای Android - Web API
    if (navigator.permissions) {
      const permission = await navigator.permissions.query({ name: 'accelerometer' });
      if (permission.state === 'granted' && 'StepCounter' in window) {
        const nativeSteps = await window.StepCounter.getStepCount();
        if (nativeSteps !== null) {
          console.log(`🤖 Android step count: ${nativeSteps}`);
          return nativeSteps;
        }
      }
    }

    // 🔥 استفاده از گام‌شمار مبتنی بر شتاب‌سنج
    if (acceleration) {
      const calculatedSteps = stepCounter.addAccelerationData(acceleration);
      return calculatedSteps;
    }

    // بازگشت آخرین مقدار محاسبه‌شده
    return stepCounter.getStepCount();

  } catch (error) {
    console.warn('Step counter error:', error);
    // در صورت خطا، از گام‌شمار داخلی استفاده می‌کنیم
    return stepCounter.getStepCount();
  }
}

// 🔥 تشخیص حرکت کاملاً مستقل از GPS - فقط از سنسورهای داخلی - بدون تغییر
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

  // 🔥 3. تشخیص از گام‌شمار محاسبه‌شده - اصلاح شده
  let stepMovement = { isMoving: false, confidence: 0, steps: 0 };

  // اگر stepCount از تابع جدید دریافت شده باشد
  if (stepCount !== null && previousStepCount !== null && timeInterval > 0) {
    const newSteps = stepCount - previousStepCount;
    const stepsPerSecond = newSteps / timeInterval;

    if (newSteps > 0 && stepsPerSecond > 0.1) { // حداقل یک گام در 10 ثانیه
      stepMovement = {
        isMoving: true,
        confidence: Math.min(stepsPerSecond / 1.5, 1), // 1.5 گام در ثانیه = اعتماد کامل
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
    if (stepMovement.isMoving && stepMovement.steps > 0) {
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

export function useDualTracking() {
  const [tracking, setTracking] = useState(false);
  const [points, setPoints] = useState([]);
  const [waitingForAccuracy, setWaitingForAccuracy] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState(999);
  // 🔥 state جدید برای وضعیت آمادگی سنسور
  const [sensorReady, setSensorReady] = useState(false);
  const [compassStable, setCompassStable] = useState(false);

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
    let stabilityCounter = 0;
    let lastHeading = null;
    const STABILITY_THRESHOLD = 3; // تعداد نمونه‌های پایدار
    const STABILITY_TOLERANCE = 2; // تولرانس درجه

    const handleOrientation = (event) => {
      if (typeof event.alpha === 'number') {
        const newHeading = event.alpha;
        headingRef.current = newHeading;

        // 🔥 بررسی پایداری سنسور
        if (lastHeading !== null) {
          const difference = Math.abs(newHeading - lastHeading);
          const normalizedDiff = Math.min(difference, 360 - difference);

          if (normalizedDiff < STABILITY_TOLERANCE) {
            stabilityCounter++;
          } else {
            stabilityCounter = 0;
          }

          // سنسور پایدار شده
          if (stabilityCounter >= STABILITY_THRESHOLD && !compassStable) {
            console.log('🧭 قطب‌نما پایدار شد - آماده برای کالیبراسیون');
            setCompassStable(true);
            setSensorReady(true);

            // 🔥 بازیابی کالیبراسیون با تاخیر
            setTimeout(() => {
              restoreCalibrationWithValidation();
            }, 1000);
          }
        }

        lastHeading = newHeading;
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [compassStable]);

  // 🔥 تابع بازیابی کالیبراسیون با validation
  const restoreCalibrationWithValidation = () => {
    try {
      const savedAngle = localStorage.getItem('northAngle');
      const calibrationData = localStorage.getItem('calibrationData');

      if (!savedAngle || !calibrationData) {
        console.log('⚠️ کالیبراسیون ذخیره‌شده‌ای یافت نشد');
        return;
      }

      const data = JSON.parse(calibrationData);
      const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);

      // بررسی اعتبار کالیبراسیون
      if (ageHours > 48) { // 2 روز
        console.warn('⚠️ کالیبراسیون قدیمی - پاک کردن...');
        localStorage.removeItem('northAngle');
        localStorage.removeItem('calibrationData');
        return;
      }

      const northAngle = Number(savedAngle);
      if (isNaN(northAngle) || northAngle < 0 || northAngle >= 360) {
        console.warn('⚠️ مقدار کالیبراسیون نامعتبر');
        return;
      }

      // بررسی سازگاری با heading فعلی
      const currentHeading = headingRef.current;
      if (currentHeading !== null) {
        const expectedCalibratedHeading = (northAngle - currentHeading + 360) % 360;

        console.log(`🔄 بازیابی کالیبراسیون:`);
        console.log(`   - زاویه شمال ذخیره‌شده: ${northAngle.toFixed(1)}°`);
        console.log(`   - heading فعلی: ${currentHeading.toFixed(1)}°`);
        console.log(`   - heading کالیبره‌شده: ${expectedCalibratedHeading.toFixed(1)}°`);
        console.log(`   - کیفیت: ${data.quality || 'نامشخص'}`);
        console.log(`   - قدمت: ${ageHours.toFixed(1)} ساعت`);

        // اعمال کالیبراسیون
        window.dispatchEvent(new Event('storage'));
        console.log('✅ کالیبراسیون بازیابی شد');
      }
    } catch (error) {
      console.error('❌ خطا در بازیابی کالیبراسیون:', error);
      localStorage.removeItem('northAngle');
      localStorage.removeItem('calibrationData');
    }
  };

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

            // 🔥 دریافت تعداد گام اولیه با acceleration
            const initialStepCount = await getStepCount(accelerationRef.current);
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

          // 🔥 دریافت تعداد گام جدید با acceleration
          const currentStepCount = await getStepCount(accelerationRef.current);
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
    // 🔥 انتظار برای آماده شدن سنسور
    if (!sensorReady) {
      console.log('⏳ انتظار برای آماده شدن سنسور...');
      alert('⏳ لطفاً کمی صبر کنید تا سنسورها آماده شوند...');

      // انتظار حداکثر 5 ثانیه
      let waitTime = 0;
      const checkInterval = setInterval(() => {
        waitTime += 500;
        if (sensorReady || waitTime >= 5000) {
          clearInterval(checkInterval);
          if (sensorReady) {
            console.log('✅ سنسور آماده شد');
            proceedWithStart();
          } else {
            console.warn('⚠️ سنسور آماده نشد - ادامه با حالت عادی');
            proceedWithStart();
          }
        }
      }, 500);
      return;
    }

    proceedWithStart();
  };

  // 🔥 تابع واقعی start
  const proceedWithStart = async () => {
    // ... کدهای قبلی تابع start را اینجا قرار دهید ...
    setTracking(true);

    // بررسی کالیبراسیون
    const northAngle = Number(localStorage.getItem('northAngle')) || 0;
    if (northAngle === 0) {
      alert('⚠️ توصیه: ابتدا قطب‌نما را کالیبره کنید');
    }

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

    // 🔥 ریست و تنظیم حساسیت گام‌شمار
    stepCounter.reset();
    stepCounter.setSensitivityLevel('very_high'); // حساسیت خیلی زیاد برای بهترین نتیجه

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
    console.log(`🎛️ حساسیت گام‌شمار: خیلی زیاد`, stepCounter.getDebugInfo());
  };


  const stop = () => {
    setTracking(false);
    setWaitingForAccuracy(false);
    isInitializedRef.current = false;
    console.log("🛑 توقف Dead Reckoning");
  };

  // 🔥 تابع کالیبراسیون بهبود یافته - جایگزین تابع قبلی در خط 549
  const calibrateHeadingOffset = () => {
    if (isCalibrating) {
      console.log('⏳ کالیبراسیون در حال انجام...');
      return null;
    }

    const currentHeading = headingRef.current;
    if (currentHeading === null || currentHeading === undefined) {
      console.warn('⚠️ داده‌های قطب‌نما در دسترس نیست');
      return 0;
    }

    console.log('🔄 شروع کالیبراسیون چندنمونه‌ای...');
    isCalibrating = true;
    calibrationSamples = [];

    // نمونه‌گیری 10 بار در 2 ثانیه
    const sampleCount = 10;
    const sampleInterval = 200; // میلی‌ثانیه
    let sampleIndex = 0;

    const collectSample = () => {
      const heading = headingRef.current;
      if (heading !== null && heading !== undefined) {
        calibrationSamples.push(heading);
        console.log(`📊 نمونه ${sampleIndex + 1}/${sampleCount}: ${heading.toFixed(1)}°`);
        sampleIndex++;

        if (sampleIndex < sampleCount) {
          setTimeout(collectSample, sampleInterval);
        } else {
          finishCalibration();
        }
      } else {
        console.warn('⚠️ نمونه‌گیری ناموفق - تکرار...');
        setTimeout(collectSample, sampleInterval);
      }
    };

    const finishCalibration = () => {
      isCalibrating = false;

      if (calibrationSamples.length < 5) {
        console.error('❌ نمونه‌های کافی جمع‌آوری نشد');
        return 0;
      }

      // حذف نمونه‌های پرت (outliers)
      const sorted = [...calibrationSamples].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const filteredSamples = calibrationSamples.filter(
        sample => sample >= lowerBound && sample <= upperBound
      );

      // محاسبه میانگین و انحراف معیار
      const average = filteredSamples.reduce((sum, val) => sum + val, 0) / filteredSamples.length;
      const variance = filteredSamples.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / filteredSamples.length;
      const standardDeviation = Math.sqrt(variance);

      console.log(`📊 آمار کالیبراسیون:`);
      console.log(`   - نمونه‌های کل: ${calibrationSamples.length}`);
      console.log(`   - نمونه‌های معتبر: ${filteredSamples.length}`);
      console.log(`   - میانگین: ${average.toFixed(2)}°`);
      console.log(`   - انحراف معیار: ${standardDeviation.toFixed(2)}°`);

      // بررسی کیفیت کالیبراسیون
      const quality = getCalibrationQuality(standardDeviation);
      console.log(`🎯 کیفیت کالیبراسیون: ${quality.label}`);

      if (quality.isAcceptable) {
        // ذخیره اطلاعات کاملتر
        const calibrationData = {
          northAngle: average,
          quality: quality.label,
          standardDeviation: standardDeviation,
          timestamp: Date.now(),
          samples: filteredSamples.length,
          deviceInfo: {
            userAgent: navigator.userAgent.substring(0, 50),
            platform: navigator.platform
          }
        };

        localStorage.setItem('northAngle', average.toString());
        localStorage.setItem('calibrationData', JSON.stringify(calibrationData));
        window.dispatchEvent(new Event('storage'));

        console.log(`✅ کالیبراسیون موفق: ${average.toFixed(1)}° (${quality.label})`);
        return average;
      } else {
        console.warn(`⚠️ کالیبراسیون ناپایدار (SD: ${standardDeviation.toFixed(1)}°) - لطفاً دوباره تلاش کنید`);
        return 0;
      }
    };

    // شروع نمونه‌گیری
    setTimeout(collectSample, 100);
    return null; // در حال پردازش
  };

  // 🔥 تابع ارزیابی کیفیت کالیبراسیون
  const getCalibrationQuality = (standardDeviation) => {
    if (standardDeviation < 2) {
      return { label: 'عالی', isAcceptable: true, color: 'success' };
    } else if (standardDeviation < 5) {
      return { label: 'خوب', isAcceptable: true, color: 'info' };
    } else if (standardDeviation < 10) {
      return { label: 'متوسط', isAcceptable: true, color: 'warning' };
    } else {
      return { label: 'ضعیف', isAcceptable: false, color: 'error' };
    }
  };

  // 🔥 تابع بررسی صحت کالیبراسیون - اضافه کردن به انتهای فایل
  const validateStoredCalibration = () => {
    try {
      const calibrationData = localStorage.getItem('calibrationData');
      if (!calibrationData) {
        console.log('⚠️ داده‌های کالیبراسیون یافت نشد');
        return false;
      }

      const data = JSON.parse(calibrationData);
      const ageHours = (Date.now() - data.timestamp) / (1000 * 60 * 60);

      console.log(`📋 بررسی کالیبراسیون ذخیره‌شده:`);
      console.log(`   - زاویه شمال: ${data.northAngle?.toFixed(1)}°`);
      console.log(`   - کیفیت: ${data.quality}`);
      console.log(`   - قدمت: ${ageHours.toFixed(1)} ساعت`);
      console.log(`   - نمونه‌ها: ${data.samples}`);

      // هشدار اگر کالیبراسیون قدیمی باشد
      if (ageHours > 24) {
        console.warn('⚠️ کالیبراسیون قدیمی است - توصیه به کالیبراسیون مجدد');
        return false;
      }

      // هشدار اگر کیفیت پایین باشد
      if (data.standardDeviation > 8) {
        console.warn('⚠️ کیفیت کالیبراسیون پایین - توصیه به کالیبراسیون مجدد');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ خطا در بررسی کالیبراسیون:', error);
      return false;
    }
  };
  const isCalibrationValid = validateStoredCalibration();
  if (!isCalibrationValid) {
    console.log('💡 توصیه: کالیبراسیون مجدد قطب‌نما را انجام دهید');
  }

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
    requiredAccuracy: REQUIRED_ACCURACY,

    // 🔥 تابع‌های جدید برای تنظیم حساسیت
    adjustStepSensitivity: (level) => adjustStepSensitivity(level),
    setCustomStepSensitivity: (value) => setCustomStepSensitivity(value),
    getStepDebugInfo: () => getStepDebugInfo()
  };
}

export { moveLatLng };
