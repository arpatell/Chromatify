import React, { useState, useRef } from 'react';
import { Button, Select, MenuItem, FormControl, InputLabel, Box, Typography, CircularProgress, Grid, Paper, Card, CardContent, Link } from '@mui/material';
import { fetchTopSongs, getSongColors } from '../services/spotifyService';
import { calculateAuraColor, getTop3Colors, getColorName, arrayToHex } from '../services/colorService';
import html2canvas from 'html2canvas';

const Dashboard = ({ accessToken }) => {
  const [timeRange, setTimeRange] = useState('short_term');
  const [topSongs, setTopSongs] = useState([]);
  const [songColors, setSongColors] = useState({});
  const [auraColor, setAuraColor] = useState('');
  const [auraName, setAuraName] = useState('');
  const [top3Colors, setTop3Colors] = useState([]);
  const [top3Names, setTop3Names] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // New state to track if the generate button has been clicked
  const [hasGenerated, setHasGenerated] = useState(false);
  const resultsRef = useRef(null);

  const handleGenerate = async () => {
    // Set the flag to true on the first click
    setHasGenerated(true);
    setIsLoading(true);
    const songs = await fetchTopSongs(accessToken, timeRange);
    setTopSongs(songs);

    if (songs.length > 0) {
      const colors = await getSongColors(accessToken, songs);
      const songColorMap = {};
      songs.forEach((song, index) => {
        songColorMap[song.id] = arrayToHex(colors[index]);
      });
      setSongColors(songColorMap);

      const aura = calculateAuraColor(colors);
      setAuraColor(arrayToHex(aura));
      const auraNameResult = await getColorName(aura);
      setAuraName(auraNameResult);
      const top3 = await getTop3Colors(colors);
      setTop3Colors(top3.map(arrayToHex));
      const top3NamesResult = await Promise.all(top3.map(color => getColorName(color)));
      setTop3Names(top3NamesResult);
    } else {
      setAuraColor('');
    }
    setIsLoading(false);
  };

  const handleExport = () => {
    const exportContent = document.createElement('div');
    exportContent.style.width = '1080px';
    exportContent.style.height = '1920px';
    exportContent.style.position = 'relative';
    exportContent.style.color = 'white';
    exportContent.style.backgroundImage = 'url(/image.png)';
    exportContent.style.backgroundSize = 'cover';
    exportContent.style.backgroundPosition = 'center';

    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    exportContent.appendChild(overlay);

    const contentWrapper = document.createElement('div');
    contentWrapper.style.position = 'relative';
    contentWrapper.style.width = '100%';
    contentWrapper.style.height = '100%';
    contentWrapper.style.display = 'flex';
    contentWrapper.style.flexDirection = 'column';
    contentWrapper.style.alignItems = 'center';
    contentWrapper.style.justifyContent = 'space-between';
    contentWrapper.style.padding = '50px';
    contentWrapper.style.boxSizing = 'border-box';

    const header = document.createElement('div');
    header.style.textAlign = 'center';
    const mainTitle = document.createElement('h1');
    mainTitle.innerText = 'My Chromatify';
    mainTitle.style.fontSize = '72px';
    mainTitle.style.margin = '0';
    const subTitle = document.createElement('h2');
    let timeRangeText = '';
    if (timeRange === 'short_term') timeRangeText = 'Last Month';
    if (timeRange === 'medium_term') timeRangeText = 'Last 6 Months';
    if (timeRange === 'long_term') timeRangeText = 'All Time';
    subTitle.innerText = timeRangeText;
    subTitle.style.fontSize = '48px';
    subTitle.style.textTransform = 'capitalize';
    subTitle.style.margin = '0';
    header.appendChild(mainTitle);
    header.appendChild(subTitle);

    const auraContainer = document.createElement('div');
    auraContainer.style.textAlign = 'center';
    auraContainer.style.display = 'flex';
    auraContainer.style.flexDirection = 'column';
    auraContainer.style.alignItems = 'center';
    auraContainer.style.gap = '10px';
    const auraTitle = document.createElement('h3');
    auraTitle.innerText = 'My Aura';
    auraTitle.style.fontSize = '48px';
    auraTitle.style.margin = '20px 0';
    auraContainer.appendChild(auraTitle);
    const auraBox = document.createElement('div');
    auraBox.style.width = '150px';
    auraBox.style.height = '150px';
    auraBox.style.backgroundColor = auraColor;
    auraBox.style.borderRadius = '10px';
    auraBox.style.display = 'flex';
    auraBox.style.alignItems = 'center';
    auraBox.style.justifyContent = 'center';
    auraBox.innerText = auraName;
    auraContainer.appendChild(auraBox);

    const colorsContainer = document.createElement('div');
    colorsContainer.style.textAlign = 'center';
    const topColorsTitle = document.createElement('h3');
    topColorsTitle.innerText = 'Top Colors';
    topColorsTitle.style.fontSize = '48px';
    topColorsTitle.style.margin = '20px 0';
    colorsContainer.appendChild(topColorsTitle);
    const colorsFlex = document.createElement('div');
    colorsFlex.style.display = 'flex';
    colorsFlex.style.gap = '20px';
    top3Colors.forEach((color, index) => {
      const colorBox = document.createElement('div');
      colorBox.style.width = '150px';
      colorBox.style.height = '150px';
      colorBox.style.backgroundColor = color;
      colorBox.style.borderRadius = '10px';
      colorBox.style.display = 'flex';
      colorBox.style.alignItems = 'center';
      colorBox.style.justifyContent = 'center';
      colorBox.innerText = top3Names[index];
      colorsFlex.appendChild(colorBox);
    });
    colorsContainer.appendChild(colorsFlex);

    const songsContainer = document.createElement('div');
    songsContainer.style.textAlign = 'center';
    const topSongsTitle = document.createElement('h3');
    topSongsTitle.innerText = 'Top Songs';
    topSongsTitle.style.fontSize = '48px';
    topSongsTitle.style.margin = '20px 0';
    songsContainer.appendChild(topSongsTitle);
    topSongs.slice(0, 5).forEach(song => {
      const songEl = document.createElement('p');
      songEl.innerText = `${song.name} - ${song.artists[0].name}`;
      songEl.style.fontSize = '36px';
      songEl.style.margin = '5px 0';
      songsContainer.appendChild(songEl);
    });

    const footer = document.createElement('div');
    // Use flexbox for easy horizontal and vertical alignment
    footer.style.display = 'flex';
    footer.style.justifyContent = 'center';
    footer.style.alignItems = 'center';
    footer.style.gap = '15px'; // Adds space between all items
    footer.style.fontSize = '36px'; // Set a base font size for text elements
    
    // Create the app link element
    const appLink = document.createElement('a');
    appLink.innerText = 'chromatify.vercel.app';
    appLink.href = 'https://chromatify.vercel.app'; // Make it a clickable link
    appLink.style.color = 'white';
    appLink.style.textDecoration = 'underline';
    appLink.style.fontSize = 'inherit'; // Use the footer's font size
    
    // Create the separator element
    const separator = document.createElement('span');
    separator.innerText = '|';
    separator.style.fontSize = 'inherit';
    
    // Create the "Powered by" text element
    const poweredByText = document.createElement('span');
    poweredByText.innerText = 'Powered by';
    poweredByText.style.fontSize = 'inherit';
    
    // Create the Spotify logo image element
    const spotifyLogo = document.createElement('img');
    spotifyLogo.src = '/spotify-logo.png'; // Use the correct path to your logo
    spotifyLogo.alt = 'Spotify Logo';
    spotifyLogo.style.height = '40px'; // Adjust size as needed
    
    // Add all elements to the footer in the correct order
    footer.appendChild(appLink);
    footer.appendChild(separator);
    footer.appendChild(poweredByText);
    footer.appendChild(spotifyLogo);

    contentWrapper.appendChild(header);
    contentWrapper.appendChild(auraContainer);
    contentWrapper.appendChild(colorsContainer);
    contentWrapper.appendChild(songsContainer);
    contentWrapper.appendChild(footer);

    exportContent.appendChild(contentWrapper);

    document.body.appendChild(exportContent);

    html2canvas(exportContent, { backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'chromatify-story.png';
      link.click();
      document.body.removeChild(exportContent);
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_access_token');
    window.location.reload();
  }

  const cardStyle = {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    p: 2,
    mb: 2
  };

  return (
    <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
      <video autoPlay loop muted src={'bg-video.mp4'} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h2" gutterBottom>Chromatify</Typography>
        <Button variant="contained" onClick={handleLogout}>Disconnect</Button>
      </Box>
      <Card sx={cardStyle}>
        <CardContent>
          <FormControl sx={{ mr: 2, minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select value={timeRange} label="Time Range" onChange={(e) => setTimeRange(e.target.value)}>
              <MenuItem value="short_term">Last Month</MenuItem>
              <MenuItem value="medium_term">Last 6 Months</MenuItem>
              <MenuItem value="long_term">All Time</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleGenerate} disabled={isLoading}>
            Generate Aura
          </Button>
        </CardContent>
      </Card>

      {/* This block now checks the hasGenerated flag before rendering anything */}
      {isLoading ? (
        <CircularProgress />
      ) : hasGenerated ? (
        topSongs.length > 0 && auraColor ? (
          <Box ref={resultsRef}>
            <Card sx={cardStyle}>
              <CardContent>
                <Typography variant="h4">Your Color Aesthetic</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <Box sx={{ width: 100, height: 100, bgcolor: auraColor, mr: 2, borderRadius: 1 }} />
                  <Typography variant="h5">{auraName}</Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={cardStyle}>
              <CardContent>
                <Typography variant="h4">Top 3 Colors</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {top3Colors.map((color, index) => (
                    <Grid item key={index}>
                      <Paper sx={{ p: 2, bgcolor: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 100, height: 100, borderRadius: 1, textAlign: 'center' }}>
                        <Typography>{top3Names[index]}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={cardStyle}>
              <CardContent>
                <Typography variant="h4">Top 5 Songs</Typography>
                <Grid container direction="column" spacing={1} sx={{ mt: 1 }}>
                  {topSongs.slice(0, 5).map((song) => (
                    <Grid item xs={12} key={song.id}>
                      <Paper sx={{ p: 2, bgcolor: songColors[song.id] || 'rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Link href={song.external_urls.spotify} target="_blank" rel="noopener noreferrer" sx={{ color: 'white' }}>
                          {song.name} - {song.artists[0].name}
                        </Link>
                        <img src="/spotify-logo.png" alt="Spotify" style={{ width: 'auto', height: '20px' }} />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Button variant="contained" onClick={handleExport} sx={{ mt: 2 }}>Export as Story</Button>
          </Box>
        ) : (
          <Typography>No listening history found, try another time frame</Typography>
        )
      ) : null}
    </Box>
  );
};

export default Dashboard;