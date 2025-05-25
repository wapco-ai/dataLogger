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
  ListItemText,
  Slide, Paper
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
  Map as MapIco,
  Draw as DrawIcon,
  CropFree,
  Polyline
} from '@mui/icons-material';
import RectangleTwoToneIcon from '@mui/icons-material/RectangleTwoTone';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DualTrackingTest from "./DualTrackingTest";
import MapIcon from '@mui/icons-material/Map'; // Use your preferred icon
import HomeMaxIcon from '@mui/icons-material/HomeMax';
import MinimizeIcon from '@mui/icons-material/Minimize';
import ExploreIcon from '@mui/icons-material/Explore';

export default function BottomControlPanel({
  isTracking,
  onStartTracking,
  onStopTracking,
  onAddMarker,
  onExport,
  onImportClick,
  onFilter,
  onStartManualPath,
  isDrawingPath,
  onStartPolygon,        // <-- ADD THIS
  isDrawingPolygon,
  onPanelToggle
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [showDualTracking, setShowDualTracking] = useState(false);
  const [panelMode, setPanelMode] = useState('closed'); // 'full' | 'compact' | 'closed'
  const isOpen = panelMode !== 'closed';

  const toggleMode = () => {
    const newMode = panelMode === 'full' ? 'compact' : 'full';
    setPanelMode(newMode);
    if (onPanelToggle) onPanelToggle(true);
  };

  const closePanel = () => {
    setPanelMode('closed');
    if (onPanelToggle) onPanelToggle(false);
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
            <DrawOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={isDrawingPolygon ? "در حال ترسیم محدوده" : "محدوده جدید"} arrow>
          <IconButton
            color={isDrawingPolygon ? 'success' : 'primary'}
            onClick={onStartPolygon}
            size={iconSize}
          >
            <RectangleTwoToneIcon />
          </IconButton>
        </Tooltip>


        <Tooltip title="فیلتر" arrow>
          <IconButton color="secondary" onClick={onFilter} size={iconSize}>
            <FilterAltOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="خروجی" arrow>
          <IconButton color="warning" onClick={handleExportClick} size={iconSize}>
            <FileDownloadOutlinedIcon />
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
            <FileUploadOutlinedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="تست مسیر GPS/DR" arrow>
          <IconButton
            color="info"
            onClick={() => {
              setPanelMode('full');
              if (onPanelToggle) onPanelToggle(true);
            }}
            size="large"
          >
            <ExploreIcon />
          </IconButton>
        </Tooltip>

      </Toolbar>

      {/* ======= PLACE THE SLIDE PANEL CODE HERE ======= */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={20}
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: panelMode === 'full' ? '100dvh' : '25vh',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            zIndex: 20000,
            bgcolor: "background.paper",
            boxShadow: 16,
            display: "flex",
            flexDirection: "column", // IMPORTANT
            pt: 1,
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2 }}>
            <Tooltip title="بستن">
              <IconButton onClick={closePanel}>×</IconButton>
            </Tooltip>
            <Typography sx={{ fontWeight: "bold", fontSize: "16px" }}>
              تست مسیر GPS/DR
            </Typography>
            <Tooltip title={panelMode === 'full' ? "حالت کوچک" : "تمام صفحه"}>
              <IconButton onClick={toggleMode}>
                {panelMode === 'full' ? <MinimizeIcon /> : <HomeMaxIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Inner Content */}
          <Box sx={{ flex: 1, minHeight: 0, px: 2, pb: 2 }}>
            <DualTrackingTest mode={panelMode}/>
          </Box>

        </Paper>
      </Slide>

    </AppBar>
  );
}