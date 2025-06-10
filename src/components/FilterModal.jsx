import React, { useMemo } from "react";
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
import { groups, subGroups } from "./groupData";

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

  const toggleGeometry = (key) => {
    setFilterOptions(prev => ({
      ...prev,
      geometry: { ...prev.geometry, [key]: !prev.geometry[key] }
    }));
  };

  const availableSubGroups = useMemo(() => {
    if (!filterOptions.groups || filterOptions.groups.length === 0) return [];
    return filterOptions.groups.flatMap(g => subGroups[g] || []);
  }, [filterOptions.groups]);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: "bold", textAlign: "center" }}>فیلترسازی</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            لایه‌ها
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={<Checkbox checked={filterOptions.geometry.markers} onChange={() => toggleGeometry('markers')} />}
              label="Markers"
            />
            <FormControlLabel
              control={<Checkbox checked={filterOptions.geometry.paths} onChange={() => toggleGeometry('paths')} />}
              label="Paths"
            />
            <FormControlLabel
              control={<Checkbox checked={filterOptions.geometry.polygons} onChange={() => toggleGeometry('polygons')} />}
              label="Polygons"
            />
          </FormGroup>
        </Box>

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

        <Divider sx={{ my: 1 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>گروه اصلی</Typography>
          <FormGroup>
            {groups.map(gr => (
              <FormControlLabel
                key={gr.value}
                control={
                  <Checkbox
                    checked={filterOptions.groups.includes(gr.value)}
                    onChange={() => toggleOption('groups', gr.value)}
                  />
                }
                label={gr.label}
              />
            ))}
          </FormGroup>
        </Box>

        {availableSubGroups.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>زیرگروه</Typography>
            <FormGroup>
              {availableSubGroups.map(sg => (
                <FormControlLabel
                  key={sg}
                  control={
                    <Checkbox
                      checked={filterOptions.subGroups.includes(sg)}
                      onChange={() => toggleOption('subGroups', sg)}
                    />
                  }
                  label={sg}
                />
              ))}
            </FormGroup>
          </Box>
        )}
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
