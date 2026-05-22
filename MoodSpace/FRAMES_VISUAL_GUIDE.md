# Frames System - Visual Guide

## UI Structure

```
┌─────────────────────────────────────┐
│  ← Frames                           │  ← Sticky Header
├─────────────────────────────────────┤
│                                     │
│  Basic Frames                       │  ← Category Title
│  ┌──────────┬──────────┐           │
│  │   ▭      │    ▭     │           │  ← 2-Column Grid
│  │Rectangle │ Rounded  │           │
│  ├──────────┼──────────┤           │
│  │   ●      │    ⌒     │           │
│  │  Circle  │   Arch   │           │
│  └──────────┴──────────┘           │
│                                     │
│  Polaroid                           │
│  ┌──────────┬──────────┐           │
│  │   ▭      │    ▭     │           │
│  │  White   │   Tape   │           │
│  ├──────────┼──────────┤           │
│  │   ▭      │          │           │
│  │ Stacked  │          │           │
│  └──────────┴──────────┘           │
│                                     │
│  Film                               │
│  ┌──────────┬──────────┐           │
│  │   ▯      │    ▬     │           │
│  │ Vertical │Horizontal│           │
│  ├──────────┼──────────┤           │
│  │   ▬      │          │           │
│  │  Cinema  │          │           │
│  └──────────┴──────────┘           │
│                                     │
│  Grid                               │
│  ┌──────────┬──────────┐           │
│  │  ▭│▭     │ ▭│▭│▭    │           │
│  │ 2 Grid   │ 3 Grid   │           │
│  ├──────────┼──────────┤           │
│  │ ▭│▭      │  ▭│▭     │           │
│  │ ▭│▭      │  ▭│▭     │           │
│  │ Collage  │Asymmetric│           │
│  └──────────┴──────────┘           │
│                                     │
│  Organic Frames                     │
│  ┌──────────┬──────────┐           │
│  │   ◯      │    ∿     │           │
│  │   Blob   │   Wave   │           │
│  ├──────────┼──────────┤           │
│  │   ◐      │          │           │
│  │  Liquid  │          │           │
│  └──────────┴──────────┘           │
│                                     │
│  Device Mockups                     │
│  ┌──────────┬──────────┐           │
│  │   ▯      │    ▭     │           │
│  │  Phone   │  Tablet  │           │
│  ├──────────┼──────────┤           │
│  │   ▭      │    ▭     │           │
│  │ Browser  │ Desktop  │           │
│  └──────────┴──────────┘           │
│                                     │
│                                     │  ← Scrollable
└─────────────────────────────────────┘
```

---

## Frame Types Visualization

### Basic Frames

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│             │  │             │  │             │  │      ⌒      │
│             │  │             │  │      ●      │  │             │
│  Rectangle  │  │   Rounded   │  │             │  │             │
│             │  │             │  │             │  │             │
│             │  │             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
  Sharp edges    Rounded corners   Circular frame    Arch top
```

### Polaroid Frames

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│             │  │   ▬▬▬▬▬     │  │             │
│             │  │             │  │  ┌────────┐ │
│             │  │             │  │  │        │ │
│             │  │             │  │  └────────┘ │
│             │  │             │  │             │
│             │  │             │  │             │
│             │  │             │  │             │
│             │  │             │  │             │
│             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
  White border     Tape on top      Stacked effect
  Thick bottom
```

### Film Frames

```
┌───┐  ┌───┐  ┌─────────────────────┐  ┌─────────────────────┐
│ ▯ │  │ ▯ │  │ ▯ ▯ ▯ ▯ ▯ ▯ ▯ ▯ ▯ │  │▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬│
│   │  │   │  │                     │  │                     │
│ ▯ │  │ ▯ │  │                     │  │                     │
│   │  │   │  │                     │  │                     │
│ ▯ │  │ ▯ │  │                     │  │                     │
│   │  │   │  │                     │  │                     │
│ ▯ │  │ ▯ │  │ ▯ ▯ ▯ ▯ ▯ ▯ ▯ ▯ ▯ │  │▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬│
└───┘  └───┘  └─────────────────────┘  └─────────────────────┘
Vertical      Horizontal                Cinema bars
sprockets     sprockets                 top/bottom
```

### Grid Frames

```
┌──────┬──────┐  ┌────┬────┬────┐  ┌──────┬──────┐  ┌──────┬──────┐
│      │      │  │    │    │    │  │      │      │  │      │      │
│      │      │  │    │    │    │  ├──────┼──────┤  ├──────┴──────┤
│      │      │  │    │    │    │  │      │      │  │             │
└──────┴──────┘  └────┴────┴────┘  └──────┴──────┘  └─────────────┘
   2 columns        3 columns         2x2 grid        Asymmetric
```

### Organic Frames

```
    ◯◯◯           ∿∿∿∿∿           ◐◐◐
  ◯     ◯       ∿       ∿       ◐     ◐
 ◯       ◯     ∿         ∿     ◐       ◐
◯         ◯   ∿           ∿   ◐         ◐
 ◯       ◯     ∿         ∿     ◐       ◐
  ◯     ◯       ∿       ∿       ◐     ◐
    ◯◯◯           ∿∿∿∿∿           ◐◐◐
    Blob            Wave            Liquid
  Organic         Wavy edges      Flowing shape
```

### Device Mockups

```
┌─────────┐    ┌───────────────┐    ┌─────────────────┐
│  ▬▬▬▬   │    │               │    │ ● ● ●           │
│         │    │               │    ├─────────────────┤
│         │    │               │    │                 │
│         │    │               │    │                 │
│         │    │               │    │                 │
│         │    │               │    │                 │
│         │    │               │    │                 │
│         │    │               │    └─────────────────┘
│         │    │               │         Browser
│         │    │               │      Window controls
│         │    │               │
└─────────┘    └───────────────┘    ┌─────────────────┐
   Phone           Tablet            │                 │
  With notch     Thick bezel         │                 │
                                     │                 │
                                     │                 │
                                     └────────┬────────┘
                                              │
                                           Desktop
                                         With stand
```

---

## Frame Card States

### Default State
```
┌──────────┐
│    ▭     │  ← Frame preview (purple border)
│ Rectangle│  ← Label
└──────────┘
Background: rgba(255, 255, 255, 0.03)
Border: rgba(255, 255, 255, 0.08)
```

### Hover State
```
┌──────────┐
│    ▭     │  ← Glowing purple
│ Rectangle│
└──────────┘
Background: rgba(124, 58, 237, 0.12)
Border: rgba(124, 58, 237, 0.35)
Transform: translateY(-2px)
Shadow: 0 8px 20px rgba(124, 58, 237, 0.2)
```

---

## Frame on Canvas

### Basic Frame
```
Canvas:
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────────┐             │
│         │             │             │
│         │   FRAME     │  ← White fill
│         │             │     Purple border
│         │             │     Can resize
│         └─────────────┘             │
│                                     │
└─────────────────────────────────────┘
```

### Polaroid Frame
```
Canvas:
┌─────────────────────────────────────┐
│                                     │
│         ┌─────────────┐             │
│         │             │             │
│         │   IMAGE     │  ← Image area
│         │   AREA      │
│         │             │
│         │             │
│         │             │
│         │             │  ← Thick bottom
│         └─────────────┘     (caption area)
│                                     │
└─────────────────────────────────────┘
```

### Device Frame
```
Canvas:
┌─────────────────────────────────────┐
│                                     │
│           ┌─────────┐               │
│           │  ▬▬▬▬   │  ← Notch      │
│           │         │               │
│           │ SCREEN  │  ← Screen area│
│           │  AREA   │               │
│           │         │               │
│           │         │               │
│           │         │               │
│           └─────────┘               │
│                                     │
└─────────────────────────────────────┘
```

---

## Usage Flow

### Adding Frame to Canvas

```
Step 1: Open Elements
┌─────────────────┐
│ ELEMENTS        │
├─────────────────┤
│ ▣ Shapes        │
│ ▭ Frames  ←     │  Click here
│ ─ Dividers      │
│ ⟿ Connectors    │
└─────────────────┘

Step 2: Browse Frames
┌─────────────────┐
│ ← Frames        │
├─────────────────┤
│ Basic Frames    │
│ ┌────┬────┐     │
│ │ ▭  │ ▭  │     │
│ └────┴────┘     │
│ Polaroid        │
│ ┌────┬────┐     │
│ │ ▭  │ ▭  │  ←  │  Click frame
│ └────┴────┘     │
└─────────────────┘

Step 3: Frame Added
┌─────────────────────────────────────┐
│ CANVAS                              │
│         ┌─────────────┐             │
│         │             │  ← Frame    │
│         │   FRAME     │     appears │
│         │             │     centered│
│         └─────────────┘     selected│
│                                     │
└─────────────────────────────────────┘

Step 4: Layers Panel
┌─────────────────┐
│ LAYERS          │
├─────────────────┤
│ frame-1  ←      │  New frame at top
│ text-2          │
│ image-3         │
└─────────────────┘
```

---

## Frame Properties

### Editable Properties
```
┌─────────────────────────────────────┐
│ PROPERTIES PANEL                    │
├─────────────────────────────────────┤
│ frame selected                      │
│ frame-1                             │
│                                     │
│ Position                            │
│ x: [500]  y: [300]                  │
│                                     │
│ Size                                │
│ w: [200]  h: [250]                  │
│                                     │
│ Rotation                            │
│ rotation: [0]°                      │
│                                     │
│ Frame Style                         │
│ fill: [#ffffff]                     │
│ stroke: [#e5e5e5]                   │
│ strokeWidth: [2]                    │
│                                     │
│ [🔒 Lock]  [🗑️ Delete]              │
└─────────────────────────────────────┘
```

---

## Frame Categories Explained

### Basic Frames
**Use Case**: General purpose framing
- Product photos
- Profile pictures
- Simple layouts
- Clean designs

### Polaroid
**Use Case**: Vintage/retro aesthetic
- Memory boards
- Scrapbooking
- Nostalgic designs
- Personal photos

### Film
**Use Case**: Cinema/photography theme
- Movie posters
- Photography portfolios
- Vintage film aesthetic
- Cinematic presentations

### Grid
**Use Case**: Multi-image layouts
- Photo collages
- Before/after comparisons
- Product showcases
- Gallery layouts

### Organic
**Use Case**: Natural, flowing designs
- Creative projects
- Artistic layouts
- Modern designs
- Unique presentations

### Device Mockups
**Use Case**: UI/UX presentations
- App screenshots
- Website mockups
- Product demos
- Portfolio presentations

---

## Comparison with Other Tools

### Canva Frames
```
✅ Categorized sections
✅ Visual previews
✅ Click to add
✅ Stays in browser
```

### Figma Frames
```
✅ Frame tool
✅ Auto-layout
✅ Nested frames
✅ Clipping masks
```

### MoodSpace Frames (Our Implementation)
```
✅ Categorized sections (like Canva)
✅ Visual previews (like Canva)
✅ Click to add (like Canva)
✅ Panel stays open (like Canva)
✅ Scalable architecture (like Figma)
✅ Ready for clipping (like Figma)
```

---

## Future Features Preview

### Image Masking (Phase 2)
```
┌─────────────────┐
│ ┌─────────────┐ │
│ │   IMAGE     │ │  ← Image inside frame
│ │   CLIPPED   │ │     Auto-masked
│ │   TO FRAME  │ │     Can drag/scale
│ └─────────────┘ │
└─────────────────┘
```

### Nested Frames (Phase 3)
```
┌─────────────────────────┐
│ ┌─────────┬───────────┐ │
│ │ FRAME 1 │  FRAME 2  │ │  ← Multiple frames
│ │         │           │ │     inside parent
│ └─────────┴───────────┘ │
│ ┌─────────────────────┐ │
│ │      FRAME 3        │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### Frame Templates (Phase 4)
```
┌─────────────────┐
│ TEMPLATES       │
├─────────────────┤
│ ┌────┬────┐     │
│ │ ▭  │ ▭  │     │  ← Pre-designed
│ └────┴────┘     │     layouts
│ Magazine Layout │
│                 │
│ ┌────┬────┐     │
│ │ ▭  │ ▭  │     │
│ └────┴────┘     │
│ Portfolio Grid  │
└─────────────────┘
```

---

## Summary

The Frames system provides:
- ✅ **24 professional frames** across 6 categories
- ✅ **Canva-style browser** with categorized sections
- ✅ **Visual previews** for easy identification
- ✅ **2-column grid** for efficient browsing
- ✅ **Rapid multi-add** workflow (panel stays open)
- ✅ **Full canvas integration** with all features
- ✅ **Scalable architecture** ready for advanced features

Perfect for creating professional designs with proper framing! 🎨
