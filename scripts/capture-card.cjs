const puppeteer = require('puppeteer');
const path = require('path');

// ── PRINT CONSTANTS ──
// Business card: 85mm x 55mm at 300 DPI
const CARD_WIDTH_PX  = Math.round(85 * 300 / 25.4);  // 1004
const CARD_HEIGHT_PX = Math.round(55 * 300 / 25.4);   // 650

async function captureCard() {
  console.log('🚀 Lancement du navigateur headless...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 4, // 4x → effective ~384 DPI
    },
  });

  const page = await browser.newPage();

  console.log('🌐 Navigation vers http://localhost:5173 ...');
  try {
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });
  } catch (e) {
    console.error("❌ Le serveur de dev Vite n'est pas lancé !");
    await browser.close();
    process.exit(1);
  }

  // Scroll to the footer where the business card lives
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 1500));

  console.log('🔍 Recherche de la carte de visite...');

  // The card has a unique class combination: border-[#1f2937] + aspect ratio
  // Use XPath or a JS evaluation to find it reliably
  const cardHandle = await page.evaluateHandle(() => {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const cl = div.className || '';
      if (
        cl.includes('border-[#1f2937]') &&
        cl.includes('aspect-[85/55]') &&
        cl.includes('rounded-')
      ) {
        return div;
      }
    }
    return null;
  });

  const cardElement = cardHandle.asElement();

  if (!cardElement) {
    console.error('❌ Carte de visite introuvable dans le DOM !');
    await browser.close();
    process.exit(1);
  }

  // Neutralize hover transforms and ensure full visibility
  await page.evaluate((el) => {
    el.scrollIntoView({ block: 'center' });
    el.style.transform = 'none';
    el.style.transition = 'none';
  }, cardElement);

  // Wait for QR code image and web fonts to fully render
  await new Promise((r) => setTimeout(r, 3000));

  const outputPath = path.join(process.cwd(), 'koktek-carte-visite-final-v2.jpg');
  console.log(`📸 Capture en cours → ${outputPath}`);

  await cardElement.screenshot({
    path: outputPath,
    type: 'jpeg',
    quality: 100,
    omitBackground: false,
  });

  console.log(`✅ Export terminé ! (${CARD_WIDTH_PX}x${CARD_HEIGHT_PX} px @ 300 DPI equiv.)`);
  console.log(`📂 Fichier : ${outputPath}`);

  await browser.close();
}

captureCard().catch((err) => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
