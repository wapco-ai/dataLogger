import { useEffect, useState } from 'react';

export default function useCompassCalibration() {
  const [calibrated, setCalibrated] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let lastAlpha = null;
    let jumpCount = 0;

    function handleOrientation(event) {
      // اگر absolute=false، سنسور دقیق نیست
      if (!event.absolute) {
        setCalibrated(false);
        setError('سنسور قطب‌نما کالیبره نیست. لطفاً با حرکت ۸ انگلیسی دستگاه را کالیبره کنید.');
        return;
      }
      // اگر مقدار غیرعادی یا صفر است
      if (
        event.alpha == null ||
        isNaN(event.alpha) ||
        event.alpha === 0 && event.beta === 0 && event.gamma === 0
      ) {
        setCalibrated(false);
        setError('دریافت داده معتبر از سنسور قطب‌نما ممکن نیست. ممکن است دستگاه شما نیاز به کالیبره داشته باشد.');
        return;
      }
      // پرش ناگهانی بیشتر از 80 درجه
      if (lastAlpha !== null && Math.abs(event.alpha - lastAlpha) > 80) {
        jumpCount++;
        if (jumpCount > 2) {
          setCalibrated(false);
          setError('سنسور قطب‌نما مشکوک به عدم کالیبراسیون است (پرش شدید زاویه).');
          return;
        }
      } else {
        jumpCount = 0;
      }
      lastAlpha = event.alpha;
      setCalibrated(true);
      setError(null);
    }

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  return { calibrated, error };
}
