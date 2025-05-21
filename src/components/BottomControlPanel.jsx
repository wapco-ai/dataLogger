import React, { useState } from 'react';
import { 
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
  Map as MapIcon
} from '@mui/icons-material';

export default function BottomControlPanel({
  isTracking,
  onStartTracking,
  onStopTracking,
  onAddMarker,
  onExport,
  onImportClick,
  onFilter
}) {
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
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: 'background.paper',
        display: 'flex',
        justifyContent: 'center',
        padding: '8px',
        zIndex: 1200,
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 1
      }}
    >
      <Button
        onClick={isTracking ? onStopTracking : onStartTracking}
        startIcon={isTracking ? <Stop /> : <PlayArrow />}
        variant={isTracking ? 'contained' : 'outlined'}
        color={isTracking ? 'error' : 'success'}
        size="small"
      >
        {isTracking ? 'توقف' : 'ردیابی'}
      </Button>

      <Button
        onClick={onAddMarker}
        startIcon={<AddLocationAlt />}
        variant="outlined"
        color="primary"
        size="small"
      >
        نشانگر
      </Button>

      <Button
        onClick={onFilter}
        startIcon={<FilterList />}
        variant="outlined"
        color="secondary"
        size="small"
      >
        فیلتر
      </Button>

      <Button
        onClick={handleExportClick}
        startIcon={<FileDownload />}
        variant="contained"
        color="warning"
        size="small"
      >
        خروجی
      </Button>
      

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

      <Button
        onClick={onImportClick}
        startIcon={<FileUpload />}
        variant="outlined"
        size="small"
        sx={{ ml: 'auto' }}
      >
        ورودی
      </Button>
    </Box>
  );
}