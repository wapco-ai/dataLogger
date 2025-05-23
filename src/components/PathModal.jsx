import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Button
} from '@mui/material';

function PathModal({ onSave, onClose, pathCoordinates }) {
  const [pathData, setPathData] = useState({
    name: '',
    description: '',
    type: '',
    transportModes: {
      wheelchair: false,
      electricVan: false,
      walking: false,
    },
    gender: '',
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setPathData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransportModeChange = (mode) => {
    setPathData(prev => ({
      ...prev,
      transportModes: {
        ...prev.transportModes,
        [mode]: !prev.transportModes[mode]
      }
    }));
  };

  const handleSave = () => {
    if (!pathData.name.trim()) {
      setError('نام مسیر را وارد کنید');
      return;
    }
    const selectedTransportModes = Object.keys(pathData.transportModes)
      .filter(mode => pathData.transportModes[mode]);
    onSave({
      ...pathData,
      transportModes: selectedTransportModes,
      coordinates: pathCoordinates,
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        ایجاد مسیر جدید
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <TextField
          label="نام مسیر"
          fullWidth
          margin="normal"
          value={pathData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
        <TextField
          label="توضیحات"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          value={pathData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>نوع مسیر</InputLabel>
          <Select
            value={pathData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            label="نوع مسیر"
          >
            <MenuItem value="hiking">پیاده‌روی</MenuItem>
            <MenuItem value="driving">رانندگی</MenuItem>
            <MenuItem value="other">سایر</MenuItem>
          </Select>
        </FormControl>

        <FormControl component="fieldset" fullWidth margin="normal">
          <InputLabel shrink>شیوه‌های حمل و نقل</InputLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={pathData.transportModes.wheelchair}
                  onChange={() => handleTransportModeChange('wheelchair')}
                />
              }
              label="ویلچر"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={pathData.transportModes.electricVan}
                  onChange={() => handleTransportModeChange('electricVan')}
                />
              }
              label="ون برقی"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={pathData.transportModes.walking}
                  onChange={() => handleTransportModeChange('walking')}
                />
              }
              label="پیاده‌روی"
            />
          </FormGroup>
        </FormControl>

        <FormControl component="fieldset" fullWidth margin="normal">
          <InputLabel shrink>جنسیت تردد</InputLabel>
          <RadioGroup
            value={pathData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
          >
            <FormControlLabel value="male" control={<Radio />} label="مردانه" />
            <FormControlLabel value="female" control={<Radio />} label="زنانه" />
            <FormControlLabel value="family" control={<Radio />} label="خانوادگی" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          انصراف
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PathModal;
