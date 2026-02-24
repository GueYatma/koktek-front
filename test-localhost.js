import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

(async () => {
  const p = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), shell: true });
  await new Promise(r => setTimeout(r, 6000));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  try {
    await page.goto('http://localhost:5173/catalogue', { waitUntil: 'networkidle2' });
    const content = await page.content();
    console.log("HTML length:", content.length);
  } catch (e) {
    console.error("Puppeteer goto failed", e);
  }
  
  await browser.close();
  p.kill();
  process.exit(0);
})();
