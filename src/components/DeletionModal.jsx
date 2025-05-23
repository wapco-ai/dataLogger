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

const DeletionModal = ({ selectedItem, onDelete, onClose }) => {
    const renderTransportModes = (modes) => {
        if (!modes || modes.length === 0) return 'ندارد';

        return modes.map(mode => {
            switch (mode) {
                case 'wheelchair': return 'ویلچر';
                case 'electricVan': return 'ون برقی';
                case 'walking': return 'پیاده‌روی';
                default: return mode;
            }
        }).join(', ');
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
            zIndex: 1000
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
                    <p>
                        <strong>نوع نشانگر:</strong> {selectedItem.item.data?.type || 'نامشخص'}
                    </p>
                    <p>
                        <strong>شیوه‌های حمل و نقل:</strong> {renderTransportModes(selectedItem.item.data?.transportModes)}
                    </p>
                    <p>
                        <strong>جنسیت تردد:</strong>
                        {selectedItem.item.data?.gender === 'male' ? 'مردانه' :
                            selectedItem.item.data?.gender === 'female' ? 'زنانه' :
                                selectedItem.item.data?.gender === 'family' ? 'خانوادگی' : 'نامشخص'}
                    </p>
                    <p>
                        <strong>موقعیت مکانی:</strong>
                        {`${selectedItem.item.position[0].toFixed(4)}, ${selectedItem.item.position[1].toFixed(4)}`}
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
                <div style={{
                    backgroundColor: '#f5f4e6',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px'
                }}>
                    <p>
                        <strong>نام محدوده:</strong> {selectedItem.item.name || 'بدون نام'}
                    </p>
                    <p>
                        <strong>توضیحات:</strong> {selectedItem.item.description || 'بدون توضیحات'}
                    </p>
                    <p>
                        <strong>نوع محدوده:</strong> {selectedItem.item.type || 'نامشخص'}
                    </p>
                    <p>
                        <strong>شیوه‌های حمل و نقل:</strong> {(selectedItem.item.transportModes || []).join(', ') || 'ندارد'}
                    </p>
                    <p>
                        <strong>جنسیت تردد:</strong> {
                            selectedItem.item.gender === 'male' ? 'مردانه' :
                                selectedItem.item.gender === 'female' ? 'زنانه' :
                                    selectedItem.item.gender === 'family' ? 'خانوادگی' : 'نامشخص'
                        }
                    </p>
                    <p>
                        <strong>تعداد نقاط:</strong> {selectedItem.item.coordinates?.length || 0}
                    </p>
                    <p>
                        <strong>تاریخ ایجاد:</strong> {new Date(selectedItem.item.timestamp).toLocaleDateString('fa-IR')}
                    </p>
                    <p>
                        <strong>زمان‌های محدودیت:</strong>
                        <br />
                        {selectedItem.item.restrictedTimes && Object.keys(selectedItem.item.restrictedTimes).length > 0 ? (
                            <ul style={{ margin: 0, paddingRight: 18 }}>
                                {Object.entries(selectedItem.item.restrictedTimes).map(([day, times]) => (
                                    <li key={day}>
                                        <span style={{ fontWeight: "bold" }}>
                                            {
                                                {
                                                    saturday: "شنبه",
                                                    sunday: "یک‌شنبه",
                                                    monday: "دوشنبه",
                                                    tuesday: "سه‌شنبه",
                                                    wednesday: "چهارشنبه",
                                                    thursday: "پنج‌شنبه",
                                                    friday: "جمعه"
                                                }[day]
                                            }
                                        </span>
                                        :{" "}
                                        {times.map((slot, idx) =>
                                            <span key={idx}>
                                                {slot.start} - {slot.end}{idx < times.length - 1 ? " ، " : ""}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : "محدودیتی ثبت نشده است"}
                    </p>
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
                        padding: '10px 20px',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <span>🗑️</span> بله، حذف شود
                </button>
                <button
                    onClick={onClose}
                    style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <span>✖</span> انصراف
                </button>
            </div>
        </div>
    )
}

export default DeletionModal;