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

function PathModal({ onSave, onClose, pathCoordinates, initialData, onUpdate }) {
  const isEditMode = Boolean(initialData);
  const defaultTransport = { wheelchair: false, electricVan: false, walking: false };
  const [pathData, setPathData] = useState(() => {
    if (isEditMode) {
      return {
        name: initialData.name || '',
        description: initialData.description || '',
        type: initialData.type || '',
        transportModes: {
          wheelchair: initialData.transportModes?.includes('wheelchair') || false,
          electricVan: initialData.transportModes?.includes('electricVan') || false,
          walking: initialData.transportModes?.includes('walking') || false,
        },
        gender: initialData.gender || '',
      };
    }
    return {
      name: '',
      description: '',
      type: '',
      transportModes: defaultTransport,
      gender: '',
    };
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
    const payload = {
      ...pathData,
      transportModes: selectedTransportModes,
      timestamp: new Date().toISOString(),
    };
    if (isEditMode && onUpdate) {
      onUpdate(initialData.id, payload);
    } else if (onSave) {
      onSave({ ...payload, coordinates: pathCoordinates });
    }
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" dir="rtl" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        {isEditMode ? 'ویرایش مسیر' : 'ایجاد مسیر جدید'}
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
