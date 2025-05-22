// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' },
    secondary: { main: '#9C27B0' },
    success:   { main: '#4CAF50' },
    error:     { main: '#E53935' },
    warning:   { main: '#FFC107' },
    info:      { main: '#2196F3' },
    background: { default: '#f5f5f5', paper: '#fff' }
  },
  typography: {
    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 16px' }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12, padding: '16px' }
      }
    }
  }
});

export default theme;
