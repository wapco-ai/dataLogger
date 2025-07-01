import React, { useState } from "react";
import {
  Box, Typography, Button, Chip, TextField, Checkbox,
  FormControlLabel, IconButton, Divider, Select, MenuItem, FormGroup, Stack, Paper
} from "@mui/material";
import DatePicker from "react-multi-date-picker";
import DeleteIcon from "@mui/icons-material/Delete";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import { genders, prayerEvents } from "./groupData";

const calendars = {
  shamsi: { calendar: persian, locale: persian_fa },
  miladi: { calendar: gregorian, locale: gregorian_fa }
};

function TimeRestrictionsFull({ value = [], onChange }) {
  const [calendarType, setCalendarType] = useState("shamsi");
  const [selectedDays, setSelectedDays] = useState([]);
  const [dayData, setDayData] = useState({});
  const [prayerEvent, setPrayerEvent] = useState("");
  const [tolBefore, setTolBefore] = useState("");
  const [tolAfter, setTolAfter] = useState("");
  const [items, setItems] = useState(value || []);
  const [error, setError] = useState("");

  // مدیریت انتخاب روزها
  const handleDaySelect = (dates) => {
    const days = dates.map(d => d.format("YYYY/MM/DD"));
    setSelectedDays(days);
    setDayData(prev => {
      const newData = { ...prev };
      days.forEach(day => {
        if (!newData[day])
          newData[day] = {
            allDay: false,
            timeSlots: [{ from: "", to: "" }],
            allowedGenders: []
          };
      });
      Object.keys(newData).forEach(day => {
        if (!days.includes(day)) delete newData[day];
      });
      return newData;
    });
  };

  const handleAllDay = (day, checked) => {
    setDayData(prev => ({
      ...prev,
      [day]: { ...prev[day], allDay: checked }
    }));
  };

  const addTimeSlot = (day) => {
    setDayData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { from: "", to: "" }]
      }
    }));
  };

  const removeTimeSlot = (day, idx) => {
    setDayData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== idx)
      }
    }));
  };

  const handleTimeChange = (day, idx, field, value) => {
    setDayData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) =>
          i === idx ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const handleGenderChange = (day, value) => {
    setDayData(prev => {
      const arr = prev[day].allowedGenders.includes(value)
        ? prev[day].allowedGenders.filter(v => v !== value)
        : [...prev[day].allowedGenders, value];
      return {
        ...prev,
        [day]: { ...prev[day], allowedGenders: arr }
      };
    });
  };

  // افزودن محدودیت روز/ساعت
  const handleAddDayLimit = () => {
    setError("");
    if (selectedDays.length === 0) {
      setError("حداقل یک روز انتخاب شود.");
      return;
    }
    for (const day of selectedDays) {
      const data = dayData[day];
      if (!data.allDay) {
        const valid = data.timeSlots.some(s => s.from && s.to);
        if (!valid) {
          setError("برای همه روزها بازه ساعت معتبر وارد کنید یا 'تمام روز' را فعال کنید.");
          return;
        }
      }
      // الزام انتخاب جنسیت: حداقل یک تیک
      if (!data.allowedGenders || data.allowedGenders.length === 0) {
        setError("برای هر محدودیت، حداقل یک جنسیت مجاز را انتخاب کنید.");
        return;
      }
    }
    const result = selectedDays.map(day => ({
      type: "customTime",
      day,
      allDay: dayData[day].allDay,
      timeSlots: dayData[day].allDay ? [{ from: "00:00", to: "23:59" }] : dayData[day].timeSlots.filter(s => s.from && s.to),
      allowedGenders: dayData[day].allowedGenders
    }));
    const newItems = [...items, ...result];
    setItems(newItems);
    if (onChange) onChange(newItems);
    setSelectedDays([]);
    setDayData({});
  };

  // اوقات شرعی
  const handleAddPrayer = () => {
    setError("");
    if (!prayerEvent || (tolBefore === "" && tolAfter === "")) {
      setError("رویداد و دقیقه قبل/بعد را وارد کنید.");
      return;
    }
    const newItem = {
      type: "prayerEvent",
      prayerEvent,
      toleranceBefore: Number(tolBefore),
      toleranceAfter: Number(tolAfter)
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    if (onChange) onChange(newItems);
    setPrayerEvent("");
    setTolBefore("");
    setTolAfter("");
  };

  const handleRemove = idx => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    if (onChange) onChange(newItems);
  };

  return (
    <Paper elevation={0} sx={{ p: 2, bgcolor: "#f6fafd", borderRadius: 5, mt: 2 }}>
      <Typography fontWeight="bold" fontSize={16} mb={2} color="#125">
        محدودیت بر اساس روز، ساعت و جنسیت
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Select
          value={calendarType}
          onChange={e => setCalendarType(e.target.value)}
          sx={{ minWidth: 90, fontWeight: 'bold', bgcolor: "#fff", borderRadius: 3 }}
          size="small"
        >
          <MenuItem value="shamsi">شمسی</MenuItem>
          <MenuItem value="miladi">میلادی</MenuItem>
        </Select>
        <DatePicker
          multiple
          calendar={calendars[calendarType].calendar}
          locale={calendars[calendarType].locale}
          value={selectedDays}
          onChange={handleDaySelect}
          format="YYYY/MM/DD"
          style={{ direction: "ltr", minWidth: 200, borderRadius: 12, background: "#fff" }}
        />
      </Stack>
      <Box>
        {selectedDays.map(day => (
          <Paper elevation={2} key={day} sx={{ bgcolor: "#fff", borderRadius: 4, p: 2, mb: 2 }}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Chip label={day} color="info" sx={{ fontWeight: "bold", fontSize: 15 }} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dayData[day]?.allDay || false}
                    onChange={e => handleAllDay(day, e.target.checked)}
                  />
                }
                label="تمام روز"
                sx={{ fontWeight: "bold" }}
              />
            </Box>
            <FormGroup row sx={{ mb: 2 }}>
              {genders.map(g => (
                <FormControlLabel
                  key={g.value}
                  control={
                    <Checkbox
                      checked={dayData[day]?.allowedGenders?.includes(g.value) || false}
                      onChange={() => handleGenderChange(day, g.value)}
                    />
                  }
                  label={<Typography fontWeight="bold" fontSize={14}>{g.label}</Typography>}
                  sx={{ mr: 1 }}
                />
              ))}
            </FormGroup>
            {!dayData[day]?.allDay && (
              <Box>
                {dayData[day]?.timeSlots?.map((slot, idx) => (
                  <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                    <TextField
                      label="از"
                      type="time"
                      value={slot.from}
                      onChange={e => handleTimeChange(day, idx, "from", e.target.value)}
                      inputProps={{
                        step: 60,
                        min: "00:00",
                        max: "23:59"
                      }}
                      size="small"
                      sx={{ width: 110, bgcolor: "#f6fafd", borderRadius: 2 }}
                    />
                    <TextField
                      label="تا"
                      type="time"
                      value={slot.to}
                      onChange={e => handleTimeChange(day, idx, "to", e.target.value)}
                      inputProps={{
                        step: 60,
                        min: "00:00",
                        max: "23:59"
                      }}
                      size="small"
                      sx={{ width: 110, bgcolor: "#f6fafd", borderRadius: 2 }}
                    />
                    <IconButton
                      onClick={() => removeTimeSlot(day, idx)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  onClick={() => addTimeSlot(day)}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: "bold", borderRadius: 3, mb: 1, mt: 0.5 }}
                >
                  افزودن بازه ساعت
                </Button>
              </Box>
            )}
          </Paper>
        ))}
      </Box>
      <Button
        onClick={handleAddDayLimit}
        variant="contained"
        color="primary"
        fullWidth
        sx={{ fontWeight: 'bold', borderRadius: 4, py: 1, mb: 1 }}
      >
        افزودن محدودیت زمانی
      </Button>
      <Divider sx={{ my: 3 }} />

      <Typography fontWeight="bold" fontSize={16} mb={2} color="#125">
        محدودیت بر اساس اوقات شرعی (برای همه روزها)
      </Typography>
      <Stack direction="row" spacing={2} mb={1}>
        <Select
          value={prayerEvent}
          onChange={e => setPrayerEvent(e.target.value)}
          sx={{ minWidth: 110, bgcolor: "#fff", borderRadius: 3 }}
          size="small"
          displayEmpty
        >
          <MenuItem value="">انتخاب رویداد</MenuItem>
          {prayerEvents.map(e => (
            <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
          ))}
        </Select>
        <TextField
          label="دقیقه قبل"
          type="number"
          value={tolBefore}
          onChange={e => setTolBefore(e.target.value)}
          size="small"
          sx={{ width: 110, bgcolor: "#fff", borderRadius: 2 }}
        />
        <TextField
          label="دقیقه بعد"
          type="number"
          value={tolAfter}
          onChange={e => setTolAfter(e.target.value)}
          size="small"
          sx={{ width: 110, bgcolor: "#fff", borderRadius: 2 }}
        />
      </Stack>
      <Button
        onClick={handleAddPrayer}
        variant="contained"
        color="primary"
        fullWidth
        sx={{ fontWeight: 'bold', borderRadius: 4, py: 1, mb: 2 }}
      >
        افزودن محدودیت اوقات شرعی
      </Button>
      {error && (
        <Typography color="error" fontSize={14} mb={2} mt={1} align="center">{error}</Typography>
      )}
      <Divider sx={{ my: 2 }} />
      <Typography fontWeight="bold" fontSize={16} mb={1}>
        محدودیت‌های ثبت شده:
      </Typography>
      {items.length === 0 && (
        <Typography fontSize={14} color="text.secondary" mb={2}>هنوز محدودیتی ثبت نشده است.</Typography>
      )}
      {items.map((item, idx) => (
        <Chip
          key={idx}
          label={
            item.type === "customTime"
              ? (item.allDay
                ? `${item.day}: تمام روز (${item.allowedGenders.map(g => genders.find(x => x.value === g)?.label).join("، ")})`
                : `${item.day}: ${item.timeSlots.map(s => `${s.from}–${s.to}`).join(", ")} (${item.allowedGenders.map(g => genders.find(x => x.value === g)?.label).join("، ")})`
              )
              : `همه روزها: ${prayerEvents.find(e => e.value === item.prayerEvent)?.label
                } (${item.toleranceBefore}دقیقه قبل تا ${item.toleranceAfter}دقیقه بعد)`
          }
          onDelete={() => handleRemove(idx)}
          color="secondary"
          sx={{ width: "100%", fontSize: 14, mb: 1, direction: "rtl", fontWeight: "bold" }}
        />
      ))}
    </Paper>
  );
}

export default TimeRestrictionsFull;
