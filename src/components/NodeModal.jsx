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

function NodeModal({ location, gpsMeta, onClose, onSave }) {
  const [nodeData, setNodeData] = useState({
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
    setNodeData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransportModeChange = (mode) => {
    setNodeData(prev => ({
      ...prev,
      transportModes: {
        ...prev.transportModes,
        [mode]: !prev.transportModes[mode]
      }
    }));
  };

  const handleSave = () => {
    if (!nodeData.name.trim()) {
      setError('نام گره را وارد کنید');
      return;
    }

    const selectedTransportModes = Object.keys(nodeData.transportModes)
      .filter(mode => nodeData.transportModes[mode]);

    onSave({
      ...nodeData,
      latitude: location.lat,
      longitude: location.lng,
      timestamp: new Date().toISOString(),
      transportModes: selectedTransportModes,
      gpsMeta: gpsMeta ? {
        coords: {
          latitude: gpsMeta.coords.latitude,
          longitude: gpsMeta.coords.longitude,
          accuracy: gpsMeta.coords.accuracy,
          altitude: gpsMeta.coords.altitude,
          speed: gpsMeta.coords.speed,
          heading: gpsMeta.coords.heading,
        },
        timestamp: gpsMeta.timestamp,
      } : null
    });

    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
        ایجاد گره جدید
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <div style={{ color: 'red', marginBottom: '16px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <TextField
          label="نام گره"
          fullWidth
          margin="normal"
          value={nodeData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />

        <TextField
          label="توضیحات"
          fullWidth
          margin="normal"
          multiline
          rows={3}
          value={nodeData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>نوع گره</InputLabel>
          <Select
            value={nodeData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            label="نوع گره"
          >
            <MenuItem value="checkpoint">نقطه بازرسی</MenuItem>
            <MenuItem value="landmark">نشانه</MenuItem>
            <MenuItem value="poi">نقطه دلخواه</MenuItem>
            <MenuItem value="other">سایر</MenuItem>
          </Select>
        </FormControl>

        <FormControl component="fieldset" fullWidth margin="normal">
          <InputLabel shrink>شیوه‌های حمل و نقل</InputLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={nodeData.transportModes.wheelchair}
                  onChange={() => handleTransportModeChange('wheelchair')}
                />
              }
              label="ویلچر"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={nodeData.transportModes.electricVan}
                  onChange={() => handleTransportModeChange('electricVan')}
                />
              }
              label="ون برقی"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={nodeData.transportModes.walking}
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
            value={nodeData.gender}
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

export default NodeModal;