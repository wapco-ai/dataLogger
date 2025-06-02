import React from "react";
import { Box, Typography } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import useCompassCalibration from "../hooks/useCompassCalibration";

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
          {error || "کالیبراسیون سنسور مورد نیاز است."}
          {/* <Typography
            variant="body2"
            sx={{ display: "inline", ml: 1, fontWeight: "normal" }}
          >
            <span>گوشی را به شکل عدد <b>۸</b> انگلیسی تکان دهید</span>
          </Typography> */}
        </>
      )}
    </Box>
  );
}
