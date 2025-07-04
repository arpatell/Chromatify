import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useSpotifyAuth } from './hooks/useSpotifyAuth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import theme from './theme';

const App = () => {
  const accessToken = useSpotifyAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div class="video-background">
        <video autoPlay loop muted>
            <source src="bg-video.webm" type="video/webm"></source>
            Your browser does not support the video tag.
        </video>
      </div>
      {accessToken ? <Dashboard accessToken={accessToken} /> : <Login />}
    </ThemeProvider>
  );
};

export default App;