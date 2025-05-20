
import { useState, useEffect } from 'react'

// Marker Storage Hook
export const useMarkerStorage = () => {
  const [markers, setMarkers] = useState(() => {
    const savedMarkers = localStorage.getItem('mapMarkers')
    return savedMarkers ? JSON.parse(savedMarkers) : []
  })

  useEffect(() => {
    localStorage.setItem('mapMarkers', JSON.stringify(markers))
  }, [markers])

  const addMarker = (newMarker) => {
    setMarkers(prevMarkers => {
      const updatedMarkers = [...prevMarkers, {
        ...newMarker,
        id: Date.now(),
        timestamp: new Date().toISOString()
      }]
      return updatedMarkers
    })
  }

  const removeMarker = (markerId) => {
    setMarkers(prevMarkers => 
      prevMarkers.filter(marker => marker.id !== markerId)
    )
  }

  const updateMarker = (markerId, updatedData) => {
    setMarkers(prevMarkers => 
      prevMarkers.map(marker => 
        marker.id === markerId 
          ? { ...marker, ...updatedData } 
          : marker
      )
    )
  }

  return { 
    markers, 
    addMarker, 
    removeMarker, 
    updateMarker 
  }
}

// Path Storage Hook
export const usePathStorage = () => {
  const [paths, setPaths] = useState(() => {
    const savedPaths = localStorage.getItem('mapPaths')
    return savedPaths ? JSON.parse(savedPaths) : []
  })

  useEffect(() => {
    localStorage.setItem('mapPaths', JSON.stringify(paths))
  }, [paths])

  const addPath = (newPath) => {
    setPaths(prevPaths => {
      const updatedPaths = [...prevPaths, {
        ...newPath,
        id: Date.now(),
        timestamp: new Date().toISOString()
      }]
      return updatedPaths
    })
  }

  const removePath = (pathId) => {
    setPaths(prevPaths => 
      prevPaths.filter(path => path.id !== pathId)
    )
  }

  const updatePath = (pathId, updatedData) => {
    setPaths(prevPaths => 
      prevPaths.map(path => 
        path.id === pathId 
          ? { ...path, ...updatedData } 
          : path
      )
    )
  }

  return { 
    paths, 
    addPath, 
    removePath, 
    updatePath 
  }
}

// Export Utility
export const exportMapData = () => {
  const markers = JSON.parse(localStorage.getItem('mapMarkers') || '[]')
  const paths = JSON.parse(localStorage.getItem('mapPaths') || '[]')
  
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    markers,
    paths
  }

  const dataStr = JSON.stringify(exportData, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  
  const exportFileDefaultName = `map_export_${new Date().toISOString().replace(/:/g, '-')}.json`
  
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

// Import Utility
export const importMapData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result)
        
        if (importedData.version && importedData.markers && importedData.paths) {
          localStorage.setItem('mapMarkers', JSON.stringify(importedData.markers))
          localStorage.setItem('mapPaths', JSON.stringify(importedData.paths))
          
          resolve(importedData)
        } else {
          reject(new Error('Invalid import file format'))
        }
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = (error) => reject(error)
    reader.readAsText(file)
  })
}
