
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import NodeModal from './NodeModal'
import {
  useMarkerStorage,
  usePathStorage,
  exportMapData,
  importMapData
} from './localStorageHooks'

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
})



const DeletionModal = ({ selectedItem, onDelete, onClose }) => {
  // Helper function to render transport modes
  const renderTransportModes = (modes) => {
    if (!modes || modes.length === 0) return 'ندارد'

    return modes.map(mode => {
      switch (mode) {
        case 'wheelchair': return 'ویلچر'
        case 'electricVan': return 'ون برقی'
        case 'bicycle': return 'دوچرخه'
        case 'walking': return 'پیاده‌روی'
        default: return mode
      }
    }).join(', ')
  }

  // Calculate path length for paths
  const calculatePathLength = (coordinates) => {
    if (!coordinates || coordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < coordinates.length; i++) {
      const coord1 = L.latLng(coordinates[i - 1][0], coordinates[i - 1][1]);
      const coord2 = L.latLng(coordinates[i][0], coordinates[i][1]);
      totalDistance += coord1.distanceTo(coord2);
    }

    return (totalDistance / 1000).toFixed(2); // Convert to kilometers
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
// Action Panel Component (Preserved from original implementation)
function ActionPanel({
  isTracking,
  onStartTracking,
  onStopTracking,
  onAddMarker,
  pathCoordinates
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
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      zIndex: 1000,
      gap: '15px'
    }}>
      {!isTracking ? (
        <button
          onClick={onStartTracking}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          <span>▶</span> شروع ردیابی
        </button>
      ) : (
        <button
          onClick={onStopTracking}
          style={{
            backgroundColor: '#F44336',
            color: 'white',
            border: 'none',
            borderRadius: '15px',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#e53935'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#F44336'}
        >
          <span>■</span> توقف ردیابی
        </button>
      )}

      <button
        onClick={onAddMarker}
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '15px',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
      >
        <span>+</span> افزودن نشانگر
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
          <span>{(pathLength / 1000).toFixed(2)} کیلومتر</span>
        </div>
      )}
    </div>
  )
}

// Path Save Modal Component (Preserved from original implementation)
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
          <option value="cycling">دوچرخه‌سواری</option>
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
      onMapClick(e.latlng)
    }
  })
  return null
}

// Recenter Map Component
function RecenterMap({ position, zoom }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.setView(position, zoom)
    }
  }, [position, zoom])

  return null
}

const Map = () => {
  // State management (Preserved from original implementation)
  const [position, setPosition] = useState([36.2972, 59.6067])
  const [zoom, setZoom] = useState(12)
  const [userLocation, setUserLocation] = useState(null)
  const [locationAccuracy, setLocationAccuracy] = useState(null)
  const [pathCoordinates, setPathCoordinates] = useState([])
  const [locationError, setLocationError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [showPathSaveModal, setShowPathSaveModal] = useState(false)
  const [selectedItemForDeletion, setSelectedItemForDeletion] = useState(null)

  // Storage Hooks
  const {
    markers,
    addMarker,
    removeMarker,
    updateMarker
  } = useMarkerStorage()

  const {
    paths,
    addPath,
    removePath,
    updatePath
  } = usePathStorage()

  // Refs for tracking
  const watchIdRef = useRef(null)

  // Comprehensive geolocation setup (Preserved from original implementation)
  const setupGeolocation = useCallback(() => {
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('موقعیت مکانی در دستگاه شما پشتیبانی نمی‌شود')
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newPosition = [latitude, longitude]

        setUserLocation(newPosition)
        setLocationAccuracy(accuracy)
        setPosition(newPosition)
        setZoom(15)
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('دسترسی به موقعیت مکانی رد شد')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('اطلاعات موقعیت در دسترس نیست')
            break
          case error.TIMEOUT:
            setLocationError('زمان درخواست موقعیت مکانی به پایان رسید')
            break
          default:
            setLocationError('خطا در دریافت موقعیت مکانی')
        }

        setPosition([36.2972, 59.6067])
        setZoom(12)
      },
      options
    )
  }, [])

  // Start tracking method (Preserved from original implementation)
  const startTracking = () => {
    setIsTracking(true)
    setPathCoordinates([]) // Clear previous coordinates
    setLocationError(null)

    const trackingTimeout = setTimeout(() => {
      if (pathCoordinates.length === 0) {
        stopTracking()
        setLocationError('عدم موفقیت در دریافت موقعیت مکانی. لطفاً مجدداً تلاش کنید.')
      }
    }, 30000)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const newLocation = [latitude, longitude]

        clearTimeout(trackingTimeout)

        if (accuracy <= 500) {
          setUserLocation(newLocation)
          setLocationError(null)

          // Ensure path coordinates are added with minimal duplicate prevention
          setPathCoordinates(prev => {
            // Always add first point
            if (prev.length === 0) {
              return [newLocation]
            }

            const lastCoord = prev[prev.length - 1]
            // Add new point if it's significantly different from the last point
            const minDistance = 0.0001 // Adjust this value as needed
            const isNewPointFarEnough =
              Math.abs(lastCoord[0] - latitude) > minDistance ||
              Math.abs(lastCoord[1] - longitude) > minDistance

            return isNewPointFarEnough
              ? [...prev, newLocation]
              : prev
          })
        }
      },
      (error) => {
        console.error('Tracking error:', error);
        clearTimeout(trackingTimeout)

        let errorMessage = 'خطا در دریافت موقعیت'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'دسترسی به موقعیت مکانی رد شد'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'اطلاعات موقعیت در دسترس نیست'
            break
          case error.TIMEOUT:
            errorMessage = 'زمان درخواست موقعیت مکانی به پایان رسید'
            break
        }

        setLocationError(errorMessage)
        stopTracking()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 1 // Minimum distance change to trigger an update
      }
    )
  }

  // Stop tracking method (Preserved from original implementation)
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      setIsTracking(false)

      // Ensure we have at least two points to create a path
      if (pathCoordinates.length > 1) {
        setShowPathSaveModal(true)
      } else {
        // Clear coordinates if not enough points
        setPathCoordinates([])
        setLocationError('مسیر بسیار کوتاه است. لطفاً مسافت بیشتری را طی کنید.')
      }
    }
  }
  const handleMarkerClick = (marker) => {
    setSelectedItemForDeletion({
      type: 'marker',
      item: marker
    })
  }

  const handlePathClick = (path) => {
    setSelectedItemForDeletion({
      type: 'path',
      item: path
    })
  }
  // Delete handler
  const handleDelete = () => {
    if (selectedItemForDeletion) {
      const { type, item } = selectedItemForDeletion

      if (type === 'marker') {
        removeMarker(item.id)
      } else if (type === 'path') {
        removePath(item.id)
      }

      setSelectedItemForDeletion(null)
    }
  }
  // Save path method (Preserved from original implementation)
  const handleSavePath = (pathData) => {
    addPath(pathData)
    setShowPathSaveModal(false)
    setPathCoordinates([])
  }

  // Initial geolocation setup
  useEffect(() => {
    setupGeolocation()
  }, [setupGeolocation])

  // Map Click Handler
  const handleMapClick = (latlng) => {
    setSelectedLocation({
      lat: latlng.lat,
      lng: latlng.lng
    })
  }

  // Node Modal Handler
  const handleSaveNode = (nodeData) => {
    addMarker({
      position: [nodeData.latitude, nodeData.longitude],
      data: nodeData
    })
    setSelectedLocation(null)
  }

  // Export/Import Handlers
  const handleExportData = () => {
    exportMapData()
  }

  const handleImportData = (event) => {
    const file = event.target.files[0]
    if (file) {
      importMapData(file)
        .then(() => {
          alert('اطلاعات با موفقیت وارد شد!')
        })
        .catch(error => {
          console.error('Import failed:', error)
          alert('واردسازی اطلاعات ناموفق بود')
        })
    }
  }

  return (
    <div style={{
      width: '100vw',      // Full viewport width
      height: '100vh',     // Full viewport height
      margin: 0,           // Remove default margins
      padding: 0,          // Remove default padding
      position: 'absolute', // Position absolutely
      top: 0,              // Align to top
      left: 0,             // Align to left
      overflow: 'hidden'   // Prevent any scrollbars
    }}>
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

      {/* Export/Import Controls */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={handleExportData}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          خروجی
        </button>
        <label
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ورودی
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            style={{ display: 'none' }}
          />
        </label>
      </div>

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
          margin: 0,         // No margins
          padding: 0,         // No padding
          direction: 'rtl'
        }}
      >
        {/* Recenter Map */}
        <RecenterMap position={position} zoom={zoom} />

        {/* Map Click Handler */}
        <MapClickHandler onMapClick={handleMapClick} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">نقشه‌برداری باز</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

        {/* Path Tracing - Ensure it renders during and after tracking */}
        {pathCoordinates.length > 1 && (
          <Polyline
            positions={pathCoordinates}
            color="blue"
            weight={5}
            opacity={isTracking ? 0.7 : 1}
            dashArray={isTracking ? "10, 10" : null} // Dashed line while tracking
          />
        )}

        {/* Path Save Modal */}
        {showPathSaveModal && (
          <PathSaveModal
            onSave={handleSavePath}
            onClose={() => {
              setShowPathSaveModal(false)
              setPathCoordinates([]) // Clear coordinates if modal is closed
            }}
            pathCoordinates={pathCoordinates}
          />
        )}

        {/* Dynamic Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={customMarkerIcon}
            eventHandlers={{
              click: () => handleMarkerClick(marker)
            }}
          >
            {/* Existing Popup content */}
          </Marker>
        ))}

        {/* Add path markers for deletion */}
        {paths.map((path) => (
          <Marker
            key={path.id}
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
        ))}
      </MapContainer>

      {/* Action Panel */}
      <ActionPanel
        isTracking={isTracking}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
        onAddMarker={() => setSelectedLocation({
          lat: position[0],
          lng: position[1]
        })}
        pathCoordinates={pathCoordinates}
      />
    </div>
  )
}

export default Map
