
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
import ActionPanel from './ActionPanel'
import PathSaveModal from './PathSaveModal'
import {
  useMarkerStorage,
  usePathStorage,
  exportMapData,
  importMapData
} from './localStorageHooks'
import './Map.css'

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

function Map() {
  // State management
  const [position, setPosition] = useState([36.2972, 59.6067])
  const [zoom, setZoom] = useState(12)
  const [userLocation, setUserLocation] = useState(null)
  const [locationAccuracy, setLocationAccuracy] = useState(null)
  const [pathCoordinates, setPathCoordinates] = useState([])
  const [locationError, setLocationError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [showPathSaveModal, setShowPathSaveModal] = useState(false)
  
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

  // Comprehensive geolocation setup
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

  // Start tracking method
  const startTracking = () => {
    setIsTracking(true)
    setPathCoordinates([])
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

          setPathCoordinates(prev => {
            const lastCoord = prev[prev.length - 1]
            if (!lastCoord ||
              (Math.abs(lastCoord[0] - latitude) > 0.0001 ||
                Math.abs(lastCoord[1] - longitude) > 0.0001)) {
              return [...prev, newLocation]
            }
            return prev
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
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 1
      }
    )
  }

  // Stop tracking method
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      setIsTracking(false)

      if (pathCoordinates.length > 1) {
        setShowPathSaveModal(true)
      }
    }
  }

  // Save path method
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
    <div className="map-container">
      {/* Export/Import Controls */}
      <div className="export-import-controls">
        <button onClick={handleExportData}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '5px'}}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          خروجی
        </button>
        <label>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '5px'}}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          ورودی
          <input
            type="file"
            accept=".json"
            onChange={handleImportData}
            style={{ display: 'none' }}
          />
        </label>
      </div>

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

      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{
          height: '100%',
          width: '100%'
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

        {/* Path Tracing */}
        {pathCoordinates.length > 1 && (
          <Polyline
            positions={pathCoordinates}
            color="blue"
            weight={5}
            opacity={0.7}
          />
        )}

        {/* Dynamic Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={customMarkerIcon}
          >
            <Popup>
              <div>
                <strong>{marker.data.name}</strong>
                <p>{marker.data.description}</p>
                <p>نوع: {marker.data.type}</p>
                {marker.data.transportModes && marker.data.transportModes.length > 0 && (
                  <p>
                    شیوه‌های حمل و نقل:
                    {marker.data.transportModes.map(mode => {
                      switch (mode) {
                        case 'wheelchair': return 'ویلچر '
                        case 'electricVan': return 'ون برقی '
                        case 'bicycle': return 'دوچرخه '
                        case 'walking': return 'پیاده‌روی '
                        default: return mode
                      }
                    }).join(', ')}
                  </p>
                )}
                {marker.data.gender && (
                  <p>
                    جنسیت تردد:
                    {marker.data.gender === 'male' ? 'مردانه' :
                      marker.data.gender === 'female' ? 'زنانه' :
                        'خانوادگی'}
                  </p>
                )}
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
