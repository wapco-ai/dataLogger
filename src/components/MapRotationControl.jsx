import { useEffect } from 'react';
import L from 'leaflet';

function MapRotationControl({ mapRef }) {
  useEffect(() => {
    const map = mapRef.current;
    if (map && L.control.rotate && !map._rotateControlAdded) {
      L.control.rotate({ position: 'topright' }).addTo(map);
      map._rotateControlAdded = true;
    }
  }, [mapRef]);
  return null;
}
export default MapRotationControl;
