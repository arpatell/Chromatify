export const CLIENT_ID = 'f5bbf7f8ab8b4462af66203517fdc02b';

const PROD_REDIRECT_URI = 'https://chromatify.vercel.app/callback';
const getLocalRedirectUri = () => {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:3000/callback';
  }

  const port = window.location.port ? `:${window.location.port}` : '';
  return `http://127.0.0.1${port}/callback`;
};

const isLoopbackHost = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]');

// Spotify deprecated localhost aliases; loopback IP literals (127.0.0.1 / ::1) remain allowed over HTTP.
export const REDIRECT_URI =
  process.env.REACT_APP_SPOTIFY_REDIRECT_URI || (isLoopbackHost() ? getLocalRedirectUri() : PROD_REDIRECT_URI);
export const SCOPES = ['user-top-read']; //export const SCOPES = ['user-top-read', 'user-read-recently-played'];

const getRandomVerifier = (length = 64) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomArray = new Uint32Array(length);
  window.crypto.getRandomValues(randomArray);
  return Array.from(randomArray, (value) => chars[value % chars.length]).join('');
};

const toBase64Url = (byteArray) =>
  btoa(String.fromCharCode(...new Uint8Array(byteArray)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const createPkceChallenge = async (verifier) => {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return toBase64Url(digest);
};

const buildAuthUrl = (extraParams = {}) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(' '),
    show_dialog: 'true',
    ...extraParams,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getSpotifyAuthUrl = async () => {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return buildAuthUrl();
  }

  const verifier = getRandomVerifier();
  const challenge = await createPkceChallenge(verifier);
  localStorage.setItem('spotify_pkce_verifier', verifier);

  return buildAuthUrl({
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
};
