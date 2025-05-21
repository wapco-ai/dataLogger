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
        id: Date.now(),
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
        id: Date.now(),
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
              coordinates: path.coordinates.map(coord => [coord[1], coord[0]]) // [lng, lat]
            },
            properties: {
              name: path.name,
              description: path.description,
              type: path.type,
              timestamp: path.timestamp
            }
          }))
        ]
      };
      dataStr = JSON.stringify(geoJsonData, null, 2);
      mimeType = 'application/geo+json';
      fileExtension = 'geojson';
      break;

    case 'kml':
      // KML implementation
      const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>`;

      const kmlFooter = `  </Document>
</kml>`;

      const pointsKML = markers.map(marker => `
    <Placemark>
      <name>${marker.data?.name || 'Unnamed Marker'}</name>
      <description>${marker.data?.description || ''}</description>
      <Point>
        <coordinates>${marker.position[1]},${marker.position[0]},0</coordinates>
      </Point>
    </Placemark>`).join('');

      const pathsKML = paths.map(path => `
    <Placemark>
      <name>${path.name || 'Unnamed Path'}</name>
      <description>${path.description || ''}</description>
      <LineString>
        <coordinates>
          ${path.coordinates.map(coord => `${coord[1]},${coord[0]},0`).join(' ')}
        </coordinates>
      </LineString>
    </Placemark>`).join('');

      dataStr = kmlHeader + pointsKML + pathsKML + kmlFooter;
      mimeType = 'application/vnd.google-earth.kml+xml';
      fileExtension = 'kml';
      break;

    case 'csv':
      // CSV implementation
      const csvHeaders = 'Type,Name,Description,Latitude,Longitude,Timestamp\n';

      const markersCSV = markers.map(marker =>
        `Point,"${marker.data?.name || ''}","${marker.data?.description || ''}",${marker.position[0]},${marker.position[1]},"${marker.timestamp}"`
      ).join('\n');

      const pathsCSV = paths.map(path =>
        `Line,"${path.name || ''}","${path.description || ''}",${path.coordinates[0][0]},${path.coordinates[0][1]},"${path.timestamp}"`
      ).join('\n');

      dataStr = csvHeaders + markersCSV + (markers.length && paths.length ? '\n' : '') + pathsCSV;
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
const importMapData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);

        if (importedData.version && importedData.markers && importedData.paths) {
          localStorage.setItem('mapMarkers', JSON.stringify(importedData.markers));
          localStorage.setItem('mapPaths', JSON.stringify(importedData.paths));

          resolve(importedData);
        } else {
          reject(new Error('Invalid import file format'));
        }
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
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