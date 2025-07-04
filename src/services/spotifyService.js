import axios from 'axios';
import { extractColor } from './colorService';

const api = axios.create({
    baseURL: 'https://api.spotify.com/v1/',
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            localStorage.removeItem('spotify_access_token');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export const fetchTopSongs = async (accessToken, timeRange) => {
    const response = await api.get('/me/top/tracks', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        params: {
            time_range: timeRange,
            limit: 7,
        },
    });
    return response.data.items;
};


export const getSongColors = async (accessToken, songs) => {
    const colors = [];
    for (const song of songs) {
        const response = await api.get(`/tracks/${song.id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const imageUrl = response.data.album.images[0].url;
        const color = await extractColor(imageUrl);
        colors.push(color);
    }
    return colors;
};