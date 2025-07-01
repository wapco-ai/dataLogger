
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
  CircleMarker
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-rotate';
import 'leaflet/dist/leaflet.css';
import '../styles/index.css';
import NodeModal from './NodeModal';
import PathModal from './PathModal';
import { Polygon } from 'react-leaflet';
import PolygonModal from './PolygonModal';
import FilterModal from './FilterModal';
import DeletionModal from './DeletionModal';
import MapRotationControl from './MapRotationControl';
import NorthAngleArrow from './NorthAngleArrow';
import { usePolygonStorage } from './localStorageHooks';
import {
  useMarkerStorage,
  usePathStorage,
  exportMapData,
  importMapData
} from './localStorageHooks';
import {
  point as turfPoint,
  featureCollection,
  polygon as turfPolygon,
  pointsWithinPolygon
} from '@turf/turf';
import BottomControlPanel from './BottomControlPanel';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Button
} from '@mui/material';

// Center-pin icon for manual marker mode
const centerIcon = L.divIcon({
  className: 'center-marker-icon',
  html: '<div class="center-pin">📍</div>',
  iconSize: [20, 26],
  iconAnchor: [10, 26],
  popupAnchor: [0, -26]
});

// Component ساده برای تشخیص زوم و نمایش لیبل‌ها
function SimpleMapLabels({ markers, polygons }) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  
  useMapEvents({
    zoomend: () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      // console.log('Zoom changed to:', newZoom, 'Markers count:', markers.length, 'Polygons count:', polygons.length);
    }
  });

  // فقط در زوم 17+ لیبل نمایش داده شود
  const shouldShowLabels = currentZoom >= 17;
  
  // console.log('Rendering labels:', shouldShowLabels, 'Current zoom:', currentZoom);

  return (
    <>
      {/* نمایش زوم برای دیباگ */}
      {/* <div style={{
        position: 'fixed',
        top: '60px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '14px',
        zIndex: 1500,
        pointerEvents: 'none',
        fontFamily: 'monospace'
      }}>
        <div>Zoom: {currentZoom}</div>
        <div>Show Labels: {shouldShowLabels ? 'YES' : 'NO'}</div>
        <div>Markers: {markers.length}</div>
        <div>Polygons: {polygons.length}</div>
      </div> */}

      {/* لیبل‌های مارکرها */}
      {shouldShowLabels && markers.length > 0 && markers.map((marker, index) => {
        // console.log('Creating marker label:', marker.id, marker.data?.name);
        return (
          <Marker
            key={`marker-label-${marker.id}-${index}`}
            position={marker.position}
            icon={L.divIcon({
              className: 'custom-marker-label',
              html: `
                <div style="
                  background: rgba(255, 255, 255, 0.95);
                  border: 2px solid #4CAF50;
                  border-radius: 8px;
                  padding: 3px 6px;
                  font-size: 10px;
                  font-weight: bold;
                  color: #2E7D32;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
                  white-space: nowrap;
                  pointer-events: none;
                  font-family: Arial, sans-serif;
                  min-width: 30px;
                  text-align: center;
                  opacity: 0.8;
                ">
                  ${marker.data?.name || `نقطه ${index + 1}`}
                </div>
              `,
              iconSize: [100, 30],
              iconAnchor: [50, -20] // بالای مارکر
            })}
          />
        );
      })}
      
      {/* لیبل‌های پولیگون‌ها */}
      {shouldShowLabels && polygons.length > 0 && polygons.map((polygon, index) => {
        try {
          // console.log('Creating polygon label:', polygon.id, polygon.name);
          // محاسبه مرکز پولیگون
          const bounds = L.polygon(polygon.coordinates).getBounds();
          const center = bounds.getCenter();
          
          return (
            <Marker
              key={`polygon-label-${polygon.id}-${index}`}
              position={[center.lat, center.lng]}
              icon={L.divIcon({
                className: 'custom-polygon-label',
                html: `
                  <div style="
                    background: rgba(242, 237, 243, 0.95);
                    border: 2px solid rgba(156, 39, 176, 0.8);
                    border-radius: 12px;
                    padding: 3px 4px;
                    font-size: 10px;
                    font-weight: bold;
                    color: black;
                    box-shadow: 0 2px 12px rgba(156, 39, 176, 0.4);
                    white-space: nowrap;
                    pointer-events: none;
                    text-align: center;
                    font-family: Arial, sans-serif;
                    min-width: 40px;
                    opacity: 0.8;
                  ">
                    ${polygon.name || `محدوده ${index + 1}`}
                  </div>
                `,
                iconSize: [120, 32],
                iconAnchor: [60, 16] // وسط
              })}
            />
          );
        } catch (error) {
          console.error('Error creating polygon label:', error, polygon);
          return null;
        }
      })}
      
      {/* تست لیبل ثابت */}
      {shouldShowLabels && (
        <Marker
          position={[36.2972, 59.6067]} // موقعیت ثابت برای تست
          icon={L.divIcon({
            className: 'test-label',
            html: `
              <div style="
                background: red;
                color: white;
                padding: 8px;
                border-radius: 4px;
                font-weight: bold;
                pointer-events: none;
              ">
                تست لیبل - زوم ${currentZoom}
              </div>
            `,
            iconSize: [120, 30],
            iconAnchor: [60, 15]
          })}
        />
      )}
    </>
  );
}

function NoPopupMarker({ position, children, ...props }) {
  const markerRef = useRef(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.off('click');
      marker.on('click', () => props.onClick && props.onClick());
    }
  }, [props]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      {...props}
    >
      <Popup>{children}</Popup>
    </Marker>
  );
}

// pick a color for each category
const categoryColors = {
  checkpoint: '#e53935', // red
  landmark: '#1e88e5', // blue
  poi: '#fb8c00', // orange
  other: '#6d4c41', // brown
};

// Component to listen for map drag/zoom and report center
function ManualMarkerOverlay({ onPositionChange }) {
  const map = useMap();

  useEffect(() => {
    onPositionChange(map.getCenter());
  }, []);

  useMapEvents({
    dragend: () => onPositionChange(map.getCenter()),
    zoomend: () => onPositionChange(map.getCenter()),
  });

  return null;
}

// Map Click Event Component
function MapClickHandler({ onMapClick, manualMode }) {
  useMapEvents({
    click: (e) => {
      if (!manualMode) onMapClick(e.latlng);
    }
  });
  return null;
}

// Recenter Map Component
function RecenterMap({ position, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, zoom);
    }
  }, [position, zoom]);

  return null;
}

const groupColors = {
  sahn: '#4caf50',       // سبز
  eyvan: '#2196f3',      // آبی
  ravaq: '#9c27b0',      // بنفش
  masjed: '#ff9800',     // نارنجی
  madrese: '#3f51b5',
  khadamat: '#607d8b',
  elmi: '#00bcd4',
  cemetery: '#795548',
  other: '#757575'
};

const functionIcons = {
  door: '🚪',
  connection: '🔗',
  elevator: '🛗',
  escalator: '↕️',
  ramp: '♿',
  stairs: '🪜',
  service: '🚾',
  other: '📍'
};

function getPolygonDefaults(point, polygons) {
  for (const pg of polygons) {
    if (pg.coordinates && isPointInPolygon(point, pg.coordinates)) {
      return {
        group: pg.group || '',
        subGroup: pg.subGroup || '',
        subGroupValue: pg.subGroupValue || ''
      };
    }
  }
  return null;
}

// Check if a point lies inside a polygon using Turf.js
function isPointInPolygon(point, polygon) {
  try {
    const pt = turfPoint([point.lng, point.lat]);
    const poly = turfPolygon([polygon.map(([lat, lng]) => [lng, lat])]);
    const result = pointsWithinPolygon(featureCollection([pt]), poly);
    return result.features.length > 0;
  } catch (error) {
    console.error('Error in isPointInPolygon:', error);
    return false;
  }
}

function getCompositeIcon(group, nodeFunction) {
  const color = groupColors[group] || '#999';
  const icon = functionIcons[nodeFunction] || '📌';

  return L.divIcon({
    className: 'custom-group-icon',
    html: `
      <div style="
        width: 35px;
        height: 35px;
        background-color: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 18px;
        font-weight: bold;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">${icon}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
}

const Map = () => {
  // State management
  const [position, setPosition] = useState([36.2972, 59.6067]);
  const [zoom, setZoom] = useState(12);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [pathCoordinates, setPathCoordinates] = useState([]);
  const [locationError, setLocationError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [selectedItemForDeletion, setSelectedItemForDeletion] = useState(null);
  const [markerToEdit, setMarkerToEdit] = useState(null);
  const [pathToEdit, setPathToEdit] = useState(null);
  const [polygonToEdit, setPolygonToEdit] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [mapLayer, setMapLayer] = useState('street');
  const trackingTimeoutRef = useRef(null);
  const [lastGpsData, setLastGpsData] = useState(null);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [manualPathPoints, setManualPathPoints] = useState([]);
  const [gpsMetaPoints, setGpsMetaPoints] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [showPolygonModal, setShowPolygonModal] = useState(false);
  const blockNextMapClickRef = useRef(false);
  const [drPanelOpen, setDrPanelOpen] = useState(false);
  const [clickPos, setClickPos] = useState(null);
  const [manualMarkerMode, setManualMarkerMode] = useState(false);
  const [centerPos, setCenterPos] = useState(null);

  const mapRef = useRef(null);

  const handleExport = (format = 'json') => {
    exportMapData(format);
  };

  const [filterOptions, setFilterOptions] = useState({
    geometry: { markers: true, paths: true, polygons: true },
    groups: [],
    subGroups: [],
    markerTypes: [],
    pathTypes: [],
    transportModes: [],
    gender: []
  });

  const layerLabels = {
    street: 'Street View',
    esri: 'Esri World Imagery',
    eox: 'EOX S2 Cloudless 2020'
  };
  
  const layers = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    esri: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    eox: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
  };

  // Storage hooks
  const { markers, addMarker, removeMarker, updateMarker } = useMarkerStorage();
  const { paths, addPath, removePath, updatePath } = usePathStorage();
  const { polygons, addPolygon, removePolygon, updatePolygon } = usePolygonStorage();

  // Load bundled GeoJSON data on first run
  useEffect(() => {
    async function loadGeojson() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data14040404.geojson`);
        if (!response.ok) return;
        const geojson = await response.json();
        if (geojson.type !== 'FeatureCollection') return;

        const markerKeys = new Set(markers.map(m => `${m.position[0]},${m.position[1]}`));
        const pathKeys = new Set(paths.map(p => JSON.stringify(p.coordinates)));
        const polygonKeys = new Set(polygons.map(p => JSON.stringify(p.coordinates)));

        geojson.features.forEach((feature) => {
          const { geometry, properties = {} } = feature;
          if (!geometry) return;

          if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates;
            const key = `${lat},${lng}`;
            if (!markerKeys.has(key)) {
              markerKeys.add(key);
              addMarker({
                id: crypto.randomUUID(),
                position: [lat, lng],
                data: properties,
                timestamp: properties.timestamp || new Date().toISOString()
              });
            }
          } else if (geometry.type === 'LineString') {
            const coords = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            const key = JSON.stringify(coords);
            if (!pathKeys.has(key)) {
              pathKeys.add(key);
              addPath({
                id: crypto.randomUUID(),
                name: properties.name || '',
                description: properties.description || '',
                type: properties.type || '',
                coordinates: coords,
                timestamp: properties.timestamp || new Date().toISOString()
              });
            }
          } else if (geometry.type === 'Polygon') {
            const coords = geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            const key = JSON.stringify(coords);
            if (!polygonKeys.has(key)) {
              polygonKeys.add(key);
              addPolygon({
                id: crypto.randomUUID(),
                name: properties.name || '',
                description: properties.description || '',
                type: properties.type || '',
                transportModes: properties.transportModes || [],
                gender: properties.gender || '',
                coordinates: coords,
                timestamp: properties.timestamp || new Date().toISOString()
              });
            }
          }
        });
      } catch (err) {
        console.error('Failed to load initial GeoJSON', err);
      }
    }

    loadGeojson();
  }, [addMarker, addPath, addPolygon]);

  // Refs for tracking
  const watchIdRef = useRef(null);

  // Geolocation setup
  const setupGeolocation = useCallback(() => {
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('موقعیت مکانی در دستگاه شما پشتیبانی نمی‌شود');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPosition = [latitude, longitude];

        setUserLocation(newPosition);
        setLastGpsData(position);
        setLocationAccuracy(accuracy);
        setPosition(newPosition);
        setZoom(15);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('دسترسی به موقعیت مکانی رد شد');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('اطلاعات موقعیت در دسترس نیست');
            break;
          case error.TIMEOUT:
            setLocationError('زمان درخواست موقعیت مکانی به پایان رسید');
            break;
          default:
            setLocationError('خطا در دریافت موقعیت مکانی');
        }

        setPosition([36.2972, 59.6067]);
        setZoom(12);
      },
      options
    );
  }, []);

  const startManualPath = () => {
    setIsDrawingPath(true);
    setManualPathPoints([]);
    setLocationError(null);
  };
  
  const finishManualPath = () => {
    if (manualPathPoints.length > 1) {
      setIsDrawingPath(false);
      setModalMode('manual');
      setShowPathModal(true);
    } else {
      setLocationError('مسیر بسیار کوتاه است. حداقل دو نقطه نیاز است.');
    }
  };
  
  const pathCoordinatesRef = useRef(pathCoordinates);

  const startDrawingPolygon = () => {
    setIsDrawingPolygon(true);
    setPolygonPoints([]);
  };

  const finishPolygon = () => {
    if (polygonPoints.length >= 3) {
      setIsDrawingPolygon(false);
      setShowPolygonModal(true);
    } else {
      alert('حداقل سه نقطه نیاز است.');
    }
  };
  
  const handleSavePolygon = (polygonData) => {
    addPolygon(polygonData);
    setShowPolygonModal(false);
    setPolygonPoints([]);
    setIsDrawingPolygon(false);
  };

  useEffect(() => {
    pathCoordinatesRef.current = pathCoordinates;
  }, [pathCoordinates]);

  // Start tracking function
  const startTracking = () => {
    setIsTracking(true);
    setPathCoordinates([]);
    setLocationError(null);
    
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }

    trackingTimeoutRef.current = setTimeout(() => {
      setPathCoordinates((currentPathCoords) => {
        if (currentPathCoords.length === 0) {
          stopTracking();
          setLocationError('عدم موفقیت در دریافت موقعیت مکانی. لطفاً مجدداً تلاش کنید.');
        }
        return currentPathCoords;
      });
    }, 30000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        console.log('GPS update:', position.coords.latitude, position.coords.longitude, 'accuracy:', position.coords.accuracy);
        setLastGpsData(position);
        const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
        const newLocation = [latitude, longitude];

        clearTimeout(trackingTimeoutRef.current);

        if (accuracy <= 5000) {
          setUserLocation(newLocation);
          setLocationError(null);
          
          setPathCoordinates(prev => {
            if (prev.length === 0) {
              return [...prev, newLocation];
            }
            const lastCoord = prev[prev.length - 1];
            const minDistance = 0.000001;
            const isNewPointFarEnough =
              Math.abs(lastCoord[0] - latitude) > minDistance ||
              Math.abs(lastCoord[1] - longitude) > minDistance;

            return isNewPointFarEnough ? [...prev, newLocation] : prev;
          });

          setGpsMetaPoints(prev => [...prev, {
            coords: { latitude, longitude, accuracy, altitude, speed, heading },
            timestamp: position.timestamp
          }]);
        }
      },
      (error) => {
        console.error('Tracking error:', error);
        clearTimeout(trackingTimeoutRef.current);

        let errorMessage = 'خطا در دریافت موقعیت';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'دسترسی به موقعیت مکانی رد شد';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'اطلاعات موقعیت در دسترس نیست';
            break;
          case error.TIMEOUT:
            errorMessage = 'زمان درخواست موقعیت مکانی به پایان رسید';
            break;
        }
        setLocationError(errorMessage);
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
        distanceFilter: 1
      }
    );
  };

  // Stop tracking method
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);

    if (pathCoordinates.length > 1) {
      setModalMode('gps');
      setShowPathModal(true);
    } else {
      setPathCoordinates([]);
      setLocationError('مسیر بسیار کوتاه است. لطفاً مسافت بیشتری را طی کنید.');
    }
  };

  const handleMarkerClick = (marker) => {
    setSelectedItemForDeletion({
      type: 'marker',
      item: marker
    });
  };

  const handlePathClick = (path) => {
    setSelectedItemForDeletion({
      type: 'path',
      item: path
    });
  };

  const handleEditSelected = () => {
    if (!selectedItemForDeletion) return;
    const { type, item } = selectedItemForDeletion;
    if (type === 'marker') {
      setMarkerToEdit(item);
    } else if (type === 'path') {
      setPathToEdit(item);
    } else if (type === 'polygon') {
      setPolygonToEdit(item);
    }
    setSelectedItemForDeletion(null);
  };

  // Delete handler
  const handleDelete = () => {
    if (selectedItemForDeletion) {
      const { type, item } = selectedItemForDeletion;

      if (type === 'marker') {
        removeMarker(item.id);
      } else if (type === 'path') {
        removePath(item.id);
      } else if (type === 'polygon') {
        removePolygon(item.id);
      }

      setSelectedItemForDeletion(null);
    }
  };

  // Save path method
  const handleSavePath = (pathData) => {
    addPath({
      ...pathData,
      coordinates: pathCoordinates,
      pointsMeta: gpsMetaPoints
    });
    setShowPathModal(false);
    setPathCoordinates([]);
    setGpsMetaPoints([]);
  };

  const handleUpdateMarker = (id, data) => {
    updateMarker(id, { position: [data.latitude, data.longitude], data });
  };

  const handleUpdatePath = (id, data) => {
    updatePath(id, data);
  };

  const handleUpdatePolygon = (id, data) => {
    updatePolygon(id, data);
  };

  // Initial geolocation setup
  useEffect(() => {
    setupGeolocation();
  }, [setupGeolocation]);

  // Manual marker controls
  const startManualMarker = () => {
    setManualMarkerMode(true);
    setCenterPos(null);
  };
  
  const finishManualMarker = () => {
    if (centerPos) {
      setManualMarkerMode(false);
      const defaults = getPolygonDefaults({ lat: centerPos.lat, lng: centerPos.lng }, polygons);
      setSelectedLocation({ lat: centerPos.lat, lng: centerPos.lng, defaults });
    } else {
      setLocationError('لطفاً جایگاه را تنظیم کنید');
    }
  };
  
  const cancelManualMarker = () => {
    setManualMarkerMode(false);
    setCenterPos(null);
  };

  // Map click handler
  const handleMapClick = (latlng) => {
    // ignore clicks during manual marker mode
    if (manualMarkerMode) return;

    // Block the next click after a feature/modal click
    if (blockNextMapClickRef.current) {
      blockNextMapClickRef.current = false;
      return;
    }

    // If any modal is open, do nothing
    if (
      selectedItemForDeletion ||
      showPolygonModal ||
      showPathModal ||
      selectedLocation
    ) {
      return;
    }

    // Add point if in polygon drawing mode
    if (isDrawingPolygon) {
      setPolygonPoints(prev => [...prev, [latlng.lat, latlng.lng]]);
      return;
    }

    // Add point if in manual path drawing mode
    if (isDrawingPath) {
      setManualPathPoints(prev => [
        ...prev,
        {
          coordinates: [latlng.lat, latlng.lng],
          gpsMeta: lastGpsData ? {
            coords: { ...lastGpsData.coords },
            timestamp: lastGpsData.timestamp
          } : null
        }
      ]);
      return;
    }

    setClickPos(latlng);

    // Otherwise, open NodeModal (add marker modal)
    const defaults = getPolygonDefaults({ lat: latlng.lat, lng: latlng.lng }, polygons);
    setSelectedLocation({
      lat: latlng.lat,
      lng: latlng.lng,
      defaults
    });
  };

  // Node Modal Handler
  const handleSaveNode = (nodeData) => {
    addMarker({
      position: [nodeData.latitude, nodeData.longitude],
      data: nodeData
    });
    setSelectedLocation(null);
  };

  // Export/Import Handlers
  const handleExportData = () => {
    exportMapData();
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      importMapData(file)
        .then(({ markers: newMarkers, paths: newPaths, polygons: newPolygons }) => {
          markers.forEach(m => removeMarker(m.id));
          paths.forEach(p => removePath(p.id));
          polygons.forEach(pg => removePolygon(pg.id));

          newMarkers.forEach(m => addMarker(m));
          newPaths.forEach(p => addPath(p));
          newPolygons && newPolygons.forEach(pg => addPolygon(pg));

          alert('اطلاعات با موفقیت وارد شد!');
        })
    }
  };

  // Filtering logic
  const filteredMarkers = filterOptions.geometry.markers ? markers.filter(marker => {
    const markerTypeMatch =
      filterOptions.markerTypes.length === 0 ||
      filterOptions.markerTypes.includes(marker.data?.type);

    const transportModesMatch =
      filterOptions.transportModes.length === 0 ||
      (marker.data?.transportModes && marker.data.transportModes.some(mode =>
        filterOptions.transportModes.includes(mode)
      ));

    const genderMatch =
      filterOptions.gender.length === 0 ||
      filterOptions.gender.includes(marker.data?.gender);

    const groupMatch =
      filterOptions.groups.length === 0 ||
      (marker.data?.group && filterOptions.groups.includes(marker.data.group));

    const subGroupMatch =
      filterOptions.subGroups.length === 0 ||
      (marker.data?.subGroup && filterOptions.subGroups.includes(marker.data.subGroup));

    return markerTypeMatch && transportModesMatch && genderMatch && groupMatch && subGroupMatch;
  }) : [];

  const filteredPaths = filterOptions.geometry.paths ? paths.filter(path =>
    filterOptions.pathTypes.length === 0 ||
    filterOptions.pathTypes.includes(path.type)
  ) : [];

  const filteredPolygons = filterOptions.geometry.polygons ? polygons.filter(pg => {
    const groupMatch =
      filterOptions.groups.length === 0 ||
      (pg.group && filterOptions.groups.includes(pg.group));
    const subGroupMatch =
      filterOptions.subGroups.length === 0 ||
      (pg.subGroup && filterOptions.subGroups.includes(pg.subGroup));
    return groupMatch && subGroupMatch;
  }) : [];
  
  const handleSaveManualPath = (pathData) => {
    addPath({
      ...pathData,
      coordinates: manualPathPoints,
    });
    setShowPathModal(false);
    setManualPathPoints([]);
    setIsDrawingPath(false);
  };
  
  // Path color helper function
  const getPathColor = (pathType) => {
    switch (pathType) {
      case 'hiking': return '#4CAF50'; // Green
      case 'cycling': return '#2196F3'; // Blue
      case 'driving': return '#FF9800'; // Orange
      default: return '#9C27B0'; // Purple
    }
  };

  return (
    <div className={`map-container ${manualMarkerMode ? 'manual-marker-mode' : ''}`}>
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#ffffffee',
          padding: '10px',
          borderRadius: '8px',
          zIndex: drPanelOpen ? 500 : 1200,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          direction: 'rtl',
          minWidth: '180px'
        }}
      >
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="map-layer-label" style={{ right: '0px', fontWeight: 'bold' }}>نقشه پایه</InputLabel>
          <Select
            labelId="map-layer-label"
            id="map-layer-select"
            value={mapLayer}
            label="نقشه پایه"
            onChange={(e) => setMapLayer(e.target.value)}
          >
            {Object.keys(layers).map((key) => (
              <MenuItem key={key} value={key}>
                {layerLabels[key] || key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Path Save Modal */}
      {showPathModal && (
        <PathModal
          onSave={modalMode === 'manual' ? handleSaveManualPath : handleSavePath}
          onClose={() => {
            setShowPathModal(false);
            if (modalMode === 'manual') {
              setManualPathPoints([]);
              setIsDrawingPath(false);
            } else {
              setPathCoordinates([]);
            }
            setModalMode(null);
          }}
          pathCoordinates={modalMode === 'manual' ? manualPathPoints : pathCoordinates}
        />
      )}

      {pathToEdit && (
        <PathModal
          onClose={() => setPathToEdit(null)}
          initialData={pathToEdit}
          onUpdate={handleUpdatePath}
        />
      )}

      {/* Node Modal */}
      {selectedLocation && (
        <NodeModal
          location={selectedLocation}
          gpsMeta={lastGpsData}
          onClose={() => setSelectedLocation(null)}
          onSave={handleSaveNode}
          initialData={selectedLocation.defaults}
        />
      )}

      {markerToEdit && (
        <NodeModal
          location={{ lat: markerToEdit.position[0], lng: markerToEdit.position[1] }}
          onClose={() => setMarkerToEdit(null)}
          initialData={markerToEdit}
          onUpdate={handleUpdateMarker}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filterOptions={filterOptions}
          setFilterOptions={setFilterOptions}
        />
      )}

      {/* Deletion Confirmation Modal */}
      {selectedItemForDeletion && (
        <DeletionModal
          selectedItem={selectedItemForDeletion}
          onDelete={handleDelete}
          onEdit={handleEditSelected}
          onClose={() => setSelectedItemForDeletion(null)}
        />
      )}

      <MapContainer
        zoom={zoom}
        scrollWheelZoom={true}
        tap={true}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          margin: 0,
          padding: 0,
          direction: 'rtl'
        }}
        whenCreated={mapInstance => {
          mapRef.current = mapInstance;
        }}
      >
        {/* Recenter Map */}
        <RecenterMap position={position} zoom={zoom} />
        <MapRotationControl mapRef={mapRef} />
        
        {/* Map Click Handler */}
        <MapClickHandler onMapClick={handleMapClick} manualMode={manualMarkerMode} />

        <TileLayer
          url={layers[mapLayer]}
          maxZoom={21}
          attribution='&copy; <a href="wapco.ir">wapco</a> contributors'
        />

        {/* User Location Marker with Accuracy Circle */}
        {userLocation && locationAccuracy && (
          <>
            <Circle
              center={userLocation}
              radius={locationAccuracy}
              color="#e6f2ff"
              fillColor="#1976d2"
              fillOpacity={0.1}
              weight={2}
            />
            <CircleMarker
              center={userLocation}
              radius={6}
              pathOptions={{
                color: '#e6f2ff',
                weight: 2,
                fillColor: '#1976d2',
                fillOpacity: 1
              }}
            />
          </>
        )}

        {/* Path Tracing */}
        {pathCoordinates.length > 0 && (
          <Polyline
            positions={pathCoordinates}
            color="blue"
            weight={5}
            opacity={isTracking ? 0.7 : 1}
          />
        )}

        {/* Manual Path Drawing Polyline */}
        {isDrawingPath && manualPathPoints.length > 0 && (
          <Polyline
            positions={manualPathPoints.map(pt => pt.coordinates)}
            color="blue"
            weight={5}
            opacity={0.7}
          />
        )}

        {isDrawingPolygon && polygonPoints.length > 1 && (
          <Polygon
            positions={polygonPoints}
            pathOptions={{ color: 'black', fill: true, fillOpacity: 0 , opacity: 0.5}}
          />
        )}

        {filteredPolygons.map(polygon => (
          <Polygon
            key={polygon.id}
            positions={polygon.coordinates}
            pathOptions={{ color: 'black', fill: true, fillOpacity: 0 , opacity: 0.5}}
            eventHandlers={{
              click: (e) => {
                if (e.originalEvent && e.originalEvent.stopPropagation) {
                  e.originalEvent.stopPropagation();
                }
                blockNextMapClickRef.current = true;
                setSelectedItemForDeletion({
                  type: 'polygon',
                  item: polygon,
                });
              }
            }}
          />
        ))}

        {showPolygonModal && (
          <PolygonModal
            onSave={handleSavePolygon}
            onClose={() => setShowPolygonModal(false)}
            polygonCoordinates={polygonPoints}
          />
        )}

        {polygonToEdit && (
          <PolygonModal
            onClose={() => setPolygonToEdit(null)}
            initialData={polygonToEdit}
            onUpdate={handleUpdatePolygon}
          />
        )}

        {/* Manual Marker Overlay & Icon */}
        {manualMarkerMode && (
          <>
            <ManualMarkerOverlay onPositionChange={setCenterPos} />
            {centerPos && (
              <Marker
                position={[centerPos.lat, centerPos.lng]}
                icon={centerIcon}
              />
            )}
          </>
        )}

        {/* show a little black dot at the clicked spot */}
        {clickPos && (
          <CircleMarker
            center={clickPos}
            radius={6}
            pathOptions={{ color: 'black', fillColor: 'black', fillOpacity: 1 }}
          />
        )}

        {/* Dynamic Markers */}
        {filteredMarkers.map((marker) => (
          <NoPopupMarker
            key={marker.id}
            position={marker.position}
            icon={getCompositeIcon(marker.data?.group, marker.data?.nodeFunction)}
            onClick={() => handleMarkerClick(marker)}
            eventHandlers={{
              click: () => handleMarkerClick(marker)
            }}
          >
          </NoPopupMarker>
        ))}

        {/* Path markers */}
        {filteredPaths.map((path) => {
          let polylinePositions = [];
          if (Array.isArray(path.coordinates) && typeof path.coordinates[0] === 'object' && Array.isArray(path.coordinates[0].coordinates)) {
            polylinePositions = path.coordinates.map(pt => pt.coordinates);
          } else if (Array.isArray(path.coordinates[0])) {
            polylinePositions = path.coordinates;
          }
          return (
            <React.Fragment key={path.id}>
              <Polyline
                positions={
                  Array.isArray(path.coordinates) && path.coordinates.length > 0
                    ? typeof path.coordinates[0] === 'object' && Array.isArray(path.coordinates[0].coordinates)
                      ? path.coordinates.map(pt => pt.coordinates)
                      : path.coordinates
                    : []
                }
                color={getPathColor(path.type)}
                weight={5}
                opacity={0.7}
                eventHandlers={{
                  click: () => handlePathClick(path)
                }}
              >
                <Popup>
                  <div>
                    <strong>{path.name}</strong>
                    <p>{path.description}</p>
                    <p>نوع مسیر: {path.type}</p>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* لیبل‌ها با Debug Panel */}
        <SimpleMapLabels 
          markers={filteredMarkers} 
          polygons={filteredPolygons} 
        />

      </MapContainer>
      
      {!drPanelOpen && <NorthAngleArrow />}
      
      <BottomControlPanel
        isTracking={isTracking}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
        onAddMarker={startManualMarker}
        onExport={handleExport}
        onImportClick={() => document.getElementById('importInput').click()}
        onFilter={() => setShowFilterModal(true)}
        onStartManualPath={startManualPath}
        isDrawingPath={isDrawingPath}
        onStartPolygon={startDrawingPolygon}
        isDrawingPolygon={isDrawingPolygon}
        onPanelToggle={setDrPanelOpen}
      />

      {/* Manual Marker Finish / Cancel Buttons */}
      {manualMarkerMode && (
        <>
          <Button
            onClick={finishManualMarker}
            variant="contained"
            color="success"
            sx={{ position: 'fixed', bottom: 80, right: 20, zIndex: 1300 }}
          >
            پایان نشانگر و ذخیره
          </Button>
          <Button
            onClick={cancelManualMarker}
            variant="contained"
            color="warning"
            sx={{ position: 'fixed', bottom: 80, right: 160, zIndex: 1300 }}
          >
            لغو
          </Button>
        </>
      )}

      {isDrawingPath && (
        <Button
          onClick={finishManualPath}
          variant="contained"
          color="success"
          style={{ position: "fixed", bottom: 70, right: 20, zIndex: 9999 }}
        >
          پایان مسیر و ذخیره
        </Button>
      )}

      {isDrawingPolygon && polygonPoints.length >= 3 && (
        <Button
          onClick={finishPolygon}
          variant="contained"
          color="success"
          style={{ position: "fixed", bottom: 70, right: 90, zIndex: 9999 }}
        >
          پایان محدوده و ذخیره
        </Button>
      )}

      <input
        id="importInput"
        type="file"
        accept=".json,.geojson,.kml"
        onChange={handleImportData}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default Map;
