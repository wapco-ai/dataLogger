import React, { useState, useRef } from "react";
import { Box, Button, Typography, LinearProgress, Collapse, Paper, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useNavigate } from "react-router-dom";

export default function CompassCalibrationPage() {
  const [running, setRunning] = useState(false);
  const [alpha, setAlpha] = useState("--");
  const [beta, setBeta] = useState("--");
  const [gamma, setGamma] = useState("--");
  const [heading, setHeading] = useState("--");
  const [accuracy, setAccuracy] = useState("--");
  const [count, setCount] = useState(0);
  const [quality, setQuality] = useState("--");
  const [qualityPercent, setQualityPercent] = useState(0);
  const [qualityColor, setQualityColor] = useState("error");
  const [status, setStatus] = useState("در انتظار شروع");
  const [desc, setDesc] = useState("روی دکمه شروع کلیک کنید");
  const [showGuide, setShowGuide] = useState(false);
  const [error, setError] = useState("");
  const readingsRef = useRef([]);
  const startTimeRef = useRef(null);
  const navigate = useNavigate();

  // ثابت و stable برای window event
  const handleOrientation = React.useCallback((event) => {
    if (!running) return;
    if (event.alpha == null) return;
    const _alpha = event.alpha;
    const _beta = event.beta;
    const _gamma = event.gamma;

    readingsRef.current.push({ alpha: _alpha, beta: _beta, gamma: _gamma });

    setAlpha(_alpha.toFixed(1) + "°");
    setBeta(_beta.toFixed(1) + "°");
    setGamma(_gamma.toFixed(1) + "°");
    setHeading(_alpha.toFixed(1) + "°");
    setCount(readingsRef.current.length);

    // بر اساس آخرین ۵۰ مقدار، دقت و کیفیت را بسنج
    if (readingsRef.current.length >= 10) {
      const last50 = readingsRef.current.slice(-50);
      const vals = last50.map(r => r.alpha);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = Math.sqrt(vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length);
      let q = "ضعیف", p = 20, c = "error";
      if (variance < 5) { q = "عالی"; p = 100; c = "success"; }
      else if (variance < 15) { q = "خوب"; p = 70; c = "warning"; }
      else if (variance < 30) { q = "متوسط"; p = 40; c = "warning"; }
      setQuality(q);
      setQualityPercent(p);
      setQualityColor(c);
      setAccuracy("±" + variance.toFixed(1) + "°");
    }
  }, [running]);

  // فقط یکبار، هنگام mount، تابع را روی ref ثابت بگذار تا همیشه قابل remove باشد
  const handlerRef = useRef();
  if (!handlerRef.current) handlerRef.current = (e) => handleOrientation(e);

  // تابع شروع بررسی
  const start = async () => {
    setError("");
    if (!window.DeviceOrientationEvent) {
      setError("سنسور جهت‌یابی پشتیبانی نمی‌شود.");
      return;
    }
    // iOS - Permission request
    if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
      try {
        const permission = await window.DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          setError("دسترسی به سنسور قطب‌نما توسط کاربر رد شد.");
          return;
        }
      } catch (err) {
        setError("خطا در درخواست دسترسی: " + err.message);
        return;
      }
    }
    // ریست مقدارها
    readingsRef.current = [];
    setAlpha("--");
    setBeta("--");
    setGamma("--");
    setHeading("--");
    setAccuracy("--");
    setCount(0);
    setQuality("--");
    setQualityPercent(0);
    setQualityColor("error");
    setStatus("در حال نظارت");
    setDesc("گوشی را حرکت دهید...");
    setRunning(true);
    startTimeRef.current = Date.now();

    window.addEventListener("deviceorientation", handlerRef.current);
  };

  // توقف
  const stop = () => {
    setRunning(false);
    window.removeEventListener("deviceorientation", handlerRef.current);
    // تحلیل دقت پس از پایان
    if (!readingsRef.current.length) {
      setStatus("خطا");
      setDesc("داده‌ای دریافت نشد. سنسور قطب‌نما کار نمی‌کند");
      setQuality("--");
      setQualityPercent(0);
      setQualityColor("error");
      return;
    }
    const vals = readingsRef.current.map(r => r.alpha);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = Math.sqrt(vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / vals.length);
    let q = "ضعیف", p = 20, c = "error", d = "نیاز به کالیبراسیون — گوشی را به شکل ۸ انگلیسی حرکت دهید";
    if (variance < 5) { q = "عالی"; p = 100; c = "success"; d = "کالیبراسیون عالی — قطب‌نما آماده استفاده است"; }
    else if (variance < 15) { q = "خوب"; p = 70; c = "warning"; d = "کالیبراسیون خوب — مناسب برای اغلب کاربردها"; }
    else if (variance < 30) { q = "متوسط"; p = 40; c = "warning"; d = "کالیبراسیون متوسط"; }
    setQuality(q);
    setQualityPercent(p);
    setQualityColor(c);
    setStatus(q);
    setDesc(d);
    setAccuracy("±" + variance.toFixed(1) + "°");
  };

  // تمیزکاری هنگام unmount
  React.useEffect(() => {
    return () => {
      window.removeEventListener("deviceorientation", handlerRef.current);
    };
  }, []);
  return (
    <Box sx={{
      maxWidth: 400,
      width: "100vw",
      minHeight: "100vh",
      mx: "auto",
      p: { xs: 1, sm: 2 },
      bgcolor: "#fafbfc",
      borderRadius: { xs: 0, sm: 5 },
      boxShadow: { xs: 0, sm: 6 },
      direction: "rtl",
      fontFamily: "'Vazirmatn', 'Vazir', Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      position: "relative",
    }}>
      <IconButton
        onClick={() => navigate("/")}
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          bgcolor: "#fff",
          boxShadow: 1,
        }}>
        <ArrowBackIosNewIcon />
      </IconButton>
      <Typography variant="h5" fontWeight="bold" align="center" color="primary" mb={2} sx={{ letterSpacing: "0.5px", mt: 2, mb: 2 }}>
        🧭 بررسی کالیبراسیون قطب‌نما
      </Typography>
      <Paper elevation={2} sx={{
        mb: 2, py: 2, px: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        bgcolor: "#f5f7fa", borderRadius: 3,
      }}>
        <Typography fontWeight="bold" fontSize={20} sx={{ my: 0.5 }}>
          {status}
        </Typography>
        <Typography variant="body2" sx={{ color: "#888", mb: -1 }}>
          {desc}
        </Typography>
      </Paper>
      <Box display="flex" gap={1} mb={2}>
        <Box sx={{ flex: 1, bgcolor: "#e6fce6", borderRadius: 2, px: 2, py: 1, textAlign: "center" }}>
          <Typography fontSize={13} color="#55a84f">دقت</Typography>
          <Typography fontWeight="bold" fontSize={19} color="#388e3c">
            {accuracy === "--" ? "--" : accuracy}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, bgcolor: "#e3f2fd", borderRadius: 2, px: 2, py: 1, textAlign: "center" }}>
          <Typography fontSize={13} color="#1976d2">جهت فعلی</Typography>
          <Typography fontWeight="bold" fontSize={19} color="#1976d2">
            {heading === "--" ? "--" : heading}
          </Typography>
        </Box>
      </Box>
      <Paper elevation={1} sx={{ mb: 2, p: 1.5, bgcolor: "#f7f8fa", borderRadius: 3, minHeight: 72, }}>
        <Typography fontWeight="bold" fontSize={15} sx={{ mb: 1 }}>
          <span role="img" aria-label="chart">📊</span> داده‌های سنسور:
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1, justifyContent: "center", }}>
          <Typography fontFamily="monospace" fontSize={15} color="#1976d2">
            Alpha (Z): {alpha}
          </Typography>
          <Typography fontFamily="monospace" fontSize={15} color="#388e3c">
            Beta (X): {beta}
          </Typography>
          <Typography fontFamily="monospace" fontSize={15} color="#fb8c00">
            Gamma (Y): {gamma}
          </Typography>
        </Box>
        <Typography variant="caption" color="#888">
          تعداد خوانش: <b>{count}</b>
        </Typography>
      </Paper>
      <Box mb={1} mt={0.5}>
        <Typography fontSize={14} color="#555" mb={0.5}>کیفیت کالیبراسیون:</Typography>
        <LinearProgress variant="determinate" value={qualityPercent}
          color={qualityColor}
          sx={{
            height: 7,
            borderRadius: 2,
            bgcolor: "#ffd4d4",
            "& .MuiLinearProgress-bar": { borderRadius: 2 },
          }}
        />
        <Typography fontWeight="bold"
          color={qualityColor === "success" ? "#388e3c" : qualityColor === "warning" ? "#fb8c00" : "#d32f2f"}
          fontSize={15}
          sx={{ mt: 0.5, textAlign: "center" }}
        >{quality}</Typography>
      </Box>
      <Box display="flex" gap={1.5} mb={2} mt={1}>
        <Button fullWidth size="large" variant="contained" color="primary"
          onClick={running ? stop : start}
          sx={{ fontWeight: "bold", fontSize: "16px", py: 1.3 }}
        >
          {running ? "⏹️ توقف" : "🎯 شروع بررسی"}
        </Button>
        <Button fullWidth size="large" variant="contained" color="warning"
          onClick={() => setShowGuide((g) => !g)}
          sx={{ fontWeight: "bold", fontSize: "16px", py: 1.3 }}>
          🔄 راهنمای کالیبراسیون
        </Button>
      </Box>
      <Collapse in={showGuide} sx={{ mb: 2 }}>
        <Paper sx={{ p: 2, bgcolor: "#fffbe6", borderRight: "4px solid #ff9800", mb: 2, borderRadius: 2, }}>
          <Typography fontWeight="bold" mb={1}>📋 دستورات کالیبراسیون:</Typography>
          <ol style={{ paddingRight: 18, margin: 0 }}>
            <li>گوشی را در دست بگیرید</li>
            <li>آن را به شکل عدد ۸ انگلیسی حرکت دهید</li>
            <li>در همه جهات بچرخانید</li>
            <li>حرکت را ۱۵ ثانیه ادامه دهید</li>
          </ol>
        </Paper>
      </Collapse>
      <Button
        startIcon={<ArrowBackIosNewIcon />}
        onClick={() => navigate("/")}
        fullWidth
        variant="outlined"
        color="secondary"
        sx={{
          mt: 0,
          fontWeight: "bold",
          fontSize: "16px",
          py: 1.2,
          borderRadius: 3,
          bgcolor: "#f8f8f8",
          "&:hover": { bgcolor: "#ececec" },
        }}
      >
        بازگشت به نقشه
      </Button>
      {error && (
        <Typography color="error" fontWeight="bold" align="center" mt={1}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
