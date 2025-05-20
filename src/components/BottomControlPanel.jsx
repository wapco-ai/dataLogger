import React from 'react';
import { Box, Button } from '@mui/material';
import {
  PlayArrow,
  Stop,
  AddLocationAlt,
  FilterList,
  FileDownload,
  FileUpload
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
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px',
        zIndex: 1200,
        borderTop: '1px solid #ddd',
        flexWrap: 'wrap',
      }}
    >
      <Button
        onClick={isTracking ? onStopTracking : onStartTracking}
        startIcon={isTracking ? <Stop /> : <PlayArrow />}
        variant="contained"
        color={isTracking ? 'error' : 'success'}
        sx={{ flex: 1, mx: 0.5, minWidth: '8px' }}
      >
        {/* {isTracking ? 'توقف' : 'شروع'} */}
      </Button>

      <Button
        onClick={onAddMarker}
        startIcon={<AddLocationAlt />}
        variant="contained"
        color="primary"
        sx={{ flex: 1, mx: 0.5, minWidth: '80px' }}
      >
        {/* نشانگر */}
      </Button>

      <Button
        onClick={onFilter}
        startIcon={<FilterList />}
        variant="contained"
        color="secondary"
        sx={{ flex: 1, mx: 0.5, minWidth: '80px' }}
      >
        {/* فیلتر */}
      </Button>

      <Button
        onClick={onExport}
        startIcon={<FileDownload />}
        variant="contained"
        color="warning"
        sx={{ flex: 1, mx: 0.5, minWidth: '80px' }}
      >
        {/* خروجی */}
      </Button>

      {/* <Button
        onClick={onImportClick}
        startIcon={<FileUpload />}
        variant="outlined"
        sx={{ flex: 1, mx: 0.5, minWidth: '100px' }}
      >
        ورودی
      </Button> */}
    </Box>
  );
}
