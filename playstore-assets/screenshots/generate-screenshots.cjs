const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });

  const screens = [
    {
      id: 'screenshot_1_home',
      title: 'DISCOVER & LEARN',
      subtitle: 'Organized Lecture Notes by Department & Semester',
      accentColor: '#3B82F6',
      icon: '📚',
      content: `
        <div style="background:#1E293B; border-radius:18px; padding:24px; margin-bottom:20px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:#2563EB; color:white; font-size:22px; font-weight:bold; padding:6px 16px; border-radius:12px;">Computer Science</span>
            <span style="color:#94A3B8; font-size:20px;">Semester 5</span>
          </div>
          <div style="color:white; font-size:28px; font-weight:bold; margin-bottom:8px;">Data Structures & Algorithms</div>
          <div style="color:#94A3B8; font-size:20px;">Prof. Tariq • 45 Lecture Files • 2,400 Students</div>
        </div>
        <div style="background:#1E293B; border-radius:18px; padding:24px; margin-bottom:20px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:#059669; color:white; font-size:22px; font-weight:bold; padding:6px 16px; border-radius:12px;">Software Eng</span>
            <span style="color:#94A3B8; font-size:20px;">Semester 6</span>
          </div>
          <div style="color:white; font-size:28px; font-weight:bold; margin-bottom:8px;">Mobile Application Architecture</div>
          <div style="color:#94A3B8; font-size:20px;">React Native & Firebase • 28 PDF Notes</div>
        </div>
        <div style="background:#1E293B; border-radius:18px; padding:24px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:#7C3AED; color:white; font-size:22px; font-weight:bold; padding:6px 16px; border-radius:12px;">Electrical Eng</span>
            <span style="color:#94A3B8; font-size:20px;">Semester 4</span>
          </div>
          <div style="color:white; font-size:28px; font-weight:bold; margin-bottom:8px;">Signals & Linear Systems</div>
          <div style="color:#94A3B8; font-size:20px;">Full Course Handouts • Download Offline</div>
        </div>
      `
    },
    {
      id: 'screenshot_2_community',
      title: 'COMMUNITY LIBRARY',
      subtitle: 'Upload, Share & Discover Peer Books & PDFs',
      accentColor: '#10B981',
      icon: '📖',
      content: `
        <div style="display:flex; gap:16px; margin-bottom:24px;">
          <div style="background:#065F46; color:#A7F3D0; font-size:22px; font-weight:bold; padding:12px 24px; border-radius:14px;">Explore Books (142)</div>
          <div style="background:#1E293B; color:#94A3B8; font-size:22px; padding:12px 24px; border-radius:14px;">My Uploads (12)</div>
        </div>
        <div style="background:#1E293B; border-radius:18px; padding:24px; margin-bottom:20px; border:1px solid #334155; display:flex; gap:20px;">
          <div style="width:120px; height:160px; background:#047857; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:50px;">📘</div>
          <div style="flex:1;">
            <div style="color:#34D399; font-size:18px; font-weight:bold; text-transform:uppercase;">Computer Science • Undergraduate</div>
            <div style="color:white; font-size:26px; font-weight:bold; margin:6px 0;">Clean Code: A Handbook</div>
            <div style="color:#94A3B8; font-size:20px;">Robert C. Martin • Uploaded by Ali K.</div>
            <div style="margin-top:14px; display:flex; gap:12px;">
              <span style="background:#059669; color:white; padding:6px 14px; border-radius:8px; font-size:18px; font-weight:bold;">Read PDF</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">★ 4.9 (84 reviews)</span>
            </div>
          </div>
        </div>
        <div style="background:#1E293B; border-radius:18px; padding:24px; border:1px solid #334155; display:flex; gap:20px;">
          <div style="width:120px; height:160px; background:#4338CA; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:50px;">📕</div>
          <div style="flex:1;">
            <div style="color:#818CF8; font-size:18px; font-weight:bold; text-transform:uppercase;">Mathematics • Calculus</div>
            <div style="color:white; font-size:26px; font-weight:bold; margin:6px 0;">Calculus: Early Transcendentals</div>
            <div style="color:#94A3B8; font-size:20px;">James Stewart • Approved Material</div>
            <div style="margin-top:14px; display:flex; gap:12px;">
              <span style="background:#4F46E5; color:white; padding:6px 14px; border-radius:8px; font-size:18px; font-weight:bold;">Read PDF</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">★ 4.8 (120 reviews)</span>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'screenshot_3_profile',
      title: 'STUDENT PROFILE',
      subtitle: 'Showcase Your Identity, Interests & Contributions',
      accentColor: '#8B5CF6',
      icon: '🎓',
      content: `
        <div style="background:#1E293B; border-radius:24px; overflow:hidden; border:1px solid #334155; margin-bottom:20px;">
          <div style="height:160px; background:linear-gradient(135deg, #6366F1, #A855F7); position:relative;"></div>
          <div style="padding:0 24px 24px 24px; margin-top:-60px;">
            <div style="width:120px; height:120px; border-radius:60px; background:#0F172A; border:4px solid #1E293B; display:flex; align-items:center; justify-content:center; font-size:54px;">👨‍🎓</div>
            <div style="color:white; font-size:32px; font-weight:bold; margin-top:12px;">Muhammad Khan</div>
            <div style="color:#A78BFA; font-size:22px;">@mkhan_cs • BS Computer Science</div>
            <div style="color:#94A3B8; font-size:20px; margin:12px 0;">Passionate software engineering student & peer note contributor. Exploring React Native & AI.</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">#DataStructures</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">#Algorithms</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">#MobileDev</span>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; background:#1E293B; border-radius:18px; padding:20px; text-align:center; border:1px solid #334155;">
            <div style="color:#A78BFA; font-size:36px; font-weight:bold;">18</div>
            <div style="color:#94A3B8; font-size:18px;">Books Uploaded</div>
          </div>
          <div style="flex:1; background:#1E293B; border-radius:18px; padding:20px; text-align:center; border:1px solid #334155;">
            <div style="color:#34D399; font-size:36px; font-weight:bold;">1.4k</div>
            <div style="color:#94A3B8; font-size:18px;">Downloads</div>
          </div>
          <div style="flex:1; background:#1E293B; border-radius:18px; padding:20px; text-align:center; border:1px solid #334155;">
            <div style="color:#FBBF24; font-size:36px; font-weight:bold;">4.9</div>
            <div style="color:#94A3B8; font-size:18px;">Rating</div>
          </div>
        </div>
      `
    },
    {
      id: 'screenshot_4_quality',
      title: 'CONTENT MODERATION',
      subtitle: 'Strict Copyright & Quality Verification Queue',
      accentColor: '#F59E0B',
      icon: '🛡️',
      content: `
        <div style="background:#1E293B; border-radius:18px; padding:24px; margin-bottom:20px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="background:#D97706; color:white; font-size:18px; font-weight:bold; padding:4px 12px; border-radius:8px;">PENDING REVIEW</span>
            <span style="color:#94A3B8; font-size:18px;">Uploaded 12m ago</span>
          </div>
          <div style="color:white; font-size:26px; font-weight:bold;">Digital Logic & Computer Design</div>
          <div style="color:#94A3B8; font-size:20px; margin:6px 0;">M. Morris Mano • Submitted by Hassan R.</div>
          <div style="background:#0F172A; border-radius:10px; padding:14px; margin:14px 0; color:#FCD34D; font-size:18px;">
            ✓ Safe Educational Content • ✓ Scanned for Malicious Code • ✓ Non-Commercial Material
          </div>
          <div style="display:flex; gap:14px; margin-top:16px;">
            <span style="flex:1; background:#059669; color:white; padding:12px; text-align:center; border-radius:10px; font-size:20px; font-weight:bold;">Approve & Publish</span>
            <span style="flex:1; background:#DC2626; color:white; padding:12px; text-align:center; border-radius:10px; font-size:20px; font-weight:bold;">Reject</span>
          </div>
        </div>
        <div style="background:#1E293B; border-radius:18px; padding:24px; border:1px solid #334155;">
          <div style="color:white; font-size:24px; font-weight:bold; margin-bottom:8px;">100% Student-Centric Safety</div>
          <div style="color:#94A3B8; font-size:20px; line-height:1.5;">Every community uploaded book is strictly reviewed to protect author rights and ensure legitimate educational materials for all students.</div>
        </div>
      `
    }
  ];

  for (const s of screens) {
    const page = await context.newPage();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 1080px;
            height: 1920px;
            background: linear-gradient(180deg, #090D16 0%, #0F172A 100%);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #F8FAFC;
            padding: 80px 60px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .header {
            text-align: center;
            margin-bottom: 50px;
          }
          .icon-badge {
            display: inline-block;
            font-size: 54px;
            margin-bottom: 16px;
          }
          .app-title {
            font-size: 52px;
            font-weight: 900;
            letter-spacing: -1px;
            color: #FFFFFF;
            margin-bottom: 12px;
            text-transform: uppercase;
          }
          .app-subtitle {
            font-size: 26px;
            color: #94A3B8;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.4;
          }
          .phone-frame {
            flex: 1;
            background: #020617;
            border-radius: 44px;
            border: 10px solid #1E293B;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            padding: 36px 28px;
            display: flex;
            flex-direction: column;
          }
          .status-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #94A3B8;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
            padding: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="icon-badge">${s.icon}</div>
          <div class="app-title" style="color:${s.accentColor};">${s.title}</div>
          <div class="app-subtitle">${s.subtitle}</div>
        </div>
        <div class="phone-frame">
          <div class="status-bar">
            <span>9:41 AM</span>
            <span>UniHub Mobile</span>
            <span>LTE 100%</span>
          </div>
          ${s.content}
        </div>
      </body>
      </html>
    `;
    await page.setContent(html);
    const outputPath = path.join(__dirname, `${s.id}.png`);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`Saved screenshot: ${outputPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots generated successfully!');
}

generateScreenshots().catch(console.error);
