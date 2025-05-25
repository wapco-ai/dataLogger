
import React, { useState } from 'react'
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Map from './components/Map'
// import NodeModal from './components/NodeModal'


function App() {
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)

  const handleMapClick = (event) => {
    const { lat, lng } = event.latlng
    setSelectedLocation({ latitude: lat, longitude: lng })
    setIsNodeModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsNodeModalOpen(false)
    setSelectedLocation(null)
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <ThemeProvider theme={theme}>
        <Map
          onMapClick={handleMapClick}
          style={{
            height: '100%',
            width: '100%'
          }}
        />
        </ThemeProvider>

      {/* {isNodeModalOpen && (
        <NodeModal
          location={selectedLocation}
          onClose={handleCloseModal}
        />
      )} */}
    </div>
  )
}

export default App
