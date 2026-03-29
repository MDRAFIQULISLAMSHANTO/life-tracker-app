# Livio Brand Guidelines

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production

---

## 🎨 1️⃣ COLOR SYSTEM (LOCKED)

Use **ONLY** these colors. No exceptions.

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#4F46E5` | Buttons, links, accents |
| Background | `#F9FAFB` | Page backgrounds |
| Card BG | `#FFFFFF` | Card surfaces |
| Text Primary | `#111827` | Headings, important text |
| Text Secondary | `#6B7280` | Body text, labels |

### Status Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#16A34A` | Success states, positive indicators |
| Warning | `#F59E0B` | Warnings, caution states |
| Danger | `#DC2626` | Errors, destructive actions |

### Rules

- ❌ No extra colors
- ❌ No random gradients
- ❌ No visual noise
- ✅ Use color system exclusively

---

## 🔠 2️⃣ TYPOGRAPHY

### Font Family

**Inter** (system fallback: `system-ui, -apple-system, sans-serif`)

### Font Weights

| Weight | Usage | Example |
|--------|-------|---------|
| 400 | Body text | Paragraphs, descriptions |
| 500 | Labels | Form labels, small text |
| 600 | Headings | Section titles, card titles |
| 700 | Hero only | Main hero headline |

### Rules

- ❌ No font mixing
- ❌ No decorative fonts
- ✅ Inter only

---

## 🔷 3️⃣ LOGO USAGE

### Allowed

- ✅ SVG format only
- ✅ Icon + text (navbar, footer)
- ✅ Icon only (mobile, favicon, app icons)

### Not Allowed

- ❌ Background boxes
- ❌ Shadows on logo
- ❌ Stretching or distortion
- ❌ Rotation
- ❌ Color changes to icon squares
- ❌ Raster formats (PNG, JPG) for UI usage

### Logo File Structure

- `/public/logo/livio-icon.svg` - Icon only (favicon source)
- `/public/logo/livio-logo.svg` - Icon + text (navbar, footer)

---

## 📐 4️⃣ LOGO CLEAR SPACE

**Minimum clear space** = size of one small square in the icon grid

Nothing may enter this area around the logo.

---

## 📏 5️⃣ LOGO SIZE GUIDE

| Usage | Height | Variant |
|-------|--------|---------|
| Navbar (desktop) | 32–36px | Full (icon + text) |
| Navbar (mobile) | 28–32px | Full (icon + text) |
| Footer | 24–28px | Full (icon + text) |
| Login / Signup | 48–56px | Icon only |
| App / Favicon | Various | Icon only |

---

## 🧱 6️⃣ SPACING SYSTEM (8px RULE)

All spacing must follow the 8px base unit system.

| Size | Value | Usage |
|------|-------|-------|
| Micro | 4px | Tight spacing, icon gaps |
| Small | 8px | Element spacing |
| Default | 16px | Standard spacing |
| Section | 24px | Between sections |
| Large | 32px | Major spacing |
| Hero | 48px+ | Hero sections |

**Breaking this = breaking the brand.**

---

## 🌗 7️⃣ DARK MODE RULES

### Logo

- Logo text uses `currentColor`
- Icon square colors stay fixed (no change)
- Text adapts: Light mode `#111827`, Dark mode `#FFFFFF`

### Text Colors

- **Light mode:**
  - Primary: `#111827`
  - Secondary: `#6B7280`
- **Dark mode:**
  - Primary: `#FFFFFF`
  - Secondary: `#9CA3AF`

---

## 🧠 8️⃣ BRAND FEEL

Livio must always feel:

- ✅ **Calm** - No aggressive animations
- ✅ **Organized** - Clear structure, predictable patterns
- ✅ **Trustworthy** - Professional, reliable
- ✅ **Daily-use friendly** - Not overwhelming, comfortable

If it feels:
- ❌ Flashy
- ❌ Playful
- ❌ Noisy
- ❌ Over-designed

→ It does **NOT** belong.

---

## 🚫 BRAND VIOLATIONS

Common mistakes to avoid:

1. **Adding colors** not in the color system
2. **Using fonts** other than Inter
3. **Modifying logo** (colors, shadows, rotation)
4. **Breaking spacing** system (using odd numbers)
5. **Over-designing** (too many effects, animations)
6. **Ignoring clear space** around logo

---

## ✅ COMPLIANCE CHECKLIST

Before shipping any UI change:

- [ ] Colors match brand system
- [ ] Typography is Inter only
- [ ] Logo usage follows rules
- [ ] Spacing follows 8px system
- [ ] Brand feel is calm and organized
- [ ] No brand violations present

---

**Remember:** Consistency builds trust. Follow these guidelines strictly.

