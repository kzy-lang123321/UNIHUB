# UniHub Official Logo, Icon & Branding Specification Guide

This document contains all design guidelines, dimensional specifications, color palettes, vector files, and AI design prompts for creating and customizing the **UniHub** brand assets.

---

## 1. Google Play Console Required Assets

| Asset Name | Dimensions | Format | Max File Size | Where to Upload in Play Console |
| :--- | :--- | :--- | :--- | :--- |
| **App Icon** | **512 x 512 px** | 32-bit PNG (with alpha) | 1,024 KB | *Store presence > Main store listing > App icon* |
| **Feature Graphic** | **1024 x 500 px** | JPEG or 24-bit PNG (no alpha) | 1,024 KB | *Store presence > Main store listing > Feature graphic* |
| **Phone Screenshots** | **1080 x 1920 px** | 24/32-bit PNG / JPEG (16:9 ratio) | 8 MB each | *Store presence > Main store listing > Phone screenshots* |

---

## 2. Brand Color Palette

| Color Role | Hex Code | RGB | Meaning & Psychological Association |
| :--- | :--- | :--- | :--- |
| **Academic Emerald** | `#059669` | `rgb(5, 150, 105)` | Growth, Education, verified status, success |
| **Tech Electric Blue** | `#2563EB` | `rgb(37, 99, 235)` | Intelligence, university network, digital connectivity |
| **Sky Cyan Accent** | `#38BDF8` | `rgb(56, 189, 248)` | Modern speed, cloud storage, fresh UI accents |
| **Excellence Gold** | `#F59E0B` | `rgb(245, 158, 11)` | Top ratings, verified student badges, honors |
| **Deep Obsidian Slate** | `#0F172A` | `rgb(15, 23, 42)` | Premium dark theme, readability, high contrast |
| **Card Surface** | `#1E293B` | `rgb(30, 41, 59)` | Elevation background for study cards & modules |

---

## 3. Logo Anatomy & Concept

The official **UniHub** emblem combines three powerful concepts into one unified geometric mark:
1. **The Letter "U"**: Represents **University**, **Unity**, and the **User**.
2. **Open Book Horizon**: The base curves represent an open academic textbook of shared knowledge.
3. **The Star of Excellence**: A modern 8-pointed golden star in the center representing student success, high marks, and enlightenment.
4. **Hub Nodes / Digital Flow**: Gradient wings curving upwards symbolize peer-to-peer data sharing and campus communities.

---

## 4. Generated Ready-to-Use Brand Files

All assets have been generated in your workspace:
- 🎨 **Scalable Vector Logo (SVG)**: `D:\unihub\playstore-assets\unihub-official-logo.svg`
- 📱 **Google Play 512x512 App Icon**: `D:\unihub\playstore-assets\unihub-icon-512x512.png`
- 🖼️ **Google Play 1024x500 Feature Graphic**: `D:\unihub\playstore-assets\unihub-feature-graphic-1024x500.png`

---

## 5. AI Prompt Templates (To Generate Custom Variations)

If you want to create additional variations using Midjourney, DALL-E 3, ChatGPT, or Canva, copy and paste these exact prompts:

### Prompt 1: Modern App Icon (Midjourney / DALL-E)
```text
A modern minimalist mobile app icon for "UniHub", an academic university super-app. A clean geometric letter "U" seamlessly fused with the silhouette of an open book and glowing digital connection nodes. High-tech dual gradient in electric sapphire blue (#2563EB) and emerald green (#059669) with subtle gold accent lighting. Set on a premium deep dark navy squircle background (#0F172A). Sleek, vector style, 3D smooth ambient occlusion, ultra clean, no realistic photos, Dribbble trending, Figma vector asset style, 8k resolution, centered, square aspect ratio 1:1.
```

### Prompt 2: 3D Glossy App Icon (Canva / Midjourney)
```text
3D isometric app icon of a university knowledge hub. A glowing stylized glassmorphism open book and graduation cap inside a bold letter U. Glossy reflections, emerald green and cyan blue neon rim lights, premium dark obsidian backdrop, soft floating shadows, app store icon standard, octane render, 512x512 centered.
```

### Prompt 3: Feature Graphic (1024x500 Banner)
```text
A panoramic 1024x500 Google Play Store promotional feature graphic banner for a university education app named UniHub. Modern dark slate background with abstract digital wave patterns and glowing blue and green light streaks. On the right, a floating 3D glowing university emblem with academic symbols. On the left, clean bold typography reading "UniHub: Notes & Books". Ultra high quality, professional SaaS product presentation.
```

---

## 6. Android Adaptive Icon Dimensions (For App Launcher)

When exporting for the Android build:
- **Foreground Asset (`ic_launcher_foreground.png`)**: 
  - Size: 108 x 108 dp (Export at 432 x 432 px for xxxhdpi).
  - Safe Area: Keep the logo within the central circle of 66 dp diameter (264 px) so it never gets clipped by Samsung, Google Pixel, or Xiaomi square/circle icon masks.
- **Background Asset (`ic_launcher_background.xml` or PNG)**:
  - Solid color: `#0F172A` or subtle gradient.
