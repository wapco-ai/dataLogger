
import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@mui/material';

export default function NorthAngleArrow() {
  const [alpha, setAlpha] = useState(0);
  const [northAngle, setNorthAngle] = useState(Number(localStorage.getItem('northAngle')) || 0);
  
  // استفاده از useMediaQuery برای responsive design
  const isSmallScreen = useMediaQuery('(max-height: 600px)');
  const isVerySmallScreen = useMediaQuery('(max-height: 500px)');
  const isLandscape = useMediaQuery('(orientation: landscape) and (max-height: 500px)');

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
    rotation = (northAngle - alpha + 360) % 360;
    if (rotation > 180) rotation -= 360;
  } else {
    rotation = (-alpha + 360) % 360;
    if (rotation > 180) rotation -= 360;
  }

  // محاسبه موقعیت بر اساس سایز صفحه
  const getBottomPosition = () => {
    if (isLandscape) return '80px';
    if (isVerySmallScreen) return '140px';
    if (isSmallScreen) return '160px';
    return '192px';
  };

  const getLeftPosition = () => {
    if (isLandscape) return '18px';
    return '15px';
  };

  return (
    <>
      <div 
        className="mobile-compass"
        style={{
          position: 'fixed',
          // bottom: getBottomPosition(),
          // left: getLeftPosition(), 
          zIndex: 1200,
          width: '48px',
          height: '48px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(15px)',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.3s ease-out'
        }}>
          <svg viewBox="0 0 32 32" style={{ width: '100%', height: '100%' }}>
            {/* دایره محیطی */}
            <circle 
              cx="16" 
              cy="16" 
              r="14" 
              fill="none" 
              stroke="rgba(100, 116, 139, 0.3)" 
              strokeWidth="1.5" 
            />
            
            {/* فلش شمال قرمز */}
            <polygon 
              points="16,4 18,20 16,18 14,20" 
              fill="#ef4444" 
              stroke="white" 
              strokeWidth="0.5" 
            />
            
            {/* فلش جنوب خاکستری */}
            <polygon 
              points="16,28 18,12 16,14 14,12" 
              fill="rgba(100, 116, 139, 0.6)" 
            />
            
            {/* نقطه مرکزی */}
            <circle 
              cx="16" 
              cy="16" 
              r="2" 
              fill="white" 
              stroke="#374151" 
              strokeWidth="1"
            />
            
            {/* علامت N برای شمال */}
            <text 
              x="16" 
              y="8" 
              textAnchor="middle" 
              fontSize="8" 
              fill="white" 
              fontWeight="bold" 
              stroke="#ef4444" 
              strokeWidth="0.5"
            >
              N
            </text>
          </svg>
        </div>
        
        {/* Tooltip */}
        <div 
          className="compass-tooltip"
          style={{
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            opacity: 0,
            visibility: 'hidden',
            transition: 'all 0.2s',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          قطب‌نما
        </div>
      </div>
      
      {/* CSS جداگانه بدون media query در inline style */}
      <style>{`
        .mobile-compass:hover .compass-tooltip {
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .mobile-compass:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
        }
      `}</style>
    </>
  );
}
