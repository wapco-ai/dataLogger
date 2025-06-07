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
  
  // ✅ فرمول صحیح همانند useDualTracking
  const calibratedHeading = northAngle !== 0 ? 
    (rawCompassHeading - northAngle + 360) % 360 : rawCompassHeading;
  
  const lastGps = points.length ? points[points.length - 1]?.gps : null;
  const lastDr = points.length ? points[points.length - 1]?.dr : null;
  
  // محاسبه سرعت و فاصله
  const currentSpeed = lastGps?.speed || 0;
  const gpsAccuracy = lastGps?.accuracy || 0;
  
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
  const ValueDisplay = ({ label, value, unit = "", color = "primary", icon, size = "small" }) => (
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
          
          {/* 🎯 هدر کامپکت - همیشه نمایان */}
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
            
            {/* آیکون و تیتر */}
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
                    e.stopPropagation(); // جلوگیری از باز/بسته شدن پنل
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
              <Chip 
                label={`${calibratedHeading.toFixed(0)}°`}
                color={isCalibrated ? "success" : "warning"}
                size="small"
                sx={{ fontSize: '0.7rem', minWidth: '45px' }}
              />
              <Chip 
                label={`DR: ${drHeading.toFixed(0)}°`}
                color="warning"
                size="small"
                sx={{ fontSize: '0.7rem', minWidth: '55px' }}
              />
              <Chip 
                label={`${deviation.toFixed(1)}m`}
                color={deviation < 5 ? "success" : deviation < 15 ? "warning" : "error"}
                size="small"
                sx={{ fontSize: '0.7rem', minWidth: '50px' }}
              />
              <Chip 
                label={`${points.length}`}
                color="info"
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

          {/* 🎯 محتوای کامل - فقط هنگام باز بودن */}
          <Collapse in={expanded} timeout={300}>
            <Box sx={{ 
              p: 2, 
              maxHeight: 'calc(80vh - 60px)', 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
              },
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
                      label="انحراف"
                      value={(rawCompassHeading - northAngle).toFixed(1)}
                      unit="°"
                      color="secondary"
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

              {/* بخش Dead Reckoning */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <NavigationIcon sx={{ mr: 1 }} />
                Dead Reckoning
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <ValueDisplay 
                    label="جهت DR"
                    value={drHeading.toFixed(1)}
                    unit="°"
                    color="warning"
                  />
                </Grid>
                <Grid item xs={4}>
                  <ValueDisplay 
                    label="جهت حرکت GPS"
                    value={movementDirection.toFixed(1)}
                    unit="°"
                    color="secondary"
                  />
                </Grid>
                <Grid item xs={4}>
                  <ValueDisplay 
                    label="خطای DR"
                    value={deviation.toFixed(1)}
                    unit="m"
                    color={deviation < 5 ? "success" : deviation < 15 ? "warning" : "error"}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* بخش GPS و دقت */}
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                📡 GPS و سرعت
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="سرعت"
                    value={currentSpeed.toFixed(1)}
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
                    label="تعداد نقاط"
                    value={points.length}
                    color="secondary"
                  />
                </Grid>
                <Grid item xs={3}>
                  <ValueDisplay 
                    label="وضعیت"
                    value={tracking ? "فعال" : "متوقف"}
                    color={tracking ? "success" : "default"}
                  />
                </Grid>
              </Grid>

              {/* موقعیت‌های دقیق فقط در حالت فعال */}
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

      {/* 🎯 فضای خالی برای جلوگیری از پوشاندن محتوا */}
      <Box sx={{ height: '60px' }} />
    </>
  );
}
