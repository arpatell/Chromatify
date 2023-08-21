import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ColorThief from 'colorthief';
import './App.css';

const CLIENT_ID = 'f5bbf7f8ab8b4462af66203517fdc02b';
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
const REDIRECT_URI = 'https://chromatify.vercel.app/callback';
const SCOPES = 'user-top-read';
var urlCode = null;

const App = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [timeRange, setTimeRange] = useState('short_term');
  const [topSongs, setTopSongs] = useState([]);
  const [auraColor, setAuraColor] = useState('');
  const [auraName, setAuraName] = useState('');
  const [top3Colors, setTop3Colors] = useState([]);
  const [top3Names, setTop3Names] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [songColors, setSongColors] = useState([]);


  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const setCode = async () => {
    const queryString = window.location.search;
    if (queryString.length > 0) {
      const urlParams = new URLSearchParams(queryString);
      urlCode = urlParams.get('code');
    }
  };

  const getAccessToken = async () => {
    try {
      const response = await fetch ('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: urlCode,
          redirect_uri: REDIRECT_URI,
          scope: SCOPES,
        }).toString(),
      });
  
      if (response.ok) {
        const data = await response.json();
        const token = data.access_token;
        setAccessToken(token);
      }
    } catch (error) {
      console.error('Error retrieving access token:', error);
      throw error;
    }
  };


  useEffect(() => {
    const handleAuthentication = async () => {
      setCode()
      if (urlCode) {
        try {
          await getAccessToken();
          window.history.pushState({}, '', '/');
        } catch (error) {
          console.error('Error retrieving access token:', error);
        }
      }
    };
    handleAuthentication();
  }, []);

  const fetchTopSongs = async () => {
    try {
      const response = await axios ( {
        method: 'GET',
        url: `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=7`,
        headers: { Authorization: `Bearer ${accessToken}`},
      })
      return response.data.items;
    } catch (error) {
      console.log(error);
    }
  };

  const getSongColors = async (songs) => {
    try {
      const colors = [];
      for (const song of songs) {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${song.id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await response.json();
  
        if (data.album.images.length > 0) {
          const imageUrl = data.album.images[0].url;
          const color = await extractColor(imageUrl);
          colors.push(color);
        }
      }
      return colors;
    } catch (error) {
      console.error('Error retrieving data:', error);
    }
  };
  
  const extractColor = async (url) => {
    try {
      const image = new Image();
      image.crossOrigin = 'Anonymous';
      image.src = url;
  
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
  
      const colorThief = new ColorThief();
      const color = colorThief.getColor(image);
      if (color) {
        return color;
      } else {
        return [255, 255, 255];
      }
    } catch (error) {
      console.error('Error extracting color:', error);
      return [255, 255, 255];
    }
  };
  const convert = require('color-convert');
  const calculateAuraColor = (songColors) => {
    const hslColors = songColors.map(rgb => convert.rgb.hsl(rgb));
    const sortedHslColors = hslColors.sort((a, b) => b[2] - a[2]);
  
    const dominantColor = sortedHslColors[0];
  
    let redSum = 0, greenSum = 0, blueSum = 0;
    let multiplier = 1;
  
    for (let i = 0; i < songColors.length; i++) {
      const rgb = convert.hsl.rgb(hslColors[i]);
      let modifiedRed = dominantColor[0] + ((rgb[0] - dominantColor[0]) * multiplier);
      let modifiedGreen = dominantColor[1] + ((rgb[1] - dominantColor[1]) * multiplier);
      let modifiedBlue = dominantColor[2] + ((rgb[2] - dominantColor[2]) * multiplier);
      modifiedRed = Math.min(Math.max(modifiedRed, 0), 255);
      modifiedGreen = Math.min(Math.max(modifiedGreen, 0), 255);
      modifiedBlue = Math.min(Math.max(modifiedBlue, 0), 255);
      redSum += modifiedRed;
      greenSum += modifiedGreen;
      blueSum += modifiedBlue;
      multiplier += 0.1;
    }
    const averageRed = Math.round(redSum / songColors.length);
    const averageGreen = Math.round(greenSum / songColors.length);
    const averageBlue = Math.round(blueSum / songColors.length);
    const auraColor = [averageRed, averageGreen, averageBlue];
    return auraColor;
  };
  const getTop3Colors = async (songColors) => {
    if (songColors.length < 3) {
      return [];
    }
    if (songColors.length === 3) {
      return[songColors[0], songColors[1], songColors[2]];
    }
    const colorCounts = {};
    songColors.forEach(color => {
      const key = color.join(',');
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    });
    const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
    const dominantColor = sortedColors[0].split(',').map(Number);
    const secondColor = sortedColors[1].split(',').map(Number);
    const thirdColor = sortedColors[2].split(',').map(Number);
    return [dominantColor, secondColor, thirdColor];
  };
  const getColorName = async (rgbColor) => {
    try {
      const response = await axios.get(`https://www.thecolorapi.com/id?rgb=${rgbColor[0]+','+rgbColor[1]+','+rgbColor[2]}`);
      const colorData = response.data;

      if (colorData.hasOwnProperty('name')) {
        return colorData.name.value;
      } else {
        return 'Unknown';
      }
    } catch (error) {
      console.error('Error retrieving color name:', error);
      return 'Unknown';
    }
  };
  const arrayToHex = (rgbColor) => {
    const hex = rgbColor.reduce((accumulator, current) => {
      const hexValue = current.toString(16).padStart(2, '0');
      return accumulator + hexValue;
    }, '#');
    return hex;
  };

  const getColorFromSong = (song) => {
    var index = 0;
    for (const songData of topSongs) {
      if (songData.id === song.id) {
        return arrayToHex(songColors[index]);
      } else {
        index++;
      }
    }
  }

  const getSongURL = (song) => {
    for (const songData of topSongs) {
      if (songData.id === song.id) {
        return songData.external_urls.spotify;
      }
    }
  }

  const handleLogout = () => {
    setAccessToken(null);
    window.location.reload();
  }

  const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}&show_dialog=true`;

  const generateAura = async () => {
    try {
      setIsLoading(true);
      getAccessToken();
      const songs = await fetchTopSongs();
      const colors = await getSongColors(songs);
      const aura = calculateAuraColor(colors);
      const top3 = await getTop3Colors(colors);
      const top3name = [];
      const top3color = [];
      for (const arr of top3) {
        top3name.push(await getColorName(arr));
        top3color.push(arrayToHex(arr));
      }
      setTopSongs(songs);
      setTop3Colors(top3color);
      setSongColors(colors);
      setTop3Names(top3name);
      setAuraColor(arrayToHex(aura));
      setAuraName(await getColorName(aura));
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating aura:', error);
    }
  };


  return (
    <div className="App">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"></link>
      <div class="video-background">
        <video autoPlay={true} loop muted>
            <source src="bg-video.webm" type="video/webm"></source>
        </video>
      </div>
      <h1 className="app-title">Chromatify</h1>
      {!accessToken && (
        <div className="info-text">
          <h3>What is Chromatify?</h3>
          <h4>Chromatify is a tool that displays the color aesthetic of a your most listened songs in a given time frame (last month, last 6 months, and all time). You will get a blended color aesthetic based on the colors of the album covers of your most listened songs. </h4>
        </div>
      )}
      {!accessToken && (
        <div>
          <a href={AUTH_URL} className="spotify-login-button">
          Log in with Spotify
          </a>
          <div className = "footer-section">
            <footer>Created by <a href="https://github.com/arpatell">Aaron Patel</a></footer>
            <i class="fas fa-info-circle" title="Video background from Freepik"></i>
          </div>
        </div>
      )}
      {accessToken && (
        <div className="time-range-selector">
          <label htmlFor="time-range" className="time-range-label">
            Select Time Range:
          </label>
          <select
            id="time-range"
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="time-range-select"
          >
            <option value="short_term">Last Month</option>
            <option value="medium_term">Last 6 Months</option>
            <option value="long_term">All Time</option>
          </select>
        </div>
      )}

      {accessToken && (
        <button className="generate-button" onClick={() => generateAura()}>
          Generate Aesthetic
        </button>
      )}
      {isLoading && (
        <div className="loading-wheel"></div>
      )}

      {auraColor && (
        <div className="color-list">
          <h2 className="header">Your Color Aesthetic:</h2>
          <div className="aura-contents">
              <div style={{ backgroundColor: auraColor }} className="color-box">
                <p className="color-name">{auraName}</p>
              </div>
          </div>
        </div>
      )}
      {top3Colors.length > 0 && (
        <div className="color-list">
          <h2 className="header">Top 3 Colors:</h2>
          <div className="color-list-items">
            {top3Colors.map((color, index) => (
              <div
                key={index}
                className="color-box"
                style={{ backgroundColor: color }}
              >
                <p className="color-name">{top3Names[index]}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {topSongs.length > 0 && (
          <div className="song-list">
            <h2 className="header">Top 5 Songs:</h2>
            <div className="song-list-items">
              {topSongs.slice(0, 5).map((song) => (
                <div key={song.id} className="song-box" style={{backgroundColor: getColorFromSong(song)}}>
                  <div className="song-details">
                    <a href={getSongURL(song)} target="_blank" rel="noopener noreferrer" align="left" className="song-name">{song.name} - {song.artists[0].name}</a>
                  </div>
                  <div className="spotify-img">
                    <img src="spotify-logo.png" align="right" alt="spotify logo" className="spotify-logo" width="100px" height="30px"></img>
                  </div>  
                </div>
              ))}
            </div>
            <button className="logout" onClick={() => handleLogout()}>Disconnect from Chromatify</button>
          </div>
        )}
    </div>
  );
};

export default App;