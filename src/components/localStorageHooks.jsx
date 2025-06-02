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

const usePolygonStorage = () => {
  const [polygons, setPolygons] = useState(() => {
    const saved = localStorage.getItem('mapPolygons');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('mapPolygons', JSON.stringify(polygons));
  }, [polygons]);

  const addPolygon = (newPolygon) => {
    setPolygons(prev => [
      ...prev,
      { ...newPolygon, id: crypto.randomUUID(), timestamp: new Date().toISOString() }
    ]);
  };
  const removePolygon = (polygonId) => {
    setPolygons(prev => prev.filter(p => p.id !== polygonId));
  };
  const updatePolygon = (polygonId, updatedData) => {
    setPolygons(prev => prev.map(p => p.id === polygonId ? { ...p, ...updatedData } : p));
  };
  return { polygons, addPolygon, removePolygon, updatePolygon };
};

// Export Utility
// In localStorageHooks.jsx
const exportMapData = (format = 'geojson') => {
  const markers = JSON.parse(localStorage.getItem('mapMarkers') || '[]');
  const paths = JSON.parse(localStorage.getItem('mapPaths') || '[]');
  const polygons = JSON.parse(localStorage.getItem('mapPolygons') || '[]');

  let dataStr, mimeType, fileExtension;

  function transportModesToString(val) {
    // Accepts either array or object
    if (Array.isArray(val)) return val.join(',');
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val)
        .filter(([k, v]) => v)
        .map(([k]) => k)
        .join(',');
    }
    return '';
  }

  switch (format) {
    case 'geojson':
      // See previous message for GeoJSON block.
      const geoJsonData = {
        type: 'FeatureCollection',
        features: [
          ...markers.map(marker => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [marker.position[1], marker.position[0]]
            },
            properties: {
              ...(marker.data || {}),
              transportModes: marker.data?.transportModes || [],
              gender: marker.data?.gender || '',
            }
          })),
          ...paths.map(path => ({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: Array.isArray(path.coordinates)
                ? (
                  typeof path.coordinates[0] === 'object' && Array.isArray(path.coordinates[0].coordinates)
                    ? path.coordinates.map(pt => [pt.coordinates[1], pt.coordinates[0]])
                    : path.coordinates.map(coord => [coord[1], coord[0]])
                )
                : []
            },
            properties: {
              name: path.name,
              description: path.description,
              type: path.type,
              timestamp: path.timestamp,
              transportModes: path.transportModes || [],
              gender: path.gender || '',
            }
          })),
          ...polygons.map(polygon => ({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [polygon.coordinates.map(c => [c[1], c[0]])], // GeoJSON polygons: array of LinearRings [lng,lat]
            },
            properties: {
              ...(polygon.data || {}),
              name: polygon.name,
              description: polygon.description,
              group: polygon.group || '',
              subGroup: polygon.subGroup || '',
              types: polygon.types || '',
              gender: polygon.gender || '',
              transportModes: polygon.services || [],
              timestamp: polygon.timestamp,
              restrictedTimes: polygon.restrictedTimes || {},
            }
          }))
        ]
      };
      dataStr = JSON.stringify(geoJsonData, null, 2);
      mimeType = 'application/geo+json';
      fileExtension = 'geojson';
      break;

    case 'kml':
      const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n`;
      const kmlFooter = `</Document>\n</kml>`;

      // Markers as Placemarks
      const pointsKML = markers.map(marker => {
        const data = marker.data || {};
        const tmodes = transportModesToString(data.transportModes);
        return `
      <Placemark>
        <name>${data.name || ''}</name>
        <description>${data.description || ''}</description>
        <ExtendedData>
          <Data name="type"><value>${data.type || ''}</value></Data>
          <Data name="transportModes"><value>${tmodes}</value></Data>
          <Data name="gender"><value>${data.gender || ''}</value></Data>
        </ExtendedData>
        <Point>
          <coordinates>${marker.position[1]},${marker.position[0]},0</coordinates>
        </Point>
      </Placemark>
      `;
      }).join('');

      // Paths as Placemarks
      const pathsKML = paths.map(path => {
        // flattenCoords from your code
        const coords = Array.isArray(path.coordinates)
          ? (
            typeof path.coordinates[0] === 'object' && Array.isArray(path.coordinates[0].coordinates)
              ? path.coordinates.map(pt => pt.coordinates)
              : path.coordinates
          )
          : [];
        const coordsStr = coords
          .map(c => `${c[1]},${c[0]},0`)  // always [lng,lat,0]
          .join(' ');
        const tmodes = transportModesToString(path.transportModes);
        return `
      <Placemark>
        <name>${path.name || ''}</name>
        <description>${path.description || ''}</description>
        <ExtendedData>
          <Data name="type"><value>${path.type || ''}</value></Data>
          <Data name="transportModes"><value>${tmodes}</value></Data>
          <Data name="gender"><value>${path.gender || ''}</value></Data>
        </ExtendedData>
        <LineString>
          <coordinates>
            ${coordsStr}
          </coordinates>
        </LineString>
      </Placemark>
      `;
      }).join('');

      const polygonsKML = polygons.map(polygon => {
        const tmodes = transportModesToString(polygon.transportModes);
        // KML expects: coordinates="lng,lat,0 lng,lat,0 ..."
        // And polygons must be "closed" (first == last point)
        let coords = Array.isArray(polygon.coordinates) ? polygon.coordinates.slice() : [];
        if (coords.length && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
          coords.push(coords[0]); // Ensure closed ring
        }
        const coordsStr = coords
          .map(c => `${c[1]},${c[0]},0`) // always [lng,lat,0]
          .join(' ');
        return `
    <Placemark>
      <name>${polygon.name || ''}</name>
      <description>${polygon.description || ''}</description>
      <ExtendedData>
        <Data name="type"><value>${polygon.type || ''}</value></Data>
        <Data name="transportModes"><value>${tmodes}</value></Data>
        <Data name="gender"><value>${polygon.gender || ''}</value></Data>
        <Data name="restrictedTimes"><value>${polygon.restrictedTimes ? JSON.stringify(polygon.restrictedTimes) : ''}</value></Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coordsStr}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  `;
      }).join('');

      dataStr = kmlHeader + pointsKML + pathsKML + polygonsKML + kmlFooter;
      mimeType = 'application/vnd.google-earth.kml+xml';
      fileExtension = 'kml';
      break;

    case 'csv':
      // CSV: Add transportModes and gender for both markers and paths
      const csvHeaders = 'Type,Name,Description,PathType,TransportModes,Gender,Latitude,Longitude,Timestamp\n';
      // Markers (POIs)
      const markersCSV = markers.map(marker => {
        const data = marker.data || {};
        return [
          'Point',
          `"${data.name || ''}"`,
          `"${data.description || ''}"`,
          '', // PathType blank for markers
          `"${transportModesToString(data.transportModes)}"`,
          `"${data.gender || ''}"`,
          marker.position[0],
          marker.position[1],
          `"${marker.timestamp}"`
        ].join(',');
      }).join('\n');
      // Paths
      const pathsCSV = paths.map(path => {
        // For CSV, just take the first coordinate for lat/lng (for tabular format)
        const coords = Array.isArray(path.coordinates)
          ? (
            typeof path.coordinates[0] === 'object' && Array.isArray(path.coordinates[0].coordinates)
              ? path.coordinates.map(pt => pt.coordinates)
              : path.coordinates
          )
          : [];
        const [lat, lng] = coords[0] || ['', ''];
        return [
          'Line',
          `"${path.name || ''}"`,
          `"${path.description || ''}"`,
          `"${path.type || ''}"`,
          `"${transportModesToString(path.transportModes)}"`,
          `"${path.gender || ''}"`,
          lat,
          lng,
          `"${path.timestamp}"`
        ].join(',');
      }).join('\n');

      const polygonsCSV = polygons.map(polygon => {
        // Use the first coordinate for lat/lng (for display purposes)
        const coords = Array.isArray(polygon.coordinates) ? polygon.coordinates : [];
        const [lat, lng] = coords[0] || ['', ''];
        return [
          'Polygon',
          `"${polygon.name || ''}"`,
          `"${polygon.description || ''}"`,
          `"${polygon.type || ''}"`,
          `"${transportModesToString(polygon.transportModes)}"`,
          `"${polygon.gender || ''}"`,
          `"${polygon.restrictedTimes ? JSON.stringify(polygon.restrictedTimes) : ''}"`,
          lat,
          lng,
          `"${polygon.timestamp || ''}"`
        ].join(',');
      }).join('\n');


      dataStr = csvHeaders +
        markersCSV + (markersCSV && (pathsCSV || polygonsCSV) ? '\n' : '') +
        pathsCSV + (pathsCSV && polygonsCSV ? '\n' : '') +
        polygonsCSV;
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
      // 1) Your custom JSON format
      if (importedData.version && importedData.markers && importedData.paths) {
        // 1. Read what’s already stored
        const existingMarkers = JSON.parse(localStorage.getItem('mapMarkers') || '[]');
        const existingPaths = JSON.parse(localStorage.getItem('mapPaths') || '[]');
        const existingPolygons = JSON.parse(localStorage.getItem('mapPolygons') || '[]');

        // 2. Assign fresh UUIDs to every imported item
        const newMarkers = importedData.markers.map(m => ({
          ...m,
          id: crypto.randomUUID()
        }));
        const newPaths = importedData.paths.map(p => ({
          ...p,
          id: crypto.randomUUID()
        }));
        const newPolygons = Array.isArray(importedData.polygons)
          ? importedData.polygons.map(pg => ({
            ...pg,
            id: crypto.randomUUID()
          }))
          : [];

        // 3. Merge old + new, then persist
        const mergedMarkers = existingMarkers.concat(newMarkers);
        const mergedPaths = existingPaths.concat(newPaths);
        const mergedPolygons = existingPolygons.concat(newPolygons);

        localStorage.setItem('mapMarkers', JSON.stringify(mergedMarkers));
        localStorage.setItem('mapPaths', JSON.stringify(mergedPaths));
        localStorage.setItem('mapPolygons', JSON.stringify(mergedPolygons));

        // 4. Return merged result so your Map.jsx can optionally update state
        return resolve({ markers: mergedMarkers, paths: mergedPaths, polygons: mergedPolygons });
      }



      // 2) GeoJSON FeatureCollection
      if (
        importedData.type === 'FeatureCollection' &&
        Array.isArray(importedData.features)
      ) {
        // read existing data
        const existingMarkers = JSON.parse(localStorage.getItem('mapMarkers') || '[]');
        const existingPaths = JSON.parse(localStorage.getItem('mapPaths') || '[]');
        const existingPolygons = JSON.parse(localStorage.getItem('mapPolygons') || '[]');

        const parsedMarkers = [];
        const parsedPaths = [];
        const parsedPolygons = [];

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
          } else if (geometry.type === 'Polygon') {
            // Expect: coordinates: [ [ [lng, lat], [lng, lat], ... ] ]
            // We'll convert to [ [lat, lng], ... ]
            const coords = geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
            parsedPolygons.push({
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
        });

        // merge instead of replace
        const mergedMarkers = existingMarkers.concat(parsedMarkers);
        const mergedPaths = existingPaths.concat(parsedPaths);
        const mergedPolygons = existingPolygons.concat(parsedPolygons);

        localStorage.setItem('mapMarkers', JSON.stringify(mergedMarkers));
        localStorage.setItem('mapPaths', JSON.stringify(mergedPaths));
        localStorage.setItem('mapPolygons', JSON.stringify(mergedPolygons));

        return resolve({
          markers: mergedMarkers,
          paths: mergedPaths,
          polygons: mergedPolygons
        });
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
  usePolygonStorage,
  exportMapData,
  importMapData
};