
import { useState, useRef, useEffect } from "react";
import { useDualTracking } from "../hooks/useDualTracking";
import { MapContainer, TileLayer, Polyline, Circle, Marker, useMap } from "react-leaflet";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import ExploreIcon from '@mui/icons-material/Explore';
import BlockIcon from '@mui/icons-material/Block';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DebugPanel from "./DebugPanel";
import L from "leaflet";
import NorthAngleArrow from './NorthAngleArrow';


// ✅ فرمول تصحیح شده برای محاسبه جهت
function calcDrHeading(path) {
    if (path.length < 2) return 0;

    const [lat1, lng1] = path[path.length - 2];
    const [lat2, lng2] = path[path.length - 1];

    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLng = (lng2 - lng1) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;

    // ✅ تصحیح فرمول - تبدیل از mathematical bearing به geographic bearing
    bearing = (bearing + 360) % 360;

    return bearing;
}

function calcGpsMovementDirection(points) {
    if (points.length < 2) return 0;

    const lastTwo = points.slice(-2);
    const [prev, curr] = lastTwo.map(p => p.gps);

    const lat1Rad = prev.latitude * Math.PI / 180;
    const lat2Rad = curr.latitude * Math.PI / 180;
    const deltaLng = (curr.longitude - prev.longitude) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
        Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLng);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;

    // ✅ همین تصحیح برای GPS هم
    bearing = (bearing + 360) % 360;

    return bearing;
}

// ✅ کامپوننت فلش DR تصحیح شده
function DrArrowMarker({ position, heading }) {
    const icon = L.divIcon({
        className: "",
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        html: `
       <div style="
         transform: rotate(${heading}deg);
          width: 48px; height: 48px;
         display: flex;
         align-items: center;
         justify-content: center;
       ">
         <svg width="32" height="32" viewBox="0 0 24 24" fill="orange" xmlns="http://www.w3.org/2000/svg">
           <path d="M12 2 L19 21 L12 17 L5 21 Z"/>
         </svg>
       </div>
     `
    });
    return <Marker position={position} icon={icon} />;
}

function toLatLngArr(points, key) {
    return points
        .map((pt) => pt[key] && pt[key].latitude && pt[key].longitude ? [pt[key].latitude, pt[key].longitude] : null)
        .filter(Boolean);
}

function exportDualCSV(points) {
    const header = "timestamp,gps_lat,gps_lng,gps_accuracy,dr_lat,dr_lng\n";
    const rows = points
        .map(pt => `${pt.gps.timestamp},${pt.gps.latitude},${pt.gps.longitude},${pt.gps.accuracy || ""},${pt.dr.latitude},${pt.dr.longitude}`)
        .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dualtrack.csv";
    a.click();
}

function exportDualGeoJSON(points) {
    const gps = {
        type: "Feature",
        properties: { source: "gps" },
        geometry: {
            type: "LineString",
            coordinates: points.map(pt => [pt.gps.longitude, pt.gps.latitude])
        }
    };
    const dr = {
        type: "Feature",
        properties: { source: "deadReckoning" },
        geometry: {
            type: "LineString",
            coordinates: points.map(pt => [pt.dr.longitude, pt.dr.latitude])
        }
    };
    const geojson = {
        type: "FeatureCollection",
        features: [gps, dr]
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dualtrack.geojson";
    a.click();
}

function AutoRecenter({ gps, dr, mode }) {
    const map = useMap();

    useEffect(() => {
        if (mode === "gps" && gps) {
            map.setView([gps.latitude, gps.longitude], map.getZoom());
        } else if (mode === "dr" && dr) {
            map.setView([dr.latitude, dr.longitude], map.getZoom());
        }
    }, [gps, dr, mode, map]);

    return null;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function DualTrackingTest({ mode, actions, mapHeight }) {
    // 🔥 دریافت توابع جدید برای کنترل حساسیت گام‌شمار
    const {
        tracking,
        points,
        start: hookStart,
        stop,
        calibrateHeadingOffset,
        offset,
        adjustStepSensitivity,
        setCustomStepSensitivity,
        getStepDebugInfo
    } = useDualTracking();

    const handleStartStop = () => {
        if (tracking) {
            stop();
        } else {
            hookStart();
            setFollowMode("gps");
        }
    };

    const lastGps = points.length ? points[points.length - 1].gps : null;
    const lastDr = points.length ? points[points.length - 1].dr : null;
    const gpsPath = toLatLngArr(points, "gps");
    const drPath = toLatLngArr(points, "dr");

    const [followMode, setFollowMode] = useState(mode === "mapOnly" ? "gps" : "off");
    const [currentHeading, setCurrentHeading] = useState(0);
    const [debugPanelExpanded, setDebugPanelExpanded] = useState(false);

    const mapRef = useRef(null);

    // محاسبه جهت‌های مختلف برای Debug Panel
    const drHeading = calcDrHeading(drPath);
    const movementDirection = calcGpsMovementDirection(points);

    // ✅ محاسبه جهت کالیبره‌شده برای فلش DR
    const getCalibratedHeading = () => {
        const northOffset = Number(localStorage.getItem('northOffset')) || 0;
        if (northOffset !== 0) {
            // ✅ فرمول صحیح کالیبراسیون
            return (currentHeading - northOffset + 360) % 360;
        }
        return currentHeading;
    };
    // دریافت جهت فعلی سنسور
    useEffect(() => {
        const handleOrientation = (event) => {
            if (typeof event.alpha === 'number') {
                setCurrentHeading(event.alpha);
            }
        };
        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    useEffect(() => {
        if (mode === 'full' && !tracking && mapRef.current) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    mapRef.current.setView([lat, lng], 17);
                },
                (error) => {
                    console.warn("Failed to fetch initial GPS:", error);
                },
                { enableHighAccuracy: true }
            );
        }
    }, [mode, tracking, mapRef.current]);

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", direction: "rtl", position: "relative" }}>

            {/* دکمه‌های Export */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, pb: 1 }}>
                <Tooltip title="خروجی CSV">
                    <span>
                        <IconButton color="success" disabled={!points.length} onClick={() => exportDualCSV(points)} size="large">
                            <ListAltIcon />
                        </IconButton>
                    </span>
                </Tooltip>

                <Tooltip title="خروجی GeoJSON">
                    <span>
                        <IconButton color="info" disabled={!points.length} onClick={() => exportDualGeoJSON(points)} size="large">
                            <TextSnippetIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* نقشه */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <MapContainer
                    center={gpsPath.length ? gpsPath[gpsPath.length - 1] : [36.2972, 59.6067]}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    whenCreated={(mapInstance) => {
                        mapRef.current = mapInstance;
                        if (mode !== "compact") {
                            navigator.geolocation.getCurrentPosition(
                                (pos) => mapInstance.setView([pos.coords.latitude, pos.coords.longitude], 17),
                                (err) => console.warn("Failed to fetch initial GPS:", err),
                                { enableHighAccuracy: true }
                            );
                        }
                    }}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Polyline positions={gpsPath} color="blue" weight={5} opacity={0.7} />
                    <Polyline positions={drPath} color="orange" weight={4} opacity={0.7} dashArray="6 8" />
                    {lastGps && <Circle center={[lastGps.latitude, lastGps.longitude]} radius={6} color="blue" />}
                    {lastDr && <Circle center={[lastDr.latitude, lastDr.longitude]} radius={6} color="orange" />}

                    {/* ✅ فلش DR با جهت کالیبره‌شده - فقط وقتی پنل دیباگ بسته است */}
                    {drPath.length > 0 && (
                        <DrArrowMarker
                            position={drPath[drPath.length - 1]}
                            heading={getCalibratedHeading()} // ✅ استفاده از جهت کالیبره‌شده
                        />
                    )}
                    <AutoRecenter gps={lastGps} dr={lastDr} mode={followMode} />
                </MapContainer>
                {/* دکمه Follow - فقط وقتی پنل دیباگ بسته است */}
                {!debugPanelExpanded && (<NorthAngleArrow />)}
                {!debugPanelExpanded && (
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 46,
                            right: 5,
                            zIndex: 1000,
                            backgroundColor: "#fff",
                            borderRadius: "50%",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                        }}
                    >
                        <Tooltip title={`دنبال‌کردن: ${followMode === 'gps' ? 'GPS' : followMode === 'dr' ? 'DR' : 'خاموش'}`}>
                            <IconButton
                                onClick={() =>
                                    setFollowMode((prev) =>
                                        prev === "off" ? "gps" : prev === "gps" ? "dr" : "off"
                                    )
                                }
                                color={
                                    followMode === "off"
                                        ? "default"
                                        : followMode === "gps"
                                            ? "primary"
                                            : "warning"
                                }
                                size="large"
                            >
                                {followMode === "gps" ? (
                                    <GpsFixedIcon />
                                ) : followMode === "dr" ? (
                                    <ExploreIcon />
                                ) : (
                                    <BlockIcon />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            {/* 🔥 پنل دیباگ با props های جدید */}
            <DebugPanel
                points={points}
                tracking={tracking}
                currentHeading={currentHeading}
                drHeading={drHeading}
                movementDirection={movementDirection}
                calibrateHeadingOffset={calibrateHeadingOffset}
                offset={offset}
                onStartStop={handleStartStop}
                // 🔥 props های جدید برای کنترل حساسیت گام‌شمار
                adjustStepSensitivity={adjustStepSensitivity}
                setCustomStepSensitivity={setCustomStepSensitivity}
                getStepDebugInfo={getStepDebugInfo}
                onExpandedChange={setDebugPanelExpanded}
            />
        </Box>
    );
}
