import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Map from './components/Map';
import NotFound from './components/NotFound'; // کامپوننت ساده 404 بساز
import CompassCalibrationPage from './components/CompassCalibrationPage';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter basename="/dataLogger">
        <Routes>
          <Route path="/" element={<Map />} />
          <Route path="/calibration" element={<CompassCalibrationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode >
)
