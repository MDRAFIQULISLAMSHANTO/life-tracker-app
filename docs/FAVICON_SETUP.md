# Favicon Setup Guide

## Overview

This document explains how to generate and add favicons for the Livio application.

## Source Icon

The source icon is located at:
```
/public/logo/livio-icon.svg
```

This SVG file is used as the source for all favicon generations.

## Generating Favicons

1. Visit [RealFaviconGenerator.net](https://realfavicongenerator.net/)

2. Upload the source icon: `/public/logo/livio-icon.svg`

3. Configure settings:
   - **iOS**: Use default settings
   - **Android Chrome**: Use default settings
   - **Windows Metro**: Use default settings
   - **Favicon for Desktop**: Use default settings

4. Generate the favicon package

5. Download the generated files

## File Structure

Place all generated files in:
```
/public/favicon/
```

Required files:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `site.webmanifest`

## Integration

The favicon metadata is already configured in:
```
/src/app/layout.jsx
```

No code changes needed after adding the files.

## Verification

After adding the files:

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. Check browser tab for favicon
4. Test on multiple devices/browsers

## Notes

- Favicons are cached aggressively by browsers
- Use incognito/private mode for testing
- Allow 24-48 hours for changes to propagate
- The source SVG should remain unchanged (single source of truth)

