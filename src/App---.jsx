
import React, { useState } from 'react'
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import theme from './theme';
import Map from './components/Map'
// import NodeModal from './components/NodeModal'
import Map from './components/Map';
import CompassCalibrationPage from './components/CompassCalibrationPage';


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
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Map />} />
            <Route path="/calibration" element={<CompassCalibrationPage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  )
}

export default App
