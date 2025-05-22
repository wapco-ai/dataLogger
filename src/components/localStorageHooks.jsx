// localStorageHooks.jsx
import { useState, useEffect } from 'react';

// Marker Storage Hook
const useMarkerStorage = () => {
  const [markers, setMarkers] = useState(() => {
    const savedMarkers = localStorage.getItem('mapMarkers');
    return savedMarkers ? JSON.parse(savedMarkers) : [];
  });

  useEffect(() => {
    localStorage.setItem('mapMarkers', JSON.stringify(markers));
  }, [markers]);

  const addMarker = (newMarker) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = [...prevMarkers, {
        ...newMarker,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
      }];
      return updatedMarkers;
    });
  };

  const removeMarker = (markerId) => {
    setMarkers(prevMarkers =>
      prevMarkers.filter(marker => marker.id !== markerId)
    );
  };

  const updateMarker = (markerId, updatedData) => {
    setMarkers(prevMarkers =>
      prevMarkers.map(marker =>
        marker.id === markerId
          ? { ...marker, ...updatedData }
          : marker
      )
    );
  };

  return {
    markers,
    addMarker,
    removeMarker,
    updateMarker
  };
};

// helper to flatten any shape:
function flattenCoords(arr) {
  if (!Array.isArray(arr)) return [];
  // arr[0] is either a number-array or an object with .coordinates
  if (typeof arr[0] === 'object' && Array.isArray(arr[0].coordinates)) {
    return arr.map(pt => pt.coordinates);
  }
  return arr;
}

// Path Storage Hook
const usePathStorage = () => {
  const [paths, setPaths] = useState(() => {
    const savedPaths = localStorage.getItem('mapPaths');
    return savedPaths ? JSON.parse(savedPaths) : [];
  });

  useEffect(() => {
    localStorage.setItem('mapPaths', JSON.stringify(paths));
  }, [paths]);

  const addPath = (newPath) => {
  setPaths(prevPaths => {
    const updatedPaths = [...prevPaths, {
      ...newPath,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }];
    return updatedPaths;
  });
};


  const removePath = (pathId) => {
    setPaths(prevPaths =>
      prevPaths.filter(path => path.id !== pathId)
    );
  };

  const updatePath = (pathId, updatedData) => {
    setPaths(prevPaths =>
      prevPaths.map(path =>
        path.id === pathId
          ? { ...path, ...updatedData }
          : path
      )
    );
  };

  return {
    paths,
    addPath,
    removePath,
    updatePath
  };
};

// Export Utility
// In localStorageHooks.jsx
const exportMapData = (format = 'geojson') => {
  const markers = JSON.parse(localStorage.getItem('mapMarkers') || '[]');
  const paths = JSON.parse(localStorage.getItem('mapPaths') || '[]');

  let dataStr, mimeType, fileExtension;

  switch (format) {
    case 'geojson':
      // GeoJSON implementation
      const geoJsonData = {
        type: 'FeatureCollection',
        features: [
          ...markers.map(marker => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [marker.position[1], marker.position[0]] // GeoJSON uses [lng, lat]
            },
            properties: marker.data || {}
          })),
          ...paths.map(path => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: Array.isArray(path.coordinates)
                ? (
                  typeof path.coordinates[0] === 'object' && Array.isArray(path.coordinates[0].coordinates)
                    ? path.coordinates.map(pt => [pt.coordinates[1], pt.coordinates[0]]) // [lng, lat]
                    : path.coordinates.map(coord => [coord[1], coord[0]])
                )
                : []
            },
            properties: {
              name: path.name,
              description: path.description,
              type: path.type,
              timestamp: path.timestamp,
              pointsMeta: Array.isArray(path.coordinates)
                ? (
                  typeof path.coordinates[0] === 'object' && path.coordinates[0].gpsMeta
                    ? path.coordinates.map(pt => pt.gpsMeta)
                    : []
                )
                : []
            }
          }))
        ]
      };
      dataStr = JSON.stringify(geoJsonData, null, 2);
      mimeType = 'application/geo+json';
      fileExtension = 'geojson';
      break;

    case 'kml':
      const kmlHeader = `<?xml …>`;
      const kmlFooter = `</Document></kml>`;

      const pathsKML = paths.map(path => {
        const coords = flattenCoords(path.coordinates);
        const coordsStr = coords
          .map(c => `${c[1]},${c[0]},0`)  // always [lng,lat,0]
          .join(' ');
        return `
    <Placemark>
      <name>${path.name || 'Unnamed Path'}</name>
      <description>${path.description || ''}</description>
      <LineString>
        <coordinates>
          ${coordsStr}
        </coordinates>
      </LineString>
    </Placemark>`;
      }).join('');

      dataStr = kmlHeader + pointsKML + pathsKML + kmlFooter;
      mimeType = 'application/vnd.google-earth.kml+xml';
      fileExtension = 'kml';
      break;

    case 'csv':
      const csvHeaders = 'Type,Name,Description,Latitude,Longitude,Timestamp\n';
      const markersCSV = markers.map(marker =>
        `Point,"${marker.data?.name || ''}","${marker.data?.description || ''}",${marker.position[0]},${marker.position[1]},"${marker.timestamp}"`
      ).join('\n');

      const pathsCSV = paths.map(path => {
        const coords = flattenCoords(path.coordinates);
        const [lat, lng] = coords[0] || ['', ''];  // use first point
        return `Line,"${path.name}","${path.description}",${lat},${lng},"${path.timestamp}"`;
      }).join('\n');

      dataStr = csvHeaders + markersCSV + (markersCSV && pathsCSV ? '\n' : '') + pathsCSV;
      mimeType = 'text/csv';
      fileExtension = 'csv';
      break;



    default: // JSON
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        markers,
        paths
      };
      dataStr = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
  }

  const blob = new Blob([dataStr], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const exportFileDefaultName = `map_export_${new Date().toISOString().replace(/[:.]/g, '-')}.${fileExtension}`;

  const linkElement = document.createElement('a');
  linkElement.href = url;
  linkElement.download = exportFileDefaultName;
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
  URL.revokeObjectURL(url);
};

// Import Utility
// replace your existing importMapData with this:
const importMapData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      let importedData;
      try {
        importedData = JSON.parse(event.target.result);
      } catch (e) {
        return reject(new Error('Invalid JSON'));
      }

      // 1) Your custom JSON format
      if (importedData.version && importedData.markers && importedData.paths) {
        // 1. Read what’s already stored
        const existingMarkers = JSON.parse(localStorage.getItem('mapMarkers') || '[]');
        const existingPaths = JSON.parse(localStorage.getItem('mapPaths') || '[]');

        // 2. Assign fresh UUIDs to every imported item
        const newMarkers = importedData.markers.map(m => ({
          ...m,
          id: crypto.randomUUID()
        }));
        const newPaths = importedData.paths.map(p => ({
          ...p,
          id: crypto.randomUUID()
        }));

        // 3. Merge old + new, then persist
        const mergedMarkers = existingMarkers.concat(newMarkers);
        const mergedPaths = existingPaths.concat(newPaths);

        localStorage.setItem('mapMarkers', JSON.stringify(mergedMarkers));
        localStorage.setItem('mapPaths', JSON.stringify(mergedPaths));

        // 4. Return merged result so your Map.jsx can optionally update state
        return resolve({ markers: mergedMarkers, paths: mergedPaths });
      }


      // 2) GeoJSON FeatureCollection
      if (
        importedData.type === 'FeatureCollection' &&
        Array.isArray(importedData.features)
      ) {
        // read existing data
        const existingMarkers = JSON.parse(localStorage.getItem('mapMarkers') || '[]');
        const existingPaths = JSON.parse(localStorage.getItem('mapPaths') || '[]');

        const parsedMarkers = [];
        const parsedPaths = [];

        importedData.features.forEach((feature) => {
          const { geometry, properties = {} } = feature;
          if (!geometry) return;

          if (geometry.type === 'Point') {
            const [lng, lat] = geometry.coordinates;
            parsedMarkers.push({
              // use a UUID so keys are always unique
              id: crypto.randomUUID(),
              position: [lat, lng],
              data: properties,
              timestamp: properties.timestamp || new Date().toISOString()
            });
          }
          else if (geometry.type === 'LineString') {
            const coords = geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            parsedPaths.push({
              id: crypto.randomUUID(),
              name: properties.name || '',
              description: properties.description || '',
              type: properties.type || '',
              coordinates: coords,
              timestamp: properties.timestamp || new Date().toISOString()
            });
          }
        });

        // merge instead of replace
        const mergedMarkers = existingMarkers.concat(parsedMarkers);
        const mergedPaths = existingPaths.concat(parsedPaths);

        localStorage.setItem('mapMarkers', JSON.stringify(mergedMarkers));
        localStorage.setItem('mapPaths', JSON.stringify(mergedPaths));

        return resolve({ markers: mergedMarkers, paths: mergedPaths });
      }


      // 3) Unknown format
      reject(new Error('Invalid import file format'));
    };

    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
};


// Named exports
export {
  useMarkerStorage,
  usePathStorage,
  exportMapData,
  importMapData
};