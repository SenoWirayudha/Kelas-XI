# Workspace Inline Text Editing Fix - Bugfix Design

## Overview

This design addresses a critical React re-render loop bug in the Workspace Canvas inline text editor that prevents normal typing. The bug manifests when users type in the inline textarea: each keystroke triggers a React re-render that unmounts and remounts the textarea DOM node, causing focus loss, cursor position reset, and Ctrl+A selection behavior. This makes it impossible to compose multi-character text strings.

The root cause is the inline text editor's dependency on computed style values (`inlineTextEditorStyle`) that are recalculated on every render. When the user types, the `editingText.value` state changes, triggering a re-render. The `inlineTextEditorStyle` useMemo recalculates (even though its dependencies haven't changed), and React sees the style object as "new" (different reference), causing the textarea to unmount and remount.

The fix stabilizes the textarea component by ensuring the style object reference remains stable across renders when only the text value changes, preventing unnecessary DOM node recreation while maintaining all existing functionality including initial focus/select-all behavior.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when a user types a character in the inline textarea editor, causing `editingText.value` to change
- **Property (P)**: The desired behavior - textarea should remain mounted and stable, allowing natural multi-character text composition without DOM node recreation
- **Preservation**: Existing double-click to edit, initial focus/select-all, Escape/Enter key handling, and blur-to-save behaviors that must remain unchanged
- **inlineTextEditorStyle**: The computed CSS style object for positioning and styling the inline textarea, calculated from `camera` and `editingTextItem` properties
- **editingText**: State object containing `{ id, value }` for the currently edited text item
- **editingTextItem**: The full item object from the `items` array, found by matching `editingText.id`
- **Re-render loop**: React behavior where state changes trigger re-renders, which recalculate memoized values, causing component unmount/remount cycles

## Bug Details

### Bug Condition

The bug manifests when a user types any character in the inline text editor. The `onChange` handler updates `editingText.value`, triggering a React re-render. During this re-render, the `inlineTextEditorStyle` useMemo recalculates and returns a new object reference (even though the actual style values haven't changed), causing React to see the textarea's `style` prop as changed. This triggers a DOM node unmount/remount cycle, which resets focus, selection, and cursor position.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type KeyboardEvent (character input in textarea)
  OUTPUT: boolean
  
  RETURN input.type === 'input'
         AND input.target === inlineTextEditorRef.current
         AND editingText !== null
         AND textareaNodeUnmountedAndRemounted()
END FUNCTION
```

### Examples

- **Example 1**: User double-clicks "Visionary" text, types "a" → textarea shows "a", types "b" → textarea shows "b" (not "ab")
- **Example 2**: User edits text, types "Hello" → each keystroke replaces previous character, final result is "o" instead of "Hello"
- **Example 3**: User types quickly "test" → only sees "t" because each keystroke unmounts/remounts the textarea, losing previous input
- **Edge case**: User types with camera zoomed at 50% or 200% → bug still occurs because style recalculation happens regardless of zoom level

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Double-clicking a text item must continue to enter inline edit mode and display the textarea editor
- Initial focus and select-all behavior when entering edit mode must remain unchanged
- Clicking outside the textarea must continue to save changes and exit edit mode
- Pressing Escape must continue to cancel editing without saving
- Pressing Enter (without Shift) must continue to finish editing and save
- Textarea positioning, sizing, rotation, and styling must remain visually identical
- Camera zoom and pan must continue to update textarea position correctly
- Transformer handles must continue to be hidden during text editing

**Scope:**
All inputs and interactions that do NOT involve typing characters in the inline textarea should be completely unaffected by this fix. This includes:
- Mouse interactions (double-click to edit, click outside to save)
- Keyboard shortcuts (Escape, Enter)
- Camera transformations (zoom, pan)
- Initial textarea mounting and focus behavior

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **useMemo Dependency Issue**: The `inlineTextEditorStyle` useMemo depends on `[camera, editingTextItem]`, but `editingTextItem` is itself a useMemo that depends on `[editingText?.id, items]`. When `editingText.value` changes (on keystroke), React re-renders the component. Even though `camera` and `editingTextItem` haven't changed, the `inlineTextEditorStyle` useMemo recalculates and returns a new object reference.

2. **Object Reference Instability**: React's reconciliation algorithm compares the `style` prop by reference. When `inlineTextEditorStyle` returns a new object (even with identical values), React treats it as a prop change and unmounts/remounts the textarea DOM node.

3. **State Update Timing**: The `onChange` handler uses `setEditingText((current) => ...)` functional update, which triggers a re-render. This re-render happens before the textarea can process the keystroke naturally, causing the DOM node to be recreated mid-input.

4. **Missing Memoization Boundary**: The textarea component itself is not memoized or separated into a stable component, so it participates in every parent re-render and is subject to the style object reference instability.

## Correctness Properties

Property 1: Bug Condition - Textarea Stability During Typing

_For any_ keyboard input where a character is typed in the inline textarea editor (isBugCondition returns true), the fixed implementation SHALL keep the textarea DOM node mounted and stable, allowing the character to be appended to the existing text without unmounting/remounting the textarea, resetting focus, or selecting all text.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Typing Interactions

_For any_ interaction that is NOT typing in the inline textarea (double-click to edit, click outside, Escape, Enter, camera transformations), the fixed implementation SHALL produce exactly the same behavior as the original code, preserving all existing functionality including initial focus/select-all, blur-to-save, and keyboard shortcuts.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/pages/Workspace.jsx`

**Function**: `Workspace` component (inline text editor section)

**Specific Changes**:

1. **Stabilize Style Object Reference**: Modify the `inlineTextEditorStyle` useMemo to use a more stable dependency array or implement deep comparison to prevent unnecessary recalculations when only `editingText.value` changes.

2. **Separate Style Calculation from Value Updates**: Split the style calculation logic to ensure it only recalculates when positioning/sizing properties actually change (camera position, item dimensions, rotation), not when text content changes.

3. **Add useRef for Style Caching**: Introduce a ref to cache the previous style object and only update it when actual style-affecting properties change, preventing reference instability.

4. **Memoize Textarea Component**: Extract the textarea into a separate memoized component that only re-renders when its actual props change, isolating it from parent re-renders caused by `editingText.value` updates.

5. **Optimize editingTextItem Calculation**: Ensure `editingTextItem` useMemo only recalculates when `editingText.id` or `items` array actually changes, not on every render.

### Implementation Strategy

**Option A: Style Reference Stabilization (Recommended)**
- Keep the inline textarea in the main component
- Use `useRef` to cache the style object
- Only update the cached style when `camera` or `editingTextItem` properties actually change
- Pass the stable ref value to the textarea's `style` prop

**Option B: Component Extraction**
- Extract the textarea into a separate `InlineTextEditor` component
- Wrap it with `React.memo` with custom comparison function
- Pass only the necessary props (style, value, handlers)
- Ensure handlers are stable using `useCallback`

**Option C: Key-based Remounting Control**
- Add a stable `key` prop to the textarea based on `editingText.id`
- This ensures the textarea only remounts when editing a different text item
- Combined with style stabilization for complete fix

**Recommended Approach**: Combination of Option A and Option C
- Use `key={editingText.id}` to control remounting lifecycle
- Stabilize style object reference using `useRef` or deep comparison
- This provides both explicit remounting control and prevents accidental remounts

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (textarea unmounting on keystroke), then verify the fix works correctly (textarea remains stable) and preserves existing behavior (initial focus/select-all, blur-to-save, keyboard shortcuts).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the textarea DOM node unmounts and remounts on every keystroke, causing focus loss and selection reset.

**Test Plan**: Write tests that simulate typing in the inline textarea editor and assert that the DOM node remains stable (same node reference) across keystrokes. Run these tests on the UNFIXED code to observe failures and confirm the root cause.

**Test Cases**:
1. **Single Character Test**: Type "a" in inline editor → assert textarea node unmounts/remounts (will fail on unfixed code)
2. **Multi-Character Test**: Type "abc" sequentially → assert only "c" remains in textarea (will fail on unfixed code)
3. **Rapid Typing Test**: Type "Hello World" quickly → assert final text is "d" not "Hello World" (will fail on unfixed code)
4. **Focus Persistence Test**: Type "a", check focus → type "b", check focus → assert focus lost between keystrokes (will fail on unfixed code)

**Expected Counterexamples**:
- Textarea DOM node reference changes on every keystroke
- Previous characters are lost/replaced by new characters
- Cursor position resets to beginning after each keystroke
- All text becomes selected (Ctrl+A behavior) before each character insertion

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (typing in inline editor), the fixed implementation produces the expected behavior (stable textarea, natural text composition).

**Pseudocode:**
```
FOR ALL keystroke WHERE isBugCondition(keystroke) DO
  textareaNodeBefore := getTextareaNode()
  simulateKeystroke(keystroke)
  textareaNodeAfter := getTextareaNode()
  ASSERT textareaNodeBefore === textareaNodeAfter  // Same DOM node
  ASSERT cursorPositionAdvanced()  // Cursor moved forward
  ASSERT noTextSelected()  // No Ctrl+A behavior
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (non-typing interactions), the fixed implementation produces the same result as the original implementation.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT isBugCondition(interaction) DO
  ASSERT fixedBehavior(interaction) = originalBehavior(interaction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different interaction types
- It catches edge cases like different zoom levels, rotation angles, and camera positions
- It provides strong guarantees that behavior is unchanged for all non-typing interactions

**Test Plan**: Observe behavior on UNFIXED code first for non-typing interactions (double-click, blur, Escape, Enter, camera transforms), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Initial Focus/Select-All Preservation**: Double-click text item → assert textarea appears, has focus, and all text is selected
2. **Blur-to-Save Preservation**: Edit text, click outside → assert changes are saved and edit mode exits
3. **Escape Key Preservation**: Edit text, press Escape → assert changes are discarded and edit mode exits
4. **Enter Key Preservation**: Edit text, press Enter → assert changes are saved and edit mode exits
5. **Camera Transform Preservation**: Edit text, zoom/pan camera → assert textarea position updates correctly
6. **Transformer Hiding Preservation**: Enter edit mode → assert Transformer handles are hidden during editing

### Unit Tests

- Test textarea DOM node stability across multiple keystrokes
- Test that typing "abc" results in "abc" not "c"
- Test cursor position advances naturally after each character
- Test no text selection occurs during normal typing
- Test initial focus and select-all behavior on edit mode entry
- Test blur, Escape, and Enter key handlers continue to work

### Property-Based Tests

- Generate random text strings and verify they can be typed completely without character loss
- Generate random camera positions/zoom levels and verify textarea positioning remains correct
- Generate random text item properties (position, rotation, fontSize) and verify style calculation is correct
- Test that textarea only remounts when `editingText.id` changes, not when `editingText.value` changes

### Integration Tests

- Test full editing flow: double-click → type multi-character text → click outside → verify text saved
- Test editing with camera transformations: enter edit mode → zoom in → type → zoom out → verify text correct
- Test rapid editing: double-click → type quickly → press Enter → verify all characters captured
- Test editing multiple text items sequentially: edit item A → save → edit item B → verify no interference
