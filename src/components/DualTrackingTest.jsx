import { useState, useRef, useEffect } from "react";
import { useDualTracking } from "../hooks/useDualTracking";
import { MapContainer, TileLayer, Polyline, Circle, Marker, useMap } from "react-leaflet";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import ExploreIcon from '@mui/icons-material/Explore';
import BlockIcon from '@mui/icons-material/Block';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import ListAltIcon from '@mui/icons-material/ListAlt';
import L from "leaflet";

// 1) Compute heading from the last two DR points (in degrees clockwise from north)
function calcDrHeading(path) {
    if (path.length < 2) return 0;
    const [lat1, lng1] = path[path.length - 2];
    const [lat2, lng2] = path[path.length - 1];
    // dy = northward, dx = eastward
    const dy = lat2 - lat1;
    const dx = lng2 - lng1;
    // atan2(dx, dy) gives angle relative to north
    return (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
}

// 2) SVG arrow inside a DivIcon, rotated by `heading`
function DrArrowMarker({ position, heading }) {
    const icon = L.divIcon({
        className: "",              // no extra CSS
        iconSize: [48, 48],         // adjust as you like
        iconAnchor: [24, 24],       // center on the point
        html: `
       <div style="
         transform: rotate(${heading}deg);
         width: 48px; height: 48px;
         display: flex;
         align-items: center;
         justify-content: center;
       ">
         <!-- simple arrow SVG -->
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

export default function DualTrackingTest({ mode, actions, mapHeight }) {
    // wrap the hook’s start so we can also flip followMode → 'gps'
    const { tracking, points, start: hookStart, stop } = useDualTracking();
    const start = () => { hookStart(); setFollowMode("gps"); };
    const lastGps = points.length ? points[points.length - 1].gps : null;
    const lastDr = points.length ? points[points.length - 1].dr : null;
    const gpsPath = toLatLngArr(points, "gps");
    const drPath = toLatLngArr(points, "dr");
    // in mapOnly mode we want to always follow GPS
    const [followMode, setFollowMode] = useState(mode === "mapOnly" ? "gps" : "off");
    const [initialGps, setInitialGps] = useState(null);
    const [pendingZoomTarget, setPendingZoomTarget] = useState(null);
    const mapRef = useRef(null);
    const firstZoomed = useRef(false);

    const drHeading = calcDrHeading(drPath);

    useEffect(() => {
        if (mode === 'full' && !tracking && mapRef.current) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setInitialGps({ latitude: lat, longitude: lng });

                    mapRef.current.setView([lat, lng], 17);
                    firstZoomed.current = true;
                },
                (error) => {
                    console.warn("Failed to fetch initial GPS:", error);
                },
                { enableHighAccuracy: true }
            );
        }
    }, [mode, tracking, mapRef.current]);


    useEffect(() => {
        const target = lastGps || initialGps;
        if (mode === 'full' && target && !firstZoomed.current) {
            setPendingZoomTarget(target);
        }
        if (mode !== 'full') {
            firstZoomed.current = false;
        }
    }, [mode, lastGps, initialGps]);

    // compact = render *only* the controls passed via `actions(...)`
    // if (mode === "compact" && typeof actions === "function") {
    //     return actions({
    //       tracking,
    //       points,
    //       start,
    //       stop,
    //       exportDualCSV,
    //       exportDualGeoJSON
    //     });
    // }

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", direction: "rtl" }}>
            <Box sx={{ textAlign: "center", py: 1 }}>
                <Typography variant="h6" fontSize={15}>مسیرآزمایشی مقایسه GPS و Dead Reckoning</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 2, pb: 1 }}>
                <Tooltip title={tracking ? "پایان مسیر" : "شروع مسیر"}>
                    <IconButton color={tracking ? "error" : "success"} onClick={tracking ? stop : start} size="large">
                        {tracking ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                </Tooltip>

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

            <Box sx={{ flex: 1, minHeight: 0 }}>
                <MapContainer
                    center={gpsPath.length ? gpsPath[gpsPath.length - 1] : [36.2972, 59.6067]}
                    zoom={16}
                    style={{ height: "100%", width: "100%" }}
                    whenCreated={(mapInstance) => {
                        mapRef.current = mapInstance;
                        // **initial GPS zoom** when modal opens
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
                    {drPath.length > 0 && (
                        <DrArrowMarker
                            position={drPath[drPath.length - 1]}
                            heading={drHeading}
                        />
                    )}
                    <AutoRecenter gps={lastGps} dr={lastDr} mode={followMode} />
                </MapContainer>

                <Box
                    sx={{
                        position: "absolute",
                        bottom: 46,
                        right: 23,
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
            </Box>

            {points.length > 0 && (
                <Box sx={{ py: 1, px: 2 }}>
                    <Typography variant="subtitle2">تعداد نقاط: {points.length}</Typography>
                    <Typography variant="body2">
                        آخرین GPS: {lastGps ? `${lastGps.latitude.toFixed(6)}, ${lastGps.longitude.toFixed(6)}` : "-"}
                        <br />
                        آخرین Dead Reckoning: {lastDr ? `${lastDr.latitude.toFixed(6)}, ${lastDr.longitude.toFixed(6)}` : "-"}
                        <br />
                        خطای لحظه‌ای (متر): {lastGps && lastDr ? (
                            Math.sqrt(
                                Math.pow((lastGps.latitude - lastDr.latitude) * 111320, 2) +
                                Math.pow(
                                    (lastGps.longitude - lastDr.longitude) *
                                    40075000 *
                                    Math.cos((lastGps.latitude * Math.PI) / 180) /
                                    360,
                                    2
                                )
                            ).toFixed(2)
                        ) : "-"}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
