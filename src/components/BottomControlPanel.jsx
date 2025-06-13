
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
  Slide, 
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  AddLocationAlt,
  FilterList,
  FileDownload,
  FileUpload,
  Layers,
  Map as MapIco,
  Draw as DrawIcon,
  CropFree,
  Polyline,
  Share,
  Route,
  Straighten
} from '@mui/icons-material';
import RectangleTwoToneIcon from '@mui/icons-material/RectangleTwoTone';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import DualTrackingTest from "./DualTrackingTest";
import MapIcon from '@mui/icons-material/Map';
import HomeMaxIcon from '@mui/icons-material/HomeMax';
import MinimizeIcon from '@mui/icons-material/Minimize';
import ExploreIcon from '@mui/icons-material/Explore';
import { useNavigate } from "react-router-dom";
import DirectionsIcon from '@mui/icons-material/Directions';
import FollowTheSignsIcon from '@mui/icons-material/FollowTheSigns';
import BuildIcon from '@mui/icons-material/Build';

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
  onStartPolygon,
  isDrawingPolygon,
  onPanelToggle
}) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [panelMode, setPanelMode] = useState('closed');
  const isOpen = panelMode !== 'closed';
  const navigate = useNavigate();

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = (format) => {
    setExportAnchorEl(null);
    if (format && typeof onExport === 'function') {
      onExport(format);
    }
  };

  const toggleMode = () => {
    const newMode = panelMode === 'full' ? 'compact' : 'full';
    setPanelMode(newMode);
    if (onPanelToggle) onPanelToggle(true);
  };

  const closePanel = () => {
    setPanelMode('closed');
    if (onPanelToggle) onPanelToggle(false);
  };

  // پنل کنترل اصلی
  const controlPanelStyle = {
    position: 'fixed',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    padding: '6px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    zIndex: 1300,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    maxWidth: '90vw',
    overflow: 'hidden'
  };

  // استایل یکسان برای همه دکمه‌های اصلی
  const buttonStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: '9px',
    fontWeight: 500,
    minWidth: 'unset',
    padding: '4px',
    color: '#374151',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)'
    }
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: theme.palette.success.main,
    color: 'white',
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
    }
  };

  const iconSize = 'small';

  return (
    <>
      {/* پنل کنترل اصلی - بدون دکمه ردیابی */}
      <Box sx={controlPanelStyle}>
        {/* نشانگر */}
        <Tooltip title="نشانگر" arrow placement="top">
          <Button sx={buttonStyle} onClick={onAddMarker}>
            <AddLocationAlt fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>نشانگر</Typography>
          </Button>
        </Tooltip>

        {/* مسیر دستی */}
        <Tooltip title="مسیر دستی" arrow placement="top">
          <Button 
            sx={isDrawingPath ? activeButtonStyle : buttonStyle}
            onClick={onStartManualPath}
          >
            <DrawOutlinedIcon fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>مسیر</Typography>
          </Button>
        </Tooltip>

        {/* محدوده */}
        <Tooltip title="محدوده جدید" arrow placement="top">
          <Button 
            sx={isDrawingPolygon ? activeButtonStyle : buttonStyle}
            onClick={onStartPolygon}
          >
            <RectangleTwoToneIcon fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>محدوده</Typography>
          </Button>
        </Tooltip>

        {/* فیلتر */}
        <Tooltip title="فیلتر" arrow placement="top">
          <Button 
            sx={buttonStyle} 
            onClick={onFilter}
          >
            <FilterAltOutlinedIcon fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>فیلتر</Typography>
          </Button>
        </Tooltip>

        {/* خروجی */}
        <Tooltip title="خروجی" arrow placement="top">
          <Button sx={buttonStyle} onClick={handleExportClick}>
            <FileDownloadOutlinedIcon fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>خروجی</Typography>
          </Button>
        </Tooltip>

        {/* ورودی */}
        <Tooltip title="ورودی" arrow placement="top">
          <Button 
            sx={buttonStyle} 
            onClick={() => document.getElementById('importInput').click()}
          >
            <FileUploadOutlinedIcon fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>ورودی</Typography>
          </Button>
        </Tooltip>

        {/* تست مسیر */}
        <Tooltip title="تست مسیر GPS/DR" arrow placement="top">
          <Button 
            sx={buttonStyle}
            onClick={() => {
              setPanelMode('full');
              if (onPanelToggle) onPanelToggle(true);
            }}
          >
            <FollowTheSignsIcon fontSize={iconSize} />
            <Typography variant="caption" sx={{ fontSize: 'inherit', lineHeight: 1 }}>تست</Typography>
          </Button>
        </Tooltip>
      </Box>

      {/* دکمه‌های سمت چپ - جدا از پنل اصلی */}
      <Box sx={{
        position: 'fixed',
        bottom: 80,
        left: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1300
      }}>
        {/* دکمه ردیابی */}
        <Tooltip title={isTracking ? "توقف ردیابی" : "شروع ردیابی"} arrow placement="right">
          <IconButton 
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(15px)',
              borderRadius: '12px',
              width: '48px',
              height: '48px',
              color: isTracking ? theme.palette.error.main : theme.palette.success.main,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
            onClick={isTracking ? onStopTracking : onStartTracking}
          >
            {isTracking ? <Stop /> : <PlayArrow />}
          </IconButton>
        </Tooltip>

        {/* دکمه کالیبراسیون - بالاتر از قبل */}
        <Tooltip title="کالیبراسیون قطب‌نما" arrow placement="right">
          <IconButton 
            sx={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(15px)',
              borderRadius: '12px',
              width: '48px',
              height: '48px',
              color: theme.palette.info.main,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
            onClick={() => navigate("/calibration")}
          >
            <ExploreIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* منوی خروجی */}
      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => handleExportClose()}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(15px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <MenuItem onClick={() => handleExportClose('geojson')}>
          <ListItemIcon><MapIcon fontSize="small" /></ListItemIcon>
          <ListItemText>GeoJSON</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExportClose('kml')}>
          <ListItemIcon><Layers fontSize="small" /></ListItemIcon>
          <ListItemText>KML</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExportClose('csv')}>
          <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExportClose('json')}>
          <ListItemIcon><FileDownload fontSize="small" /></ListItemIcon>
          <ListItemText>JSON</ListItemText>
        </MenuItem>
      </Menu>

      {/* پنل کشویی */}
      <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={20}
          sx={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            height: panelMode === 'full' ? '100dvh' : '25vh',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            zIndex: 20000,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
            display: "flex",
            flexDirection: "column",
            pt: 1,
            pb: 1,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2 }}>
            <Tooltip title="بستن">
              <IconButton onClick={closePanel} sx={{ fontSize: '20px' }}>×</IconButton>
            </Tooltip>
            <Typography sx={{ fontWeight: "600", fontSize: "14px" }}>
              تست مسیر GPS/DR
            </Typography>
            <Tooltip title={panelMode === 'full' ? "حالت کوچک" : "تمام صفحه"}>
              <IconButton onClick={toggleMode}>
                {panelMode === 'full' ? <MinimizeIcon /> : <HomeMaxIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, px: 2, pb: 2 }}>
            <DualTrackingTest mode={panelMode} />
          </Box>
        </Paper>
      </Slide>
    </>
  );
}
