import { useState, useEffect } from 'react';
import axios from 'axios';
import { CLIENT_ID, REDIRECT_URI } from '../config/spotify';

export const useSpotifyAuth = () => {
    const [accessToken, setAccessToken] = useState(() => {
        const token = localStorage.getItem('spotify_access_token');
        const expiry = localStorage.getItem('token_expiry');
        if (!token || !expiry || Date.now() > parseInt(expiry)) {
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('token_expiry');
            return null;
        }
        return token;
    });

    useEffect(() => {
        const code = new URLSearchParams(window.location.search).get('code');
        const clientSecret = process.env.REACT_APP_CLIENT_SECRET;
        const codeVerifier = localStorage.getItem('spotify_pkce_verifier');

        if (code) {
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                client_id: CLIENT_ID,
            });

            if (codeVerifier) {
                body.append('code_verifier', codeVerifier);
            } else if (clientSecret) {
                body.append('client_secret', clientSecret);
            }

            axios.post('https://accounts.spotify.com/api/token', body, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }).then(response => {
                const token = response.data.access_token;
                const expiresInMs = (response.data.expires_in || 3600) * 1000;
                localStorage.setItem('token_expiry', String(Date.now() + expiresInMs));
                localStorage.setItem('spotify_access_token', token);
                localStorage.removeItem('spotify_pkce_verifier');
                setAccessToken(token);
                window.history.pushState({}, null, '/');
            }).catch(() => {
                localStorage.removeItem('spotify_pkce_verifier');
                window.location = '/';
            });
        }
    }, []);

    return accessToken;
};
