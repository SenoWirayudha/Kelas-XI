import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

const W = 400, H = 400;

function test(label, fn) {
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff0000'; // red background
  ctx.fillRect(0, 0, W, H);
  fn(ctx);
  writeFileSync(`test_output_${label.replace(/\s+/g, '_')}.png`, c.toBuffer('image/png'));
  console.log(`  ✓ ${label}`);
}

// ============ TEST 1: beginPath() + clip() no-op ============
test('1a_beginPath_plus_clip_no-op', (ctx) => {
  // After beginPath(), current path is empty
  ctx.beginPath();
  ctx.clip(); // Should be no-op: no subpaths → do nothing
  // This large blue rect should appear fully
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(50, 50, 300, 300);
});

test('1b_clip_without_beginPath_control', (ctx) => {
  // First create a path (small rect in top-left)
  ctx.beginPath();
  ctx.rect(0, 0, 100, 100); // small clip region
  ctx.clip();
  // This large blue rect should ONLY appear in top-left 100x100
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(50, 50, 300, 300);
});

test('1c_pointless_clip_after_beginPath_is_safe', (ctx) => {
  // First clip to small rect
  ctx.beginPath();
  ctx.rect(0, 0, 100, 100);
  ctx.clip();

  // Then "clear" it with beginPath + clip
  ctx.beginPath();
  ctx.clip();

  // Now draw — if beginPath+clip restores infinite clip, blue fills fully
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(50, 50, 300, 300);
});

// ============ TEST 2: clip() before restore() persistence ============
test('2a_clip_before_restore_persistence', (ctx) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 100, 100); // small rect at origin
  ctx.clip();
  ctx.restore(); // Should revert clip region to pre-save state (infinite)
  // Draw large rect — if clip survived restore, only 100x100 shows blue
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(50, 50, 300, 300);
});

test('2b_clip_after_restore_is_unaffected', (ctx) => {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 100, 100);
  ctx.clip();
  ctx.restore();

  // Set ANOTHER clip AFTER restore — this should work independently
  ctx.beginPath();
  ctx.rect(200, 200, 150, 150);
  ctx.clip();

  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 0, W, H); // Should only fill 200,200 to 350,350
});

// ============ TEST 3: The actual fix (clip before restore + beginPath) ============
test('3a_fix_translate_rotate_clip_beginpath_restore', (ctx) => {
  // Simulate the fix for a shape at (100,100) with rotation
  ctx.save();
  ctx.translate(200, 200); // centerX, centerY
  ctx.rotate(0.5); // ~28.6 degrees
  ctx.beginPath();
  ctx.rect(-60, -60, 120, 120); // shape centered at (0,0)
  ctx.closePath();
  ctx.clip();     // clip with rotate+translate → correct position
  ctx.beginPath(); // empty current path → Konva's clip becomes no-op
  ctx.restore();  // revert transform

  // Now "render children" — a large blue rect at identity transform
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 0, W, H);
  // Expected: blue clipped to rotated rect at (200,200)
  // Background red shows outside the rotated rect
});

test('3b_fix_is_same_as_direct_clip_control', (ctx) => {
  // Control: create the SAME clip but WITHOUT save/restore hassle
  // Just direct clip + beginPath
  ctx.translate(200, 200);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.rect(-60, -60, 120, 120);
  ctx.closePath();
  ctx.clip();
  ctx.beginPath();
  // reset transform for children
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 0, W, H);
  // Expected: identical to 3a
});

// ============ TEST 4: Verify Konva's problematic pattern (current bug) ============
test('4a_current_bug_save_translate_rotate_path_restore', (ctx) => {
  // This is what current drawCompositeMaskPath does (with save/restore)
  ctx.save();
  ctx.translate(200, 200);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.rect(-60, -60, 120, 120);
  ctx.closePath();
  ctx.restore(); // ← revert transform BEFORE Konva clips
  // Konva calls ctx.clip() here — transform is identity
  // clip path at (0,0)-(120,120) instead of rotated at (200,200)

  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 0, W, H);
  // Expected: blue clipped to 120x120 at origin, NOT rotated, NOT at 200,200
});

test('4b_fix_prev_save_translate_rotate_path_clip_beginPath_restore', (ctx) => {
  // THE FIX: clip() before restore(), beginPath() to clear path
  ctx.save();
  ctx.translate(200, 200);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.rect(-60, -60, 120, 120);
  ctx.closePath();
  ctx.clip();     // ← clip with active transform → CORRECT
  ctx.beginPath(); // ← empty current path → Konva clip() = no-op
  ctx.restore();  // ← revert transform → children render correctly

  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, 0, W, H);
  // Expected: blue clipped to rotated rect at (200,200)
});

console.log('All tests generated. Check the PNG files.');
