# Google Play Console Upload & Verification Step-by-Step Guide for UniHub

This guide details everything you need to upload and publish **UniHub** to the **Google Play Console**.

---

## 📁 Generated Files & Assets Directory (`D:\unihub\playstore-assets\`)

1. **AAB (App Bundle for Google Play):**
   * Output Location: `D:\unihub\android\app\build\outputs\bundle\release\app-release.aab`
   * Copy in artifacts: `D:\unihub\artifacts\UniHub-v2-release.aab`
2. **Direct Shareable APK (For WhatsApp / Direct Install):**
   * Output Location: `D:\unihub\android\app\build\outputs\apk\release\app-release.apk`
   * Copy in artifacts: `D:\unihub\artifacts\UniHub-v2-Standalone-Release.apk`
3. **Official Release Keystore (Crucial - Keep Backed Up!):**
   * Location: `D:\unihub\android\app\unihub-release-key.keystore`
   * Key Alias: `unihub-key-alias`
   * Password: `unihubrelease2026`
   * *⚠️ WARNING: Google Play requires all future updates to be signed with this exact keystore. Do not delete it!*
4. **Legal & Policy Files:**
   * Privacy Policy: `D:\unihub\playstore-assets\legal\PRIVACY_POLICY.md` & `privacy-policy.html`
   * Terms of Service: `D:\unihub\playstore-assets\legal\TERMS_OF_SERVICE.md`
   * Data Safety Answers: `D:\unihub\playstore-assets\legal\DATA_SAFETY_DECLARATION.md`
5. **High-Resolution Screenshots (1080x1920):**
   * `D:\unihub\playstore-assets\screenshots\screenshot_1_home.png`
   * `D:\unihub\playstore-assets\screenshots\screenshot_2_community.png`
   * `D:\unihub\playstore-assets\screenshots\screenshot_3_profile.png`
   * `D:\unihub\playstore-assets\screenshots\screenshot_4_quality.png`

---

## 🚀 Step-by-Step Play Console Submission Steps

### Step 1: Log in & Create App
1. Go to [Google Play Console](https://play.google.com/console).
2. Click **Create app** (top-right).
3. **App name:** `UniHub: Notes & Book Library`
4. **Default language:** English (United States)
5. **App or game:** App
6. **Free or paid:** Free
7. Accept the Declarations and click **Create app**.

---

### Step 2: Complete "App content" Section (Mandatory Legal Requirements)
Navigate to **Policy and programs > App content** on the left menu:

1. **Privacy Policy:**
   * Enter your hosted Privacy Policy URL (e.g. from GitHub Pages using `playstore-assets/legal/privacy-policy.html`).
2. **App Access:**
   * Select: *"All functionality is available without special access"* (or provide test credentials: `teststudent@unihub.com` / `UniHub@2026`).
3. **Ads:**
   * Select: *"No, my app does not contain ads"*.
4. **Content Ratings:**
   * Start questionnaire -> Category: **Utility / Education**
   * Answer **NO** to violence, profanity, adult content, illegal acts.
   * Rating will be assigned as **Everyone (PEGI 3 / USK 0)**.
5. **Target Audience and Content:**
   * Select: **18 and over**.
   * Appeals to children: Select **No**.
6. **Data Safety Questionnaire:**
   * Open `D:\unihub\playstore-assets\legal\DATA_SAFETY_DECLARATION.md` and check the exact boxes listed.
   * Encrypted in transit: **Yes**
   * Deletion request mechanism: **Yes**
7. **Government Apps / Financial Features:**
   * Answer **No** to both.

---

### Step 3: Main Store Listing
Navigate to **Grow > Store presence > Main store listing**:
1. Copy-paste details from `D:\unihub\playstore-assets\STORE_LISTING.md`:
   * **Short description:** `Your all-in-one university companion for lecture notes, books & student profiles.`
   * **Full description:** *(Paste full markdown from STORE_LISTING.md)*
2. **App Icon:** Upload a 512x512 PNG icon.
3. **Feature Graphic:** Upload a 1024x500 PNG banner.
4. **Phone Screenshots:** Upload the 4 generated PNGs from `D:\unihub\playstore-assets\screenshots\`.

---

### Step 4: Upload the AAB (`app-release.aab`)
1. Go to **Release > Production** (or **Closed testing** for internal test).
2. Click **Create new release**.
3. Under **App bundles**, upload:
   `D:\unihub\artifacts\UniHub-v2-release.aab`
4. **Release name:** `1.0.0 (UniHub v2 - Profiles & Community Library)`
5. **Release notes:**
   ```
   Initial release of UniHub featuring:
   - Department lecture notes and offline study material
   - Community Book Library with peer PDF uploads and verified review queue
   - Customizable student profiles with bio, interests, and badges
   - Biometric authentication and offline caching
   ```
6. Click **Next** -> Review warnings -> Click **Save** and **Start rollout to Production**!
