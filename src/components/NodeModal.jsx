import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  FormGroup, FormControlLabel, Checkbox, Radio, RadioGroup, Button,
  Chip, Box, Typography, Divider
} from '@mui/material';
import TimeRestrictionsFull from './TimeRestrictions';
import {
  groups,
  subGroups,
  types,
  servicesList,
  genders,
  nodeFunctions
} from './groupData';

// داده‌ها از groupData وارد می‌شود


function generateUniqueId({ latitude, longitude }, group, subGroupValue) {
  const rnd = Math.floor(Math.random() * 10000);
  return [subGroupValue || group, rnd].filter(Boolean).join('_');
}

function NodeModal({ location, gpsMeta, onClose, onSave, initialData, onUpdate }) {
  const isEditMode = typeof onUpdate === 'function';
  const [data, setData] = useState(() => {
    if (initialData) {
      const d = initialData.data || initialData;
      return {
        name: d.name || '',
        description: d.description || '',
        group: d.group || '',
        subGroup: d.subGroup || '',
        subGroupValue: d.subGroupValue || '',
        types: d.types || [],
        services: d.services || { wheelchair: false, electricVan: false, walking: false },
        gender: d.gender || '',
        nodeFunction: d.nodeFunction || '',
        restrictedTimes: Array.isArray(d.restrictedTimes) ? d.restrictedTimes : [],
      };
    }
    return {
      name: '',
      description: '',
      group: '',
      subGroup: '',
      subGroupValue: '',
      types: [],
      services: { wheelchair: false, electricVan: false, walking: false },
      gender: '',
      nodeFunction: "",
      restrictedTimes: [],
    };
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  const handleTypesChange = (typeValue) => {
    setData(prev => ({
      ...prev,
      types: prev.types.includes(typeValue)
        ? prev.types.filter(t => t !== typeValue)
        : [...prev.types, typeValue]
    }));
  };
  const handleServiceChange = (service) => {
    setData(prev => ({
      ...prev,
      services: { ...prev.services, [service]: !prev.services[service] }
    }));
  };
  const handleRestrictedTimesChange = (items) =>
    setData(prev => ({ ...prev, restrictedTimes: items }));

  const handleSave = () => {
    if (!data.name.trim()) return setError('نام گره را وارد کنید');
    if (!data.group) return setError('یک گروه انتخاب کنید');
    if (!data.subGroup) return setError('زیرگروه را انتخاب کنید');
    if (data.types.length === 0) return setError('حداقل یک نوع محل انتخاب کنید');

    const base = {
      ...data,
      latitude: location.lat,
      longitude: location.lng,
      gpsMeta: gpsMeta || null,
      timestamp: new Date().toISOString(),
    };

    if (isEditMode && onUpdate) {
      onUpdate(initialData.id, base);
    } else if (onSave) {
      const uniqueId = generateUniqueId(
        { latitude: location.lat, longitude: location.lng },
        data.group,
        data.subGroupValue
      );
      onSave({ ...base, uniqueId });
    }
    onClose();
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm" // پهنا بیشتر نسبت به xs
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: 8,
          maxWidth: 440,
          width: '98vw',
          bgcolor: "#ffffffee",
          boxShadow: "0 8px 40px #0002",
          border: "1px solid #e0e5ec",
          zIndex: "1000"
        }
      }}
    >
      <DialogTitle sx={{
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 22,
        color: "#374151",
        letterSpacing: 1,
        bgcolor: "#f6fafd",
        borderTopRightRadius: 32,
        borderTopLeftRadius: 32,
        py: 2
      }}>
        {isEditMode ? 'ویرایش گره' : 'ایجاد گره جدید'}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          py: 2,
          px: 2,
          bgcolor: "#f9fafb",
          maxHeight: "73vh",
          overflowY: "auto",
          overflowX: "hidden" // حذف اسکرول x
        }}
      >
        <TextField
          label={<span>نام گره </span>}
          fullWidth
          margin="dense"
          value={data.name}
          onChange={e => handleChange('name', e.target.value)}
          required
          inputProps={{ style: { fontWeight: 'bold', fontSize: 17 } }}
          sx={{
            bgcolor: "#fff", borderRadius: 3,
            boxShadow: "0 1px 5px #b1bbdd22", mb: 1,
            "& .MuiInputBase-root": { py: 1.1 }
          }}
        />
        {error === 'نام گره را وارد کنید' &&
          <Typography color="error" fontSize={13} mb={1} pl={1}>{error}</Typography>
        }

        <TextField
          label="توضیحات"
          fullWidth
          margin="dense"
          multiline
          rows={2}
          value={data.description}
          onChange={e => handleChange('description', e.target.value)}
          sx={{ bgcolor: "#fff", borderRadius: 3, mb: 1 }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1 }}>
          <FormControl fullWidth margin="dense" sx={{ mb: 1 }}>
            <InputLabel>گروه اصلی</InputLabel>
            <Select
              value={data.group}
              onChange={e => {
                handleChange('group', e.target.value);
                handleChange('subGroup', '');
                handleChange('subGroupValue', '');
                handleChange('nodeFunction', '');
              }}
              label="گروه اصلی"
              size="small"
              sx={{ bgcolor: "#fff", borderRadius: 2 }}
            >
              {groups.map(gr => (
                <MenuItem key={gr.value} value={gr.value}>{gr.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={{ mb: 1 }} disabled={!data.group}>
            <InputLabel>زیرگروه</InputLabel>
            <Select
              value={data.subGroupValue}
              onChange={e => {
                const val = e.target.value;
                const obj = (subGroups[data.group] || []).find(s => s.value === val);
                handleChange('subGroup', obj ? obj.label : '');
                handleChange('subGroupValue', val);
              }}
              label="زیرگروه"
              size="small"
              sx={{ bgcolor: "#fff", borderRadius: 2 }}
            >
              {(subGroups[data.group] || []).map(sub => (
                <MenuItem key={sub.value} value={sub.value}>{sub.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" sx={{ mb: 2 }} disabled={!data.group}>
            <InputLabel>کارکرد گره</InputLabel>
            <Select
              value={data.nodeFunction}
              onChange={e => handleChange('nodeFunction', e.target.value)}
              label="کارکرد گره"
              size="small"
              sx={{ bgcolor: "#fff", borderRadius: 2 }}
            >
              {nodeFunctions.map(fn => (
                <MenuItem key={fn.value} value={fn.value}>{fn.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

        </Box>
        {error && error.startsWith("یک گروه") &&
          <Typography color="error" fontSize={13} mb={1} pl={1}>{error}</Typography>
        }
        <Divider sx={{ my: 1.5, borderColor: "#e0e7ef" }} />

        <Typography variant="subtitle2" fontWeight="bold" mb={1} fontSize={16}>
          نوع محل <span style={{ color: "#d32f2f" }}>*</span>
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={1} justifyContent="center">
          {types.map(t => (
            <Chip
              key={t.value}
              label={t.label}
              color={data.types.includes(t.value) ? "primary" : "default"}
              onClick={() => handleTypesChange(t.value)}
              clickable
              sx={{
                fontWeight: data.types.includes(t.value) ? 'bold' : undefined,
                fontSize: 15,
                borderRadius: 6,
                px: 3,
                py: 1,
                minWidth: 78,
                boxShadow: data.types.includes(t.value) ? "0 2px 10px #2196f322" : "none",
                bgcolor: data.types.includes(t.value) ? "#e3f1fe" : "#f3f6f9"
              }}
            />
          ))}
        </Box>
        {error === 'حداقل یک نوع محل انتخاب کنید' &&
          <Typography color="error" fontSize={13} mb={1} pl={1}>{error}</Typography>
        }
        <Divider sx={{ my: 1.5, borderColor: "#e0e7ef" }} />

        <Typography variant="subtitle2" fontWeight="bold" mb={0.5} fontSize={16}>امکانات / خدمات</Typography>
        <FormGroup row sx={{ flexWrap: 'wrap', gap: 0 }}>
          {servicesList.map(s => (
            <FormControlLabel
              key={s.value}
              control={
                <Checkbox
                  checked={data.services[s.value]}
                  onChange={() => handleServiceChange(s.value)}
                  size="small"
                />
              }
              label={s.label}
              sx={{ mr: 1, mb: 0.5, fontWeight: 'bold' }}
            />
          ))}
        </FormGroup>
        <Divider sx={{ my: 1.5, borderColor: "#e0e7ef" }} />

        <Typography variant="subtitle2" fontWeight="bold" mb={0.5} fontSize={16}>جنسیت تردد</Typography>
        <RadioGroup
          value={data.gender}
          onChange={e => handleChange('gender', e.target.value)}
          row
          sx={{ gap: 1, mb: 1 }}
        >
          {genders.map(g => (
            <FormControlLabel key={g.value} value={g.value} control={<Radio size="small" />} label={g.label} />
          ))}
        </RadioGroup>
        <Divider sx={{ my: 1.5, borderColor: "#e0e7ef", mb: 2 }} />

        <TimeRestrictionsFull value={data.restrictedTimes} onChange={handleRestrictedTimesChange} />

      </DialogContent>
      <DialogActions sx={{
        p: 2, pt: 0, bgcolor: "#f4f6fa",
        position: "sticky", bottom: 0,
        display: "flex", gap: 2
      }}>
        <Button
          onClick={onClose}
          color="secondary"
          fullWidth
          sx={{
            fontWeight: "bold",
            borderRadius: 4,
            fontSize: 18,
            py: 1,
            bgcolor: "#fff",
            color: "#ad10a5",
            border: "1.5px solid #e7cfff"
          }}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          fullWidth
          sx={{
            fontWeight: "bold",
            borderRadius: 4,
            fontSize: 18,
            py: 1,
            boxShadow: "0 4px 18px #3b82f622"
          }}
        >
          ذخیره
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default NodeModal;
