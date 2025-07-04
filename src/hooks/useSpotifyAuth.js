import { useState, useEffect } from 'react';
import axios from 'axios';

const CLIENT_ID = 'f5bbf7f8ab8b4462af66203517fdc02b';
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
const REDIRECT_URI = 'https://chromatify.vercel.app/callback';

export const useSpotifyAuth = () => {
    const [accessToken, setAccessToken] = useState(localStorage.getItem('spotify_access_token'));

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code');

        if (code) {
            axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }).then(response => {
                const token = response.data.access_token;
                localStorage.setItem('spotify_access_token', token);
                setAccessToken(token);
                window.history.pushState({}, null, '/');
            }).catch(() => {
                window.location = '/';
            });
        }
    }, []);

    return accessToken;
};