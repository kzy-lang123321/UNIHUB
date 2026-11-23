const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function renderLogoAndGraphic() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const outDir = path.resolve("D:/unihub/playstore-assets");
  const svgPath = path.join(outDir, "unihub-official-logo.svg");
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // 1. Render 512x512 App Icon
  const page512 = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  await page512.setContent(`
    <!DOCTYPE html>
    <html>
    <head><style>* { margin: 0; padding: 0; } body { width: 512px; height: 512px; overflow: hidden; background: transparent; }</style></head>
    <body>${svgContent}</body>
    </html>
  `);
  const iconOut = path.join(outDir, "unihub-icon-512x512.png");
  await page512.screenshot({ path: iconOut, omitBackground: false });
  console.log(`Saved 512x512 icon: ${iconOut}`);
  await page512.close();

  // 2. Render 1024x500 Feature Graphic
  const pageFeature = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  await pageFeature.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body {
          width: 1024px;
          height: 500px;
          background: linear-gradient(135deg, #090D16 0%, #0F172A 50%, #041E15 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 60px 80px;
          position: relative;
          overflow: hidden;
        }
        .glow {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(5,150,105,0.2) 60%, transparent 100%);
          filter: blur(50px);
          top: 50px;
          right: 100px;
        }
        .left {
          z-index: 2;
          max-width: 580px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(37, 99, 235, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38BDF8;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 8px 18px;
          border-radius: 20px;
          margin-bottom: 20px;
        }
        h1 {
          color: #FFFFFF;
          font-size: 56px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }
        h1 span {
          background: linear-gradient(135deg, #38BDF8, #34D399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          color: #94A3B8;
          font-size: 22px;
          line-height: 1.4;
          margin-bottom: 24px;
        }
        .stats {
          display: flex;
          gap: 24px;
        }
        .stat-item {
          color: #FFFFFF;
          font-size: 18px;
          font-weight: bold;
        }
        .stat-item span {
          color: #34D399;
          font-size: 24px;
          display: block;
        }
        .right {
          z-index: 2;
          width: 260px;
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="glow"></div>
      <div class="left">
        <div class="badge">🎓 University Super-App</div>
        <h1>UniHub: <span>Knowledge & Notes</span></h1>
        <p>24+ Academic Departments • Verified Lecture Notes • Community Library • Offline Learning</p>
        <div class="stats">
          <div class="stat-item"><span>670+</span>Verified Books</div>
          <div class="stat-item"><span>24</span>Departments</div>
          <div class="stat-item"><span>100%</span>Offline Support</div>
        </div>
      </div>
      <div class="right">
        <div style="width:240px; height:240px; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.6));">
          ${svgContent}
        </div>
      </div>
    </body>
    </html>
  `);
  const featureOut = path.join(outDir, "unihub-feature-graphic-1024x500.png");
  await pageFeature.screenshot({ path: featureOut });
  console.log(`Saved 1024x500 feature graphic: ${featureOut}`);
  await pageFeature.close();

  await browser.close();
}

renderLogoAndGraphic().catch(console.error);
