
import React, { useState, useEffect } from 'react';

export default function NorthAngleArrow() {
  const [alpha, setAlpha] = useState(0);
  const [northAngle, setNorthAngle] = useState(Number(localStorage.getItem('northAngle')) || 0);

  useEffect(() => {
    function handleOrientation(event) {
      if (typeof event.alpha === 'number') setAlpha(event.alpha);
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  useEffect(() => {
    const updateNorth = () => setNorthAngle(Number(localStorage.getItem('northAngle')) || 0);
    window.addEventListener('storage', updateNorth);
    return () => window.removeEventListener('storage', updateNorth);
  }, []);


  // 🔧 محاسبه صحیح چرخش آیکون
  let rotation = 0;

  if (northAngle !== null && northAngle !== 0) {
    // 🔥 فرمول صحیح: عقربه باید به سمت شمال واقعی بچرخد
    // northAngle = زاویه‌ای که در آن لحظه کالیبراسیون، گوشی رو به شمال بود
    // alpha = زاویه فعلی گوشی
    // پس عقربه باید به سمت northAngle بچرخد
    rotation = (northAngle + 360) % 360;
  } else {
    // اگر کالیبراسیون نشده، فرض می‌کنیم شمال در جهت 0 درجه است
    rotation = 0;
  }

  // بهینه‌سازی چرخش (کوتاه‌ترین مسیر)
  if (rotation > 180) rotation -= 360;

  return (
    <div style={{
      position: 'absolute',
      bottom: 100,
      right: 5,
      zIndex: 1200,
      width: 50,
      height: 50,
      background: 'rgba(255,255,255,0.82)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.13)'
    }}>
      <div style={{
        width: 40,
        height: 40,
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.3s ease-out'
      }}>
        <svg viewBox="0 0 32 32">
          {/* فلش شمال قرمز */}
          <polygon points="16,4 19,21 16,16 13,21" fill="red" />
          {/* دایره محیطی */}
          <circle cx="16" cy="16" r="14" fill="none" stroke="#999" strokeWidth="2" />
          {/* علامت N برای شمال */}
          <text x="16" y="8" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">N</text>
        </svg>
      </div>
    </div>
  );
}
