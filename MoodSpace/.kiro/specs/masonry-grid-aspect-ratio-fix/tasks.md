# Masonry Grid Aspect Ratio Fix - Implementation Tasks

## Overview
This task list implements the fix for masonry grid aspect ratios across all pages (Home, Projects, BoardDetail, Profile, PostDetail) by replacing hardcoded `--media-ratio` CSS with dynamic `aspect-ratio` property driven by data.

---

## Phase 1: Data Preparation

### 1.1 Create Aspect Ratio Mapping Utility
- [ ] Create `src/utils/aspectRatioMap.js` file
- [ ] Define `aspectRatioMap` object with mappings from CSS classes to aspect ratios
- [ ] Export the mapping for use in components
- [ ] Add JSDoc comments explaining the mapping

**Acceptance Criteria:**
- Mapping includes all CSS classes: `art-1` through `art-6`, `project-art-*` variants
- Values match the aspect ratios from `mockAssets.js`
- File is properly exported and importable

---

## Phase 2: Component Updates

### 2.1 Update Home Page (`src/pages/Home.jsx`)
- [ ] Import aspect ratio mapping utility
- [ ] Add `aspectRatio` property to `items` array using the mapping
- [ ] Update `.gallery-art` div to include inline `style={{ aspectRatio: item.aspectRatio }}`
- [ ] Verify no TypeScript/linting errors

**Acceptance Criteria:**
- Each item in `items` array has `aspectRatio` property
- Gallery art divs render with inline aspect-ratio style
- Page renders without errors

### 2.2 Update Projects Page (`src/pages/Projects.jsx`)
- [ ] Import aspect ratio mapping utility
- [ ] Add `aspectRatio` property to `projects` array using the mapping
- [ ] Update `.project-art` div to include inline `style={{ aspectRatio: project.aspectRatio }}`
- [ ] Verify no TypeScript/linting errors

**Acceptance Criteria:**
- Each project in `projects` array has `aspectRatio` property
- Project art divs render with inline aspect-ratio style
- Page renders without errors

### 2.3 Update BoardDetail Page (`src/pages/BoardDetail.jsx`)
- [ ] Update `.placeholder-image` div to include inline `style={{ aspectRatio: asset.aspectRatio }}`
- [ ] Verify `asset.aspectRatio` is already available from `mockAssets.js`
- [ ] Verify no TypeScript/linting errors

**Acceptance Criteria:**
- Placeholder image divs render with inline aspect-ratio style
- Aspect ratio values come from `mockAssets.js` data
- Page renders without errors

### 2.4 Update Profile Page (`src/pages/Profile.jsx`)
- [ ] Import aspect ratio mapping utility
- [ ] Add `aspectRatio` property to `projects` array using the mapping
- [ ] Add `aspectRatio` property to `savedItems` array using the mapping
- [ ] Update `.project-art` div (Projects tab) to include inline `style={{ aspectRatio: project.aspectRatio }}`
- [ ] Update `.gallery-art` div (Saved tab) to include inline `style={{ aspectRatio: item.aspectRatio }}`
- [ ] Verify no TypeScript/linting errors

**Acceptance Criteria:**
- Each project has `aspectRatio` property
- Each saved item has `aspectRatio` property
- Both Projects and Saved tabs render with inline aspect-ratio styles
- Page renders without errors

### 2.5 Update PostDetail Page (`src/pages/PostDetail.jsx`)
- [ ] Import aspect ratio mapping utility
- [ ] Add `aspectRatio` property to `mockPosts` array using the mapping
- [ ] Update `.post-detail-image` div to include inline `style={{ aspectRatio: post.aspectRatio }}`
- [ ] Update `.recommended-image` div to include inline `style={{ aspectRatio: recommendedPost.aspectRatio }}`
- [ ] Verify no TypeScript/linting errors

**Acceptance Criteria:**
- Each post in `mockPosts` has `aspectRatio` property
- Main post image and recommended images render with inline aspect-ratio styles
- Page renders without errors

---

## Phase 3: CSS Cleanup

### 3.1 Remove Hardcoded Aspect Ratios from Gallery Styles
- [ ] Open `src/App.css`
- [ ] Remove `padding-top: var(--media-ratio, 85%);` from `.gallery-art`
- [ ] Remove `--media-ratio` definitions from `.art-1` through `.art-6`
- [ ] Keep `background-image`, `background-size`, and `background-position` properties
- [ ] Verify CSS is valid

**Acceptance Criteria:**
- `.gallery-art` no longer uses `padding-top` for aspect ratio
- All `.art-*` classes no longer define `--media-ratio`
- Background image styles are preserved

### 3.2 Remove Hardcoded Aspect Ratios from Project Styles
- [ ] Remove `padding-top: var(--media-ratio, 72%);` from `.project-art`
- [ ] Remove `--media-ratio` definitions from `.project-card.small .project-art`
- [ ] Remove `--media-ratio` definitions from `.project-card.medium .project-art`
- [ ] Remove `--media-ratio` definitions from `.project-card.large .project-art`
- [ ] Keep all other `.project-art` styles (position, background-size, background-position)
- [ ] Verify CSS is valid

**Acceptance Criteria:**
- `.project-art` no longer uses `padding-top` for aspect ratio
- Size-based aspect ratio overrides are removed
- Background and positioning styles are preserved

### 3.3 Update BoardDetail Masonry Styles
- [ ] Verify `.placeholder-image` doesn't use `padding-top` for aspect ratio
- [ ] Ensure `.masonry-card-image` styles support aspect-ratio property
- [ ] Keep all gradient and background styles
- [ ] Verify CSS is valid

**Acceptance Criteria:**
- Masonry card styles support dynamic aspect ratios
- Placeholder gradients are preserved
- No hardcoded aspect ratio values remain

### 3.4 Update PostDetail Recommended Grid Styles
- [ ] Verify `.recommended-image` doesn't use `padding-top` for aspect ratio
- [ ] Ensure styles support aspect-ratio property
- [ ] Keep all background and styling properties
- [ ] Verify CSS is valid

**Acceptance Criteria:**
- Recommended image styles support dynamic aspect ratios
- All styling is preserved
- No hardcoded aspect ratio values remain

---

## Phase 4: Testing & Verification

### 4.1 Visual Regression Testing
- [ ] Test Home page: verify all gallery items display with correct aspect ratios
- [ ] Test Projects page: verify all project cards display with correct aspect ratios
- [ ] Test BoardDetail page: verify masonry grid displays with correct aspect ratios
- [ ] Test Profile page (Boards tab): verify board cards display correctly
- [ ] Test Profile page (Projects tab): verify project cards display with correct aspect ratios
- [ ] Test Profile page (Saved tab): verify saved items display with correct aspect ratios
- [ ] Test PostDetail page: verify main image and recommended images display correctly

**Acceptance Criteria:**
- Portrait images (aspectRatio < 1) display taller than wide
- Landscape images (aspectRatio > 1) display wider than tall
- Square images (aspectRatio = 1) display as squares
- No visual regressions in layout or styling

### 4.2 Layout Preservation Testing
- [ ] Verify Home page uses 3-column layout with 18px gap
- [ ] Verify Projects page uses 3-column layout with 20px gap
- [ ] Verify BoardDetail uses CSS Grid with proper row spanning
- [ ] Verify Profile page maintains 3-column layout for Projects and Saved tabs
- [ ] Verify all hover effects continue to work (transform, box-shadow)
- [ ] Verify card borders, border-radius, and backgrounds are unchanged
- [ ] Verify badges and overlays display correctly

**Acceptance Criteria:**
- Column counts are preserved
- Gap spacing is unchanged
- Hover effects work identically
- All styling is preserved

### 4.3 Responsive Testing
- [ ] Test at desktop width (>1024px): verify 3-column layout
- [ ] Test at tablet width (768-1024px): verify layout adapts correctly
- [ ] Test at mobile width (<768px): verify layout adapts correctly
- [ ] Verify aspect ratios remain correct at all breakpoints

**Acceptance Criteria:**
- Responsive breakpoints work correctly
- Aspect ratios are correct at all viewport sizes
- No layout breaking at any breakpoint

### 4.4 Data-Driven Testing
- [ ] Temporarily change an `aspectRatio` value in the mapping
- [ ] Verify the corresponding image displays with the new aspect ratio
- [ ] Revert the change
- [ ] Verify the image returns to original aspect ratio

**Acceptance Criteria:**
- Aspect ratios are driven by data, not hardcoded CSS
- Changing data immediately affects display
- No caching issues

---

## Phase 5: Documentation & Cleanup

### 5.1 Code Documentation
- [ ] Add comments to aspect ratio mapping utility explaining the source of values
- [ ] Add comments to component changes explaining the inline style approach
- [ ] Update any relevant README or documentation files

**Acceptance Criteria:**
- Code is well-commented
- Future developers can understand the approach
- Documentation is up-to-date

### 5.2 Final Verification
- [ ] Run linter and fix any issues
- [ ] Run build process and verify no errors
- [ ] Test all pages one final time
- [ ] Verify no console errors or warnings

**Acceptance Criteria:**
- No linting errors
- Build succeeds
- All pages work correctly
- No console errors

---

## Notes

- **Browser Compatibility**: CSS `aspect-ratio` is supported in all modern browsers (Chrome 88+, Firefox 89+, Safari 15+, Edge 88+)
- **Fallback**: If older browser support is needed, consider adding a fallback using `@supports` query
- **Performance**: Inline styles are minimal and have negligible performance impact
- **Future Enhancement**: Consider fetching aspect ratios from actual image metadata if real images are used

---

## Definition of Done

- [ ] All component files updated with inline aspect-ratio styles
- [ ] All hardcoded `--media-ratio` values removed from CSS
- [ ] All pages display images with correct aspect ratios from data
- [ ] All existing layout and styling behaviors are preserved
- [ ] No visual regressions
- [ ] No console errors or warnings
- [ ] Code is documented and clean
- [ ] Build succeeds without errors
