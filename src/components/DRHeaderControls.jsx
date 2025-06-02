import { Box, Typography, Tooltip, IconButton, Chip, Paper } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// props: { calibrateHeadingOffset, offset, compassStatus }
export function DRHeaderControls({ calibrateHeadingOffset, offset = 0, compassStatus = "سنسور قطب‌نما کالیبره است" }) {
  return (
    <Box sx={{
      px: 1.5, pt: 1, pb: 0.5,
      mb: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch"
    }}>
      {/* تیتر جمع‌وجور */}
      {/* <Typography variant="h6" fontWeight="bold" fontSize={17} mb={0.5} sx={{ textAlign: "center", letterSpacing: 0.1 }}>
        تست مسیر GPS/DR
      </Typography> */}
      <Typography fontSize={13} color="text.secondary" sx={{ textAlign: "center", mb: 1 }}>
        مسیر آزمایشی مقایسه GPS و Dead Reckoning
      </Typography>

      {/* ردیف دکمه و افست */}
      <Box sx={{
        display: "flex", alignItems: "center",
        justifyContent: "center", gap: 1, mb: 1
      }}>
        <Tooltip title="گوشی را رو به شمال واقعی بگیرید و سپس این دکمه را بزنید">
          <Paper elevation={3} sx={{
            bgcolor: "#1976d2",
            borderRadius: 3, px: 2, py: 0.5, boxShadow: 1,
            display: "flex", alignItems: "center", cursor: "pointer"
          }}
            onClick={calibrateHeadingOffset}
          >
            <ExploreIcon sx={{ color: "#fff", mr: 0.5 }} />
            <Typography sx={{
              color: "#fff", fontWeight: "bold", fontSize: 14
            }}>
              کالیبره جهت DR
            </Typography>
          </Paper>
        </Tooltip>
        <Chip
          label={`افست فعلی: ${Math.round(offset)}°`}
          sx={{
            bgcolor: "#f3f5fb", color: "#1976d2",
            fontWeight: "bold", fontSize: 12,
            height: 32, borderRadius: 2
          }}
        />
      </Box>

      {/* پیام وضعیت کالیبراسیون قطب‌نما */}
      <Paper elevation={0} sx={{
        display: "flex", alignItems: "center",
        bgcolor: "#e7fbe7", color: "#388e3c", px: 1.3, py: 0.7, borderRadius: 2,
        mb: 0.5, justifyContent: "center"
      }}>
        <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography sx={{ fontWeight: "bold", fontSize: 13 }}>
          {compassStatus}
        </Typography>
      </Paper>
    </Box>
  )
}
