const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function generateScreenshots() {
  console.log('Starting high-res 1080x1920 Play Store screenshot generation...');
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
      title: '24+ DEPARTMENTS',
      subtitle: 'Verified University Notes & Syllabi',
      accentColor: '#3B82F6',
      icon: '📚',
      content: `
        <div style="background:#1E293B; border-radius:20px; padding:26px; margin-bottom:20px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:#2563EB; color:white; font-size:22px; font-weight:bold; padding:6px 16px; border-radius:12px;">Computer Science</span>
            <span style="color:#38BDF8; font-size:20px; font-weight:600;">22 Full Modules</span>
          </div>
          <div style="color:white; font-size:28px; font-weight:bold; margin-bottom:8px;">Data Structures & OOP in C++</div>
          <div style="color:#94A3B8; font-size:20px;">Prof. Tariq • Lecture Handouts • 2,400 Students</div>
        </div>
        <div style="background:#1E293B; border-radius:20px; padding:26px; margin-bottom:20px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:#059669; color:white; font-size:22px; font-weight:bold; padding:6px 16px; border-radius:12px;">Chemistry</span>
            <span style="color:#34D399; font-size:20px; font-weight:600;">104 PDF Books</span>
          </div>
          <div style="color:white; font-size:28px; font-weight:bold; margin-bottom:8px;">Organic & Heterocyclic Chemistry</div>
          <div style="color:#94A3B8; font-size:20px;">Spectroscopy, Reaction Mechanisms & Labs</div>
        </div>
        <div style="background:#1E293B; border-radius:20px; padding:26px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="background:#7C3AED; color:white; font-size:22px; font-weight:bold; padding:6px 16px; border-radius:12px;">Physics & Botany</span>
            <span style="color:#C084FC; font-size:20px; font-weight:600;">144 Complete Sets</span>
          </div>
          <div style="color:white; font-size:28px; font-weight:bold; margin-bottom:8px;">Quantum Physics & Plant Physiology</div>
          <div style="color:#94A3B8; font-size:20px;">Exam Ready • Complete Past Papers</div>
        </div>
      `
    },
    {
      id: 'screenshot_2_community',
      title: 'COMMUNITY LIBRARY',
      subtitle: 'Upload, Share & Discover Peer Study Material',
      accentColor: '#10B981',
      icon: '📖',
      content: `
        <div style="display:flex; gap:16px; margin-bottom:24px;">
          <div style="background:#065F46; color:#A7F3D0; font-size:22px; font-weight:bold; padding:12px 24px; border-radius:14px;">Explore Materials (670+)</div>
          <div style="background:#1E293B; color:#94A3B8; font-size:22px; padding:12px 24px; border-radius:14px;">My Uploads (14)</div>
        </div>
        <div style="background:#1E293B; border-radius:20px; padding:24px; margin-bottom:20px; border:1px solid #334155; display:flex; gap:20px;">
          <div style="width:120px; height:160px; background:#047857; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:52px;">📘</div>
          <div style="flex:1;">
            <div style="color:#34D399; font-size:18px; font-weight:bold; text-transform:uppercase;">Computer Science • Undergraduate</div>
            <div style="color:white; font-size:26px; font-weight:bold; margin:6px 0;">Object Oriented Programming in C++</div>
            <div style="color:#94A3B8; font-size:20px;">Robert Lafore • Uploaded by Ali K.</div>
            <div style="margin-top:14px; display:flex; gap:12px;">
              <span style="background:#059669; color:white; padding:6px 14px; border-radius:8px; font-size:18px; font-weight:bold;">Offline Ready</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">★ 4.9 (142 reviews)</span>
            </div>
          </div>
        </div>
        <div style="background:#1E293B; border-radius:20px; padding:24px; border:1px solid #334155; display:flex; gap:20px;">
          <div style="width:120px; height:160px; background:#4338CA; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:52px;">📕</div>
          <div style="flex:1;">
            <div style="color:#818CF8; font-size:18px; font-weight:bold; text-transform:uppercase;">Economics • Statistics</div>
            <div style="color:white; font-size:26px; font-weight:bold; margin:6px 0;">Applied Econometrics & Statistics</div>
            <div style="color:#94A3B8; font-size:20px;">Dimitrios Asteriou • Approved Book</div>
            <div style="margin-top:14px; display:flex; gap:12px;">
              <span style="background:#4F46E5; color:white; padding:6px 14px; border-radius:8px; font-size:18px; font-weight:bold;">Download PDF</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">★ 4.8 (95 reviews)</span>
            </div>
          </div>
        </div>
      `
    },
    {
      id: 'screenshot_3_profile',
      title: 'STUDENT PROFILE',
      subtitle: 'Verified Campus Badges, Degree & Contributions',
      accentColor: '#8B5CF6',
      icon: '🎓',
      content: `
        <div style="background:#1E293B; border-radius:24px; overflow:hidden; border:1px solid #334155; margin-bottom:20px;">
          <div style="height:160px; background:linear-gradient(135deg, #6366F1, #A855F7); position:relative;"></div>
          <div style="padding:0 24px 24px 24px; margin-top:-60px;">
            <div style="width:120px; height:120px; border-radius:60px; background:#0F172A; border:4px solid #1E293B; display:flex; align-items:center; justify-content:center; font-size:54px;">👨‍🎓</div>
            <div style="display:flex; align-items:center; gap:10px; margin-top:12px;">
              <span style="color:white; font-size:32px; font-weight:bold;">Muhammad Khan</span>
              <span style="background:#0284C7; color:white; font-size:16px; font-weight:bold; padding:3px 10px; border-radius:8px;">VERIFIED STUDENT</span>
            </div>
            <div style="color:#A78BFA; font-size:22px; margin-top:4px;">@mkhan_cs • BS Computer Science</div>
            <div style="color:#94A3B8; font-size:20px; margin:12px 0;">University Top Contributor & Peer Study Mentor. Sharing clean exam notes & books.</div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">#DataStructures</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">#Algorithms</span>
              <span style="background:#334155; color:#E2E8F0; padding:6px 14px; border-radius:8px; font-size:18px;">#Chemistry</span>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:16px;">
          <div style="flex:1; background:#1E293B; border-radius:18px; padding:20px; text-align:center; border:1px solid #334155;">
            <div style="color:#A78BFA; font-size:36px; font-weight:bold;">24</div>
            <div style="color:#94A3B8; font-size:18px;">Notes Shared</div>
          </div>
          <div style="flex:1; background:#1E293B; border-radius:18px; padding:20px; text-align:center; border:1px solid #334155;">
            <div style="color:#34D399; font-size:36px; font-weight:bold;">2.8k</div>
            <div style="color:#94A3B8; font-size:18px;">Downloads</div>
          </div>
          <div style="flex:1; background:#1E293B; border-radius:18px; padding:20px; text-align:center; border:1px solid #334155;">
            <div style="color:#FBBF24; font-size:36px; font-weight:bold;">4.95</div>
            <div style="color:#94A3B8; font-size:18px;">Peer Rating</div>
          </div>
        </div>
      `
    },
    {
      id: 'screenshot_4_quality',
      title: 'OFFLINE PERSISTENCE',
      subtitle: 'Read Anywhere • Zero Mobile Data Consumed',
      accentColor: '#F59E0B',
      icon: '⚡',
      content: `
        <div style="background:#1E293B; border-radius:20px; padding:26px; margin-bottom:20px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="background:#059669; color:white; font-size:18px; font-weight:bold; padding:4px 12px; border-radius:8px;">SAVED TO DEVICE (MMKV)</span>
            <span style="color:#34D399; font-size:18px; font-weight:bold;">✓ 100% Offline</span>
          </div>
          <div style="color:white; font-size:26px; font-weight:bold;">Biochemistry & Molecular Biology</div>
          <div style="color:#94A3B8; font-size:20px; margin:6px 0;">BS 4th Semester • 24.5 MB • Ready without internet</div>
          <div style="background:#0F172A; border-radius:12px; padding:16px; margin:14px 0; color:#A7F3D0; font-size:18px; border:1px solid #065F46;">
            ✓ Instant 0.01s Page Turn • ✓ Auto-Resume Bookmark • ✓ Zero Battery Drain
          </div>
          <div style="display:flex; gap:14px; margin-top:16px;">
            <button style="background:#10B981; color:white; border:none; padding:12px 24px; border-radius:10px; font-size:18px; font-weight:bold; cursor:pointer;">Open in Reader</button>
            <button style="background:#334155; color:#E2E8F0; border:none; padding:12px 24px; border-radius:10px; font-size:18px; cursor:pointer;">Share with Peer</button>
          </div>
        </div>
        <div style="background:#1E293B; border-radius:20px; padding:24px; border:1px solid #334155;">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
            <span style="font-size:28px;">🎯</span>
            <span style="color:white; font-size:24px; font-weight:bold;">TikTok-Style Bite Sized Flashcards</span>
          </div>
          <div style="color:#94A3B8; font-size:20px;">Swipe through rapid exam formulas, key definitions, and quick MCQs on the go!</div>
        </div>
      `
    }
  ];

  const outDir = path.resolve(__dirname);

  for (const s of screens) {
    const page = await context.newPage();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          body {
            width: 1080px;
            height: 1920px;
            background: linear-gradient(180deg, #090D16 0%, #0F172A 100%);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
          }
          .header {
            padding: 80px 60px 40px 60px;
            text-align: center;
          }
          .tagline {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            padding: 10px 24px;
            border-radius: 30px;
            color: ${s.accentColor};
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 24px;
          }
          .main-title {
            color: #FFFFFF;
            font-size: 54px;
            font-weight: 900;
            line-height: 1.2;
            letter-spacing: -0.5px;
            margin-bottom: 14px;
          }
          .main-subtitle {
            color: #94A3B8;
            font-size: 28px;
            font-weight: 500;
            line-height: 1.4;
          }
          .phone-frame {
            margin: 20px 60px 0 60px;
            flex: 1;
            background: #0B1120;
            border: 12px solid #1E293B;
            border-bottom: none;
            border-top-left-radius: 48px;
            border-top-right-radius: 48px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            padding: 36px 32px 0 32px;
            position: relative;
          }
          .status-bar {
            display: flex;
            justify-content: space-between;
            color: #E2E8F0;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 28px;
          }
          .app-nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-box {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #2563EB, #059669);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: 900;
          }
          .brand-name {
            color: white;
            font-size: 30px;
            font-weight: 900;
            letter-spacing: -0.5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="tagline">${s.icon} ${s.title}</div>
          <div class="main-title">${s.subtitle}</div>
          <div class="main-subtitle">Empowering University Students Across All Academic Disciplines</div>
        </div>
        <div class="phone-frame">
          <div class="status-bar">
            <span>9:41</span>
            <span>📶 5G  🔋 100%</span>
          </div>
          <div class="app-nav">
            <div class="brand">
              <div class="logo-box">U</div>
              <div class="brand-name">UniHub</div>
            </div>
            <div style="background:#1E293B; border-radius:50%; width:44px; height:44px; display:flex; align-items:center; justify-content:center; color:white; font-size:20px;">🔍</div>
          </div>
          ${s.content}
        </div>
      </body>
      </html>
    `;
    await page.setContent(html);
    const filePath = path.join(outDir, `${s.id}.png`);
    await page.screenshot({ path: filePath });
    console.log(`Saved screenshot: ${filePath}`);
    await page.close();
  }

  await browser.close();
  console.log('All 4 Google Play screenshots successfully generated at 1080x1920!');
}

generateScreenshots().catch(err => {
  console.error(err);
  process.exit(1);
});
