import axios from 'axios';
import { extractColor } from './colorService';

const api = axios.create({
    baseURL: 'https://api.spotify.com/v1/',
});

const TIME_RANGE_WINDOW_DAYS = {
    short_term: 30,
    medium_term: 180,
    long_term: 3650,
};

const RECENTLY_PLAYED_PAGE_SIZE = 50;
const MAX_RECENTLY_PLAYED_PAGES = 20;

api.interceptors.response.use(
    response => response,
    error => {
        if (error?.response?.status === 401) {
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('token_expiry');
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
            limit: 12,
        },
    });
    return response.data.items;
};

const getRangeCutoffTimestamp = (timeRange) => {
    const days = TIME_RANGE_WINDOW_DAYS[timeRange] || TIME_RANGE_WINDOW_DAYS.short_term;
    return Date.now() - days * 24 * 60 * 60 * 1000;
};

export const getSongListenCounts = async (accessToken, songs, timeRange) => {
    const trackIds = songs.map((song) => song.id).filter(Boolean);
    const listenCounts = Object.fromEntries(trackIds.map((id) => [id, 0]));
    const cutoffTimestamp = getRangeCutoffTimestamp(timeRange);

    if (!trackIds.length) {
        return listenCounts;
    }

    let beforeCursor = Date.now();
    let page = 0;
    let shouldContinue = true;

    while (shouldContinue && page < MAX_RECENTLY_PLAYED_PAGES) {
        const response = await api.get('/me/player/recently-played', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                limit: RECENTLY_PLAYED_PAGE_SIZE,
                before: beforeCursor,
            },
        });

        const items = response?.data?.items || [];
        if (!items.length) {
            break;
        }

        let oldestInPage = Number.MAX_SAFE_INTEGER;

        items.forEach((item) => {
            const playedTrackId = item?.track?.id;
            const playedAt = item?.played_at ? Date.parse(item.played_at) : NaN;

            if (!Number.isNaN(playedAt) && playedAt < oldestInPage) {
                oldestInPage = playedAt;
            }

            if (Number.isNaN(playedAt) || playedAt < cutoffTimestamp) {
                return;
            }

            if (playedTrackId && Object.prototype.hasOwnProperty.call(listenCounts, playedTrackId)) {
                listenCounts[playedTrackId] += 1;
            }
        });

        if (oldestInPage <= cutoffTimestamp) {
            shouldContinue = false;
        }

        if (!Number.isFinite(oldestInPage) || oldestInPage <= 0) {
            break;
        }

        beforeCursor = oldestInPage;
        page += 1;
    }

    return listenCounts;
};


export const getSongColors = async (_accessToken, songs) => {
    const colorPromises = songs.map(async (song) => {
        const imageUrl = song?.album?.images?.[0]?.url;
        if (!imageUrl) {
            return [116, 96, 255];
        }
        return extractColor(imageUrl);
    });

    return Promise.all(colorPromises);
};
