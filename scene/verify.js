/**
 * scene/verify.js
 * Playwright verification script.
 *
 * Serves demo.html via a local HTTP server, then:
 * - Takes a screenshot for each of the 6 moods
 * - Takes a screenshot during the speaking animation
 * Total: 7 screenshots saved to scene/_verify/
 *
 * Run from the repo root: node scene/verify.js
 */

// Use ESM-compatible imports (package.json has "type": "module")
import { chromium } from '@playwright/test';
import path from 'path';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Replicate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder to save screenshots into
const SCREENSHOT_DIR = path.join(__dirname, '_verify');

// The 6 moods to test
const MOODS = ['calm', 'anxious', 'angry', 'sad', 'happy', 'confused'];

/**
 * startServer(rootDir, port)
 * Spins up a simple static HTTP server using Node's built-in http module.
 * Returns a promise that resolves once the server is listening.
 */
function startServer(rootDir, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Strip query strings and decode the path
      let urlPath = req.url.split('?')[0];
      urlPath = decodeURIComponent(urlPath);

      // Default to index file
      if (urlPath === '/' || urlPath === '') urlPath = '/scene/demo.html';

      const filePath = path.join(rootDir, urlPath);

      // Resolve the MIME type based on extension
      const extMap = {
        '.html': 'text/html',
        '.js':   'application/javascript',
        '.css':  'text/css',
        '.png':  'image/png',
        '.jpg':  'image/jpeg',
        '.json': 'application/json',
      };
      const ext = path.extname(filePath).toLowerCase();
      const mime = extMap[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // Return a minimal empty response for missing files (like ai/dialogue.js)
          // so the page falls back gracefully instead of hanging
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
      });
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`Static server listening on http://127.0.0.1:${port}`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

/**
 * waitMs(ms)
 * Simple promise-based delay helper.
 */
function waitMs(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  // Make sure the screenshot output folder exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const PORT = 7331;
  const ROOT = path.join(__dirname, '..');

  // Start the local HTTP server
  const server = await startServer(ROOT, PORT);

  // Launch Chromium via Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1100, height: 700 },
    // Ignore camera permission prompts in headless mode
    permissions: [],
  });

  // Suppress console noise from the page (optional, shows warnings in CI output)
  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.warn('[PAGE ERROR]', msg.text());
  });

  const url = `http://127.0.0.1:${PORT}/scene/demo.html`;
  console.log('Opening:', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for the scene to initialize and render first frame
  // We wait for the canvas to have been painted (not blank)
  await waitMs(1500);

  // --- Screenshot each mood ---
  for (const mood of MOODS) {
    console.log(`Setting mood: ${mood}`);

    // Call the public API exposed on window
    await page.evaluate((m) => {
      if (typeof window.setMood === 'function') window.setMood(m);
    }, mood);

    // Wait for transition to complete (300ms) plus a little extra
    await waitMs(800);

    const screenshotPath = path.join(SCREENSHOT_DIR, `${mood}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  Saved: ${screenshotPath}`);
  }

  // --- Screenshot the speaking state ---
  console.log('Triggering speaking animation...');
  await page.evaluate(() => {
    if (typeof window.playSpeaking === 'function') window.playSpeaking(2000);
  });

  // Wait a bit for the animation to get into speaking pose
  await waitMs(500);

  const speakingPath = path.join(SCREENSHOT_DIR, 'speaking.png');
  await page.screenshot({ path: speakingPath, fullPage: false });
  console.log(`  Saved: ${speakingPath}`);

  // --- Done ---
  await browser.close();
  server.close();

  console.log('\nVerification complete. Screenshots saved to:', SCREENSHOT_DIR);
  console.log('Files:');
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => console.log(' ', f));
}

main().catch(err => {
  console.error('Verify script failed:', err);
  process.exit(1);
});
