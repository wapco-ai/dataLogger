import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/index.css';
import NodeModal from './NodeModal';
import {
  useMarkerStorage,
  usePathStorage,
  exportMapData,
  importMapData
} from './localStorageHooks';
import BottomControlPanel from './BottomControlPanel';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box
} from '@mui/material';
import { right } from '@popperjs/core';
// Custom Marker Icon
const customMarkerIcon = L.divIcon({
  className: 'custom-marker-icon',
  html: `
    <div style="
      width: 30px; 
      height: 30px; 
      background-color: #2196F3; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">
      📍
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Deletion Modal Component
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

  const calculatePathLength = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const coord1 = L.latLng(coordinates[i - 1][0], coordinates[i - 1][1]);
      const coord2 = L.latLng(coordinates[i][0], coordinates[i][1]);
      totalDistance += coord1.distanceTo(coord2);
    }

    return (totalDistance / 1000).toFixed(2); // Convert to kilometers
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
        جزئیات {selectedItem.type === 'marker' ? 'نشانگر' : 'مسیر'}
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

// Action Panel Component
function ActionPanel({
  isTracking,
  onStartTracking,
  onStopTracking,
  onAddMarker,
  pathCoordinates,
  onShowFilter  // New prop for filter
}) {
  const calculatePathLength = () => {
    if (pathCoordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < pathCoordinates.length; i++) {
      const coord1 = L.latLng(pathCoordinates[i - 1][0], pathCoordinates[i - 1][1]);
      const coord2 = L.latLng(pathCoordinates[i][0], pathCoordinates[i][1]);
      totalDistance += coord1.distanceTo(coord2);
    }

    return totalDistance; // in meters
  }

  const pathLength = calculatePathLength();

  return (
    <div className="bottom-action-panel">
      {!isTracking ? (
        <button
          onClick={onStartTracking}
          className="action-button start-tracking-btn"
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          <span>▶</span> شروع ردیابی
        </button>
      ) : (
        <button
          onClick={onStopTracking}
          className="action-button stop-tracking-btn"
          onMouseOver={(e) => e.target.style.backgroundColor = '#e53935'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#F44336'}
        >
          <span>■</span> توقف ردیابی
        </button>
      )}

      <button
        onClick={onAddMarker}
        className="action-button add-marker-btn"
        onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
      >
        <span>+</span> افزودن نشانگر
      </button>

      <button
        onClick={onShowFilter}
        style={{
          backgroundColor: 'purple',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        فیلتر
      </button>

      {pathLength > 0 && (
        <div style={{
          backgroundColor: '#FFC107',
          color: 'black',
          borderRadius: '15px',
          padding: '10px 15px',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>مسافت:</span>
          <span>{pathLength} متر</span>
        </div>
      )}
    </div>
  )
}

// Path Save Modal Component
function PathSaveModal({ onSave, onClose, pathCoordinates }) {
  const [pathName, setPathName] = useState('')
  const [pathDescription, setPathDescription] = useState('')
  const [pathType, setPathType] = useState('')

  const handleSave = () => {
    if (!pathName.trim()) {
      alert('نام مسیر را وارد کنید')
      return
    }

    const pathData = {
      name: pathName,
      description: pathDescription,
      type: pathType,
      coordinates: pathCoordinates,
      timestamp: new Date().toISOString()
    }

    onSave(pathData)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      width: '90%',
      maxWidth: '400px'
    }}>
      <h2>ذخیره‌سازی مسیر</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>نام مسیر:</label>
        <input
          type="text"
          value={pathName}
          onChange={(e) => setPathName(e.target.value)}
          placeholder="نام مسیر را وارد کنید"
          style={{ width: '100%', padding: '5px' }}
          required
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>توضیحات:</label>
        <textarea
          value={pathDescription}
          onChange={(e) => setPathDescription(e.target.value)}
          placeholder="توضیحات مسیر را وارد کنید"
          style={{ width: '100%', padding: '5px', minHeight: '100px' }}
        />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>نوع مسیر:</label>
        <select
          value={pathType}
          onChange={(e) => setPathType(e.target.value)}
          style={{ width: '100%', padding: '5px' }}
        >
          <option value="">انتخاب نوع مسیر</option>
          <option value="hiking">پیاده‌روی</option>
          <option value="driving">رانندگی</option>
          <option value="other">سایر</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px',
            backgroundColor: 'green',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          ذخیره
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '10px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          انصراف
        </button>
      </div>
    </div>
  )
}

// Map Click Event Component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
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

// Filter Modal Component
function FilterModal({ isOpen, onClose, filterOptions, setFilterOptions }) {
  if (!isOpen) return null;

  const toggleOption = (category, option) => {
    setFilterOptions(prev => {
      const currentOptions = prev[category] || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(item => item !== option)
        : [...currentOptions, option];

      return { ...prev, [category]: newOptions };
    });
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
      zIndex: 1000,
      width: '90%',
      maxWidth: '400px'
    }}>
      <h2>فیلترسازی</h2>

      <div>
        <h3>نوع نشانگر</h3>
        {['checkpoint', 'landmark', 'poi', 'other'].map(type => (
          <label key={type}>
            <input
              type="checkbox"
              checked={filterOptions.markerTypes.includes(type)}
              onChange={() => toggleOption('markerTypes', type)}
            />
            {type === 'checkpoint' && 'نقطه بازرسی'}
            {type === 'landmark' && 'نشانه'}
            {type === 'poi' && 'نقطه دلخواه'}
            {type === 'other' && 'سایر'}
          </label>
        ))}
      </div>

      <div>
        <h3>نوع مسیر</h3>
        {['hiking', 'driving', 'other'].map(type => (
          <label key={type}>
            <input
              type="checkbox"
              checked={filterOptions.pathTypes.includes(type)}
              onChange={() => toggleOption('pathTypes', type)}
            />
            {type === 'hiking' && 'پیاده‌روی'}
            {type === 'driving' && 'رانندگی'}
            {type === 'other' && 'سایر'}
          </label>
        ))}
      </div>

      <button onClick={onClose}>بستن</button>
    </div>
  );
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
  const [showPathSaveModal, setShowPathSaveModal] = useState(false);
  const [selectedItemForDeletion, setSelectedItemForDeletion] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [mapLayer, setMapLayer] = useState('street');
  const trackingTimeoutRef = useRef(null);

  const handleExport = (format = 'json') => {
    exportMapData(format); // Make sure this uses the enhanced export function we created earlier
  };

  const [filterOptions, setFilterOptions] = useState({
    markerTypes: [],
    pathTypes: [],
    transportModes: [],
    gender: []
  });

  const layers = {
    street: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
  };


  // Storage Hooks
  const {
    markers,
    addMarker,
    removeMarker,
    updateMarker
  } = useMarkerStorage();

  const {
    paths,
    addPath,
    removePath,
    updatePath
  } = usePathStorage();

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

  const pathCoordinatesRef = useRef(pathCoordinates);

  useEffect(() => {
    pathCoordinatesRef.current = pathCoordinates;
  }, [pathCoordinates]);
  // Start tracking function
  const startTracking = () => {
    setIsTracking(true);
    setPathCoordinates([]); // Clear previous coordinates
    setLocationError(null);
    // Clear any existing timeout to avoid stacking
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }

    // Use a ref + functional update to avoid stale closure for pathCoordinates length check
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
        const { latitude, longitude, accuracy } = position.coords;
        const newLocation = [latitude, longitude];

        clearTimeout(trackingTimeoutRef.current);

        if (accuracy <= 500) {
          setUserLocation(newLocation);
          setLocationError(null);
          setPathCoordinates(prev => {
            if (prev.length === 0) {
              return [newLocation];
            }
            const lastCoord = prev[prev.length - 1];
            const minDistance = 0.000001;
            const isNewPointFarEnough =
              Math.abs(lastCoord[0] - latitude) > minDistance ||
              Math.abs(lastCoord[1] - longitude) > minDistance;

            return isNewPointFarEnough ? [...prev, newLocation] : prev;
          });
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
      setShowPathSaveModal(true);
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

  // Delete handler
  const handleDelete = () => {
    if (selectedItemForDeletion) {
      const { type, item } = selectedItemForDeletion;

      if (type === 'marker') {
        removeMarker(item.id);
      } else if (type === 'path') {
        removePath(item.id);
      }

      setSelectedItemForDeletion(null);
    }
  };

  // Save path method
  const handleSavePath = (pathData) => {
    addPath(pathData);
    setShowPathSaveModal(false);
    setPathCoordinates([]);
  };

  // Initial geolocation setup
  useEffect(() => {
    setupGeolocation();
  }, [setupGeolocation]);

  // Map Click Handler
  const handleMapClick = (latlng) => {
    setSelectedLocation({
      lat: latlng.lat,
      lng: latlng.lng
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
        .then(() => {
          alert('اطلاعات با موفقیت وارد شد!');
        })
        .catch(error => {
          console.error('Import failed:', error);
          alert('واردسازی اطلاعات ناموفق بود');
        });
    }
  };

  // Filtering logic
  const filteredMarkers = markers.filter(marker => {
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

    return markerTypeMatch && transportModesMatch && genderMatch;
  });

  const filteredPaths = paths.filter(path =>
    filterOptions.pathTypes.length === 0 ||
    filterOptions.pathTypes.includes(path.type)
  );

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
    <div className="map-container">
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: '#ffffffee',
          padding: '10px',
          borderRadius: '8px',
          zIndex: 1200,
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
            <MenuItem value="street">Street View</MenuItem>
            <MenuItem value="satellite">Satellite View</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Path Save Modal */}
      {showPathSaveModal && (
        <PathSaveModal
          onSave={handleSavePath}
          onClose={() => setShowPathSaveModal(false)}
          pathCoordinates={pathCoordinates}
        />
      )}

      {/* Node Modal */}
      {selectedLocation && (
        <NodeModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onSave={handleSaveNode}
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
          onClose={() => setSelectedItemForDeletion(null)}
        />
      )}

      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{
          width: '100%',     // 100% of parent container
          height: '100%',    // 100% of parent container
          position: 'absolute',
          margin: 0,         // No margins
          padding: 0,        // No padding
          direction: 'rtl'
        }}
      >
        {/* Recenter Map */}
        <RecenterMap position={position} zoom={zoom} />

        {/* Map Click Handler */}
        <MapClickHandler onMapClick={handleMapClick} />

        <TileLayer
          url={layers[mapLayer]}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Location Marker with Accuracy Circle */}
        {userLocation && locationAccuracy && (
          <>
            <Circle
              center={userLocation}
              radius={locationAccuracy}
              color="blue"
              fillColor="blue"
              fillOpacity={0.1}
              weight={2}
            />
            <Circle
              center={userLocation}
              radius={5}
              color="blue"
              fillColor="blue"
              fillOpacity={1}
              weight={0}
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
            // dashArray={isTracking ? "1, 1" : null} // Dashed line while tracking
          />
        )}

        {/* Dynamic Markers */}
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={customMarkerIcon}
            eventHandlers={{
              click: () => handleMarkerClick(marker)
            }}
          >
            {/* Popup can contain more information if desired */}
          </Marker>
        ))}

        {/* Path markers */}
        {filteredPaths.map((path) => {
          if (!path.coordinates || !Array.isArray(path.coordinates) || path.coordinates.length === 0) {
            console.warn('Path has invalid coordinates:', path);
            return null; // Skip this path
          }
          return (
            <React.Fragment key={path.id}>
              <Polyline
                positions={path.coordinates}
                color={getPathColor(path.type)}
                weight={5}
                opacity={0.7}
              />
              <Marker
                position={path.coordinates[0]}
                icon={customMarkerIcon}
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
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      <BottomControlPanel
        isTracking={isTracking}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
        onAddMarker={() => setSelectedLocation({ lat: position[0], lng: position[1] })}
        onExport={handleExport} // Add this line
        // onImportClick={() => document.getElementById('importInput').click()}
        onFilter={() => setShowFilterModal(true)}
      />

      <input
        id="importInput"
        type="file"
        accept=".json"
        onChange={handleImportData}
        style={{ display: 'none' }}
      />


    </div>
  )
}

export default Map;