import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import html2canvas from 'html2canvas';
import { fetchTopSongs, getSongColors, getSongListenCounts } from '../services/spotifyService';
import { calculateAuraColor, getTop3Colors, getColorName, arrayToHex, getAuraStyleProfile } from '../services/colorService';

const TIME_RANGES = [
  { value: 'short_term', label: 'Last Month' },
  { value: 'medium_term', label: 'Last 6 Months' },
  { value: 'long_term', label: 'All Time' },
];

const glassCardSx = {
  borderRadius: '14px',
  background: 'rgba(255, 255, 255, 0.66)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 24px 55px rgba(31, 44, 77, 0.12)',
};

const SPOTIFY_LOGO_SRC = '/spotify-logo.png';

const SOCIAL_THEME = {
  x: { color: '#0f1419', label: 'X', iconSrc: 'https://cdn.simpleicons.org/x/ffffff' },
  facebook: { color: '#1877f2', label: 'Facebook', iconSrc: 'https://cdn.simpleicons.org/facebook/ffffff' },
  instagram: { color: '#e1306c', label: 'Instagram', iconSrc: 'https://cdn.simpleicons.org/instagram/ffffff' },
  tiktok: { color: '#111111', label: 'TikTok', iconSrc: 'https://cdn.simpleicons.org/tiktok/ffffff' },
  reddit: { color: '#ff4500', label: 'Reddit', iconSrc: 'https://cdn.simpleicons.org/reddit/ffffff' },
  telegram: { color: '#26a5e4', label: 'Telegram', iconSrc: 'https://cdn.simpleicons.org/telegram/ffffff' },
  whatsapp: { color: '#25d366', label: 'WhatsApp', iconSrc: 'https://cdn.simpleicons.org/whatsapp/ffffff' },
};

const buildEmptyListenCountMap = (songs) => Object.fromEntries(songs.map((song) => [song.id, 0]));

const hasPositiveListenCounts = (listenCounts) => Object.values(listenCounts || {}).some((listenCount) => Number(listenCount) > 0);

const buildWeightedColorPoolFromCounts = (songs, colors, listenCounts) => {
  if (!songs.length || !colors.length) {
    return [];
  }

  const counts = songs.map((song) => listenCounts[song.id] ?? 0);
  const maxCount = Math.max(...counts, 1);
  const pool = [];

  songs.forEach((song, index) => {
    const color = colors[index];
    if (!Array.isArray(color) || color.length !== 3) {
      return;
    }
    const normalizedWeight = (listenCounts[song.id] ?? 0) / maxCount;
    const repeats = Math.max(1, Math.round(normalizedWeight * 5));
    for (let repeat = 0; repeat < repeats; repeat += 1) {
      pool.push(color);
    }
  });

  return pool;
};

const buildWeightedColorPoolFromRanking = (songs, colors) => {
  if (!songs.length || !colors.length) {
    return [];
  }

  const pool = [];
  const maxRankWeight = songs.length;

  songs.forEach((song, index) => {
    const color = colors[index];
    if (!Array.isArray(color) || color.length !== 3) {
      return;
    }
    const repeats = Math.max(1, maxRankWeight - index);
    for (let repeat = 0; repeat < repeats; repeat += 1) {
      pool.push(color);
    }
  });

  return pool;
};

const getTopColorsByListenRanking = (songs, colors, listenCounts, limit = 3) => {
  const rankedSongs = songs
    .map((song, index) => ({ song, color: colors[index], listens: listenCounts[song.id] ?? 0, index }))
    .filter((entry) => Array.isArray(entry.color) && entry.color.length === 3)
    .sort((a, b) => b.listens - a.listens || a.index - b.index);

  const selected = [];
  const seenColorKeys = new Set();

  rankedSongs.forEach((entry) => {
    if (selected.length >= limit) {
      return;
    }
    const colorHex = arrayToHex(entry.color);
    if (seenColorKeys.has(colorHex)) {
      return;
    }
    seenColorKeys.add(colorHex);
    selected.push(entry.color);
  });

  return selected;
};

const formatListenCount = (listenCount) => `${listenCount} listen${listenCount === 1 ? '' : 's'}`;

const getPlatformShareMode = (platformId) => {
  if (platformId === 'x' || platformId === 'facebook') {
    return 'native-or-link';
  }
  return 'native-only';
};

const getReadableTextColor = (hexColor) => {
  if (!hexColor) {
    return '#16213a';
  }
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return '#16213a';
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#172340' : '#f9fbff';
};

const buildShareUrl = ({ auraColor, auraName, timeRange, top3Colors, topSongs, styleProfile }) => {
  const params = new URLSearchParams({
    aura: auraColor.replace('#', ''),
    aura_name: auraName,
    vibe: styleProfile.id,
    range: timeRange,
    palette: top3Colors.map((color) => color.replace('#', '')).join('-'),
    songs: topSongs
      .slice(0, 5)
      .map((song) => `${song.name} - ${song.artists[0]?.name || 'Unknown Artist'}`)
      .join(' | '),
  });

  return `${window.location.origin}/share?${params.toString()}`;
};

const buildSocialLinks = (caption, shareUrl) => {
  const encodedCaption = encodeURIComponent(caption);
  const encodedShareUrl = encodeURIComponent(shareUrl);
  return [
    {
      id: 'instagram',
      name: 'Instagram',
      url: '',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      url: '',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}&quote=${encodedCaption}`,
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      url: `https://twitter.com/intent/tweet?text=${encodedCaption}&url=${encodedShareUrl}`,
    },
    {
      id: 'reddit',
      name: 'Reddit',
      url: `https://www.reddit.com/submit?url=${encodedShareUrl}&title=${encodedCaption}`,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      url: `https://t.me/share/url?url=${encodedShareUrl}&text=${encodedCaption}`,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      url: `https://wa.me/?text=${encodeURIComponent(`${caption} ${shareUrl}`)}`,
    },
  ];
};

const Dashboard = ({ accessToken }) => {
  const [timeRange, setTimeRange] = useState('short_term');
  const [topSongs, setTopSongs] = useState([]);
  const [songColors, setSongColors] = useState({});
  const [songListenCounts, setSongListenCounts] = useState({});
  const [listenCountStatus, setListenCountStatus] = useState('none');
  const [auraColor, setAuraColor] = useState('');
  const [auraName, setAuraName] = useState('');
  const [top3Colors, setTop3Colors] = useState([]);
  const [top3Names, setTop3Names] = useState([]);
  const [auraProfile, setAuraProfile] = useState(() => getAuraStyleProfile([]));
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareError, setShareError] = useState('');
  const exportPreviewRef = useRef(null);

  const timeRangeLabel = useMemo(
    () => TIME_RANGES.find((option) => option.value === timeRange)?.label || 'Recent',
    [timeRange]
  );

  const shareCaption = useMemo(() => {
    if (!auraColor || !auraName) {
      return '';
    }
    return `My Chromatify aura is ${auraName} (${auraColor}) from my ${timeRangeLabel} Spotify listening.`;
  }, [auraColor, auraName, timeRangeLabel]);

  const shareUrl = useMemo(() => {
    if (!auraColor) {
      return '';
    }
    return buildShareUrl({ auraColor, auraName, timeRange, top3Colors, topSongs, styleProfile: auraProfile });
  }, [auraColor, auraName, timeRange, top3Colors, topSongs, auraProfile]);

  const socialLinks = useMemo(() => {
    if (!shareCaption || !shareUrl) {
      return [];
    }
    return buildSocialLinks(shareCaption, shareUrl);
  }, [shareCaption, shareUrl]);

  const handleGenerate = async () => {
    setHasGenerated(true);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const songs = await fetchTopSongs(accessToken, timeRange);
      setTopSongs(songs);

      if (!songs.length) {
        setSongListenCounts({});
        setListenCountStatus('none');
        setAuraColor('');
        setAuraName('');
        setTop3Colors([]);
        setTop3Names([]);
        setAuraProfile(getAuraStyleProfile([]));
        return;
      }

      const [colors, listenCountsResult] = await Promise.all([
        getSongColors(accessToken, songs),
        getSongListenCounts(accessToken, songs, timeRange)
          .then((counts) => ({ counts, status: hasPositiveListenCounts(counts) ? 'available' : 'empty' }))
          .catch(() => ({ counts: buildEmptyListenCountMap(songs), status: 'unavailable' })),
      ]);

      setSongListenCounts(listenCountsResult.counts);
      setListenCountStatus(listenCountsResult.status);

      const songColorMap = {};
      songs.forEach((song, index) => {
        songColorMap[song.id] = arrayToHex(colors[index]);
      });
      setSongColors(songColorMap);

      const hasRealCounts = hasPositiveListenCounts(listenCountsResult.counts);
      const weightedColors = hasRealCounts
        ? buildWeightedColorPoolFromCounts(songs, colors, listenCountsResult.counts)
        : buildWeightedColorPoolFromRanking(songs, colors);
      const effectiveColorPool = weightedColors.length ? weightedColors : colors;

      const aura = calculateAuraColor(effectiveColorPool);
      setAuraColor(arrayToHex(aura));
      setAuraName(await getColorName(aura));

      const rankedTop3 = getTopColorsByListenRanking(songs, colors, listenCountsResult.counts, 3);
      const top3 = rankedTop3.length > 0 ? rankedTop3 : await getTop3Colors(effectiveColorPool);
      const top3Hex = top3.map(arrayToHex);
      setTop3Colors(top3Hex);
      setTop3Names(await Promise.all(top3.map((color) => getColorName(color))));
      setAuraProfile(getAuraStyleProfile([aura, ...effectiveColorPool.slice(0, 5), ...top3]));
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not generate your aura right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('token_expiry');
    window.location.reload();
  };

  const getExportFile = async () => {
    if (!exportPreviewRef.current) {
      return null;
    }

    const canvas = await html2canvas(exportPreviewRef.current, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
    });

    const blob = await new Promise((resolve) => {
      canvas.toBlob((generatedBlob) => resolve(generatedBlob), 'image/png', 0.98);
    });

    if (!blob) {
      return null;
    }

    return new File([blob], `chromatify-${timeRange}.png`, { type: 'image/png' });
  };

  const downloadExportFile = async (file) => {
    const objectUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
  };

  const tryNativeImageShare = async (file, platformName) => {
    if (!navigator?.share || !navigator?.canShare) {
      return false;
    }

    const sharePayload = {
      files: [file],
      title: `Chromatify Aura - ${timeRangeLabel}`,
      text: `${shareCaption} (${platformName})`,
    };

    if (!navigator.canShare(sharePayload)) {
      return false;
    }

    await navigator.share(sharePayload);
    return true;
  };

  const handleShareToPlatform = async (platform) => {
    setShareError('');
    try {
      const exportFile = await getExportFile();
      if (!exportFile) {
        setShareError('Could not build export image. Please try again.');
        return;
      }

      const mode = getPlatformShareMode(platform.id);
      const sharedWithFile = await tryNativeImageShare(exportFile, platform.name).catch(() => false);
      if (sharedWithFile) {
        return;
      }

      if (mode === 'native-or-link' && platform.url) {
        window.open(platform.url, '_blank', 'noopener,noreferrer');
        return;
      }

      await downloadExportFile(exportFile);
      setShareError(`Direct ${platform.name} web upload is not available. Image downloaded for manual posting.`);
    } catch (error) {
      console.error(error);
      setShareError('Share failed. Please try again.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 2.5 } }}>
      <Stack spacing={2.25}>
        <Card sx={glassCardSx}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Box>
                <Typography variant="h2" sx={{ lineHeight: 1.1 }}>
                  Chromatify
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
                  Turn your Spotify listening into a color aura you can share.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={handleLogout}>
                Disconnect Spotify
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={glassCardSx}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 } }}>
                <InputLabel id="time-range-label">Time Range</InputLabel>
                <Select
                  labelId="time-range-label"
                  value={timeRange}
                  label="Time Range"
                  onChange={(event) => setTimeRange(event.target.value)}
                >
                  {TIME_RANGES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleGenerate} disabled={isLoading} sx={{ minWidth: { sm: 170 } }}>
                Generate Aura
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                onClick={() => setShareDialogOpen(true)}
                disabled={!auraColor || isLoading}
                sx={{ minWidth: { sm: 170 } }}
              >
                <Box component="span" sx={{ mr: 0.8, fontWeight: 800 }}>
                  ↗
                </Box>
                Export & Share
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {isLoading && (
          <Card sx={glassCardSx}>
            <CardContent sx={{ p: { xs: 2.5, sm: 4 }, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Pulling tracks and building your vibrant palette...
              </Typography>
            </CardContent>
          </Card>
        )}

        {!isLoading && errorMessage && (
          <Card sx={glassCardSx}>
            <CardContent>
              <Typography color="error.main">{errorMessage}</Typography>
            </CardContent>
          </Card>
        )}

        {!isLoading && hasGenerated && topSongs.length === 0 && !errorMessage && (
          <Card sx={glassCardSx}>
            <CardContent>
              <Typography>No listening history found for this range. Try another time frame.</Typography>
            </CardContent>
          </Card>
        )}

        {!isLoading && topSongs.length > 0 && auraColor && (
          <>
            <Grid container spacing={2.25}>
              <Grid item xs={12} md={6}>
                <Card sx={glassCardSx}>
                  <CardContent
                    sx={{ p: { xs: 2.2, sm: 2.6 }, background: auraProfile.surfaceGradient, borderRadius: '12px' }}
                  >
                    <Typography variant="h4">Your Aura</Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          width: { xs: 84, sm: 108 },
                          height: { xs: 84, sm: 108 },
                          borderRadius: '26px',
                          background: auraColor,
                          boxShadow: '0 14px 30px rgba(23, 32, 62, 0.2)',
                          border: '2px solid rgba(255, 255, 255, 0.85)',
                        }}
                      />
                      <Box>
                        <Typography variant="h5">{auraName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {auraColor}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={glassCardSx}>
                  <CardContent sx={{ p: { xs: 2.2, sm: 2.6 } }}>
                    <Typography variant="h4">Top Colors</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ mt: 2 }}>
                      {top3Colors.map((color, index) => (
                        <Box
                          key={color}
                          sx={{
                            flex: 1,
                            minHeight: { xs: 82, sm: 124 },
                            borderRadius: '10px',
                            p: 1.3,
                            background: color,
                            color: getReadableTextColor(color),
                            border: '2px solid rgba(255,255,255,0.72)',
                            boxShadow: '0 10px 22px rgba(20, 32, 64, 0.17)',
                          }}
                        >
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, opacity: 0.92 }}>
                            #{index + 1}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {top3Names[index] || color}
                          </Typography>
                          <Typography variant="caption">{color}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={glassCardSx}>
              <CardContent sx={{ p: { xs: 2.2, sm: 2.8 } }}>
                <Typography variant="h4">Top Songs</Typography>
                <Typography variant="caption" color="text.secondary">
                  {listenCountStatus === 'available'
                    ? `Listen counts shown for ${timeRangeLabel}.`
                    : `No listen count data available for ${timeRangeLabel}; showing 0.`}
                </Typography>
                <Stack spacing={1.15} sx={{ mt: 1.8 }}>
                  {topSongs.slice(0, 7).map((song, index) => {
                    const colorHex = songColors[song.id] || '#ecf1ff';
                    const textColor = getReadableTextColor(colorHex);
                    const listens = songListenCounts[song.id] ?? 0;
                    const albumArt =
                      song?.album?.images?.[2]?.url || song?.album?.images?.[1]?.url || song?.album?.images?.[0]?.url;
                    return (
                      <Box
                        key={song.id}
                        sx={{
                          p: { xs: 1.2, sm: 1.5 },
                          borderRadius: '10px',
                          background: colorHex,
                          color: textColor,
                          border: '1px solid rgba(255,255,255,0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1.25,
                          flexWrap: { xs: 'wrap', sm: 'nowrap' },
                          overflow: 'hidden',
                        }}
                      >
                        <Stack direction="row" spacing={1.15} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, flexShrink: 0, opacity: 0.95 }}>
                            #{index + 1}
                          </Typography>
                          {albumArt && (
                            <Box
                              component="img"
                              src={albumArt}
                              alt={`${song.name} album art`}
                              sx={{
                                width: 42,
                                height: 42,
                                borderRadius: '8px',
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: '1px solid rgba(255,255,255,0.7)',
                              }}
                            />
                          )}
                          <Link
                            href={song.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{
                              color: 'inherit',
                              fontWeight: 700,
                              minWidth: 0,
                              maxWidth: '100%',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.9,
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                              }}
                            >
                              {song.name} - {song.artists[0]?.name || 'Unknown Artist'}
                            </Box>
                            <Box
                              component="img"
                              src={SPOTIFY_LOGO_SRC}
                              alt="Spotify"
                              sx={{ height: 15, width: 'auto', display: 'block', flexShrink: 0 }}
                            />
                          </Link>
                        </Stack>
                        <Stack spacing={0.1} alignItems="flex-end" sx={{ flexShrink: 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.15 }}>
                            {formatListenCount(listens)}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.25 }}>
                            {colorHex}
                          </Typography>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Stack>

      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          <Box component="span" sx={{ mr: 0.8 }}>
            ↗
          </Box>
          Export & Share
        </DialogTitle>
        <DialogContent>
          {auraColor ? (
            <Stack spacing={1.8}>
              <Box
                ref={exportPreviewRef}
                sx={{
                  width: '100%',
                  borderRadius: '12px',
                  p: { xs: 2, sm: 2.6 },
                  pt: '100px',
                  pb: '100px',
                  background:
                    'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(242,248,255,0.86) 48%, rgba(236,244,255,0.82) 100%)',
                  border: '1px solid rgba(255,255,255,0.85)',
                }}
              >
                <Box
                  sx={{
                    mx: 'auto',
                    width: '100%',
                    maxWidth: 280,
                    aspectRatio: '9 / 16',
                    borderRadius: '12px',
                    p: 1.8,
                    pt: '50px',
                    pb: '125px',
                    background: `${auraProfile.surfaceGradient}, linear-gradient(190deg, ${auraColor} 0%, #ffffff 100%)`,
                    color: getReadableTextColor(auraColor),
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 12px 22px rgba(26, 36, 67, 0.2)',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      My Chromatify
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.4, lineHeight: 1.15 }}>
                      {timeRangeLabel}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      my: 'auto',
                      minHeight: 88,
                      borderRadius: '10px',
                      p: 1,
                      background: 'rgba(255,255,255,0.24)',
                      border: '1px solid rgba(255,255,255,0.34)',
                    }}
                  >
                    <Stack spacing={0.7}>
                      {topSongs.slice(0, 3).map((song) => {
                        const albumArt =
                          song?.album?.images?.[2]?.url || song?.album?.images?.[1]?.url || song?.album?.images?.[0]?.url;
                        return (
                          <Stack key={song.id} direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                            {albumArt && (
                              <Box
                                component="img"
                                src={albumArt}
                                alt={`${song.name} cover`}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '6px',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Typography
                              variant="caption"
                              sx={{
                                minWidth: 0,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 700,
                              }}
                            >
                              {song.name} - {song.artists?.[0]?.name || 'Unknown Artist'}
                            </Typography>
                            <Box
                              component="img"
                              src={SPOTIFY_LOGO_SRC}
                              alt="Spotify"
                              sx={{ height: 11, width: 'auto', display: 'block', flexShrink: 0 }}
                            />
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                  <Box sx={{ mb: 0.45 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {auraName}
                    </Typography>
                    <Typography variant="caption">{auraColor}</Typography>
                    <Stack direction="row" spacing={0.6} sx={{ mt: 0.8 }}>
                      {top3Colors.slice(0, 3).map((color) => (
                        <Box
                          key={color}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 999,
                            border: '1px solid rgba(255,255,255,0.82)',
                            background: color,
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2">Share to social apps</Typography>
                <Typography variant="caption" color="text.secondary">
                  Tap an icon to post your aura.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.1,
                  overflowX: 'auto',
                  py: 0.5,
                  pr: 0.5,
                  scrollbarWidth: 'thin',
                }}
              >
                {socialLinks.map((platform) => (
                  <Button
                    key={platform.id}
                    variant="outlined"
                    onClick={() => handleShareToPlatform(platform)}
                    sx={{
                      minWidth: 92,
                      flex: '0 0 auto',
                      px: 1.1,
                      py: 0.8,
                      borderRadius: '10px',
                      borderColor: 'rgba(33,48,86,0.18)',
                      color: 'text.primary',
                    }}
                    aria-label={`Share to ${platform.name}`}
                  >
                    <Stack spacing={0.55} alignItems="center">
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: SOCIAL_THEME[platform.id]?.color || '#5f55ff',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Box
                          component="img"
                          src={SOCIAL_THEME[platform.id]?.iconSrc}
                          alt={`${platform.name} logo`}
                          sx={{ width: 18, height: 18, display: 'block' }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1 }}>
                        {SOCIAL_THEME[platform.id]?.label || platform.name}
                      </Typography>
                    </Stack>
                  </Button>
                ))}
              </Box>
              {shareError && (
                <Typography variant="caption" color="text.secondary">
                  {shareError}
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Generate an aura first to unlock export URLs.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
