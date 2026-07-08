import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function runTest(label, fn) {
  const c = createCanvas(400, 400);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 400, 400);
  fn(ctx);

  const data = ctx.getImageData(0, 0, 400, 400).data;
  const px = (x, y) => { const i = (y * 400 + x) * 4; return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] }; };
  const isRed = (p) => p.r > 200 && p.g < 50 && p.b < 50;
  const isBlue = (p) => p.r < 50 && p.g < 50 && p.b > 200;

  writeFileSync(`test_output_${label.replace(/\s+/g, '_')}.png`, c.toBuffer('image/png'));
  console.log(`\n========== ${label} ==========`);
  return { px, isRed, isBlue, data };
}

console.log('=== VERIFIKASI EMPIRIS CLAIM 1: beginPath() + clip() no-op ===\n');

{
  const t = runTest('1a_beginPath_plus_clip_no-op', (ctx) => {
    ctx.beginPath();
    ctx.clip();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(50, 50, 300, 300);
  });
  const center = t.px(200, 200);
  console.log(`  Center (200,200): R=${center.r} G=${center.g} B=${center.b} → ${t.isBlue(center) ? 'BLUE' : t.isRed(center) ? 'RED' : 'OTHER'}`);
  console.log(`  CLAIM 1a: beginPath+clip is no-op → ${t.isBlue(center) ? '✓ TERBUKTI (infinite clip)' : '✗ GAGAL'}`);
}

{
  const t = runTest('1b_clip_without_beginPath_control', (ctx) => {
    ctx.beginPath();
    ctx.rect(0, 0, 100, 100);
    ctx.clip();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(50, 50, 300, 300);
  });
  const inside = t.px(60, 60);
  const outside = t.px(200, 200);
  console.log(`  Inside clip (60,60):  ${t.isBlue(inside) ? 'BLUE' : 'RED'} — should be BLUE`);
  console.log(`  Outside clip (200,200): ${t.isBlue(outside) ? 'BLUE' : 'RED'} — should be RED`);
  console.log(`  CLAIM 1b: clip works normally → ${t.isBlue(inside) && t.isRed(outside) ? '✓' : '✗'}`);
}


console.log('\n=== VERIFIKASI EMPIRIS CLAIM 2: restore() kills clip? ===\n');

{
  const t = runTest('2a_clip_then_restore', (ctx) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, 100, 100);
    ctx.clip();
    ctx.restore();
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(50, 50, 300, 300);
  });
  const inside = t.px(60, 60);
  const outside = t.px(200, 200);
  const clipKilled = t.isBlue(outside);
  console.log(`  Inside (60,60):  ${t.isBlue(inside) ? 'BLUE' : 'RED'}`);
  console.log(`  Outside (200,200): ${t.isBlue(outside) ? 'BLUE' : 'RED'}`);
  console.log(`  restore() ${clipKilled ? 'KILLED clip (outside is BLUE → clip infinite)' : 'PRESERVED clip (outside is RED → clip still active)'}`);
}

console.log('\n=== VERIFIKASI FIX PLAN: clip() BEFORE restore() ===\n');

{
  const t = runTest('3a_fix_clip_before_restore_beginPath', (ctx) => {
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();         // set clip with active transform
    ctx.beginPath();    // empty path
    ctx.restore();      // restore CTM + clip to pre-save

    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  const center = t.px(200, 200);
  const far = t.px(50, 50);
  console.log(`  Center (200,200): ${t.isBlue(center) ? 'BLUE' : 'RED'}`);
  console.log(`  (50,50):          ${t.isBlue(far) ? 'BLUE' : 'RED'}`);
  const fixWorks = t.isBlue(center) && t.isRed(far);
  console.log(`  CLAIM: fix clip BEFORE restore → ${fixWorks ? '✓ Clip rotated at center' : '✗ GAGAL'}`);
}

{
  const t = runTest('3b_direct_clip_control', (ctx) => {
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  const center = t.px(200, 200);
  const far = t.px(50, 50);
  console.log(`  Center (200,200): ${t.isBlue(center) ? 'BLUE' : 'RED'}`);
  console.log(`  (50,50):          ${t.isBlue(far) ? 'BLUE' : 'RED'}`);

  // Compare pixel-by-pixel with 3a
  const tA = runTest('_tmp_noop', () => {});
  const dataA = tA.data; // dummy, we'll generate separately
}

// Pixel-level comparison 3a vs 3b
{
  const generate = (fn) => {
    const c = createCanvas(400,400);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff0000'; ctx.fillRect(0,0,400,400);
    fn(ctx);
    return ctx.getImageData(0,0,400,400).data;
  };

  const d3a = generate((ctx) => {
    ctx.save();
    ctx.translate(200,200); ctx.rotate(0.5);
    ctx.beginPath(); ctx.rect(-60,-60,120,120); ctx.closePath();
    ctx.clip(); ctx.beginPath(); ctx.restore();
    ctx.fillStyle='#0000ff'; ctx.fillRect(0,0,400,400);
  });

  const d3b = generate((ctx) => {
    ctx.translate(200,200); ctx.rotate(0.5);
    ctx.beginPath(); ctx.rect(-60,-60,120,120); ctx.closePath();
    ctx.clip(); ctx.beginPath();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle='#0000ff'; ctx.fillRect(0,0,400,400);
  });

  let identical = true;
  for (let i = 0; i < d3a.length; i++) {
    if (d3a[i] !== d3b[i]) { identical = false; break; }
  }
  console.log(`  3a vs 3b pixel-identical: ${identical ? '✓ YES' : '✗ NO'}`);
}


console.log('\n=== VERIFIKASI BUG EKSISTING ===\n');

{
  const t = runTest('4a_current_bug', (ctx) => {
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.restore();
    // Konva calls ctx.clip() here — CTM=identity

    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  const bugClipInside = t.px(60, 60);
  const bugCenter = t.px(200, 200);
  console.log(`  Bug: (60,60) inside 0,0-120,120 area: ${t.isBlue(bugClipInside) ? 'BLUE' : 'RED'}`);
  console.log(`  Bug: (200,200) center: ${t.isBlue(bugCenter) ? 'BLUE' : 'RED'}`);
  console.log(`  Bug pattern confirms clip at (0,0)-(120,120): ${t.isBlue(t.px(60,60)) && t.isRed(t.px(200,200)) ? '✓ Ya' : '✗ Unexpected'}`);
}

{
  const t = runTest('4b_fix_applied', (ctx) => {
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.restore();

    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);
  });
  const center = t.px(200, 200);
  const far = t.px(50, 50);
  console.log(`  Fix: Center (200,200): ${t.isBlue(center) ? 'BLUE' : 'RED'}`);
  console.log(`  Fix: (50,50):          ${t.isBlue(far) ? 'BLUE' : 'RED'}`);
  console.log(`  FIX PLAN: ${t.isBlue(center) && t.isRed(far) ? '✓ VALID (clip di posisi rotated center)' : '✗ GAGAL'}`);
}

// =========== CRITICAL: clip region survive restore? ===========
console.log('\n=== CRITICAL: Apakah clip region di-preserve setelah restore()? ===');

{
  const c1 = createCanvas(400,400);
  const ctx1 = c1.getContext('2d');
  ctx1.fillStyle = '#ff0000'; ctx1.fillRect(0,0,400,400);
  ctx1.save();
  ctx1.beginPath(); ctx1.rect(0,0,100,100); ctx1.closePath();
  ctx1.clip();
  ctx1.restore();
  ctx1.fillStyle = '#0000ff'; ctx1.fillRect(0,0,400,400);
  const d1 = ctx1.getImageData(0,0,400,400).data;

  const c2 = createCanvas(400,400);
  const ctx2 = c2.getContext('2d');
  ctx2.fillStyle = '#ff0000'; ctx2.fillRect(0,0,400,400);
  ctx2.beginPath(); ctx2.rect(0,0,100,100); ctx2.closePath();
  ctx2.clip();
  ctx2.fillStyle = '#0000ff'; ctx2.fillRect(0,0,400,400);
  const d2 = ctx2.getImageData(0,0,400,400).data;

  let same = true;
  for (let i = 0; i < d1.length; i++) {
    if (d1[i] !== d2[i]) { same = false; break; }
  }

  const p1_60 = {r:d1[(60*400+60)*4], g:d1[(60*400+60)*4+1], b:d1[(60*400+60)*4+2]};
  const p1_200 = {r:d1[(200*400+200)*4], g:d1[(200*400+200)*4+1], b:d1[(200*400+200)*4+2]};
  const p2_60 = {r:d2[(60*400+60)*4], g:d2[(60*400+60)*4+1], b:d2[(60*400+60)*4+2]};
  const p2_200 = {r:d2[(200*400+200)*4], g:d2[(200*400+200)*4+1], b:d2[(200*400+200)*4+2]};

  const p1_60_blue = p1_60.b > 200 && p1_60.r < 50;
  const p1_200_red = p1_200.r > 200 && p1_200.b < 50;
  const p2_60_blue = p2_60.b > 200 && p2_60.r < 50;
  const p2_200_red = p2_200.r > 200 && p2_200.b < 50;

  console.log(`  Clip+restore (60,60):   R=${p1_60.r} G=${p1_60.g} B=${p1_60.b} — inside clip? ${p1_60_blue ? 'BLUE (clipped)' : 'RED (not clipped)'}`);
  console.log(`  Clip+restore (200,200): R=${p1_200.r} G=${p1_200.g} B=${p1_200.b} — outside clip? ${p1_200_red ? 'RED (clipped)' : 'BLUE (overspray)'}`);
  console.log(`  Clip-only (60,60):      R=${p2_60.r} G=${p2_60.g} B=${p2_60.b}`);
  console.log(`  Clip-only (200,200):    R=${p2_200.r} G=${p2_200.g} B=${p2_200.b}`);

  if (p1_200_red && p2_200_red) {
    console.log(`  ■ KLIP DIPRESERVE SETELAH RESTORE: clip+restore masih ngeblok (200,200)=RED, sama kayak clip-only`);
  } else if (p1_200_red && !p2_200_red) {
    console.log(`  ■ BIZARRE: clip+restore block di (200,200) tapi clip-only tidak?`);
  } else if (!p1_200_red && p2_200_red) {
    console.log(`  ■ KLIP DIHAPUS OLEH RESTORE: clip+restore (200,200)=BLUE (overspray). restore() batalin clip!`);
  } else {
    console.log(`  ■ Keduanya (200,200)=BLUE → tidak ada clipping di kedua case → ???`);
  }

  console.log(`  Pixel-identical clip+restore vs clip-only: ${same ? 'SAME pattern' : 'DIFFERENT pattern'}`);
}

console.log('\n=== COMPARISON: Konva clipFunc scenario ===');

// Simulate what Konva does around clipFunc
{
  const d_fix = (() => {
    const c = createCanvas(400,400);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff0000'; ctx.fillRect(0,0,400,400);

    // Konva outer:
    ctx.save();
    ctx.translate(0, 0);  // no group transform for simplicity

    // clipFunc:
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.restore();

    // Konva calls clip() with whatever path is set (now empty → no-op)
    ctx.beginPath(); // simulate Konva's beginPath before clip
    ctx.clip();

    // Render children
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 400, 400);

    ctx.restore();
    return ctx.getImageData(0,0,400,400).data;
  })();

  const d_bug = (() => {
    const c = createCanvas(400,400);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff0000'; ctx.fillRect(0,0,400,400);

    // Konva outer:
    ctx.save();
    ctx.translate(0, 0);

    // clipFunc (BUG pattern):
    ctx.save();
    ctx.translate(200, 200);
    ctx.rotate(0.5);
    ctx.beginPath();
    ctx.rect(-60, -60, 120, 120);
    ctx.closePath();
    ctx.restore();

    // Konva calls clip()
    ctx.beginPath(); // Konva beginPath
    ctx.clip();      // Konva clip → CTM=identity → path at origin

    // Render children
    ctx.fillStyle = '#0000bf'; // slightly different blue for distinction
    ctx.fillRect(0, 0, 400, 400);

    ctx.restore();
    return ctx.getImageData(0,0,400,400).data;
  })();

  function px(data, x, y) {
    const i = (y*400+x)*4;
    return {r:data[i], g:data[i+1], b:data[i+2]};
  }

  const fix_center = px(d_fix, 200, 200);
  const fix_50 = px(d_fix, 50, 50);
  const bug_60 = px(d_bug, 60, 60);
  const bug_200 = px(d_bug, 200, 200);

  const fix_center_blue = fix_center.b > 200 && fix_center.r < 50;
  const fix_50_red = fix_50.r > 200 && fix_50.b < 50;
  const bug_60_blue = bug_60.b > 200 && bug_60.r < 50;
  const bug_200_red = bug_200.r > 200 && bug_200.b < 50;

  console.log(`  FIX: center (200,200)=${fix_center_blue ? 'BLUE' : 'RED'}, (50,50)=${fix_50_red ? 'RED' : 'BLUE'}`);
  console.log(`  BUG: (60,60)=${bug_60_blue ? 'BLUE' : 'RED'}, (200,200)=${bug_200_red ? 'RED' : 'BLUE'}`);

  const fixWorksInKonvaFlow = fix_center_blue && fix_50_red;
  console.log(`  Fix works in Konva flow: ${fixWorksInKonvaFlow ? '✓ YES' : '✗ NO'}`);
}

console.log('\n=== FINAL VERDICT ===');
