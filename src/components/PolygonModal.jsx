import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Select, MenuItem, FormControl, InputLabel,
    FormGroup, FormControlLabel, Checkbox, RadioGroup, Radio, Button,
    Box, Typography
} from '@mui/material';
import TimeRestrictionsFull from './TimeRestrictions';
import { groups, subGroups } from './groupData';

// داده‌های پایه (مستقیماً از پروژه یا فایل config جدا ایمپورت کن)
const types = [
    { value: 'ziyarati', label: 'زیارتی' },
    { value: 'tarikhi', label: 'تاریخی' },
    { value: 'memari', label: 'معماری' },
    { value: 'farhangi', label: 'فرهنگی' },
    { value: 'khadamat', label: 'خدماتی' },
];
const servicesList = [
    { value: 'wheelchair', label: 'ویلچر' },
    { value: 'electricVan', label: 'ون برقی' },
    { value: 'walking', label: 'پیاده‌روی' }
];
const genders = [
    { value: 'male', label: 'مردانه' },
    { value: 'female', label: 'زنانه' },
    { value: 'family', label: 'خانوادگی' }
];

function PolygonModal({ onSave, onClose, polygonCoordinates, initialData, onUpdate }) {
    const isEditMode = Boolean(initialData);
    const [data, setData] = useState(() => {
        if (isEditMode) {
            return {
                name: initialData.name || '',
                description: initialData.description || '',
                group: initialData.group || '',
                subGroup: initialData.subGroup || '',
                subGroupValue: initialData.subGroupValue || '',
                types: initialData.types || [],
                services: initialData.services || {},
                gender: initialData.gender || '',
                restrictedTimes: initialData.restrictedTimes || [],
            };
        }
        return {
            name: '',
            description: '',
            group: '',
            subGroup: '',
            subGroupValue: '',
            types: [],
            services: {},
            gender: '',
            restrictedTimes: [],
        };
    });
    const [error, setError] = useState('');

    const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
    const handleTypeChange = (typeValue) => {
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
        if (!data.name.trim()) return setError('نام محدوده را وارد کنید');
        if (!data.group) return setError('یک گروه انتخاب کنید');
        if (!data.subGroup) return setError('زیرگروه را انتخاب کنید');
        if (data.types.length === 0) return setError('حداقل یک نوع محل انتخاب کنید');

        const payload = {
            ...data,
            timestamp: new Date().toISOString()
        };

        if (isEditMode && onUpdate) {
            onUpdate(initialData.id, payload);
        } else if (onSave) {
            onSave({ ...payload, coordinates: polygonCoordinates });
        }
        onClose();
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth dir="rtl">
            <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: 22, color: "#374151", letterSpacing: 1, bgcolor: "#f6fafd" }}>
                {isEditMode ? 'ویرایش محدوده' : 'ایجاد محدوده جدید'}
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: "#f9fafb" }}>
                {error && <Typography color="error" mb={2} align="center">{error}</Typography>}

                <TextField
                    label="نام محدوده"
                    fullWidth
                    margin="dense"
                    value={data.name}
                    onChange={e => handleChange('name', e.target.value)}
                    required
                    sx={{ mb: 1, bgcolor: "#fff", borderRadius: 2 }}
                />

                <TextField
                    label="توضیحات"
                    fullWidth
                    margin="dense"
                    multiline
                    rows={2}
                    value={data.description}
                    onChange={e => handleChange('description', e.target.value)}
                    sx={{ mb: 1, bgcolor: "#fff", borderRadius: 2 }}
                />

                <FormControl fullWidth margin="dense" sx={{ mb: 1 }}>
                    <InputLabel>گروه</InputLabel>
                    <Select
                        value={data.group}
                        onChange={e => {
                            handleChange('group', e.target.value);
                            handleChange('subGroup', '');
                            handleChange('subGroupValue', '');
                        }}
                        label="گروه"
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

                <Box mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold" mb={0.5}>نوع محل</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {types.map(t => (
                            <Button
                                key={t.value}
                                variant={data.types.includes(t.value) ? "contained" : "outlined"}
                                color={data.types.includes(t.value) ? "primary" : "inherit"}
                                onClick={() => handleTypeChange(t.value)}
                                sx={{ minWidth: 78, fontWeight: "bold", borderRadius: 4, px: 2, py: 0.5 }}
                            >
                                {t.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                <Box mb={1}>
                    <Typography variant="subtitle2" fontWeight="bold" mb={0.5}>امکانات / خدمات</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {servicesList.map(s => (
                            <FormControlLabel
                                key={s.value}
                                control={
                                    <Checkbox
                                        checked={data.services[s.value] || false}
                                        onChange={() => handleServiceChange(s.value)}
                                        size="small"
                                    />
                                }
                                label={s.label}
                                sx={{ mr: 1 }}
                            />
                        ))}
                    </Box>
                </Box>

                <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                    <InputLabel>جنسیت تردد</InputLabel>
                    <Select
                        value={data.gender}
                        onChange={e => handleChange('gender', e.target.value)}
                        label="جنسیت تردد"
                        size="small"
                        sx={{ bgcolor: "#fff", borderRadius: 2 }}
                    >
                        {genders.map(g => (
                            <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* زمان‌بندی محدودیت دسترسی */}
                <TimeRestrictionsFull value={data.restrictedTimes} onChange={handleRestrictedTimesChange} />

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary" variant="outlined">انصراف</Button>
                <Button onClick={handleSave} color="primary" variant="contained">ذخیره</Button>
            </DialogActions>
        </Dialog>
    );
}

export default PolygonModal;