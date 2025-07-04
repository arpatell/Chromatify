import React from 'react';
import { Button, Box, Typography, Card, CardContent, Tooltip } from '@mui/material';

const CLIENT_ID = 'f5bbf7f8ab8b4462af66203517fdc02b';
const REDIRECT_URI = 'https://chromatify.vercel.app/callback';
const SCOPES = 'user-top-read';
const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&response_type=code&show_dialog=true`;

const Login = () => {
  const handleLogin = () => {
    window.location.href = AUTH_URL;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        zIndex: 1
      }}
    >
      <video
        autoPlay
        muted
        loop
        src={'bg-video.mp4'}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }}
      />
      <Card sx={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', p: 4, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h1" component="h1" gutterBottom>
            Chromatify
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4 }}>
            Discover the color aura of your listening on Spotify
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleLogin}
            sx={{ backgroundColor: '#1DB954', '&:hover': { backgroundColor: '#1AA34A' }, p: '10px 20px', fontWeight: 'bold' }}
          >
            Login with Spotify
          </Button>
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 4, color: 'rgba(255, 255, 255, 0.7)' }}>
            Made by{' '}
            <a 
              href="https://github.com/arpatell" 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'inherit', textDecoration: 'underline', margin: '0 4px' }}
            >
              Aaron Patel
            </a>
            <Tooltip title="Video background from Pixabay" arrow>
              <span style={{ cursor: 'pointer', fontWeight: 'bold', fontFamily: 'sans-serif' }}>
                (i)
              </span>
            </Tooltip>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;