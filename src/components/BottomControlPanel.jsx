import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  AddLocationAlt,
  FilterList,
  FileDownload,
  FileUpload,
  Layers,
  Gesture,
  Map as MapIcon
} from '@mui/icons-material';

export default function BottomControlPanel({
  isTracking,
  onStartTracking,
  onStopTracking,
  onAddMarker,
  onExport,
  onImportClick,
  onFilter,
  onStartManualPath, // <-- Add this prop!
  isDrawingPath // <-- Track if drawing manually
}) {
  const theme = useTheme();
  const isXs  = useMediaQuery(theme.breakpoints.down('sm'));
  // const isXs = useMediaQuery('(max-width:600px)');
  const iconSize = isXs ? 'small' : 'medium';
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportClose = (format) => {
    setExportAnchorEl(null);
    if (format && typeof onExport === 'function') {
      onExport(format);
    }
  };

  return (
    <AppBar position="fixed" color="inherit" sx={{ top: 'auto', bottom: 0 }}>
      <Toolbar sx={{ justifyContent: 'space-around' }}>
        <Tooltip title={isTracking ? "توقف ردیابی" : "شروع ردیابی"} arrow>
          <IconButton color={isTracking ? 'error' : 'success'} onClick={isTracking ? onStopTracking : onStartTracking} size={iconSize}>
            {isTracking ? <Stop /> : <PlayArrow />}
          </IconButton>
        </Tooltip>

        <Tooltip title="نشانگر" arrow>
          <IconButton color="primary" onClick={onAddMarker} size={iconSize}>
            <AddLocationAlt />
          </IconButton>
        </Tooltip>

        <Tooltip title="مسیر دستی" arrow>
          <IconButton color={isDrawingPath ? 'success' : 'primary'} onClick={onStartManualPath} size={iconSize}>
            <Gesture />
          </IconButton>
        </Tooltip>

        <Tooltip title="فیلتر" arrow>
          <IconButton color="secondary" onClick={onFilter} size={iconSize}>
            <FilterList />
          </IconButton>
        </Tooltip>

        <Tooltip title="خروجی" arrow>
          <IconButton color="warning" onClick={handleExportClick} size={iconSize}>
            <FileDownload />
          </IconButton>
        </Tooltip>

        <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => handleExportClose()}
              >
                <MenuItem onClick={() => handleExportClose('geojson')}>
                  <ListItemIcon>
                    <MapIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>GeoJSON</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleExportClose('kml')}>
                  <ListItemIcon>
                    <Layers fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>KML</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleExportClose('csv')}>
                  <ListItemIcon>
                    <FileDownload fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>CSV</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleExportClose('json')}>
                  <ListItemIcon>
                    <FileDownload fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>JSON</ListItemText>
                </MenuItem>
              </Menu>

        <Tooltip title="ورودی" arrow>
          <IconButton color="inherit" onClick={onImportClick} size={iconSize}>
            <FileUpload />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}