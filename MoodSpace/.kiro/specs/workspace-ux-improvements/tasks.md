# Implementation Plan: Workspace UX Improvements

## Overview

This implementation plan transforms the MoodSpace Workspace into a cinematic, immersive editing experience by adding professional zoom controls, typography previews, and a dedicated font selection sidebar. The implementation follows a phased approach: zoom controls first (immediate UX impact), then typography enhancements, and finally the font sidebar system.

## Tasks

- [ ] 1. Implement default 75% zoom and camera initialization
  - Modify the initial camera state calculation to use 0.75 scale instead of 1.0
  - Update the `calculateInitialCamera` function to center the canvas at 75% zoom
  - Ensure the camera is applied before the first render to avoid visual jump
  - _Requirements: 1.1, 1.2, 1.3, 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]* 1.1 Write property test for camera centering calculation
  - **Property 3: Camera Centering Calculation**
  - **Validates: Requirements 11.2**
  - Generate random viewport and canvas dimensions
  - Verify canvas center aligns with viewport center at 75% zoom
  - Minimum 100 iterations

- [x] 2. Create ZoomControlPill component
  - [x] 2.1 Create new component file `src/components/ZoomControlPill.jsx`
    - Implement component with decrease button, percentage display, and increase button
    - Add props: `currentZoom`, `onZoomIn`, `onZoomOut`, `onResetZoom`, `minZoom`, `maxZoom`
    - Calculate zoom percentage as `Math.round(currentZoom * 100)`
    - Disable buttons at min/max limits
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Add ZoomControlPill styling
    - Position fixed at bottom-right (32px from edges)
    - Use dark background with blur effect and subtle border
    - Style buttons with hover effects and disabled states
    - Make percentage display clickable with hover effect
    - _Requirements: 3.5, 12.1, 12.4_

  - [ ]* 2.3 Write unit tests for ZoomControlPill
    - Test button disable logic at min/max zoom
    - Test percentage display formatting
    - Test click handlers for all three elements
    - _Requirements: 3.3, 4.4, 4.5_

- [ ]* 2.4 Write property test for zoom percentage display format
  - **Property 1: Zoom Percentage Display Format**
  - **Validates: Requirements 3.3**
  - Generate random scale values between 0.25 and 3.0
  - Verify displayed text matches `Math.round(scale * 100) + '%'`
  - Minimum 100 iterations

- [x] 3. Integrate ZoomControlPill into Workspace
  - [x] 3.1 Add zoom control handlers to Workspace component
    - Implement `handleZoomIn` using viewport center as zoom origin
    - Implement `handleZoomOut` using viewport center as zoom origin
    - Implement `handleResetZoom` to return to 75% and center
    - Use existing `animateCameraTo` function for smooth transitions
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3, 4.6, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.2 Render ZoomControlPill in Workspace
    - Add ZoomControlPill component to Workspace JSX
    - Pass current camera scale and handler functions as props
    - Pass minZoom (0.25) and maxZoom (3.0) constants
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 3.3 Write integration tests for zoom controls
    - Test zoom in increases scale by zoom speed factor
    - Test zoom out decreases scale by zoom speed factor
    - Test reset zoom returns to 75% and centers canvas
    - Test animation triggers on all zoom actions
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2, 4.3_

- [x] 4. Checkpoint - Verify zoom controls functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Add typography previews to TextPanel
  - [-] 5.1 Define text type configuration with preview metadata
    - Create TEXT_TYPES array with id, label, preview, fontSize, fontWeight, fontStyle, fontFamily
    - Include heading (bold, large), subheading (semi-bold, medium), body (normal, small), quote (italic)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [-] 5.2 Update TextPanel component to render typography previews
    - Modify text type option rendering to include preview span
    - Position preview to the right of the label
    - Apply font styles from text type configuration to preview
    - Scale preview fontSize to fit UI (divide by 3, max 18px)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 5.3 Style typography preview elements
    - Add styles for `.text-type-preview` class
    - Ensure sufficient contrast for readability
    - Use consistent spacing and alignment
    - _Requirements: 12.3, 12.5_

  - [ ]* 5.4 Write unit tests for typography previews
    - Test heading preview uses bold and larger size
    - Test quote preview uses italic style
    - Test paragraph preview uses smaller size
    - Test preview fontFamily matches text type
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Create FontLoader utility class
  - [~] 6.1 Create `src/utils/FontLoader.js` file
    - Implement FontLoader class with loadedFonts Set and loadingPromises Map
    - Implement `loadGoogleFont(fontFamily, variants)` method
    - Add 3-second timeout for font loading
    - Implement font caching and deduplication logic
    - Handle load success, timeout, and network errors
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 6.2 Write unit tests for FontLoader
    - Test font caching prevents duplicate loads
    - Test timeout applies fallback after 3 seconds
    - Test network error handling
    - Test loading promise deduplication
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 7. Create FontItem component
  - [~] 7.1 Create `src/components/FontItem.jsx` file
    - Implement component with font preview, name, category, and status icons
    - Add props: `font`, `isSelected`, `isLoading`, `isDisabled`, `onClick`
    - Render preview text using actual font family in style
    - Show loading spinner when isLoading is true
    - Show check icon when isSelected is true
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 8.3_

  - [~] 7.2 Style FontItem component
    - Use card-style layout with hover effects
    - Highlight selected font with accent color
    - Disable interaction when isDisabled is true
    - Add smooth transitions for all interactive states
    - _Requirements: 12.2, 12.4, 12.5_

  - [ ]* 7.3 Write unit tests for FontItem
    - Test font preview renders with correct fontFamily
    - Test selected state shows check icon
    - Test loading state shows spinner
    - Test disabled state prevents interaction
    - _Requirements: 7.2, 8.3, 8.4_

- [ ]* 7.4 Write property test for font preview rendering
  - **Property 2: Font Preview Rendering**
  - **Validates: Requirements 7.2**
  - Generate random font items with various family names
  - Verify each rendered item has `fontFamily: font.family` in style
  - Minimum 100 iterations

- [ ] 8. Create FontSidebar component
  - [~] 8.1 Create `src/components/FontSidebar.jsx` file
    - Implement component with header, search input, and font list
    - Add props: `selectedTextItem`, `currentFont`, `onFontSelect`, `onClose`
    - Define CURATED_FONTS array with Google Fonts and system fonts
    - Implement font search filtering logic
    - Manage loadingFonts and loadedFonts state
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [~] 8.2 Implement font selection handler in FontSidebar
    - Check if Google Font needs loading
    - Call FontLoader.loadGoogleFont with timeout
    - Handle load success, timeout, and error cases
    - Apply font to selected text item via onFontSelect callback
    - Update loading state during font load
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [~] 8.3 Style FontSidebar component
    - Match right sidebar width and position
    - Style header with close button
    - Style search input with icon
    - Style font list with scrollable container
    - _Requirements: 6.5, 12.2, 12.5_

  - [ ]* 8.4 Write integration tests for FontSidebar
    - Test font sidebar replaces right panel when opened
    - Test close button restores previous panel
    - Test font items disabled when no text selected
    - Test selected font highlighted in list
    - Test Google fonts appear before system fonts
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.6_

- [ ] 9. Integrate FontSidebar into Workspace
  - [~] 9.1 Add font sidebar state and handlers to Workspace
    - Add 'fonts' option to activePanel state
    - Implement `handleOpenFontPicker` to open font sidebar
    - Implement `handleCloseFontSidebar` to return to text panel
    - Implement `handleFontSelect` to apply font to selected text
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2_

  - [~] 9.2 Add font picker trigger to TextPanel
    - Add "Change Font" button or similar trigger in TextPanel
    - Call `handleOpenFontPicker` when clicked
    - Only enable when text item is selected
    - _Requirements: 6.1, 8.4_

  - [~] 9.3 Update right panel rendering logic
    - Add case for 'fonts' panel in renderRightPanel switch
    - Render FontSidebar when activePanel is 'fonts'
    - Pass selectedItem, currentFont, handlers as props
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 9.4 Write integration tests for font sidebar integration
    - Test opening font picker switches to font sidebar
    - Test closing font sidebar returns to text panel
    - Test font selection updates text item fontFamily
    - Test font loading shows loading state
    - _Requirements: 6.1, 6.2, 6.3, 8.1, 8.2, 8.5_

- [~] 10. Checkpoint - Verify all features working together
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Add keyboard shortcuts for zoom controls
  - [~] 11.1 Implement keyboard event handlers
    - Add `Ctrl/Cmd + =` for zoom in
    - Add `Ctrl/Cmd + -` for zoom out
    - Add `Ctrl/Cmd + 0` for reset zoom
    - Prevent default browser zoom behavior
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ]* 11.2 Write unit tests for keyboard shortcuts
    - Test Ctrl/Cmd + = triggers zoom in
    - Test Ctrl/Cmd + - triggers zoom out
    - Test Ctrl/Cmd + 0 triggers reset zoom
    - Test default behavior is prevented

- [ ] 12. Add accessibility features
  - [~] 12.1 Add ARIA labels to ZoomControlPill
    - Add aria-label to zoom out button
    - Add aria-label to zoom in button
    - Add role="button" and aria-label to percentage display
    - _Requirements: 12.1, 12.4_

  - [~] 12.2 Add ARIA attributes to FontSidebar and FontItem
    - Add role="option" to font items
    - Add aria-selected to indicate selected font
    - Add aria-disabled to disabled font items
    - Add aria-label with font family and category
    - _Requirements: 12.2, 12.5_

  - [~] 12.3 Implement keyboard navigation for FontSidebar
    - Add Tab navigation between font items
    - Add Enter/Space to select focused font
    - Add Esc to close font sidebar
    - Add Arrow Up/Down to navigate font list
    - _Requirements: 12.4_

  - [ ]* 12.4 Write accessibility tests
    - Test keyboard navigation works correctly
    - Test ARIA labels are present and correct
    - Test focus management in font sidebar

- [ ] 13. Final checkpoint and polish
  - [~] 13.1 Verify all acceptance criteria are met
    - Test default 75% zoom on load
    - Test reset zoom returns to 75% and centers
    - Test zoom controls visible and functional
    - Test typography previews display correctly
    - Test font sidebar opens and closes properly
    - Test font selection applies to text objects
    - Test font loading with timeout and fallback
    - Test zoom animations are smooth
    - Test visual design consistency
    - _Requirements: All_

  - [~] 13.2 Performance optimization
    - Verify zoom animation runs at 60fps
    - Verify font list scrolling is smooth
    - Verify font loading doesn't block UI
    - Add memoization where needed
    - _Requirements: 7.5, 10.1, 10.2, 10.3, 10.4_

  - [~] 13.3 Visual polish and design consistency
    - Verify all UI elements match design system
    - Verify color contrast meets WCAG AA standards
    - Verify spacing and typography are consistent
    - Verify transitions are smooth and professional
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [~] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses JavaScript/React with existing Konva canvas infrastructure
- Font loading uses Google Fonts API with 3-second timeout and system font fallbacks
- Zoom animation uses requestAnimationFrame for smooth 60fps performance
- All UI components follow the existing dark theme design system

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.4"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "5.1"] },
    { "id": 4, "tasks": ["3.3", "5.2", "6.1"] },
    { "id": 5, "tasks": ["5.3", "6.2", "7.1"] },
    { "id": 6, "tasks": ["5.4", "7.2", "7.4"] },
    { "id": 7, "tasks": ["7.3", "8.1"] },
    { "id": 8, "tasks": ["8.2", "8.3"] },
    { "id": 9, "tasks": ["8.4", "9.1"] },
    { "id": 10, "tasks": ["9.2", "9.3"] },
    { "id": 11, "tasks": ["9.4", "11.1"] },
    { "id": 12, "tasks": ["11.2", "12.1", "12.2"] },
    { "id": 13, "tasks": ["12.3", "12.4"] },
    { "id": 14, "tasks": ["13.1", "13.2", "13.3"] }
  ]
}
```
