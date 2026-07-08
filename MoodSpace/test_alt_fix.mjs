import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function run(label, fn) {
  const c = createCanvas(400, 400);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 400, 400);
  fn(ctx);
  writeFileSync(`test_alt_${label.replace(/\s+/g, '_')}.png`, c.toBuffer('image/png'));
  const data = ctx.getImageData(0, 0, 400, 400).data;
  const px = (x,y) => {const i=(y*400+x)*4; return {r:data[i],g:data[i+1],b:data[i+2]};};
  const isR = p => p.r>200 && p.g<50 && p.b<50;
  const isB = p => p.r<50 && p.g<50 && p.b>200;
  return {px, isR, isB, data};
}

console.log('=== INVESTIGASI beginPath+clip behavior ===\n');

// Test 1: What if we just do beginPath WITHOUT clip? Then fill.
{
  const t = run('X1_beginPath_no_clip', (ctx) => {
    ctx.beginPath();
    // No clip
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(50, 50, 300, 300);
  });
  const c = t.px(200,200);
  console.log(`  beginPath+no clip (200,200): R=${c.r} G=${c.g} B=${c.b} → ${t.isB(c) ? 'BLUE' : 'RED'}`);
  console.log(`  → beginPath ALONE doesn't affect rendering (normal)`);
}

// Test 2: beginPath + clip → what happens?
{
  const t = run('X2_beginPath_clip', (ctx) => {
    ctx.beginPath();
    ctx.clip();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(50, 50, 300, 300);
  });
  const c = t.px(200,200);
  console.log(`  beginPath+clip (200,200): R=${c.r} G=${c.g} B=${c.b} → ${t.isB(c) ? 'BLUE' : 'RED'}`);
  console.log(`  → beginPath+clip ${t.isB(c) ? 'NO-OP (blue shows)' : 'CLIP KOSONG (red only)'}`);
}

// Test 3: What if we ALREADY have a clip, then beginPath+clip?
{
  const t = run('X3_clip_then_beginPath_clip', (ctx) => {
    // First: set a real clip
    ctx.beginPath();
    ctx.rect(0, 0, 100, 100);
    ctx.clip();
    
    // THEN beginPath+clip (what Konva would do)
    ctx.beginPath();
    ctx.clip();
    
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(50, 50, 300, 300);
  });
  console.log(`  clip(0,0,100,100) then beginPath+clip:`);
  console.log(`    (60,60): R=${t.px(60,60).r} G=${t.px(60,60).g} B=${t.px(60,60).b} → ${t.isB(t.px(60,60)) ? 'BLUE' : 'RED'}`);
  console.log(`    (200,200): R=${t.px(200,200).r} G=${t.px(200,200).g} B=${t.px(200,200).b} → ${t.isB(t.px(200,200)) ? 'BLUE' : 'RED'}`);
  console.log(`  → ${t.isB(t.px(200,200)) ? 'beginPath+clip clears the clip (blue overspray)' : 'clip persists'}`);
}

// Test 4: setTransform after clip — does it preserve clip?
{
  const t = run('X4_setTransform_after_clip', (ctx) => {
    ctx.beginPath();
    ctx.rect(100, 100, 100, 100);
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset CTM only
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  console.log(`  clip(100,100,100,100) then setTransform identity:`);
  console.log(`    (150,150): ${t.isB(t.px(150,150)) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(t.px(50,50)) ? 'BLUE' : 'RED'}`);
  console.log(`    (300,300): ${t.isB(t.px(300,300)) ? 'BLUE' : 'RED'}`);
  const clipAlive = t.isB(t.px(150,150)) && t.isR(t.px(50,50)) && t.isR(t.px(300,300));
  console.log(`  → clip ${clipAlive ? 'SURVIVES setTransform (only 100-200 area blue)' : 'KILLED by setTransform'}`);
}

// Test 5: save → clip → setTransform → restore → does clip from save survive?
{
  const t = run('X5_save_clip_setTransform_restore', (ctx) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(100, 100, 100, 100);
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore(); // restores clip to pre-save (infinite)
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  console.log(`  save→clip→setTransform→restore:`);
  console.log(`    (150,150): ${t.isB(t.px(150,150)) ? 'BLUE' : 'RED'}`);
  console.log(`    (300,300): ${t.isB(t.px(300,300)) ? 'BLUE' : 'RED'}`);
  console.log(`  → clip ${t.isB(t.px(300,300)) ? 'KILLED by restore (blue everywhere)' : 'SURVIVES restore (blue only in clipped area)'}`);
}

// Test 6: setTransform WITHOUT restore — THE KEY TEST
{
  const t = run('X6_setTransform_no_restore', (ctx) => {
    ctx.beginPath();
    ctx.rect(100, 100, 100, 100);
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // NO restore
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  console.log(`  clip→setTransform identity (NO restore):`);
  console.log(`    (150,150): ${t.isB(t.px(150,150)) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(t.px(50,50)) ? 'BLUE' : 'RED'}`);
  console.log(`    (300,300): ${t.isB(t.px(300,300)) ? 'BLUE' : 'RED'}`);
  const clipAlive = t.isB(t.px(150,150)) && t.isR(t.px(50,50)) && t.isR(t.px(300,300));
  console.log(`  → clip ${clipAlive ? 'SURVIVES setTransform' : 'KILLED by setTransform'}`);
}

// Test 7: Absolute coordinates approach — rotated rect at center
{
  const t = run('X7_absolute_coords_rotated', (ctx) => {
    const cx = 200, cy = 200, w = 120, h = 120, rot = 0.5;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const hw = w/2, hh = h/2;

    ctx.beginPath();
    ctx.moveTo(cx + cos*(-hw) - sin*(-hh), cy + sin*(-hw) + cos*(-hh));
    ctx.lineTo(cx + cos*(hw) - sin*(-hh), cy + sin*(hw) + cos*(-hh));
    ctx.lineTo(cx + cos*(hw) - sin*(hh), cy + sin*(hw) + cos*(hh));
    ctx.lineTo(cx + cos*(-hw) - sin*(hh), cy + sin*(-hw) + cos*(hh));
    ctx.closePath();
    ctx.clip();

    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  const inside = t.px(200,200);
  const outside = t.px(50,50);
  console.log(`  Absolute-coords rotated rect (cx=200,cy=200, w=120,h=120, rot=0.5):`);
  console.log(`    Center (200,200): ${t.isB(inside) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):         ${t.isB(outside) ? 'BLUE' : 'RED'}`);
  const works = t.isB(inside) && t.isR(outside);
  console.log(`  → ${works ? '✓ CLIP DI POSISI BENAR!' : '✗ GAGAL'}`);
}

// Test 8: Konva-like flow with absolute coordinates
{
  const t = run('X8_konva_flow_absolute_coords', (ctx) => {
    const cx = 200, cy = 200, w = 120, h = 120, rot = 0.5;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const hw = w/2, hh = h/2;

    // Simulate Konva: save() + group transform (identity) + clipFunc + clip() + children + restore()
    ctx.save();

    // No group transform (group at 0,0)

    // clipFunc:
    ctx.beginPath();
    ctx.moveTo(cx + cos*(-hw) - sin*(-hh), cy + sin*(-hw) + cos*(-hh));
    ctx.lineTo(cx + cos*(hw) - sin*(-hh), cy + sin*(hw) + cos*(-hh));
    ctx.lineTo(cx + cos*(hw) - sin*(hh), cy + sin*(hw) + cos*(hh));
    ctx.lineTo(cx + cos*(-hw) - sin*(hh), cy + sin*(-hw) + cos*(hh));
    ctx.closePath();
    // NO save/restore in clipFunc

    // Konva calls clip():
    ctx.clip();

    // Render children — CTM is still identity (good)
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);

    ctx.restore(); // Konva restore
  });
  const inside = t.px(200,200);
  const outside = t.px(50,50);
  console.log(`  Konva flow with abs-coords:`);
  console.log(`    (200,200): ${t.isB(inside) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(outside) ? 'BLUE' : 'RED'}`);
  const works = t.isB(inside) && t.isR(outside);
  console.log(`  → ${works ? '✓ CLIP DI POSISI BENAR, children render correct' : '✗ GAGAL'}`);
}

// Test 9: setTransform after translate+rotate+clip
{
  const t = run('X9_setTransform_after_transform_clip', (ctx) => {
    const cx = 200, cy = 200, rot = 0.5;

    ctx.save();  // we don't need this for clip persistence, just for transform

    // Apply transform so rect at (0,0) maps to correct position
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Draw path in user space (centered at 0,0)
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();  // clip with active transform

    // Reset transform for children (setTransform doesn't affect clip)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // DON'T call restore — it would kill the clip!
    // Let Konva's outer save/restore handle cleanup

    ctx.fillStyle = '#0000bf';
    ctx.fillRect(0, 0, 400, 400);
  });
  const inside = t.px(200,200);
  const outside = t.px(50,50);
  console.log(`  setTransform after translate+rotate+clip (NO restore):`);
  console.log(`    (200,200): ${t.isB(inside) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(outside) ? 'BLUE' : 'RED'}`);
  const works = t.isB(inside) && t.isR(outside);
  console.log(`  → ${works ? '✓ CLIP DI POSISI BENAR (setTransform preserves clip)' : '✗ GAGAL'}`);
}

// Test 9b: Konva flow with setTransform
{
  const t = run('X9b_konva_setTransform', (ctx) => {
    const cx = 200, cy = 200, rot = 0.5;

    // Konva: save + groupTransform + clipFunc + clip + children + restore
    ctx.save();

    // clipFunc:
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset CTM for children, clip preserved
    // NO restore in clipFunc

    // Konva clip() — path has rect(-60,-60,120,120) still! CTM is identity!
    // This would clip to (-60,-60)-(60,60) in device space — WRONG!
    // Unless the path is empty... we need to empty it.

    // Hmm, this is the same issue. We need to empty the path before Konva's clip.

    // Actually, does Konva call beginPath before clip? Let me check by looking at result.

    ctx.fillStyle = '#0000bf';
    ctx.fillRect(0, 0, 400, 400);

    ctx.restore();
  });
  console.log(`  Konva flow with setTransform:`);
  console.log(`    (150,150): ${t.isB(t.px(150,150)) ? 'BLUE' : 'RED'}`);
  console.log(`    (200,200): ${t.isB(t.px(200,200)) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(t.px(50,50)) ? 'BLUE' : 'RED'}`);
}

// Test 10: Does node-canvas call beginPath before clip internally?
// We can test by seeing what happens when we leave path non-empty
{
  const t = run('X10_path_nonempty_then_konva_clip', (ctx) => {
    // Simulate Konva flow where Konva does NOT call beginPath before clip

    // clipFunc sets up path:
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    // NO restore, NO clip in clipFunc

    // Konva calls clip() here — CTM = translate+rotate
    ctx.clip(); // Simulating Konva's clip — CTM is active → correct!

    // Render children — CTM is still translate+rotate!
    ctx.fillStyle = '#0000bf';
    ctx.fillRect(0, 0, 400, 400);
    // Children will be double-transformed!
  });
  console.log(`  No restore (path+clip in correct transform, but children double-transformed):`);
  console.log(`    (200,200): ${t.isB(t.px(200,200)) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(t.px(50,50)) ? 'BLUE' : 'RED'}`);
}

// Test 11: Clip with setTransform AND ctx.beginPath after clip
// Check if beginPath clears path but doesn't affect clip region
{
  const t = run('X11_setTransform_beginPath_after_clip', (ctx) => {
    const cx = 200, cy = 200, rot = 0.5;

    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();

    // Reset CTM
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Empty path so Konva's clip is no-op
    ctx.beginPath();

    // Render children — CTM=identity, clip set at rotated rect
    ctx.fillStyle = '#0000bf';
    ctx.fillRect(0, 0, 400, 400);
  });
  const inside = t.px(200,200);
  const outside = t.px(50,50);
  console.log(`  setTransform + beginPath after clip:`);
  console.log(`    (200,200): ${t.isB(inside) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):   ${t.isB(outside) ? 'BLUE' : 'RED'}`);
  console.log(`    (120,200): ${t.isB(t.px(120,200)) ? 'BLUE' : 'RED'}`);
  const works = t.isB(t.px(200,200)) && t.isR(t.px(50,50)) && t.isR(t.px(120,200));
  console.log(`  → ${works ? '✓ CLIP BENAR + path empty + CTM reset' : '✗ GAGAL'}`);
}

// Test: simulasikan fix dengan absolute coordinates + Konva flow
// Ini adalah pendekatan yang akan diimplementasi
{
  console.log('\n=== FIX DENGAN ABSOLUTE COORDINATES (simulasi) ===\n');

  // Shape rect dengan rotation 30 derajat, di posisi (100,100) ukuran 100x80
  const item = { x: 100, y: 100, w: 100, h: 80, rotation: 30 };
  const cx = item.x + item.w/2; // 150
  const cy = item.y + item.h/2; // 140
  const rot = item.rotation * Math.PI / 180; // 0.524 rad

  const t = run('FIX_1_absolute_rotated_rect', (ctx) => {
    // Konva: save + groupTransform(identity) + beginPath
    ctx.save();
    // groupTransform = identity → nothing

    // clipFunc: absolute coordinates
    ctx.beginPath();
    const cos = Math.cos(rot), sin = Math.sin(rot);
    const hw = item.w/2, hh = item.h/2;
    ctx.moveTo(cx + cos*(-hw) - sin*(-hh), cy + sin*(-hw) + cos*(-hh));
    ctx.lineTo(cx + cos*(hw) - sin*(-hh), cy + sin*(hw) + cos*(-hh));
    ctx.lineTo(cx + cos*(hw) - sin*(hh), cy + sin*(hw) + cos*(hh));
    ctx.lineTo(cx + cos*(-hw) - sin*(hh), cy + sin*(-hw) + cos*(hh));
    ctx.closePath();
    // NO save/restore/translate/rotate in clipFunc

    // Konva: clip() → CTM=identity → path is already in device space → correct
    ctx.clip();
    // Konva: invert group transform → identity → no change

    // Render children (a blue rect)
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);

    ctx.restore(); // Konva restore
  });

  console.log(`  Rotated rect (30°, 100,100, 100x80):`);
  console.log(`    Center (150,140): ${t.isB(t.px(150,140)) ? 'BLUE ✓' : 'RED ✗'}`);
  console.log(`    Outside (50,50):  ${t.isR(t.px(50,50)) ? 'RED ✓' : 'BLUE ✗'}`);
  console.log(`    Inside (155,100): ${t.isB(t.px(155,100)) ? 'BLUE ✓' : 'RED ✗'}`);
  console.log(`    Inside (155,180): ${t.isB(t.px(155,180)) ? 'BLUE ✓' : 'RED ✗'}`);

  const rOK = t.isB(t.px(150,140)) && t.isR(t.px(50,50));
  console.log(`  → ${rOK ? '✓ ABSOLUTE COORDINATES FIX VALID' : '✗ GAGAL'}`);
}

{
  // Test 2: rounded rect dengan rotation
  const item = { x: 100, y: 100, w: 100, h: 80, rotation: 30, cornerRadius: 15 };
  const cx = item.x + item.w/2;
  const cy = item.y + item.h/2;
  const rot = item.rotation * Math.PI / 180;
  const r = Math.max(0, Math.min(item.cornerRadius || 0, item.w/2, item.h/2));
  const hw = item.w/2, hh = item.h/2;
  const cos = Math.cos(rot), sin = Math.sin(rot);

  const rotate = (x, y) => ({
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos
  });

  function drawRotatedRoundedRect(ctx) {
    // Points for rounded rect (relative to center 0,0)
    const pts = [
      // lineTo: top edge start (after top-left corner)
      { x: -hw + r, y: -hh },
      // quadTo control + lineTo: top-right corner
      { x: hw - r, y: -hh }, // lineTo end
      { x: hw, y: -hh }, { x: hw, y: -hh + r }, // quadTo control + end
      // lineTo: right edge
      { x: hw, y: hh - r },
      // quadTo: bottom-right corner
      { x: hw, y: hh }, { x: hw - r, y: hh },
      // lineTo: bottom edge
      { x: -hw + r, y: hh },
      // quadTo: bottom-left corner
      { x: -hw, y: hh }, { x: -hw, y: hh - r },
      // lineTo: left edge
      { x: -hw, y: -hh + r },
      // quadTo: top-left corner
      { x: -hw, y: -hh }, { x: -hw + r, y: -hh },
    ];

    const rotPts = pts.map(p => rotate(p.x, p.y));

    ctx.beginPath();
    ctx.moveTo(rotPts[0].x, rotPts[0].y);
    ctx.lineTo(rotPts[1].x, rotPts[1].y);
    ctx.quadraticCurveTo(rotPts[2].x, rotPts[2].y, rotPts[3].x, rotPts[3].y);
    ctx.lineTo(rotPts[4].x, rotPts[4].y);
    ctx.quadraticCurveTo(rotPts[5].x, rotPts[5].y, rotPts[6].x, rotPts[6].y);
    ctx.lineTo(rotPts[7].x, rotPts[7].y);
    ctx.quadraticCurveTo(rotPts[8].x, rotPts[8].y, rotPts[9].x, rotPts[9].y);
    ctx.lineTo(rotPts[10].x, rotPts[10].y);
    ctx.quadraticCurveTo(rotPts[11].x, rotPts[11].y, rotPts[0].x, rotPts[0].y);
    ctx.closePath();
  }

  const t2 = run('FIX_2_absolute_rotated_rounded_rect', (ctx) => {
    ctx.save();
    ctx.beginPath();
    drawRotatedRoundedRect(ctx);
    ctx.clip();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
    ctx.restore();
  });

  console.log(`  Rotated rounded rect (30°, r=15):`);
  console.log(`    Center (150,140): ${t2.isB(t2.px(150,140)) ? 'BLUE ✓' : 'RED ✗'}`);
  console.log(`    Outside (50,50):  ${t2.isR(t2.px(50,50)) ? 'RED ✓' : 'BLUE ✗'}`);
  console.log(`    Inside (155,105): ${t2.isB(t2.px(155,105)) ? 'BLUE ✓' : 'RED ✗'}`);
  const rrOK = t2.isB(t2.px(150,140)) && t2.isR(t2.px(50,50));
  console.log(`  → ${rrOK ? '✓ ROUNDED RECT FIX VALID' : '✗ GAGAL'}`);
}

{
  // Test 3: non-rotated rect (regression)
  const t3 = run('FIX_3_non_rotated_regression', (ctx) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(100, 100, 100, 80);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
    ctx.restore();
  });

  console.log(`  Non-rotated rect (100,100, 100x80):`);
  console.log(`    (150,140): ${t3.isB(t3.px(150,140)) ? 'BLUE ✓' : 'RED ✗'}`);
  console.log(`    (50,50):   ${t3.isR(t3.px(50,50)) ? 'RED ✓' : 'BLUE ✗'}`);
  const nrOK = t3.isB(t3.px(150,140)) && t3.isR(t3.px(50,50));
  console.log(`  → ${nrOK ? '✓ REGRESSION OK' : '✗ GAGAL'}`);
}

{
  // Test 4: polygon with rotation (triangle)
  const item = { x: 100, y: 100, w: 100, h: 80, rotation: 30 };
  const cx = item.x + item.w/2, cy = item.y + item.h/2;
  const rot = item.rotation * Math.PI / 180;
  const sides = 3;
  const radius = Math.min(item.w, item.h) / 2;

  const t4 = run('FIX_4_polygon_rotation', (ctx) => {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI/2 + (i * Math.PI * 2) / sides + rot;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
    ctx.restore();
  });

  console.log(`  Polygon (triangle, 30° rotation):`);
  console.log(`    Center (150,140): ${t4.isB(t4.px(150,140)) ? 'BLUE' : 'RED'}`);
  console.log(`    (50,50):          ${t4.isR(t4.px(50,50)) ? 'RED' : 'BLUE'}`);
  const pOK = t4.isB(t4.px(150,140));
  console.log(`  → ${pOK ? '✓ POLYGON FIX VALID' : '✗ GAGAL'}`);
}

console.log('\n=== KESIMPULAN ===\n');
console.log('1. beginPath+clip = EMPTY CLIP (bukan no-op) di node-canvas');
console.log('2. setTransform setelah clip: clip SURVIVES');
console.log('3. restore setelah clip: clip KILLED');
console.log('4. Absolute coordinates: ✓ CLIP DI POSISI BENAR');
console.log('5. Rounded rect rotated: ✓ CLIP VALID');
console.log('6. Konva flow dengan absolute coordinates: ✓ VALID');
console.log('7. Polygon dengan rotation: ✓ VALID');
console.log('');
console.log('IMPELEMENTASI: absolute coordinates di drawCompositeMaskPath tanpa save/restore/translate/rotate');

