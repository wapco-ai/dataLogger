
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Collapse, 
  Divider,
  Grid,
  Chip,
  Button,
  Tooltip,
  Slide
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExploreIcon from '@mui/icons-material/Explore';
import NavigationIcon from '@mui/icons-material/Navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import TuneIcon from '@mui/icons-material/Tune';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SensorsIcon from '@mui/icons-material/Sensors';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';

export default function DebugPanel({ 
  points = [], 
  tracking = false,
  currentHeading = 0,
  drHeading = 0,
  movementDirection = 0,
  calibrateHeadingOffset,
  offset = 0,
  onStartStop
}) {
  const [expanded, setExpanded] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0
  });

  // دریافت داده‌های سنسور به‌صورت Real-time
  useEffect(() => {
    const handleOrientation = (event) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // محاسبه مقادیر کلیدی
  const northAngle = Number(localStorage.getItem('northAngle')) || 0;
  const rawCompassHeading = deviceOrientation.alpha;
  
  const calibratedHeading = northAngle !== 0 ? 
    (northAngle - rawCompassHeading + 360) % 360 : rawCompassHeading;
  
  const lastGps = points.length ? points[points.length - 1]?.gps : null;
  const lastDr = points.length ? points[points.length - 1]?.dr : null;
  
  // اطلاعات سنسوری از آخرین نقطه
  const sensorData = lastDr?.sensorMovement || {
    isMoving: false,
    confidence: 0,
    estimatedSpeed: 0,
    details: {
      acceleration: { isMoving: false, confidence: 0, value: 0 },
      rotation: { isMoving: false, confidence: 0, value: 0 },
      steps: { isMoving: false, confidence: 0, steps: 0 }
    }
  };
  
  // محاسبه سرعت و فاصله
  const currentSpeed = lastDr?.finalSpeed || 0;
  const gpsAccuracy = lastGps?.accuracy || 0;
  const stepCount = lastDr?.stepCount || 0;
  
  // محاسبه انحراف بین GPS و DR
  const calculateDeviation = () => {
    if (!lastGps || !lastDr) return 0;
    
    const R = 6371000; // شعاع زمین
    const dLat = (lastDr.latitude - lastGps.latitude) * Math.PI / 180;
    const dLng = (lastDr.longitude - lastGps.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lastGps.latitude * Math.PI / 180) * Math.cos(lastDr.latitude * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const deviation = calculateDeviation();
  const isCalibrated = northAngle !== 0;

  // کامپوننت نمایش مقدار با رنگ
  const ValueDisplay = ({ label, value, unit = "", color = "primary", size = "small" }) => (
    <Box sx={{ textAlign: 'center', mb: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Chip 
        label={`${value}${unit}`}
        color={color}
        variant="outlined"
        size={size}
        sx={{ 
          fontWeight: 'bold', 
          fontFamily: 'monospace',
          fontSize: '0.75rem'
        }}
      />
    </Box>
  );

  return (
    <>
      {/* 🎯 پنل اصلی پایین صفحه */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          transform: expanded ? 'translateY(0)' : 'translateY(calc(100% - 60px))',
          transition: 'transform 0.3s ease-in-out',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            bgcolor: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(15px)',
            borderRadius: '16px 16px 0 0',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
          }}
        >
          
          {/* 🎯 هدر کامپکت */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              px: 2,
              py: 1,
              bgcolor: tracking ? 'success.light' : 'grey.100',
              cursor: 'pointer',
              minHeight: '60px'
            }}
            onClick={() => setExpanded(!expanded)}
          >
            
            <BugReportIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="h7" sx={{ flex: 1, fontWeight: 'bold', fontSize: '0.9rem' }}>
              Debug
            </Typography>
            
            {/* دکمه start/stop */}
            {onStartStop && (
              <Tooltip title={tracking ? "پایان مسیر" : "شروع مسیر"}>
                <IconButton 
                  size="medium" 
                  color={tracking ? "error" : "success"} 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartStop();
                  }}
                  sx={{ mr: 1 }}
                >
                  {tracking ? <StopIcon /> : <PlayArrowIcon />}
                </IconButton>
              </Tooltip>
            )}
            
            {/* اطلاعات خلاصه در هدر */}
            <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
              {/* وضعیت حرکت */}
              <Chip 
                label={sensorData.isMoving ? "🏃" : "⏸️"}
                color={sensorData.isMoving ? "success" : "default"}
                size="small"
                sx={{ fontSize: '0.8rem', minWidth: '35px' }}
              />
              
              {/* سرعت */}
              <Chip 
                label={`${currentSpeed.toFixed(1)}m/s`}
                color={currentSpeed > 0 ? "info" : "default"}
                size="small"
                sx={{ fontSize: '0.7rem', minWidth: '55px' }}
              />
              
              {/* انحراف */}
              <Chip 
                label={`${deviation.toFixed(1)}m`}
                color={deviation < 5 ? "success" : deviation < 15 ? "warning" : "error"}
                size="small"
                sx={{ fontSize: '0.7rem', minWidth: '50px' }}
              />
              
              {/* تعداد نقاط */}
              <Chip 
                label={`${points.length}`}
                color="secondary"
                size="small"
                sx={{ fontSize: '0.7rem', minWidth: '35px' }}
              />
            </Box>

            {/* وضعیت کالیبراسیون */}
            <Tooltip title={isCalibrated ? "کالیبره شده" : "نیاز به کالیبراسیون"}>
              {isCalibrated ? 
                <CheckCircleIcon color="success" sx={{ mr: 1 }} /> : 
                <WarningIcon color="warning" sx={{ mr: 1 }} />
              }
            </Tooltip>
            
            {/* دکمه باز/بسته */}
            <IconButton size="medium">
              {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
            </IconButton>
          </Box>

          {/* 🎯 محتوای کامل */}
          <Collapse in={expanded} timeout={300}>
            <Box sx={{ 
              p: 2, 
              maxHeight: 'calc(80vh - 60px)', 
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '3px' },
              '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '3px' }
            }}>
              
              {/* بخش کالیبراسیون */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                  <TuneIcon sx={{ mr: 1 }} />
                  کالیبراسیون قطب‌نما
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <ValueDisplay 
                      label="North Angle"
                      value={northAngle.toFixed(1)}
                      unit="°"
                      color={northAngle !== 0 ? "success" : "error"}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ValueDisplay 
                      label="خام قطب‌نما"
                      value={rawCompassHeading.toFixed(1)}
                      unit="°"
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ValueDisplay 
                      label="تصحیح‌شده"
                      value={calibratedHeading.toFixed(1)}
                      unit="°"
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <ValueDisplay 
                      label="DR Heading"
                      value={drHeading.toFixed(1)}
                      unit="°"
                      color="warning"
                    />
                  </Grid>
                </Grid>

                {/* دکمه کالیبراسیون */}
                {calibrateHeadingOffset && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ExploreIcon />}
                    onClick={() => {
                      const newOffset = calibrateHeadingOffset();
                      alert(`✅ جهت شمال کالیبره شد: ${newOffset.toFixed(1)}°`);
                    }}
                    sx={{ mb: 2, py: 1.5 }}
                  >
                    🧭 کالیبره کردن شمال (رو به شمال بایستید)
                  </Button>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* بخش سنسورها */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <SensorsIcon sx={{ mr: 1 }} />
                سنسورهای تشخیص حرکت (مستقل از GPS)
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <ValueDisplay 
                    label="🏃 حرکت کلی"
                    value={sensorData.isMoving ? "فعال" : "متوقف"}
                    color={sensorData.isMoving ? "success" : "default"}
                  />
                </Grid>
                <Grid item xs={4}>
                  <ValueDisplay 
                    label="اعتماد"
                    value={sensorData.confidence.toFixed(2)}
                    color={sensorData.confidence > 0.7 ? "success" : sensorData.confidence > 0.3 ? "warning" : "error"}
                  />
                </Grid>
                <Grid item xs={4}>
                  <ValueDisplay 
                    label="سرعت تخمینی"
                    value={sensorData.estimatedSpeed.toFixed(2)}
                    unit="m/s"
                    color="info"
                  />
                </Grid>
              </Grid>

              {/* جزئیات سنسورها */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      📈 شتاب‌سنج
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {sensorData.details.acceleration.isMoving ? "✅" : "❌"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {sensorData.details.acceleration.value.toFixed(2)} m/s²
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      🔄 ژیروسکوپ
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {sensorData.details.rotation.isMoving ? "✅" : "❌"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {sensorData.details.rotation.value.toFixed(1)} °/s
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      🚶 گام‌شمار
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {sensorData.details.steps.isMoving ? "✅" : "❌"}
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {stepCount || 0} کل
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* بخش Dead Reckoning */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <NavigationIcon sx={{ mr: 1 }} />
                Dead Reckoning (مستقل از GPS)
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="سرعت نهایی"
                    value={currentSpeed.toFixed(2)}
                    unit="m/s"
                    color={currentSpeed > 0 ? "success" : "default"}
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="حرکت آخر"
                    value={(lastDr?.moved || 0).toFixed(3)}
                    unit="m"
                    color="info"
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="انحراف از GPS"
                    value={deviation.toFixed(1)}
                    unit="m"
                    color={deviation < 5 ? "success" : deviation < 15 ? "warning" : "error"}
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="روش تشخیص"
                    value={lastDr?.movementMethod?.slice(0, 8) || "ندارد"}
                    color="secondary"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* GPS برای مقایسه */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                📡 GPS (فقط برای مقایسه)
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="سرعت GPS"
                    value={(lastGps?.speed || 0).toFixed(1)}
                    unit="m/s"
                    color="info"
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="دقت GPS"
                    value={gpsAccuracy.toFixed(1)}
                    unit="m"
                    color={gpsAccuracy < 10 ? "success" : gpsAccuracy < 20 ? "warning" : "error"}
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="جهت GPS"
                    value={movementDirection.toFixed(1)}
                    unit="°"
                    color="secondary"
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="تعداد نقاط"
                    value={points.length}
                    color="primary"
                  />
                </Grid>
              </Grid>

              {/* نمایش فرمول‌های محاسبه */}
              <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                  🔧 تنظیمات فعلی:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5, fontSize: '0.8rem' }}>
                  <strong>🎯 تشخیص حرکت:</strong> 100% مستقل از GPS
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5, fontSize: '0.8rem' }}>
                  <strong>📱 سنسورها:</strong> شتاب‌سنج + ژیروسکوپ + گام‌شمار
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5, fontSize: '0.8rem' }}>
                  <strong>🧭 جهت:</strong> قطب‌نمای کالیبره‌شده
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  <strong>🚀 GPS:</strong> فقط نقطه شروع + مقایسه
                </Typography>
              </Box>

              {/* موقعیت‌های دقیق */}
              {tracking && lastGps && lastDr && (
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    📍 موقعیت‌های دقیق:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                    <strong>GPS:</strong> {lastGps.latitude.toFixed(6)}, {lastGps.longitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    <strong>DR:</strong> {lastDr.latitude.toFixed(6)}, {lastDr.longitude.toFixed(6)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Box>

      {/* فضای خالی برای جلوگیری از پوشاندن محتوا */}
      <Box sx={{ height: '60px' }} />
    </>
  );
}
