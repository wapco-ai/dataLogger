import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    FormGroup, FormControlLabel, Checkbox, Radio, RadioGroup, Button,
    Grid, IconButton, Typography,
    Box, Collapse, Paper, Chip, Switch
} from '@mui/material';
import { AddCircle, Delete, AddCircleOutline } from "@mui/icons-material";

// Days in Persian
const daysOfWeek = [
    { key: "saturday", label: "شنبه" },
    { key: "sunday", label: "یک‌شنبه" },
    { key: "monday", label: "دوشنبه" },
    { key: "tuesday", label: "سه‌شنبه" },
    { key: "wednesday", label: "چهارشنبه" },
    { key: "thursday", label: "پنج‌شنبه" },
    { key: "friday", label: "جمعه" },
];

function PolygonModal({ onSave, onClose, polygonCoordinates }) {
    const [data, setData] = useState({
        name: '', description: '', type: '',
        transportModes: { wheelchair: false, electricVan: false, walking: false },
        gender: '',
    });
    const [error, setError] = useState('');
    const [restrictedTimes, setRestrictedTimes] = useState({});

    const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
    const handleTransportModeChange = (mode) => setData(prev => ({
        ...prev,
        transportModes: { ...prev.transportModes, [mode]: !prev.transportModes[mode] }
    }));

    const handleSave = () => {
        if (!data.name.trim()) {
            setError('نام محدوده را وارد کنید');
            return;
        }
        const selectedTransportModes = Object.keys(data.transportModes).filter(mode => data.transportModes[mode]);
        onSave({
            ...data,
            transportModes: selectedTransportModes,
            coordinates: polygonCoordinates,
            restrictedTimes, // <-- add this line!
            timestamp: new Date().toISOString()
        });
        onClose();
    };


    return (
        <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>ایجاد محدوده جدید</DialogTitle>
            <DialogContent dividers>
                {error && <div style={{ color: 'red', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
                <TextField label="نام محدوده" fullWidth margin="normal"
                    value={data.name} onChange={e => handleChange('name', e.target.value)} required />
                <TextField label="توضیحات" fullWidth margin="normal" multiline rows={3}
                    value={data.description} onChange={e => handleChange('description', e.target.value)} />
                <FormControl fullWidth margin="normal">
                    <InputLabel>نوع محدوده</InputLabel>
                    <Select value={data.type} onChange={e => handleChange('type', e.target.value)} label="نوع محدوده">
                        <MenuItem value="park">پارک</MenuItem>
                        <MenuItem value="zone">محدوده</MenuItem>
                        <MenuItem value="other">سایر</MenuItem>
                    </Select>
                </FormControl>
                <FormControl component="fieldset" fullWidth margin="normal">
                    <InputLabel shrink>شیوه‌های حمل و نقل</InputLabel>
                    <FormGroup>
                        <FormControlLabel control={
                            <Checkbox checked={data.transportModes.wheelchair} onChange={() => handleTransportModeChange('wheelchair')} />
                        } label="ویلچر" />
                        <FormControlLabel control={
                            <Checkbox checked={data.transportModes.electricVan} onChange={() => handleTransportModeChange('electricVan')} />
                        } label="ون برقی" />
                        <FormControlLabel control={
                            <Checkbox checked={data.transportModes.walking} onChange={() => handleTransportModeChange('walking')} />
                        } label="پیاده‌روی" />
                    </FormGroup>
                </FormControl>
                <FormControl component="fieldset" fullWidth margin="normal">
                    <InputLabel shrink>جنسیت تردد</InputLabel>
                    <RadioGroup value={data.gender} onChange={e => handleChange('gender', e.target.value)}>
                        <FormControlLabel value="male" control={<Radio />} label="مردانه" />
                        <FormControlLabel value="female" control={<Radio />} label="زنانه" />
                        <FormControlLabel value="family" control={<Radio />} label="خانوادگی" />
                    </RadioGroup>
                </FormControl>

                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 2, mb: 1 }}>
                    <span style={{ borderBottom: "2px solid #999", paddingBottom: 3 }}>
                        زمان‌های محدودیت دسترسی
                    </span>
                </Typography>

                <Box>
                    {daysOfWeek.map(day => (
                        <Paper
                            key={day.key}
                            elevation={restrictedTimes[day.key] ? 2 : 0}
                            sx={{
                                mb: 1,
                                borderRadius: 3,
                                p: 1,
                                bgcolor: restrictedTimes[day.key] ? "#f5f5f5" : "transparent",
                                transition: "background .2s"
                            }}
                        >
                            <Box display="flex" alignItems="center">
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!restrictedTimes[day.key]}
                                            color="primary"
                                            onChange={e => {
                                                setRestrictedTimes(rt =>
                                                    e.target.checked
                                                        ? { ...rt, [day.key]: [{ start: '', end: '' }] }
                                                        : Object.fromEntries(Object.entries(rt).filter(([k]) => k !== day.key))
                                                );
                                            }}
                                        />
                                    }
                                    label={<Typography sx={{ fontWeight: "bold" }}>{day.label}</Typography>}
                                    labelPlacement="start"
                                    sx={{ flex: 1, mr: 1 }}
                                />
                            </Box>
                            <Collapse in={!!restrictedTimes[day.key]}>
                                <Box mt={1} pl={2} pr={1}>
                                    {(restrictedTimes[day.key] || []).map((slot, i) => (
                                        <Box key={i} display="flex" alignItems="center" mb={1}>
                                            <TextField
                                                size="small"
                                                label="از"
                                                type="time"
                                                value={slot.start}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRestrictedTimes(rt => ({
                                                        ...rt,
                                                        [day.key]: rt[day.key].map((s, idx) =>
                                                            idx === i ? { ...s, start: val } : s
                                                        )
                                                    }));
                                                }}
                                                variant="outlined"
                                                sx={{ width: 105, mx: 0.5, direction: "ltr", bgcolor: "#fff" }}
                                                InputLabelProps={{
                                                    shrink: true,
                                                    sx: { right: 0, fontWeight: "bold" }
                                                }}
                                                inputProps={{
                                                    step: 300,
                                                    dir: "ltr",
                                                    style: { textAlign: "center" }
                                                }}
                                            />
                                            <Typography variant="body2" sx={{ mx: 1 }}>
                                                تا
                                            </Typography>
                                            <TextField
                                                size="small"
                                                label="تا"
                                                type="time"
                                                value={slot.end}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRestrictedTimes(rt => ({
                                                        ...rt,
                                                        [day.key]: rt[day.key].map((s, idx) =>
                                                            idx === i ? { ...s, end: val } : s
                                                        )
                                                    }));
                                                }}
                                                variant="outlined"
                                                sx={{ width: 105, mx: 0.5, direction: "ltr", bgcolor: "#fff" }}
                                                InputLabelProps={{
                                                    shrink: true,
                                                    sx: { right: 0, fontWeight: "bold" }
                                                }}
                                                inputProps={{
                                                    step: 300,
                                                    dir: "ltr",
                                                    style: { textAlign: "center" }
                                                }}
                                            />
                                            <IconButton
                                                onClick={() =>
                                                    setRestrictedTimes(rt => ({
                                                        ...rt,
                                                        [day.key]: rt[day.key].filter((_, idx) => idx !== i)
                                                    }))
                                                }
                                                size="small"
                                                color="error"
                                                sx={{ mx: 0.5 }}
                                                disabled={restrictedTimes[day.key].length === 1}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        onClick={() =>
                                            setRestrictedTimes(rt => ({
                                                ...rt,
                                                [day.key]: [...rt[day.key], { start: '', end: '' }]
                                            }))
                                        }
                                        color="primary"
                                        size="small"
                                        startIcon={<AddCircleOutline />}
                                        sx={{ mt: 1, fontWeight: "bold" }}
                                    >
                                        افزودن بازه
                                    </Button>
                                </Box>
                            </Collapse>
                        </Paper>
                    ))}
                </Box>



            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">انصراف</Button>
                <Button onClick={handleSave} color="primary" variant="contained">ذخیره</Button>
            </DialogActions>
        </Dialog>
    );
}
export default PolygonModal;
