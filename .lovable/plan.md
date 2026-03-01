

# Fix: PWA Not Updating on Devices

## Problem
The PWA configuration has two conflicting issues causing devices to stay on old versions:

1. **Conflicting registration mode**: `vite.config.ts` uses `registerType: "autoUpdate"` (auto-activate new SW), but `main.tsx` uses a manual `registerSW` pattern with `confirm()` dialog. These conflict -- if the user dismisses the dialog or never sees it, the old SW stays active indefinitely.

2. **No periodic update check**: The Service Worker only checks for updates on page load. If a user keeps the app open (common on mobile PWAs), they never get the new version until they fully close and reopen the app.

3. **Missing `skipWaiting` / `clientsClaim`**: Without these, the new Service Worker waits until ALL tabs are closed before activating, which on mobile PWAs can mean days.

## Solution

### 1. Fix vite.config.ts -- align registration mode and add aggressive update settings
- Change `registerType` to `"prompt"` to match the manual `confirm()` pattern in `main.tsx`
- Add `skipWaiting: true` and `clientsClaim: true` to workbox config so new SW takes control immediately once accepted
- Add `navigateFallbackDenylist: [/^\/~oauth/]` (required by Lovable)

### 2. Fix main.tsx -- add periodic update checks
- Add an interval that checks for SW updates every 60 seconds
- This ensures that even if the app stays open, it will detect and prompt for updates quickly
- Replace the native `confirm()` with a more reliable approach that auto-reloads after a short delay if the user doesn't respond

### Changes

**File: `vite.config.ts`**
- Change `registerType: "autoUpdate"` to `registerType: "prompt"`
- Add `skipWaiting: true` and `clientsClaim: true` to workbox section
- Add `navigateFallbackDenylist: [/^\/~oauth/]`

**File: `src/main.tsx`**
- Add periodic update check (every 60 seconds) after SW registration
- Improve the `onNeedRefresh` handler to auto-update after a brief timeout if the user doesn't respond, ensuring the update always goes through

These changes ensure that:
- New versions are detected within 60 seconds even if the app stays open
- The new Service Worker activates immediately (skipWaiting + clientsClaim)
- Users get a prompt but the update proceeds automatically if they don't respond
