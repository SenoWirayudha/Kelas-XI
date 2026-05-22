# Layers Panel Visual Guide

## New Layer Item Structure

```
┌─────────────────────────────────────────────────────────┐
│  ≡  📄  heading-1                    👁  🔓  🗑         │
│  ↑   ↑   ↑                           ↑   ↑   ↑          │
│  │   │   └─ Layer Name               │   │   └─ Delete  │
│  │   └───── Type Icon                │   └───── Lock    │
│  └───────── Drag Handle              └───────── Visible │
└─────────────────────────────────────────────────────────┘
```

## Layer Item Anatomy

### 1. Drag Handle (≡)
- **Icon**: `GripVertical` from lucide-react
- **Size**: 32px × 36px
- **Cursor**: `grab` (changes to `grabbing` when dragging)
- **Color**: 
  - Default: `rgba(255, 255, 255, 0.3)`
  - Hover: `rgba(255, 255, 255, 0.6)`
  - Active: `rgba(168, 85, 247, 0.8)` (purple)
- **Function**: Drag to reorder layers

### 2. Type Icon
- **Icons by Type**:
  - Text: `Type` icon
  - Image: `Box` icon
  - Note: `MessageSquarePlus` icon
  - Card: `Box` icon
  - Palette: `Circle` icon
  - Default: `Layers` icon
- **Size**: 20px × 20px
- **Color**:
  - Default: `rgba(255, 255, 255, 0.5)`
  - Active: `rgba(168, 85, 247, 0.9)` (purple)

### 3. Layer Name
- **Font**: Inter, 13px, weight 500
- **Color**:
  - Default: `rgba(255, 255, 255, 0.85)`
  - Hover: `rgba(255, 255, 255, 0.95)`
  - Active: `#e9d5ff` (light purple)
- **Behavior**: Click to select layer
- **Overflow**: Ellipsis for long names

### 4. Visibility Toggle (👁)
- **Icons**: `Eye` / `EyeOff`
- **Size**: 32px × 32px
- **Color**: `rgba(255, 255, 255, 0.4)`
- **Hover**: 
  - Background: `rgba(255, 255, 255, 0.08)`
  - Color: `rgba(255, 255, 255, 0.7)`
- **Function**: Toggle layer visibility on canvas

### 5. Lock Toggle (🔓/🔒)
- **Icons**: `Unlock` / `Lock`
- **Size**: 32px × 32px
- **Color**: `rgba(255, 255, 255, 0.4)`
- **Hover**: Same as visibility
- **Function**: Toggle layer lock state

### 6. Delete Button (🗑)
- **Icon**: `Trash2`
- **Size**: 32px × 32px
- **Color**: `rgba(255, 255, 255, 0.4)`
- **Hover**:
  - Background: `rgba(239, 68, 68, 0.15)` (red tint)
  - Color: `#f87171` (red)
- **Function**: Delete layer

---

## Visual States

### Default State
```
Background: rgba(255, 255, 255, 0.03)
Border: 1px solid rgba(255, 255, 255, 0.08)
Border Radius: 12px
Height: 48px
Padding: 6px
Gap: 6px
```

### Hover State
```
Background: rgba(255, 255, 255, 0.06)
Border: 1px solid rgba(255, 255, 255, 0.12)
Transition: all 0.2s ease
```

### Active State (Selected Layer)
```
Background: rgba(168, 85, 247, 0.15)
Border: 1px solid rgba(168, 85, 247, 0.4)
Box Shadow: 
  - 0 0 0 1px rgba(168, 85, 247, 0.2)
  - 0 4px 12px rgba(168, 85, 247, 0.25)
```

### Dragging State
```
Opacity: 0.5
Transform: scale(1.02)
Box Shadow: 0 8px 24px rgba(0, 0, 0, 0.4)
Cursor: grabbing
```

---

## Color Palette

### Purple Theme (Active/Selected)
- Primary: `rgba(168, 85, 247, 0.15)` - Background
- Border: `rgba(168, 85, 247, 0.4)` - Border
- Glow: `rgba(168, 85, 247, 0.25)` - Shadow
- Icon: `rgba(168, 85, 247, 0.9)` - Icon color
- Text: `#e9d5ff` - Light purple text

### Neutral Theme (Default)
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `rgba(255, 255, 255, 0.08)`
- Text: `rgba(255, 255, 255, 0.85)`
- Icon: `rgba(255, 255, 255, 0.5)`

### Hover Theme
- Background: `rgba(255, 255, 255, 0.06)`
- Border: `rgba(255, 255, 255, 0.12)`
- Text: `rgba(255, 255, 255, 0.95)`
- Icon: `rgba(255, 255, 255, 0.6)`

### Delete Theme (Hover)
- Background: `rgba(239, 68, 68, 0.15)` - Red tint
- Icon: `#f87171` - Red

---

## Spacing & Layout

### Container
```
Display: flex
Flex Direction: column
Gap: 8px (between layer items)
```

### Layer Item
```
Display: flex
Align Items: center
Gap: 6px (between elements)
Min Height: 48px
Padding: 6px
```

### Element Widths
- Drag Handle: 32px (fixed)
- Type Icon: 20px (fixed)
- Layer Name: flex: 1 (grows to fill space)
- Action Buttons: 32px each (fixed)

---

## Interaction Flow

### 1. Selecting a Layer
```
User clicks layer name
  ↓
setSelectedId(id)
  ↓
Layer item gets .active class
  ↓
Purple glow appears
  ↓
Canvas transformer attaches
  ↓
Panel STAYS OPEN (no auto-close)
```

### 2. Dragging to Reorder
```
User grabs drag handle
  ↓
Cursor changes to grabbing
  ↓
Layer becomes semi-transparent (opacity: 0.5)
  ↓
User drags up/down
  ↓
Other layers shift to make space
  ↓
User releases
  ↓
handleDragEnd fires
  ↓
items array reordered with arrayMove
  ↓
Canvas z-order updates immediately
```

### 3. Toggling Visibility
```
User clicks eye icon
  ↓
updateItem(id, { visible: !visible })
  ↓
Icon changes: Eye ↔ EyeOff
  ↓
Canvas layer visibility updates
  ↓
Panel STAYS OPEN
```

### 4. Locking a Layer
```
User clicks lock icon
  ↓
updateItem(id, { locked: !locked })
  ↓
Icon changes: Unlock ↔ Lock
  ↓
Canvas layer becomes non-draggable
  ↓
Panel STAYS OPEN
```

### 5. Deleting a Layer
```
User clicks trash icon
  ↓
Delete button turns red on hover
  ↓
User confirms click
  ↓
deleteObject(id)
  ↓
Layer removed from items array
  ↓
Canvas updates
  ↓
Panel STAYS OPEN (unless last layer)
```

---

## Responsive Behavior

### Desktop (Default)
- All elements visible
- Comfortable 48px height
- 6px gaps for breathing room

### Tablet (if needed)
- Same layout
- Touch-friendly 48px targets
- Slightly larger gaps (8px)

### Mobile (if needed)
- Consider stacking actions
- Swipe gestures for delete
- Larger touch targets (56px)

---

## Accessibility

### Keyboard Navigation
- **Tab**: Move between layer items
- **Enter/Space**: Select layer
- **Arrow Up/Down**: Navigate list (with dnd-kit)
- **Escape**: Deselect layer

### Screen Reader
- Drag handle: "Drag to reorder"
- Visibility: "Toggle visibility"
- Lock: "Toggle lock"
- Delete: "Delete layer"
- Layer name: Announced with type (e.g., "Text layer: heading-1")

### Focus Indicators
- Visible focus ring on all interactive elements
- High contrast for accessibility
- Clear visual feedback

---

## Animation Timing

### Transitions
```css
transition: all 0.2s ease
```

### Drag Transform
```css
transform: CSS.Transform.toString(transform)
transition: transition (from dnd-kit)
```

### Hover Effects
```css
transition: 
  background 0.2s ease,
  color 0.2s ease,
  border-color 0.2s ease
```

---

## Comparison: Before vs After

### Before
```
┌─────────────────────────────────────────────┐
│  📄 heading-1  ↑  ↓  👁  🔓  🗑            │
└─────────────────────────────────────────────┘
```
- No drag handle
- Up/Down buttons (clunky)
- No visual hierarchy
- Panel auto-closes on select

### After
```
┌─────────────────────────────────────────────┐
│  ≡  📄  heading-1              👁  🔓  🗑   │
└─────────────────────────────────────────────┘
```
- Clear drag handle
- Drag & drop (intuitive)
- Better visual hierarchy
- Panel stays persistent

---

## Design Inspiration

### Figma
- Drag handle on left
- Type icons
- Compact layout
- Purple active state

### Canva
- Clear action buttons
- Hover states
- Smooth animations
- Persistent panel

### Framer
- Modern spacing
- Subtle backgrounds
- Glow effects
- Professional feel

---

## CSS Class Reference

| Class | Purpose |
|-------|---------|
| `.workspace-layer-list` | Container for all layers |
| `.workspace-layer-item` | Individual layer item |
| `.workspace-layer-item.active` | Selected layer state |
| `.workspace-layer-item.dragging` | Dragging state |
| `.workspace-layer-drag-handle` | Drag handle button |
| `.workspace-layer-main` | Layer name button |
| `.workspace-layer-icon` | Type icon container |
| `.workspace-layer-label` | Layer name text |
| `.workspace-layer-action` | Action buttons (eye, lock, trash) |
| `.workspace-layer-delete` | Delete button (special hover) |

---

## Testing Checklist

- [ ] Drag handle cursor changes (grab → grabbing)
- [ ] Layer reorders smoothly
- [ ] Active state shows purple glow
- [ ] Hover states work on all buttons
- [ ] Delete button turns red on hover
- [ ] Panel stays open when selecting layers
- [ ] Canvas z-order updates in real-time
- [ ] No console errors
- [ ] Keyboard navigation works
- [ ] Touch devices work (if applicable)

---

**Visual Design Status: ✅ Complete**
**UX Flow Status: ✅ Complete**
**Accessibility Status: ✅ Complete**
