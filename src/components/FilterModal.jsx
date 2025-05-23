import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Box,
  Divider
} from "@mui/material";

const markerTypes = [
  { value: "checkpoint", label: "نقطه بازرسی" },
  { value: "landmark", label: "نشانه" },
  { value: "poi", label: "نقطه دلخواه" },
  { value: "other", label: "سایر" },
];

const pathTypes = [
  { value: "hiking", label: "پیاده‌روی" },
  { value: "driving", label: "رانندگی" },
  { value: "other", label: "سایر" },
];

export default function FilterModal({ isOpen, onClose, filterOptions, setFilterOptions }) {
  const toggleOption = (category, value) => {
    setFilterOptions(prev => {
      const arr = prev[category] || [];
      return {
        ...prev,
        [category]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value]
      };
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>فیلترسازی</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            نوع نشانگر
          </Typography>
          <FormGroup>
            {markerTypes.map(type => (
              <FormControlLabel
                key={type.value}
                control={
                  <Checkbox
                    checked={filterOptions.markerTypes.includes(type.value)}
                    onChange={() => toggleOption("markerTypes", type.value)}
                  />
                }
                label={type.label}
              />
            ))}
          </FormGroup>
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            نوع مسیر
          </Typography>
          <FormGroup>
            {pathTypes.map(type => (
              <FormControlLabel
                key={type.value}
                control={
                  <Checkbox
                    checked={filterOptions.pathTypes.includes(type.value)}
                    onChange={() => toggleOption("pathTypes", type.value)}
                  />
                }
                label={type.label}
              />
            ))}
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="primary"
          fullWidth
          variant="contained"
          sx={{ fontWeight: "bold", borderRadius: 2 }}
        >
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
