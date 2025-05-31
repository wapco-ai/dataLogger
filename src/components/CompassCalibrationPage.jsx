import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Collapse,
  Paper,
  Grid,
  IconButton
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ExploreIcon from "@mui/icons-material/Explore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/Info";
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { useNavigate } from "react-router-dom";

const initialState = {
  running: false,
  count: 0,
  readings: [],
  heading: "--",
  accuracy: "--",
  alpha: "--",
  beta: "--",
  gamma: "--",
  quality: "--",
  qualityPercent: 0,
  qualityColor: "error",
  desc: "در حال بررسی...",
  status: "در انتظار شروع",
  statusIcon: <InfoIcon color="primary" sx={{ fontSize: 40 }} />,
  ready: false,
};

export default function CompassCalibrationPage() {
  const [state, setState] = useState(initialState);
  const [showGuide, setShowGuide] = useState(false);
  const [error, setError] = useState(null);
  const watcher = useRef(null);
  const navigate = useNavigate();

  const variance = (values) => {
    if (!values.length) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const v = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(v);
  };

  const calcQuality = (varAlpha) => {
    if (varAlpha < 5)
      return { text: "عالی", percent: 100, color: "success" };
    if (varAlpha < 15)
      return { text: "خوب", percent: 70, color: "warning" };
    if (varAlpha < 30)
      return { text: "متوسط", percent: 40, color: "warning" };
    return { text: "ضعیف", percent: 20, color: "error" };
  };

  const handleOrientation = (event) => {
    if (!state.running) return;
    const { alpha, beta, gamma } = event;
    if (alpha == null) return;
    const readings = [...state.readings, { alpha, beta, gamma }];
    const heading = alpha.toFixed(1) + "°";
    const count = state.count + 1;
    const last50 = readings.slice(-50);
    const varAlpha = variance(last50.map((r) => r.alpha));
    const quality = calcQuality(varAlpha);

    setState((s) => ({
      ...s,
      readings,
      count,
      heading,
      alpha: alpha.toFixed(1) + "°",
      beta: beta.toFixed(1) + "°",
      gamma: gamma.toFixed(1) + "°",
      accuracy: `±${varAlpha.toFixed(1)}°`,
      quality: quality.text,
      qualityPercent: quality.percent,
      qualityColor: quality.color,
      desc: "در حال بررسی...",
      status: "در حال نظارت",
      statusIcon: <ExploreIcon color="primary" sx={{ fontSize: 40 }} />,
      ready: false,
    }));
  };

  const start = async () => {
    setError(null);

    if (!window.DeviceOrientationEvent) {
      setError("سنسور جهت‌یابی توسط این دستگاه پشتیبانی نمی‌شود.");
      return;
    }
    if (
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          setError("دسترسی به سنسور قطب‌نما توسط کاربر رد شد.");
          return;
        }
      } catch (err) {
        setError("خطا در درخواست دسترسی: " + err.message);
        return;
      }
    }

    setState({
      ...initialState,
      running: true,
      status: "در حال نظارت",
      desc: "گوشی را حرکت دهید...",
      statusIcon: <ExploreIcon color="primary" sx={{ fontSize: 40 }} />,
      ready: false,
    });
    watcher.current = handleOrientation;
    window.addEventListener("deviceorientation", watcher.current);
  };

  const stop = () => {
    window.removeEventListener("deviceorientation", watcher.current);
    analyze();
    setState((s) => ({
      ...s,
      running: false,
      status: "پایان بررسی",
      statusIcon: <InfoIcon color="primary" sx={{ fontSize: 40 }} />,
    }));
  };

  // این تابع آماده بودن سنسور را چک می‌کند
  React.useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setState(s => ({ ...s, ready: false }));
      return;
    }
    setState(s => ({
      ...s,
      status: "آماده بررسی",
      desc: "روی دکمه شروع کلیک کنید",
      statusIcon: <CheckBoxIcon color="success" sx={{ fontSize: 48 }} />,
      ready: true,
    }));
  }, []);

  const analyze = () => {
    const readings = state.readings;
    if (!readings.length) {
      setError("داده‌ای دریافت نشد. سنسور قطب‌نما کار نمی‌کند.");
      setState((s) => ({
        ...s,
        desc: "سنسور قطب‌نما کار نمی‌کند",
        status: "خطا",
        statusIcon: <WarningAmberIcon color="error" sx={{ fontSize: 40 }} />,
      }));
      return;
    }
    const varAlpha = variance(readings.map((r) => r.alpha));
    const quality = calcQuality(varAlpha);

    setState((s) => ({
      ...s,
      desc:
        varAlpha < 5
          ? "کالیبراسیون عالی — قطب‌نما آماده استفاده است"
          : varAlpha < 15
          ? "کالیبراسیون خوب — مناسب برای اغلب کاربردها"
          : "نیاز به کالیبراسیون — گوشی را به شکل ۸ انگلیسی حرکت دهید",
      status:
        varAlpha < 5
          ? "عالی"
          : varAlpha < 15
          ? "خوب"
          : "ضعیف",
      quality: quality.text,
      qualityPercent: quality.percent,
      qualityColor: quality.color,
      accuracy: `±${varAlpha.toFixed(1)}°`,
      statusIcon:
        varAlpha < 15 ? (
          <ExploreIcon color="success" sx={{ fontSize: 40 }} />
        ) : (
          <WarningAmberIcon color="warning" sx={{ fontSize: 40 }} />
        ),
    }));
  };

  return (
    <Box
      sx={{
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
      }}
    >
      {/* دکمه بازگشت بالا سمت چپ */}
      <IconButton
        onClick={() => navigate("/")}
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10,
          bgcolor: "#fff",
          boxShadow: 1,
        }}
      >
        <ArrowBackIosNewIcon />
      </IconButton>

      <Typography
        variant="h5"
        fontWeight="bold"
        align="center"
        color="primary"
        mb={2}
        sx={{ letterSpacing: "0.5px", mt: 2, mb: 2 }}
      >
        🧭 بررسی کالیبراسیون قطب‌نما
      </Typography>

      {/* کارت وضعیت */}
      <Paper
        elevation={2}
        sx={{
          mb: 2,
          py: 2,
          px: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: state.ready ? "#e6fce6" : "#f5f7fa",
          border: state.ready ? "2px solid #22bb55" : "2px solid #f2f2f2",
          borderRadius: 3,
        }}
      >
        <div style={{ fontSize: 44 }}>{state.statusIcon}</div>
        <Typography fontWeight="bold" fontSize={20} sx={{ my: 0.5 }}>
          {state.ready ? "آماده بررسی" : state.status}
        </Typography>
        <Typography variant="body2" sx={{ color: "#888", mb: -1 }}>
          {state.desc}
        </Typography>
      </Paper>

      {/* دو کارت وضعیت کوچک (دقت و جهت) */}
      <Box display="flex" gap={1} mb={2}>
        <Box
          sx={{
            flex: 1,
            bgcolor: "#e6fce6",
            borderRadius: 2,
            px: 2,
            py: 1,
            textAlign: "center",
          }}
        >
          <Typography fontSize={13} color="#55a84f">
            دقت
          </Typography>
          <Typography fontWeight="bold" fontSize={19} color="#388e3c">
            {state.accuracy === "--" ? "--" : state.accuracy}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            bgcolor: "#e3f2fd",
            borderRadius: 2,
            px: 2,
            py: 1,
            textAlign: "center",
          }}
        >
          <Typography fontSize={13} color="#1976d2">
            جهت فعلی
          </Typography>
          <Typography fontWeight="bold" fontSize={19} color="#1976d2">
            {state.heading === "--" ? "--" : state.heading}
          </Typography>
        </Box>
      </Box>

      {/* کارت داده‌های سنسور */}
      <Paper
        elevation={1}
        sx={{
          mb: 2,
          p: 1.5,
          bgcolor: "#f7f8fa",
          borderRadius: 3,
          minHeight: 72,
        }}
      >
        <Typography fontWeight="bold" fontSize={15} sx={{ mb: 1 }}>
          <span role="img" aria-label="chart">
            📊
          </span>{" "}
          داده‌های سنسور:
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            mb: 1,
            justifyContent: "center",
          }}
        >
          <Typography fontFamily="monospace" fontSize={15} color="#1976d2">
            Alpha (Z): {state.alpha === "--" ? "--" : state.alpha}
          </Typography>
          <Typography fontFamily="monospace" fontSize={15} color="#388e3c">
            Beta (X): {state.beta === "--" ? "--" : state.beta}
          </Typography>
          <Typography fontFamily="monospace" fontSize={15} color="#fb8c00">
            Gamma (Y): {state.gamma === "--" ? "--" : state.gamma}
          </Typography>
        </Box>
        <Typography variant="caption" color="#888">
          تعداد خوانش: <b>{state.count}</b>
        </Typography>
      </Paper>

      {/* کیفیت کالیبراسیون */}
      <Box mb={1} mt={0.5}>
        <Typography fontSize={14} color="#555" mb={0.5}>
          کیفیت کالیبراسیون:
        </Typography>
        <LinearProgress
          variant="determinate"
          value={state.qualityPercent}
          color={state.qualityColor}
          sx={{
            height: 7,
            borderRadius: 2,
            bgcolor: "#ffd4d4",
            "& .MuiLinearProgress-bar": {
              borderRadius: 2,
            },
          }}
        />
        <Typography
          fontWeight="bold"
          color={
            state.qualityColor === "success"
              ? "#388e3c"
              : state.qualityColor === "warning"
              ? "#fb8c00"
              : "#d32f2f"
          }
          fontSize={15}
          sx={{ mt: 0.5, textAlign: "center" }}
        >
          {state.quality === "--" ? "--" : state.quality}
        </Typography>
      </Box>

      {/* دکمه‌های اصلی */}
      <Box display="flex" gap={1.5} mb={2} mt={1}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          color="primary"
          onClick={state.running ? stop : start}
          sx={{ fontWeight: "bold", fontSize: "16px", py: 1.3 }}
        >
          🎯 شروع بررسی
        </Button>
        <Button
          fullWidth
          size="large"
          variant="contained"
          color="warning"
          onClick={() => setShowGuide((g) => !g)}
          sx={{ fontWeight: "bold", fontSize: "16px", py: 1.3 }}
        >
          🔄 راهنمای کالیبراسیون
        </Button>
      </Box>

      {/* راهنما */}
      <Collapse in={showGuide} sx={{ mb: 2 }}>
        <Paper
          sx={{
            p: 2,
            bgcolor: "#fffbe6",
            borderRight: "4px solid #ff9800",
            mb: 2,
            borderRadius: 2,
          }}
        >
          <Typography fontWeight="bold" mb={1}>
            📋 دستورات کالیبراسیون:
          </Typography>
          <ol style={{ paddingRight: 18, margin: 0 }}>
            <li>گوشی را در دست بگیرید</li>
            <li>آن را به شکل عدد ۸ انگلیسی حرکت دهید</li>
            <li>در همه جهات بچرخانید</li>
            <li>حرکت را ۱۵ ثانیه ادامه دهید</li>
          </ol>
        </Paper>
      </Collapse>

      {/* دکمه بازگشت پایین */}
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
