const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const indexPath = path.join(publicDir, 'index.html');
const robotsPath = path.join(publicDir, 'robots.txt');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

const toSiteUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
};

const pickSiteUrl = () => {
  const candidates = [
    process.env.REACT_APP_SITE_URL,
    process.env.SITE_URL,
    process.env.REACT_APP_VERCEL_PROJECT_PRODUCTION_URL,
    process.env.REACT_APP_VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const normalized = toSiteUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return 'https://chromatify.vercel.app';
};

const siteUrl = pickSiteUrl();
const canonicalUrl = `${siteUrl}/`;
const today = new Date().toISOString().split('T')[0];

const updateIndexHtml = () => {
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);

  if (/<meta property="og:url" content="[^"]*" \/>/.test(html)) {
    html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  } else {
    html = html.replace(
      '<meta property="og:type" content="website" />',
      `<meta property="og:type" content="website" />\n  <meta property="og:url" content="${canonicalUrl}" />`
    );
  }

  fs.writeFileSync(indexPath, html, 'utf8');
};

const writeRobotsTxt = () => {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
  fs.writeFileSync(robotsPath, robots, 'utf8');
};

const writeSitemapXml = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${canonicalUrl}</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n</urlset>\n`;
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
};

updateIndexHtml();
writeRobotsTxt();
writeSitemapXml();

console.log(`[seo] Prepared canonical/og:url, robots.txt, and sitemap.xml for ${siteUrl}`);
