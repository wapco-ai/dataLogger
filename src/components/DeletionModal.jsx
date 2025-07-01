import React, { useState } from 'react';
import L from 'leaflet';
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

// ابتدای فایل DeletionModal.jsx
const groupLabels = {
    sahn: "صحن",
    eyvan: "ایوان",
    ravaq: "رواق",
    masjed: "مسجد",
    madrese: "مدرسه",
    khadamat: "خدماتی",
    elmi: "علمی/آموزشی/فرهنگی",
    cemetery: "آرامستان",
    other: "سایر"
};
const nodeFunctionLabels = {
    door: "درب",
    connection: "نقطه اتصال",
    elevator: "آسانسور",
    escalator: "پله برقی",
    ramp: "رمپ",
    stairs: "پله",
    service: "سرویس",
    other: "سایر"
};
const typeLabels = {
    ziyarati: "زیارتی",
    tarikhi: "تاریخی",
    memari: "معماری",
    farhangi: "فرهنگی",
    khadamat: "خدماتی"
};
const genderLabels = {
    male: "مردانه",
    female: "زنانه",
    family: "خانوادگی"
};
const serviceLabels = {
    wheelchair: "ویلچر",
    electricVan: "ون برقی",
    walking: "پیاده‌روی"
};
const prayerEventLabels = {
    azan_fajr: "اذان صبح",
    sunrise: "طلوع آفتاب",
    azan_zohr: "اذان ظهر",
    sunset: "غروب آفتاب",
    azan_maghreb: "اذان مغرب"
};


const DeletionModal = ({ selectedItem, onDelete, onClose, onEdit }) => {
    const renderTransportModes = (modes) => {
        if (!modes || modes.length === 0) return 'ندارد';
        return modes.map(mode => serviceLabels[mode] || mode).join(', ');
    };

    const renderRestrictedTimes = (times) => {
        if (!Array.isArray(times) || times.length === 0) return "محدودیتی ثبت نشده است";
        return (
            <ul style={{ margin: 0, paddingRight: 18 }}>
                {times.map((rt, i) => (
                    <li key={i} style={{ fontSize: 13 }}>
                        {rt.type === "prayerEvent"
                            ? `همه روزها: ${prayerEventLabels[rt.prayerEvent] || rt.prayerEvent} (${rt.toleranceBefore} دقیقه قبل تا ${rt.toleranceAfter} دقیقه بعد)`
                            : `${rt.day} - ${rt.allDay ? "تمام روز" : (rt.timeSlots || []).map(s => `${s.from}–${s.to}`).join("، ")}`
                            + (rt.allowedGenders && rt.allowedGenders.length
                                ? ` (${rt.allowedGenders.map(g => genderLabels[g]).join("، ")})`
                                : " (هیچکس مجاز نیست!)")}
                    </li>
                ))}
            </ul>
        );
    };

    // New helper:
    const normalizeCoords = (coordinates) => {
        if (!Array.isArray(coordinates)) return [];
        if (Array.isArray(coordinates[0])) return coordinates;
        return coordinates.map(pt => pt.coordinates || []);
    };

    // Updated length calculator:
    const calculatePathLength = (coordinates) => {
        const pts = normalizeCoords(coordinates);
        if (pts.length < 2) return 0;
        let totalDistance = 0;
        for (let i = 1; i < pts.length; i++) {
            const [lat1, lng1] = pts[i - 1];
            const [lat2, lng2] = pts[i];
            totalDistance += L.latLng(lat1, lng1)
                .distanceTo(L.latLng(lat2, lng2));
        }
        return (totalDistance / 1000).toFixed(2);
    };
    console.log("Selected Item:", selectedItem);
    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 1400,
            fontSize: "13px"
        }}>
            <h2 style={{
                marginBottom: '15px',
                textAlign: 'center',
                color: '#333'
            }}>
                جزئیات {selectedItem.type === 'marker' ? 'نشانگر'
                    : selectedItem.type === 'path' ? 'مسیر'
                        : selectedItem.type === 'polygon' ? 'محدوده'
                            : ''}
            </h2>
            {/* Common Details */}
            <div style={{
                backgroundColor: '#f4f4f4',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px'
            }}>
                <p>
                    <strong>نام:</strong> {selectedItem.item.data?.name || selectedItem.item.name || 'بدون نام'}
                </p>
                <p>
                    <strong>توضیحات:</strong> {selectedItem.item.data?.description || selectedItem.item.description || 'بدون توضیحات'}
                </p>
            </div>

            {/* Marker-Specific Details */}
            {selectedItem.type === 'marker' && (
                <div style={{
                    backgroundColor: '#e9f5e9',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                }}>

                    <p><strong>گروه:</strong> {groupLabels[selectedItem.item.data?.group] || "ثبت نشده"}</p>
                    <p><strong>زیرگروه:</strong> {selectedItem.item.data?.subGroup || "ثبت نشده"}</p>
                    <p><strong>کارکرد گره:</strong> {nodeFunctionLabels[selectedItem.item.data?.nodeFunction] || "ثبت نشده"}</p>
                    <p><strong>نوع محل:</strong>
                        {(selectedItem.item.data?.types && selectedItem.item.data.types.length > 0)
                            ? selectedItem.item.data.types.map(t => typeLabels[t] || t).join("، ")
                            : "ثبت نشده"}
                    </p>
                    <p>
                        <strong>امکانات/خدمات:</strong>
                        {(selectedItem.item.data?.services && Object.keys(selectedItem.item.data.services).filter(k => selectedItem.item.data.services[k]).length > 0)
                            ? Object.keys(selectedItem.item.data.services)
                                .filter(k => selectedItem.item.data.services[k])
                                .map(k => serviceLabels[k] || k)
                                .join("، ")
                            : "ندارد"}
                    </p>
                    <p>
                        <strong>جنسیت تردد:</strong>
                        {genderLabels[selectedItem.item.data?.gender] || "ثبت نشده"}
                    </p>
                    <p>
                        <strong>موقعیت مکانی:</strong>
                        {selectedItem.item.position && selectedItem.item.position.length === 2
                            ? `${selectedItem.item.position[0].toFixed(5)}, ${selectedItem.item.position[1].toFixed(5)}`
                            : "ثبت نشده"}
                    </p>
                    {/* <p>
                        <strong>شناسه یکتا:</strong> {selectedItem.item.data?.uniqueId || "ثبت نشده"}
                    </p> */}
                    <p>
                        <strong>محدودیت زمانی:</strong>
                        {selectedItem.item.data?.restrictedTimes && selectedItem.item.data.restrictedTimes.length > 0 ?
                            <ul style={{ margin: 0, paddingRight: 18 }}>
                                {selectedItem.item.data.restrictedTimes.map((rt, i) => (
                                    <li key={i} style={{ fontSize: 13 }}>
                                        {rt.type === "prayerEvent"
                                            ? `همه روزها: ${prayerEventLabels[rt.prayerEvent] || rt.prayerEvent} (${rt.toleranceBefore} دقیقه قبل تا ${rt.toleranceAfter} دقیقه بعد)`
                                            : `${rt.day} - ${rt.allDay ? "تمام روز" : (rt.timeSlots || []).map(s => `${s.from}–${s.to}`).join("، ")}`
                                            + (rt.allowedGenders && rt.allowedGenders.length
                                                ? ` (${rt.allowedGenders.map(g => genderLabels[g]).join("، ")})`
                                                : " (هیچکس مجاز نیست!)")
                                        }
                                    </li>
                                ))}
                            </ul>
                            : "محدودیتی ثبت نشده است"}
                    </p>
                </div>
            )}


            {/* Path-Specific Details */}
            {selectedItem.type === 'path' && (
                <div style={{
                    backgroundColor: '#e6f2ff',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                }}>
                    <p>
                        <strong>نوع مسیر:</strong> {selectedItem.item.type || 'نامشخص'}
                    </p>
                    <p>
                        <strong>طول مسیر:</strong> {calculatePathLength(selectedItem.item.coordinates)} کیلومتر
                    </p>
                    <p>
                        <strong>تعداد نقاط مسیر:</strong> {selectedItem.item.coordinates?.length || 0}
                    </p>
                    <p>
                        <strong>تاریخ ایجاد:</strong> {new Date(selectedItem.item.timestamp).toLocaleDateString('fa-IR')}
                    </p>
                    <p>
                        <strong>دقت GPS:</strong>
                        {selectedItem.item.gpsMeta?.coords?.accuracy
                            ? `${selectedItem.item.gpsMeta.coords.accuracy} متر`
                            : 'اطلاعات موجود نیست'}
                    </p>
                </div>
            )}

            {selectedItem.type === 'polygon' && (
                <div style={{ backgroundColor: '#f5f4e6', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <p><strong>گروه:</strong> {groupLabels[selectedItem.item.data?.group] || "ثبت نشده"}</p>
                    <p><strong>نوع محل:</strong> {(selectedItem.item.data?.types || []).map(t => typeLabels[t] || t).join("، ") || "ثبت نشده"}</p>
                    <p><strong>امکانات/خدمات:</strong> {renderTransportModes(Object.keys(selectedItem.item.data?.services || {}).filter(k => selectedItem.item.data?.services[k]))}</p>
                    <p><strong>جنسیت تردد:</strong> {genderLabels[selectedItem.item.data?.gender] || "ثبت نشده"}</p>
                    <p><strong>تعداد رئوس محدوده:</strong> {selectedItem.item.coordinates?.length || 0}</p>
                    {/* <p><strong>شناسه یکتا:</strong> {selectedItem.item?.uniqueId || "ثبت نشده"}</p> */}
                    <p><strong>محدودیت زمانی:</strong> {renderRestrictedTimes(selectedItem.item.data?.restrictedTimes)}</p>
                </div>
            )}


            {/* Deletion Confirmation Buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '15px'
            }}>
                <button
                    onClick={onDelete}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '10px 10px',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span>🗑️</span> بله، حذف شود
                </button>
                {onEdit && (
                <button
                    onClick={onEdit}
                    style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '10px 10px',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span>✏️</span> ویرایش
                </button>
                )}
                <button
                    onClick={onClose}
                    style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '10px 10px',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                    }}
                >
                    <span>✖</span> انصراف
                </button>
            </div>
        </div>
    )
}

export default DeletionModal;