
import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// Hook ساده برای بررسی کالیبراسیون
function useCompassCalibration() {
  const [calibrated, setCalibratedStatus] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // بررسی وجود northAngle در localStorage
    const northAngle = localStorage.getItem('northAngle');
    
    if (northAngle && Number(northAngle) !== 0) {
      setCalibratedStatus(true);
      setError("");
    } else {
      setCalibratedStatus(false);
      setError("نیاز به کالیبراسیون شمال");
    }

    // بررسی دسترسی به سنسور
    if (!window.DeviceOrientationEvent) {
      setCalibratedStatus(false);
      setError("سنسور قطب‌نما پشتیبانی نمی‌شود");
    }
  }, []);

  return { calibrated, error };
}

export default function CompassStatus() {
  const { calibrated, error } = useCompassCalibration();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: calibrated ? "#e8f5e9" : "#fff3e0",
        color: calibrated ? "#388e3c" : "#d32f2f",
        fontWeight: "bold",
        borderRadius: 2,
        p: 1,
        my: 1,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        fontSize: "15px"
      }}
    >
      {calibrated ? (
        <>
          <ExploreIcon sx={{ mr: 1 }} />
          سنسور قطب‌نما کالیبره است
        </>
      ) : (
        <>
          <WarningAmberIcon sx={{ mr: 1 }} />
          {error || "کالیبراسیون سنسور مورد نیاز است"}
          <Typography
            variant="body2"
            sx={{ display: "inline", ml: 1, fontWeight: "normal" }}
          >
            <span>گوشی را به شکل عدد <b>۸</b> انگلیسی تکان دهید</span>
          </Typography>
        </>
      )}
    </Box>
  );
}
