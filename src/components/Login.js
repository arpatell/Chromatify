import React from 'react';
import { Button, Box, Typography, Card, CardContent, Stack } from '@mui/material';
import { getSpotifyAuthUrl } from '../config/spotify';

const SPOTIFY_LOGO_SRC = '/spotify-logo.png';

const Login = () => {
  const handleLogin = async () => {
    const authUrl = await getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 6 },
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <Stack spacing={2.2} alignItems="center" sx={{ maxWidth: 780, mx: 'auto', transform: { xs: 'translateY(-3vh)', sm: 'translateY(-5vh)' } }}>
        <Card sx={{ width: '100%', maxWidth: 620, p: { xs: 2, sm: 4 }, borderRadius: '14px' }}>
          <CardContent>
            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{ textAlign: 'center', fontSize: { xs: '2.35rem', sm: '3.2rem', md: '3.8rem' } }}
            >
              Chromatify
            </Typography>
            <Typography
              variant="h5"
              component="h2"
              gutterBottom
              sx={{ mb: 1.4, textAlign: 'center', fontSize: { xs: '1.02rem', sm: '1.25rem' }, color: 'text.secondary' }}
            >
              Music aura from your Spotify listening history.
            </Typography>
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
              Discover your current color palette, preview your top tracks with album art, and share your aura across socials.
            </Typography>
            <Stack spacing={1.2} alignItems="stretch">
              <Button variant="contained" color="primary" onClick={handleLogin} sx={{ py: 1.35, fontWeight: 700 }}>
                Login with Spotify
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <Box
        sx={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: { xs: 12, sm: 16 },
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.55,
          zIndex: 10,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.72rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#ffffff',
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          Powered by
        </Typography>
        <Box
          component="img"
          src={SPOTIFY_LOGO_SRC}
          alt="Spotify"
          sx={{
            height: 16,
            width: 'auto',
            display: 'block',
            flexShrink: 0,
            filter: 'brightness(0) invert(1)',
            transform: 'translateY(-2px)',
          }}
        />
      </Box>
      <Box
        component="a"
        href="https://github.com/arpatell"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub profile"
        sx={{
          position: 'fixed',
          right: { xs: 12, sm: 16 },
          bottom: { xs: 12, sm: 16 },
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(20, 24, 35, 0.78)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 8px 18px rgba(20, 24, 35, 0.22)',
          transition: 'transform 120ms ease, opacity 120ms ease',
          opacity: 0.88,
          '&:hover': {
            transform: 'translateY(-1px)',
            opacity: 1,
          },
        }}
      >
        <Box component="img" src="https://cdn.simpleicons.org/github/ffffff" alt="GitHub" sx={{ width: 14, height: 14 }} />
      </Box>
    </Box>
  );
};

export default Login;
