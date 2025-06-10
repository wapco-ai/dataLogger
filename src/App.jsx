import React from 'react'
import { usePwaUpdate } from "./hooks/usePwaUpdate"; // آدرس رو صحیح بنویس
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import theme from './theme';
import Map from './components/Map';
import NotFound from './components/NotFound';
import CompassCalibrationPage from './components/CompassCalibrationPage';


function App() {
  const { hasUpdate, updateApp } = usePwaUpdate();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', width: '100vw', m: 0, p: 0, overflow: 'hidden' }}>
        {hasUpdate && (
          <Box sx={{ position: 'fixed', bottom: 70, left: 0, right: 0, zIndex: 9999, textAlign: 'center' }}>
            <button
              onClick={updateApp}
              style={{
                padding: '14px 32px',
                borderRadius: 10,
                fontWeight: 'bold',
                fontSize: 18,
                background: '#2196F3',
                color: 'white',
                boxShadow: '0 2px 8px #0002',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              نسخه جدید آماده است! بروزرسانی
            </button>
          </Box>
        )}
        <BrowserRouter basename="/dataLogger">
          <Routes>
            <Route path="/" element={<Map />} />
            <Route path="/calibration" element={<CompassCalibrationPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </Box>
    </ThemeProvider>
  )
}

export default App
