import Konva from 'konva'
import { applyRepeater } from './transform-effects.js'

// ─────────────────────────────────────────────
// WebGL Engine
// Render filter via WebGL, baca hasil via readPixels + Y-flip
// readPixels membaca raw straight alpha — RGB tetap utuh meski alpha=0
// ─────────────────────────────────────────────

class WebGLEngine {
  constructor() {
    this._glCanvas = document.createElement('canvas')
    const opts = { preserveDrawingBuffer: true, premultipliedAlpha: false }
    let gl = this._glCanvas.getContext('webgl2', opts)
      || this._glCanvas.getContext('webgl', opts)
      || this._glCanvas.getContext('experimental-webgl', opts)
    if (!gl) {
      gl = this._glCanvas.getContext('webgl2', { preserveDrawingBuffer: true })
        || this._glCanvas.getContext('webgl', { preserveDrawingBuffer: true })
        || this._glCanvas.getContext('experimental-webgl', { preserveDrawingBuffer: true })
    }
    this._gl = gl
    this.supported = !!this._gl
    this._programs = {}
    if (this.supported) {
      this._initQuad()
      this._glCanvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault()
        this.supported = false
      })
    }
  }

  _initQuad() {
    const gl = this._gl
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 0,0,   1,-1, 1,0,   -1,1, 0,1,   1,1, 1,1
    ]), gl.STATIC_DRAW)
    this._quad = buf
  }

  _compileShader(type, src) {
    const gl = this._gl
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      console.error('[WebGL] Shader error:', gl.getShaderInfoLog(s))
    return s
  }

  register(name, fragSrc) {
    if (!this.supported) return
    const gl = this._gl
    const vert = `attribute vec2 aPos,aUV; varying vec2 vUV;
      void main(){ vUV=aUV; gl_Position=vec4(aPos,0,1); }`
    const prog = gl.createProgram()
    gl.attachShader(prog, this._compileShader(gl.VERTEX_SHADER, vert))
    gl.attachShader(prog, this._compileShader(gl.FRAGMENT_SHADER, fragSrc))
    gl.linkProgram(prog)
    this._programs[name] = prog
  }

  // Proses imageData via WebGL, tulis hasil balik ke imageData yang sama
  processSync(imageData, name, uniforms = {}) {
    if (!this.supported) {
      console.warn('[WebGL] Engine not supported — skipping', name)
      return
    }
    const prog = this._programs[name]
    if (!prog) {
      console.warn('[WebGL] Program not found:', name)
      return
    }

    const gl = this._gl
    const { width, height } = imageData
    this._glCanvas.width = width
    this._glCanvas.height = height
    gl.viewport(0, 0, width, height)

    // Upload texture — FLIP_Y supaya UV 0,0 = top-left
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quad)
    const posL = gl.getAttribLocation(prog, 'aPos')
    const uvL  = gl.getAttribLocation(prog, 'aUV')
    gl.enableVertexAttribArray(posL); gl.vertexAttribPointer(posL, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(uvL);  gl.vertexAttribPointer(uvL,  2, gl.FLOAT, false, 16, 8)

    gl.uniform1i(gl.getUniformLocation(prog, 'uTexture'), 0)
    gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), performance.now() / 1000)
    gl.uniform2f(gl.getUniformLocation(prog, 'uResolution'), width, height)
    for (const [k, v] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(prog, k)
      if (!loc) continue
      Array.isArray(v) ? (v.length===2 ? gl.uniform2f(loc,...v) : gl.uniform3f(loc,...v)) : gl.uniform1f(loc, v)
    }

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.finish()

    // Baca hasil via readPixels — membaca raw straight alpha dari drawing buffer
    // Tidak ada konversi premultiplied alpha, RGB tetap utuh meski alpha=0
    const pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

    // readPixels menghasilkan bottom-left origin, ImageData butuh top-left → flip Y
    const dst = imageData.data
    const stride = width * 4
    for (let y = 0; y < height; y++) {
      const srcRow = y * stride
      const dstRow = (height - 1 - y) * stride
      for (let x = 0; x < stride; x++) {
        dst[dstRow + x] = pixels[srcRow + x]
      }
    }

    gl.deleteTexture(tex)
  }
}

export const webglEngine = new WebGLEngine()

// ─────────────────────────────────────────────
// GLSL Shaders
// ─────────────────────────────────────────────
const HIGH_P = `#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif`

const SHADERS = {
  directionalBlur: `${HIGH_P}
    uniform sampler2D uTexture; uniform float uAngle,uStrength,uSamples;
    varying vec2 vUV;
    void main(){
      vec2 dir=vec2(cos(uAngle),sin(uAngle))*uStrength*0.02;
      vec4 c=vec4(0.); float t=0.;
      for(float i=0.;i<32.;i++){
        if(i>=uSamples)break;
        c+=texture2D(uTexture,clamp(vUV+dir*(i/(uSamples-1.)-.5),0.,1.)); t+=1.;
      }
      gl_FragColor=c/t;
    }`,

  rgbSplit: `${HIGH_P}
    uniform sampler2D uTexture; uniform float uOffset,uAngle,uMode;
    uniform vec2 uPadUV, uImgUV;
    varying vec2 vUV;
    void main(){
      vec2 dir = vec2(cos(uAngle), sin(uAngle));
      vec2 shift = dir * uOffset;
      vec2 center = vUV * uImgUV + uPadUV;
      vec2 rUV, gUV, bUV;
      if (uMode < 0.5) {
        // Mode G: G center, B kiri, R kanan
        rUV = clamp(vUV - shift, 0., 1.) * uImgUV + uPadUV;
        gUV = center;
        bUV = clamp(vUV + shift, 0., 1.) * uImgUV + uPadUV;
      } else if (uMode < 1.5) {
        // Mode R: R center, B kiri, G kanan
        rUV = center;
        gUV = clamp(vUV - shift, 0., 1.) * uImgUV + uPadUV;
        bUV = clamp(vUV + shift, 0., 1.) * uImgUV + uPadUV;
      } else {
        // Mode B: B center, G kiri, R kanan
        rUV = clamp(vUV - shift, 0., 1.) * uImgUV + uPadUV;
        gUV = clamp(vUV + shift, 0., 1.) * uImgUV + uPadUV;
        bUV = center;
      }
      vec4 rS = texture2D(uTexture, rUV);
      vec4 gS = texture2D(uTexture, gUV);
      vec4 bS = texture2D(uTexture, bUV);
      float alpha = uMode < 0.5 ? gS.a : (uMode < 1.5 ? rS.a : bS.a);
      gl_FragColor = vec4(rS.r, gS.g, bS.b, alpha);
    }`,

  zoomBlur: `${HIGH_P}
    uniform sampler2D uTexture; uniform float uStrength,uCenterX,uCenterY,uSamples;
    varying vec2 vUV;
    void main(){
      vec2 c=vec2(uCenterX,uCenterY),d=vUV-c;
      vec4 col=vec4(0.); float tot=0.;
      for(float i=0.;i<32.;i++){
        if(i>=uSamples)break;
        float t=i/(uSamples-1.); float w=1.-t*.5;
        col+=texture2D(uTexture,clamp(c+d*(1.-uStrength*.3*t),0.,1.))*w; tot+=w;
      }
      gl_FragColor=col/tot;
    }`,

  spinBlur: `${HIGH_P}
    uniform sampler2D uTexture; uniform float uAngle,uCenterX,uCenterY,uSamples;
    varying vec2 vUV;
    vec2 rot(vec2 v,vec2 c,float a){vec2 d=v-c;return c+vec2(d.x*cos(a)-d.y*sin(a),d.x*sin(a)+d.y*cos(a));}
    void main(){
      vec2 c=vec2(uCenterX,uCenterY); vec4 col=vec4(0.); float tot=0.;
      for(float i=0.;i<32.;i++){
        if(i>=uSamples)break;
        col+=texture2D(uTexture,clamp(rot(vUV,c,uAngle*(i/(uSamples-1.)-.5)),0.,1.)); tot+=1.;
      }
      gl_FragColor=col/tot;
    }`,

  halftone: `${HIGH_P}
    uniform sampler2D uTexture; uniform vec2 uResolution; uniform float uDotSize,uAngle,uSoftness,uInvert;
    uniform vec3 uColor1,uColor2;
    varying vec2 vUV;
    vec2 rotUV(vec2 p,float a){return vec2(p.x*cos(a)-p.y*sin(a),p.x*sin(a)+p.y*cos(a));}
    void main(){
      vec4 src=texture2D(uTexture,vUV);
      float luma=dot(src.rgb,vec3(.299,.587,.114));
      vec2 cell=fract(rotUV(vUV*uResolution,uAngle)/uDotSize)-.5;
      float r=mix(.05,.5,1.-luma), e=uSoftness*.15+.01;
      float d=1.-smoothstep(r-e,r+e,length(cell));
      if(uInvert>.5)d=1.-d;
      gl_FragColor=vec4(mix(uColor2,uColor1,d),src.a);
    }`,

  roughenEdge: `${HIGH_P}
    uniform sampler2D uTexture; uniform float uScale,uStrength,uBorder,uTime,uSpeed;
    varying vec2 vUV;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float ns(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*ns(p);p*=2.;a*=.5;}return v;}
    void main(){
      vec4 orig=texture2D(uTexture,vUV);
      float e=min(min(vUV.x,1.-vUV.x),min(vUV.y,1.-vUV.y));
      float edgeWeight=uBorder>0.?1.-step(uBorder,e):1.;
      float n=fbm(vUV*uScale+vec2(uTime*uSpeed*.1,uTime*uSpeed*.07));
      vec2 d=vUV+(n-.5)*uStrength*.05*edgeWeight;
      vec4 c=texture2D(uTexture,clamp(d,0.,1.));
      gl_FragColor=mix(c,orig,1.-edgeWeight);
      gl_FragColor.a=mix(step(n*uStrength*.08,e),orig.a,1.-edgeWeight);
    }`,

  jpegDamage: `${HIGH_P}
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uTime, uDamage, uBlockSize, uColorBleed, uQuantize, uRinging;
  varying vec2 vUV;

  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float h1(float p){ return fract(sin(p*93.9898)*43758.5453); }

  float fbm(vec2 p){
    float v=0., a=.5;
    for(int i=0;i<4;i++){ v+=a*h(floor(p)); p*=2.1; a*=.5; }
    return v;
  }

  vec3 quant(vec3 c, float l){ return floor(c*l+.5)/l; }

  void main(){
    vec4 src = texture2D(uTexture, vUV);
    vec2 px = 1./uResolution;

    float bs = max(2., uBlockSize);
    vec2 bUV = floor(vUV*uResolution/bs)*bs/uResolution;
    float br  = h(bUV + floor(uTime*.4));
    float corrupt = step(1.-uDamage, br);

    float lowFreq  = fbm(bUV * 3. + uTime*.05) - .5;
    float highFreq = (h(bUV * 17. + uTime*.3) - .5) * .4;
    float freqMix  = lowFreq*.7 + highFreq*.3;

    vec2 off = vec2(
      freqMix * uBlockSize * px.x * 4.,
      (h(bUV+.3)-.5) * uBlockSize * px.y * 2.
    ) * corrupt * uDamage;

    float bleedX = uColorBleed * px.x * bs * .8;
    float bleedY = uColorBleed * px.y * bs * .3;
    float r = texture2D(uTexture, clamp(vUV+off+vec2( bleedX*corrupt,  bleedY*corrupt*.5), 0.,1.)).r;
    float g = texture2D(uTexture, clamp(vUV+off, 0.,1.)).g;
    float b = texture2D(uTexture, clamp(vUV+off-vec2( bleedX*corrupt, -bleedY*corrupt*.5), 0.,1.)).b;
    vec3 c = vec3(r,g,b);

    float qLevels = mix(256., 2., uQuantize * corrupt);
    c = quant(c, qLevels);

    vec2 blockPos = fract(vUV*uResolution/bs);
    float edgeDist = min(min(blockPos.x, 1.-blockPos.x), min(blockPos.y, 1.-blockPos.y));
    float ringing = uRinging * corrupt * smoothstep(.5, 0., edgeDist) * (h(vUV*uResolution+.7)-.5) * .4;
    c += ringing;

    float extreme = step(.96, br) * step(.65, uDamage);
    c = mix(c, vec3(step(.5, h(bUV+1.3))), extreme);

    float lumaShift = (h(bUV+.55)-.5) * uDamage * corrupt * .15;
    c += lumaShift;

    gl_FragColor = vec4(clamp(c,0.,1.), src.a);
  }`,

  filmDamage: `${HIGH_P}
  uniform sampler2D uTexture;
  uniform vec2 uResolution;
  uniform float uTime, uGrain, uScratches, uDust, uFlicker, uVignette, uColorAge;
  varying vec2 vUV;

  float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float h1(float p){ return fract(sin(p*127.1)*43758.5453); }
  float h2(float p){ return fract(cos(p*93.9898)*43758.5453); }

  float grain(vec2 uv, float t){
    float f = floor(t*24.);
    vec2 p = uv * uResolution;
    float n1 = h(floor(p*.5)    + f*7.3);
    float n2 = h(floor(p*1.)    + f*13.7);
    float n3 = h(floor(p*2.)    + f*31.1);
    return (n1*.5 + n2*.35 + n3*.15) - .5;
  }

  float scratch(vec2 uv, float seed, float t){
    float f   = floor(t*8. + seed*73.);
    float xPos = h1(f*.07 + seed);
    float xW   = .0008 + h1(f+seed)*.0015;
    float len  = .3 + h1(f+seed+.5)*.7;
    float yOff = h2(f+seed)*(1.-len);
    float inLen = step(yOff, uv.y)*step(uv.y, yOff+len);
    float stipple = step(.12, h(vec2(uv.y*80., f+seed)));
    float bright = .6 + h1(f*.4+seed)*.4;
    return smoothstep(xW, 0., abs(uv.x-xPos)) * inLen * stipple * bright;
  }

  float hair(vec2 uv, float seed, float t){
    float f    = floor(t*3. + seed*41.);
    float xPos = h1(f*.11 + seed + .2);
    float angle = (h2(f+seed)-.5) * .3;
    float dist = abs((uv.x - xPos) + (uv.y-.5)*angle);
    float xW   = .0005 + h1(f+seed+.3)*.001;
    float inFrame = step(0., uv.y)*step(uv.y, 1.);
    float stipple = step(.08, h(vec2(uv.y*60.+seed, f)));
    return smoothstep(xW, 0., dist) * inFrame * stipple * .7;
  }

  float stain(vec2 uv, float seed, float t){
    float f    = floor(t*1.5 + seed*17.);
    vec2 center = vec2(h1(f+seed), h2(f+seed+.3));
    float size  = .05 + h1(f+seed+.7)*.2;
    float dist  = length(uv - center);
    float edge  = h(uv*8. + f) * .02;
    return 1. - smoothstep(size*.4, size+edge, dist);
  }

  float dust(vec2 uv, float seed, float t){
    float f    = floor(t*5. + seed*53.);
    vec2 pos   = vec2(h1(f+seed), h2(f+seed+.5));
    float size = .001 + h1(f+seed+1.)*.004;
    return 1. - smoothstep(size*.4, size, length(uv-pos));
  }

  void main(){
    vec4 src = texture2D(uTexture, vUV);
    vec3 c = src.rgb;

    float flickerFrame = floor(uTime*18.);
    float flicker = 1. + (h1(flickerFrame)-.5)*uFlicker*.25;
    float hardFlicker = step(.97, h1(flickerFrame*.3)) * uFlicker * .4;
    c *= flicker - hardFlicker;

    float g = grain(vUV, uTime);
    float luma = dot(c, vec3(.299,.587,.114));
    float grainMask = 1. - abs(luma*2. - 1.) * .3;
    c += g * uGrain * .3 * grainMask;

    vec2 vigUV = (vUV - .5) * vec2(1., 1.3);
    float vig  = 1. - dot(vigUV, vigUV) * uVignette * .8;
    c *= max(.0, vig);

    if(uColorAge > 0.){
      c = mix(c, c*.82 + .1, uColorAge*.5);
      c.r = mix(c.r, c.r*1.1,  uColorAge*.4);
      c.g = mix(c.g, c.g*1.02, uColorAge*.2);
      c.b = mix(c.b, c.b*.88,  uColorAge*.5);
      float l2 = dot(c, vec3(.299,.587,.114));
      c = mix(c, vec3(l2), uColorAge*.25);
    }

    for(int i=0; i<5; i++){
      float s = scratch(vUV, float(i)*7.3, uTime);
      float scrColor = .7 + h1(float(i))*.3;
      c = mix(c, vec3(scrColor), s * uScratches);
    }

    for(int i=0; i<3; i++){
      float hv = hair(vUV, float(i)*11.7, uTime);
      c = mix(c, vec3(.1+h1(float(i))*.2), hv * uScratches * .6);
    }

    for(int i=0; i<3; i++){
      float st = stain(vUV, float(i)*19.3, uTime);
      float stainBright = h1(float(i)*3.7+uTime*.1) > .5 ? .85 : .05;
      c = mix(c, vec3(stainBright), st * uDust * .5);
    }

    for(int i=0; i<6; i++){
      float d = dust(vUV, float(i)*7.3, uTime);
      c = mix(c, vec3(.02+h1(float(i))*.1), d * uDust * .8);
    }

    gl_FragColor = vec4(clamp(c, 0., 1.), src.a);
  }`,

    edgeGlow: `${HIGH_P}
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uThreshold;
    varying vec2 vUV;
    float lum(vec3 c) { return 0.299*c.r + 0.587*c.g + 0.114*c.b; }
    void main() {
      vec2 px = 1.0 / uResolution;
      float tl = lum(texture2D(uTexture, clamp(vUV + vec2(-1,-1)*px, 0., 1.)).rgb);
      float t  = lum(texture2D(uTexture, clamp(vUV + vec2( 0,-1)*px, 0., 1.)).rgb);
      float tr = lum(texture2D(uTexture, clamp(vUV + vec2( 1,-1)*px, 0., 1.)).rgb);
      float l  = lum(texture2D(uTexture, clamp(vUV + vec2(-1, 0)*px, 0., 1.)).rgb);
      float r  = lum(texture2D(uTexture, clamp(vUV + vec2( 1, 0)*px, 0., 1.)).rgb);
      float bl = lum(texture2D(uTexture, clamp(vUV + vec2(-1, 1)*px, 0., 1.)).rgb);
      float b  = lum(texture2D(uTexture, clamp(vUV + vec2( 0, 1)*px, 0., 1.)).rgb);
      float br = lum(texture2D(uTexture, clamp(vUV + vec2( 1, 1)*px, 0., 1.)).rgb);
      float gx = -tl - 2.0*l - bl + tr + 2.0*r + br;
      float gy = -tl - 2.0*t - tr + bl + 2.0*b + br;
      float edge = sqrt(gx*gx + gy*gy);
      edge = smoothstep(uThreshold, uThreshold + 0.2, edge);
      gl_FragColor = vec4(vec3(1.0), edge);
    }`,

  vhs: `${HIGH_P}
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uTime;

    uniform float uChromaOffset;
    uniform float uJitter;
    uniform float uSyncLoss;
    uniform float uNoise;
    uniform float uScanlines;
    uniform float uColorBleed;
    uniform float uHeadSwitching;
    uniform float uFade;

    varying vec2 vUV;

    float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float h1(float p){ return fract(sin(p*93.9898)*43758.5453); }
    float h2(float p){ return fract(cos(p*57.2689)*43758.5453); }

    float smoothNoise1D(float x){
      float i=floor(x);
      float f=fract(x);
      float u=f*f*(3.-2.*f);
      return mix(h1(i), h1(i+1.), u);
    }

    float tapeCrease(vec2 uv, float t){
      float creaseTime = floor(t * 0.7);
      float creaseX = h1(creaseTime * 3.7);
      float creaseW = 0.002 + h2(creaseTime) * 0.006;
      float dist = abs(uv.x - creaseX);
      float crease = smoothstep(creaseW, 0., dist);
      float active = step(0.92, h1(creaseTime * 0.5));
      return crease * active;
    }

    float dropout(vec2 uv, float t){
      float frame = floor(t * 24.);
      float lineY = floor(uv.y * uResolution.y);
      float rand = h(vec2(lineY * 0.1, frame * 7.3));
      float active = step(0.97, rand);
      float width = h1(lineY + frame) * 0.003 + 0.001;
      return active * smoothstep(width, 0., abs(fract(uv.y * uResolution.y * 0.5) - 0.5) * 2.);
    }

    void main(){
      vec2 uv = vUV;
      float t = uTime;
      float lineY = floor(uv.y * uResolution.y);
      float px = 1.0 / uResolution.x;

      // Sync Loss: rolling horizontal shake
      float slowSync = smoothNoise1D(t * 1.3) * 0.6 + smoothNoise1D(t * 0.4) * 0.4;
      float fastSync = (h(vec2(floor(lineY * 0.05), floor(t * 3.))) - 0.5);
      float syncShift = (slowSync - 0.5) * 0.7 + fastSync * 0.3;
      uv.x += syncShift * uSyncLoss * 0.05;

      // Line Jitter
      float jitSlow = smoothNoise1D(lineY * 0.01 + t * 2.) - 0.5;
      float jitFast = h(vec2(lineY, floor(t * 18.))) - 0.5;
      float jitter = jitSlow * 0.7 + jitFast * 0.3;
      uv.x += jitter * uJitter * 0.025;
      uv.x = clamp(uv.x, 0., 1.);

      // Chroma Offset
      float chromaMag = uChromaOffset * 0.02;
      float chromaWave = sin(uv.y * 8. + t * 0.5) * 0.3 + 0.7;
      vec2 rUV = clamp(uv + vec2(chromaMag * chromaWave, 0.), 0., 1.);
      vec2 bUV = clamp(uv + vec2(-chromaMag * chromaWave * 0.5, 0.), 0., 1.);
      float r = texture2D(uTexture, rUV).r;
      float g = texture2D(uTexture, uv).g;
      float b = texture2D(uTexture, bUV).b;

      // Color Bleed
      if(uColorBleed > 0.01){
        float bleedR = r, bleedG = g, bleedB = b;
        float weight = 1.0;
        float totalW = 1.0;
        for(int i = 1; i <= 6; i++){
          float dist = float(i) * uColorBleed * px * uResolution.x * 0.015;
          vec2 bleedUV = clamp(uv + vec2(dist, 0.), 0., 1.);
          float w = exp(-float(i) * 0.8);
          vec3 s = texture2D(uTexture, bleedUV).rgb;
          bleedR += s.r * w * 0.4;
          bleedG += s.g * w * 0.8;
          bleedB += s.b * w * 0.9;
          totalW += w;
        }
        float bleedFac = uColorBleed * 0.6;
        r = mix(r, bleedR / totalW, bleedFac);
        g = mix(g, bleedG / totalW, bleedFac);
        b = mix(b, bleedB / totalW, bleedFac);
      }

      vec3 c = vec3(r, g, b);

      // Tape Crease
      float crease = tapeCrease(uv, t);
      c += crease * 0.4;

      // Scanlines
      if(uScanlines > 0.01){
        float staticScan = sin(uv.y * uResolution.y * 3.14159) * 0.5 + 0.5;
        float rollSpeed = t * 0.15;
        float rollScan = sin((uv.y - rollSpeed) * uResolution.y * 0.3) * 0.5 + 0.5;
        rollScan = smoothstep(0.3, 0.7, rollScan);
        float scan = mix(staticScan, rollScan, 0.3);
        c *= 1. - uScanlines * 0.35 * (1. - scan);
      }

      // Luma Noise
      if(uNoise > 0.01){
        float frame24 = floor(t * 24.);
        float lumaNoise = (h(uv * uResolution + frame24) - 0.5) * uNoise * 0.2;
        float chromaNoise = (h(uv * uResolution * 0.5 + frame24 + 37.) - 0.5) * uNoise * 0.08;
        c += lumaNoise;
        c.r += chromaNoise;
        c.b -= chromaNoise * 0.5;
      }

      // Dropout
      float drop = dropout(uv, t);
      c = mix(c, vec3(0.9 + h1(floor(t * 24.)) * 0.1), drop);

      // Head Switching
      if(uHeadSwitching > 0.01){
        float headZone = 1. - uv.y;
        if(headZone < 0.1){
          float hShift = (h1(floor(t * 30.)) - 0.5) * uHeadSwitching * 0.08;
          vec2 headUV = clamp(uv + vec2(hShift, 0.), 0., 1.);
          vec3 headSample = texture2D(uTexture, headUV).rgb;
          float hNoise = h(vec2(uv.x * uResolution.x, floor(t * 30.)));
          float band = smoothstep(0.1, 0., headZone) * uHeadSwitching;
          vec3 headColor = mix(headSample, vec3(hNoise), 0.5);
          c = mix(c, headColor, band * 0.9);
        }
      }

      // Vignette
      vec2 vigUV = uv * 2. - 1.;
      float vig = 1. - dot(vigUV, vigUV) * 0.15;
      c *= vig;

      // Fade/Wash
      if(uFade > 0.01){
        float luma = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, vec3(luma), uFade * 0.3);
        c = mix(c, c * 0.88 + 0.08, uFade * 0.5);
        c.r = mix(c.r, c.r * 0.95, uFade * 0.4);
        c.g = mix(c.g, c.g * 1.03, uFade * 0.3);
        c.b = mix(c.b, c.b * 0.85, uFade * 0.5);
      }

      gl_FragColor = vec4(clamp(c, 0., 1.), texture2D(uTexture, vUV).a);
    }`,

  waveWarp: `${HIGH_P}
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;
    uniform float uAngle;

    varying vec2 vUV;

    void main(){
      float amp = uAmplitude / uResolution.y;
      float freq = uFrequency * 6.2832;
      float phase = uTime * uSpeed;

      // Scanline displacement: setiap baris pixel digeser mengikuti sin
      float wave = sin(vUV.y * freq + phase) * amp;
      float waveX = sin(vUV.x * freq + phase) * amp;

      vec2 disp = vec2(
        wave * cos(uAngle),
        waveX * sin(uAngle)
      );

      vec2 uv = vUV + disp;
      gl_FragColor = texture2D(uTexture, clamp(uv, 0., 1.));
    }`,

  dotMatrix: `${HIGH_P}
    uniform sampler2D uTexture;
    uniform vec2 uResolution;
    uniform float uTileSize;
    uniform float uUseOriginalColor;
    uniform vec3 uDotColor;
    uniform float uShape;
    varying vec2 vUV;
    void main(){
      vec2 px = vUV * uResolution;
      vec2 tileCenter = floor(px / uTileSize) * uTileSize + uTileSize * 0.5;
      vec2 tileUV = tileCenter / uResolution;
      vec4 src = texture2D(uTexture, tileUV);
      float halfTile = uTileSize * 0.5;
      float inDot;
      if (uShape > 0.5) {
        vec2 d = abs(px - tileCenter);
        float squareHalf = halfTile * 0.75;
        float edge = 1.5;
        inDot = 1.0 - smoothstep(squareHalf - edge, squareHalf + edge, max(d.x, d.y));
      } else {
        float d = length(px - tileCenter);
        float edge = 1.5;
        inDot = 1.0 - smoothstep(halfTile - edge, halfTile + edge, d);
      }
      vec3 dotCol = mix(uDotColor, src.rgb, uUseOriginalColor);
      gl_FragColor = vec4(dotCol, src.a * inDot);
    }`,

  threshold: `${HIGH_P}
    uniform sampler2D uTexture;
    uniform float uThreshold;
    uniform float uInvert;
    varying vec2 vUV;
    void main(){
      vec4 src = texture2D(uTexture, vUV);
      float l = dot(src.rgb, vec3(0.299, 0.587, 0.114));
      float val = step(uThreshold / 255.0, l);
      if (uInvert > 0.5) val = 1.0 - val;
      gl_FragColor = vec4(vec3(val), src.a);
    }`,

  spectralMap: `${HIGH_P}
    uniform sampler2D uTexture;
    uniform float uHue0, uHue1, uHue2;
    uniform float uTahap, uRepeat, uSaturation, uAlpha;
    varying vec2 vUV;

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 src = texture2D(uTexture, vUV);
      float luma = dot(src.rgb, vec3(0.299, 0.587, 0.114));
      float t = mod(luma * uRepeat + uTahap, 1.0);

      float seg = t * 3.0;
      float frac = fract(seg);
      float i = floor(seg);
      float hue;
      if (i == 0.0) hue = mix(uHue0, uHue1, frac);
      else if (i == 1.0) hue = mix(uHue1, uHue2, frac);
      else hue = mix(uHue2, uHue0 + 1.0, frac);

      vec3 col = hsv2rgb(vec3(fract(hue), uSaturation, 1.0));
      gl_FragColor = vec4(mix(src.rgb, col, uAlpha), src.a);
    }`,
}

for (const [name, src] of Object.entries(SHADERS)) webglEngine.register(name, src)

// ─────────────────────────────────────────────
// Risograph Texture — full-color single pass (no threshold)
// ─────────────────────────────────────────────
const _risoWeakCache = new WeakMap()

function applyRisographTextureFullColor(imgData, p) {
  const paramKey = JSON.stringify(p)
  const cached = _risoWeakCache.get(imgData)
  if (cached && cached.paramKey === paramKey) {
    imgData.data.set(cached.data)
    return
  }

  const { pr, pg, pb, density, misalignment } = p
  const w = imgData.width, h = imgData.height, d = imgData.data
  const src = new Uint8ClampedArray(d)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const or = src[i], og = src[i+1], ob = src[i+2]
      const origL = (or * 0.299 + og * 0.587 + ob * 0.114) / 255

      let r = or, g = og, b = ob

      // (a) FM DOT SCREENING — density follows luminance
      if (density > 0.01) {
        const localDensity = (1 - origL) * density
        const dotHash = (Math.sin(x * 57.123 + y * 33.789) * 43758.5453) % 1
        const dotNoise = dotHash < 0 ? dotHash + 1 : dotHash
        if (dotNoise > localDensity) {
          const blend = 0.12
          r = r + (pr - r) * blend
          g = g + (pg - g) * blend
          b = b + (pb - b) * blend
        }
      }

      // (b) EDGE-BASED CHANNEL SPLIT — Sobel-like gradient, threshold 0.06
      if (misalignment > 0.01 && x > 0 && x < w - 1 && y > 0 && y < h - 1) {
        const L = (idx) => (src[idx] * 0.299 + src[idx+1] * 0.587 + src[idx+2] * 0.114) / 255
        const gx = L((y * w + (x-1)) * 4) - L((y * w + (x+1)) * 4)
        const gy = L(((y-1) * w + x) * 4) - L(((y+1) * w + x) * 4)
        const gradMag = Math.sqrt(gx * gx + gy * gy)

        if (gradMag > 0.06) {
          const hDir = (Math.sin(x * 13.37 + y * 42.69) * 43758.5453) % 1
          const dir = hDir < 0 ? hDir + 1 : hDir
          const angle = dir * Math.PI * 2
          const off = Math.round(misalignment * 4)
          const dx = Math.round(Math.cos(angle) * off)
          const dy = Math.round(Math.sin(angle) * off)

          const rx = Math.max(0, Math.min(w - 1, x + dx))
          const ry = Math.max(0, Math.min(h - 1, y + dy))
          const bx = Math.max(0, Math.min(w - 1, x - dx))
          const by = Math.max(0, Math.min(h - 1, y - dy))

          r = src[(ry * w + rx) * 4]
          b = src[(by * w + bx) * 4 + 2]
        }
      }

      // (c) PAPER GRAIN OVERLAY
      const ph = (Math.sin(x * 67.319 + y * 53.827) * 43758.5453) % 1
      const pn = ph < 0 ? ph + 1 : ph
      const grainFactor = 0.94 + pn * 0.12
      r = Math.max(0, Math.min(255, r * grainFactor))
      g = Math.max(0, Math.min(255, g * grainFactor))
      b = Math.max(0, Math.min(255, b * grainFactor))

      d[i] = Math.round(r); d[i+1] = Math.round(g); d[i+2] = Math.round(b)
    }
  }
  _risoWeakCache.set(imgData, {
    paramKey,
    data: new Uint8ClampedArray(d),
  })
}

// ─────────────────────────────────────────────
// Canvas 2D pixel helpers
// ─────────────────────────────────────────────
function mirrorPixels(d, w, h, axis) {
  const copy = new Uint8ClampedArray(d)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = (axis==='h'||axis==='both') ? w-1-x : x
    const sy = (axis==='v'||axis==='both') ? h-1-y : y
    const si=(sy*w+sx)*4, di=(y*w+x)*4
    d[di]=copy[si]; d[di+1]=copy[si+1]; d[di+2]=copy[si+2]; d[di+3]=copy[si+3]
  }
}

function spotColorPixels(d, w, h, hex, thr, fea) {
  const toH = (hex) => {
    const r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255
    const max=Math.max(r,g,b), min=Math.min(r,g,b), delta=max-min
    if (!delta) return 0
    const h = max===r ? (g-b)/delta+(g<b?6:0) : max===g ? (b-r)/delta+2 : (r-g)/delta+4
    return h*60
  }
  const th = toH(hex)
  for (let i = 0; i < d.length; i+=4) {
    const r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255
    const max=Math.max(r,g,b), min=Math.min(r,g,b), delta=max-min
    let h=0
    if (delta) h=(max===r?(g-b)/delta+(g<b?6:0):max===g?(b-r)/delta+2:(r-g)/delta+4)*60
    const diff=Math.min(Math.abs(h-th),360-Math.abs(h-th))
    const keep=Math.max(0,1-Math.max(0,diff-thr*(1-fea))/(thr*fea+1))
    if (keep<0.99) {
      const luma=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]
      d[i]=Math.round(d[i]*keep+luma*(1-keep))
      d[i+1]=Math.round(d[i+1]*keep+luma*(1-keep))
      d[i+2]=Math.round(d[i+2]*keep+luma*(1-keep))
    }
  }
}

function monoNoisePixels(d, w, h, amount) {
  for (let i=0;i<d.length;i+=4) {
    const n=(Math.random()-.5)*amount*255
    d[i]=Math.round(Math.max(0,Math.min(255,d[i]+n)))
    d[i+1]=Math.round(Math.max(0,Math.min(255,d[i+1]+n)))
    d[i+2]=Math.round(Math.max(0,Math.min(255,d[i+2]+n)))
  }
}

function chromaKeyPixels(d, w, h, hex, thr, fea) {
  const kr=parseInt(hex.slice(1,3),16), kg=parseInt(hex.slice(3,5),16), kb=parseInt(hex.slice(5,7),16)
  for (let i=0;i<d.length;i+=4) {
    const dr=d[i]-kr, dg=d[i+1]-kg, db=d[i+2]-kb
    const dist=Math.sqrt(dr*dr+dg*dg+db*db), inner=thr*(1-fea)
    if (dist<thr) d[i+3]=dist<inner?0:Math.round(255*(dist-inner)/(thr-inner))
  }
}

function lumaKeyPixels(d, w, h, thr, fea, invert) {
  const range=thr*fea+1
  for (let i=0;i<d.length;i+=4) {
    const luma=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]
    const dist=invert?luma-thr:thr-luma
    if (dist>0) d[i+3]=dist<range?Math.round(255*dist/range):0
  }
}

function replaceColorPixels(d, w, h, fromHex, toHex, thr, fea) {
  const fr=parseInt(fromHex.slice(1,3),16), fg=parseInt(fromHex.slice(3,5),16), fb=parseInt(fromHex.slice(5,7),16)
  const tr=parseInt(toHex.slice(1,3),16), tg=parseInt(toHex.slice(3,5),16), tb=parseInt(toHex.slice(5,7),16)
  const range=Math.max(1, thr)
  for (let i=0;i<d.length;i+=4) {
    const dr=d[i]-fr, dg=d[i+1]-fg, db=d[i+2]-fb
    const dist=Math.sqrt(dr*dr+dg*dg+db*db)
    if (dist>=range) continue
    const t=dist<range*(1-fea) ? 1 : (range-dist)/(range*fea)
    d[i]=Math.round(d[i]*(1-t)+tr*t)
    d[i+1]=Math.round(d[i+1]*(1-t)+tg*t)
    d[i+2]=Math.round(d[i+2]*(1-t)+tb*t)
  }
}

function duotonePixels(d, w, h, hexA, hexB) {
  const ra=parseInt(hexA.slice(1,3),16), ga=parseInt(hexA.slice(3,5),16), ba=parseInt(hexA.slice(5,7),16)
  const rb=parseInt(hexB.slice(1,3),16), gb=parseInt(hexB.slice(3,5),16), bb=parseInt(hexB.slice(5,7),16)
  for (let i=0;i<d.length;i+=4) {
    const l=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])/255
    d[i]=Math.round(ra+(rb-ra)*l); d[i+1]=Math.round(ga+(gb-ga)*l); d[i+2]=Math.round(ba+(bb-ba)*l)
  }
}

function reflectPixels(d, w, h, angleDeg) {
  const cx=w/2, cy=h/2, a=angleDeg*Math.PI/180
  const cos2a=Math.cos(2*a), sin2a=Math.sin(2*a)
  const copy=new Uint8ClampedArray(d)
  for (let y=0;y<h;y++) for (let x=0;x<w;x++) {
    const dx=x-cx, dy=y-cy
    const sx=dx*cos2a+dy*sin2a+cx, sy=dx*sin2a-dy*cos2a+cy
    const ix=Math.floor(sx), iy=Math.floor(sy), fx=sx-ix, fy=sy-iy
    if (ix<0||ix>=w-1||iy<0||iy>=h-1) { d[(y*w+x)*4]=0; d[(y*w+x)*4+3]=0; continue }
    const i00=(iy*w+ix)*4, i10=(iy*w+ix+1)*4, i01=((iy+1)*w+ix)*4, i11=((iy+1)*w+ix+1)*4
    for (let c=0;c<4;c++) {
      d[(y*w+x)*4+c]=Math.round(
        copy[i00+c]*(1-fx)*(1-fy)+copy[i10+c]*fx*(1-fy)+copy[i01+c]*(1-fx)*fy+copy[i11+c]*fx*fy
      )
    }
  }
}

// ─────────────────────────────────────────────
// EffectManager
// ─────────────────────────────────────────────
export class EffectManager {
  constructor() {
    this._overlays = new WeakMap()   // gradient overlay nodes
    this._repeaters = new WeakMap()  // repeater clone nodes
    this._origRotation = new WeakMap() // rotation sebelum efek
  }

  // Panggil ini setiap kali item.effects berubah
  // adjustments opsional — objek item (exposure, brightness, dll) untuk MoodSpaceCombined
  applyAll(node, effects = {}, adjustments) {
    // Don't clear filters/cache here — let the final node.filters()+cache() at the end
    // replace them atomically. This prevents an intermediate un-filtered frame when the
    // previously-scheduled batchDraw fires mid-applyAll.
    // Spectral animation cycle is managed by React useEffect (not EffectManager).
    this._clearOverlay(node)
    this._clearRepeater(node)
    this._clearBounds(node)

    const filterList = []
    let cachePad = 0
    const addPad = (v) => { if (v > cachePad) cachePad = v }

    for (const [id, val] of Object.entries(effects)) {
      if (!val && val !== 0) continue
      if (val === false || val === 'none' || val === '') continue

      // ── Built-in Konva ────────────────────────────────
      if (id === 'invert'    && val) { filterList.push(Konva.Filters.Invert); continue }
      if (id === 'grayscale' && val) { filterList.push(Konva.Filters.Grayscale); continue }
      if (id === 'sepia'     && val) { filterList.push(Konva.Filters.Sepia); continue }
      if (id === 'solarize'  && val) { filterList.push(Konva.Filters.Solarize); continue }
      if (id === 'threshold' && val) {
        const p = val
        filterList.push(function thresholdFilter(imgData) {
          webglEngine.processSync(imgData, 'threshold', {
            uThreshold: p.threshold ?? 128,
            uInvert: p.invert ? 1 : 0,
          })
        })
        continue
      }
      if (id === 'gaussianBlur' && val > 0) {
        const radius = val
        addPad(Math.ceil(radius * 5) + 8)
        filterList.push(function gaussianBlurCanvasFilter(imgData) {
          const src = document.createElement('canvas')
          src.width = imgData.width; src.height = imgData.height
          src.getContext('2d').putImageData(imgData, 0, 0)
          const dst = document.createElement('canvas')
          dst.width = src.width; dst.height = src.height
          const ctx = dst.getContext('2d')
          ctx.filter = `blur(${radius}px)`
          ctx.drawImage(src, 0, 0)
          const out = ctx.getImageData(0, 0, dst.width, dst.height)
          imgData.data.set(out.data)
        })
        continue
      }
      if (id === 'noise' && val) {
        const amount = typeof val === 'number' ? val : (val.amount ?? 0.3)
        const mono = typeof val === 'object' && val.monochrome
        if (amount > 0) {
          if (mono) {
            filterList.push(function monoNoiseFilter(imgData) {
              monoNoisePixels(imgData.data, imgData.width, imgData.height, amount)
            })
          } else {
            node.noise(amount); filterList.push(Konva.Filters.Noise)
          }
        }
        continue
      }
      if (id === 'pixelate' && val > 0) {
        node.pixelSize(Math.max(1, Math.round(val))); filterList.push(Konva.Filters.Pixelate); continue
      }

      // ── Mirror (Canvas 2D pixel) ───────────────────────
      if (id === 'mirror' && val !== 'none') {
        const axis = val
        filterList.push(function mirrorFilter(imgData) {
          mirrorPixels(imgData.data, imgData.width, imgData.height, axis)
        })
        continue
      }

      // ── WebGL filters ──────────────────────────────────
      if (id === 'directionalBlur' && val) {
        const p = val
        filterList.push(function directionalBlurFilter(imgData) {
          webglEngine.processSync(imgData, 'directionalBlur', {
            uAngle: (p.angle ?? 0) * Math.PI / 180,
            uStrength: p.strength ?? 0.5,
            uSamples: p.samples ?? 16,
          })
        })
        addPad(Math.ceil((p.strength ?? 0.5) * 20)); continue
      }
      if (id === 'rgbSplit' && val) {
        const p = val
        addPad(Math.min(
          Math.ceil((p.offset ?? 0.01) * Math.max(node.getAttr('width'), node.getAttr('height'), 200)),
          150
        ))
        const modeVal = { g: 0, r: 1, b: 2 }[p.mode ?? 'g'] ?? 0
        filterList.push(function rgbSplitFilter(imgData) {
          webglEngine.processSync(imgData, 'rgbSplit', {
            uOffset: p.offset ?? 0.01,
            uAngle: (p.angle ?? 0) * Math.PI / 180,
            uMode: modeVal,
            uPadUV: [0, 0],
            uImgUV: [1, 1],
          })
        })
        continue
      }
      if (id === 'zoomBlur' && val) {
        const p = typeof val === 'number' ? { strength: val, centerX: 0.5, centerY: 0.5 } : val
        filterList.push(function zoomBlurFilter(imgData) {
          webglEngine.processSync(imgData, 'zoomBlur', { uStrength: p.strength ?? 0.3, uCenterX: p.centerX ?? 0.5, uCenterY: p.centerY ?? 0.5, uSamples: 16 })
        })
        addPad(Math.ceil((p.strength ?? 0.3) * 100)); continue
      }
      if (id === 'spinBlur' && val) {
        const p = typeof val === 'number' ? { angle: val, centerX: 0.5, centerY: 0.5 } : val
        filterList.push(function spinBlurFilter(imgData) {
          webglEngine.processSync(imgData, 'spinBlur', { uAngle: p.angle ?? 0.3, uCenterX: p.centerX ?? 0.5, uCenterY: p.centerY ?? 0.5, uSamples: 16 })
        })
        addPad(Math.ceil((p.angle ?? 0.3) * 100)); continue
      }
      if (id === 'halftone' && val) {
        const p = val
        const hex1 = p.color1 ?? '#000000'
        const c1r = parseInt(hex1.slice(1,3),16)/255
        const c1g = parseInt(hex1.slice(3,5),16)/255
        const c1b = parseInt(hex1.slice(5,7),16)/255
        const hex2 = p.color2 ?? '#ffffff'
        const c2r = parseInt(hex2.slice(1,3),16)/255
        const c2g = parseInt(hex2.slice(3,5),16)/255
        const c2b = parseInt(hex2.slice(5,7),16)/255
        filterList.push(function halftoneFilter(imgData) {
          webglEngine.processSync(imgData, 'halftone', {
            uDotSize: p.dotSize ?? 8,
            uAngle: (p.angle ?? 0) * Math.PI / 180,
            uSoftness: p.softness ?? 0.3,
            uInvert: p.invert ? 1 : 0,
            uColor1: [c1r, c1g, c1b],
            uColor2: [c2r, c2g, c2b],
          })
        })
        continue
      }
      if (id === 'roughenEdge' && val) {
        const p = val
        filterList.push(function roughenEdgeFilter(imgData) {
          webglEngine.processSync(imgData, 'roughenEdge', {
            uScale: p.scale ?? 10,
            uStrength: p.strength ?? 0.5,
            uBorder: p.border ?? 0.1,
            uSpeed: p.speed ?? 1,
          })
        })
        continue
      }
      if (id === 'waveWarp' && val) {
        const p = val
        addPad(Math.ceil((p.amplitude ?? 20) * 1.5))
        filterList.push(function waveWarpFilter(imgData) {
          webglEngine.processSync(imgData, 'waveWarp', {
            uAmplitude: p.amplitude ?? 20,
            uFrequency: p.frequency ?? 5,
            uSpeed: p.speed ?? 1,
            uAngle: (p.rotation ?? 0) * Math.PI / 180,
          })
        })
        continue
      }
      if (id === 'risograph' && val) {
        const p = val
        const hex1 = p.color1 ?? '#2d5a27', hexP = p.paper ?? '#f4cfc6'
        const c1r = parseInt(hex1.slice(1,3),16), c1g = parseInt(hex1.slice(3,5),16), c1b = parseInt(hex1.slice(5,7),16)
        const pr = parseInt(hexP.slice(1,3),16), pg = parseInt(hexP.slice(3,5),16), pb = parseInt(hexP.slice(5,7),16)
        const thr = p.threshold ?? 0.5, grain = p.grain ?? 0.15
        if (p.mode === 'texture') {
          const density = p.density ?? 0.5, misalignment = p.misalignment ?? 0.3
          filterList.push(function risographTextureFilter(imgData) {
            applyRisographTextureFullColor(imgData, { pr, pg, pb, density, misalignment })
          })
        } else {
          filterList.push(function risographFilter(imgData) {
            const w = imgData.width, h = imgData.height, d = imgData.data
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4
                const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
                const n = noise < 0 ? noise + 1 : noise
                let L = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) / 255
                L = Math.max(0, Math.min(1, L + (n - 0.5) * grain * 2))
                if (L < thr) {
                  d[i] = c1r; d[i+1] = c1g; d[i+2] = c1b
                } else {
                  d[i] = pr; d[i+1] = pg; d[i+2] = pb
                }
              }
            }
          })
        }
        continue
      }
      if (id === 'dotMatrix' && val) {
        const p = val
        const dotHex = p.dotColor ?? '#00ff00'
        const dcr = parseInt(dotHex.slice(1,3),16)/255
        const dcg = parseInt(dotHex.slice(3,5),16)/255
        const dcb = parseInt(dotHex.slice(5,7),16)/255
        filterList.push(function dotMatrixFilter(imgData) {
          webglEngine.processSync(imgData, 'dotMatrix', {
            uTileSize: p.tileSize ?? 10,
            uUseOriginalColor: p.useOriginalColor === false ? 0 : 1,
            uDotColor: [dcr, dcg, dcb],
            uShape: (p.shape ?? 'circle') === 'square' ? 1 : 0,
          })
        })
        continue
      }
      if (id === 'feather' && val > 0) {
        const amount = val
        filterList.push(function featherFilter(imgData) {
          const w = imgData.width, h = imgData.height, d = imgData.data
          const fadeSize = amount * Math.min(w, h) * 0.5
          if (fadeSize <= 1) return
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const minDist = Math.min(x, w - 1 - x, y, h - 1 - y)
              if (minDist < fadeSize) {
                const idx = (y * w + x) * 4
                const alpha = minDist / fadeSize
                d[idx + 3] = Math.round(d[idx + 3] * alpha)
              }
            }
          }
        })
        continue
      }
      if (id === 'edgeGlow' && val) {
        const p = val
        filterList.push(function edgeGlowFilter(imgData) {
          const w = imgData.width, h = imgData.height
          const d = imgData.data
          const orig = new Uint8ClampedArray(d)
          webglEngine.processSync(imgData, 'edgeGlow', {
            uResolution: [w, h],
            uThreshold: p.threshold ?? 0.1,
          })
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          const ctx = canvas.getContext('2d')
          ctx.putImageData(imgData, 0, 0)
          const blurW = document.createElement('canvas')
          blurW.width = w; blurW.height = h
          const blurCtx = blurW.getContext('2d')
          blurCtx.filter = `blur(${p.width ?? 5}px)`
          blurCtx.drawImage(canvas, 0, 0)
          blurCtx.filter = 'none'
          const blurred = blurCtx.getImageData(0, 0, w, h).data
          const hex = p.color ?? '#00ffff'
          const cr = parseInt(hex.slice(1,3), 16)
          const cg = parseInt(hex.slice(3,5), 16)
          const cb = parseInt(hex.slice(5,7), 16)
          const intensity = p.intensity ?? 0.5
          for (let i = 0; i < d.length; i += 4) {
            const glow = (blurred[i + 3] / 255) * intensity
            d[i] = orig[i] * (1 - glow) + cr * glow
            d[i+1] = orig[i+1] * (1 - glow) + cg * glow
            d[i+2] = orig[i+2] * (1 - glow) + cb * glow
            d[i+3] = orig[i+3]
          }
        })
        addPad(Math.ceil((p.width ?? 5) * 2)); continue
      }
      if (id === 'jpegDamage' && val) {
        const p = val
        filterList.push(function jpegDamageFilter(imgData) {
          webglEngine.processSync(imgData, 'jpegDamage', {
            uDamage: p.damage ?? 0.4,
            uBlockSize: p.blockSize ?? 16,
            uColorBleed: p.colorBleed ?? 0.5,
            uQuantize: p.quantize ?? 0.3,
            uRinging: p.ringing ?? 0.2,
          })
        })
        addPad(10); continue
      }
      if (id === 'filmDamage' && val) {
        const p = val
        filterList.push(function filmDamageFilter(imgData) {
          webglEngine.processSync(imgData, 'filmDamage', {
            uGrain: p.grain ?? 0.5,
            uScratches: p.scratches ?? 0.4,
            uDust: p.dust ?? 0.3,
            uFlicker: p.flicker ?? 0.2,
            uVignette: p.vignette ?? 0.5,
            uColorAge: p.colorAge ?? 0.4,
          })
        })
        addPad(10); continue
      }
      if (id === 'vhs' && val) {
        const p = val
        filterList.push(function vhsFilter(imgData) {
          webglEngine.processSync(imgData, 'vhs', {
            uChromaOffset: p.chromaOffset ?? 0.3,
            uJitter: p.jitter ?? 0.4,
            uSyncLoss: p.syncLoss ?? 0.2,
            uNoise: p.noise ?? 0.3,
            uScanlines: p.scanlines ?? 0.3,
            uColorBleed: p.colorBleed ?? 0.5,
            uHeadSwitching: p.headSwitching ?? 0.2,
            uFade: p.fade ?? 0.2,
          })
        })
        continue
      }

      // ── Canvas 2D custom filters ───────────────────────
      if (id === 'spotColor' && val) {
        const p = val
        filterList.push(function spotColorFilter(imgData) {
          spotColorPixels(imgData.data, imgData.width, imgData.height, p.color ?? '#ff0000', p.threshold ?? 30, p.feather ?? 0.2)
        })
        continue
      }
      if (id === 'duotone' && val) {
        const p = val
        filterList.push(function duotoneFilter(imgData) {
          duotonePixels(imgData.data, imgData.width, imgData.height, p.colorA ?? '#000000', p.colorB ?? '#ffffff')
        })
        continue
      }
      if (id === 'spectralMap' && val) {
        const p = val
        const hueOf = hex => {
          const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
          const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn
          if (d === 0) return 0
          let h; if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          else if (mx === g) h = ((b - r) / d + 2) / 6
          else h = ((r - g) / d + 4) / 6
          return h
        }
        filterList.push(function spectralMapFilter(imgData) {
          webglEngine.processSync(imgData, 'spectralMap', {
            uHue0: hueOf(p.shadowColor ?? '#ff0000'),
            uHue1: hueOf(p.midColor ?? '#00ff00'),
            uHue2: hueOf(p.highlightColor ?? '#0000ff'),
            uTahap: p.tahap ?? p.stage ?? 0,
            uRepeat: p.repeat ?? 1,
            uSaturation: p.saturation ?? 1,
            uAlpha: p.alpha ?? 1,
          })
        })
        continue
      }
      if (id === 'chromaKey' && val) {
        const p = val
        filterList.push(function chromaKeyFilter(imgData) {
          chromaKeyPixels(imgData.data, imgData.width, imgData.height, p.keyColor ?? '#00ff00', p.threshold ?? 80, p.feather ?? 0.1)
        })
        continue
      }
      if (id === 'lumaKey' && val) {
        const p = val
        filterList.push(function lumaKeyFilter(imgData) {
          lumaKeyPixels(imgData.data, imgData.width, imgData.height, p.threshold ?? 128, p.feather ?? 0.1, p.invertKey ?? false)
        })
        continue
      }
      if (id === 'replaceColor' && val) {
        const p = val
        filterList.push(function replaceColorFilter(imgData) {
          replaceColorPixels(imgData.data, imgData.width, imgData.height, p.fromColor ?? '#ff0000', p.toColor ?? '#00ff00', p.threshold ?? 30, p.feather ?? 0.2)
        })
        continue
      }

      // ── Text Effects (Canvas 2D pixel distortion) ─────
      if (id === 'bubble' && val) {
        const amount = val.amount ?? 0.5
        const radius = val.radius ?? 0.8
        filterList.push(function bubbleFilter(imgData) {
          const w = imgData.width, h = imgData.height
          const d = imgData.data
          const src = new Uint8ClampedArray(d)
          const cx = w / 2, cy = h / 2
          const maxR = Math.sqrt(cx * cx + cy * cy) * radius
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const dx = x - cx, dy = y - cy
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist >= maxR) continue
              const t = dist / maxR
              const barrel = Math.pow(t, 1.0 - amount * 0.6) * maxR / (dist || 1)
              const sx = cx + dx * barrel, sy = cy + dy * barrel
              const si = (Math.round(sy) * w + Math.round(sx)) * 4
              if (si < 0 || si >= d.length) continue
              const di = (y * w + x) * 4
              d[di] = src[si]; d[di+1] = src[si+1]; d[di+2] = src[si+2]; d[di+3] = src[si+3]
            }
          }
        })
        continue
      }
      if (id === 'stretch' && val) {
        const p = val
        filterList.push(function stretchFilter(imgData) {
          const sw = imgData.width, sh = imgData.height
          const d = imgData.data
          const src = new Uint8ClampedArray(d)
          const scx = sw / 2, scy = sh / 2
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const nx = (x - scx) / scx, ny = (y - scy) / scy
              const taper = Math.max(0.01, 1 - (ny + 1) / 2 * (p.taperTop ?? 0) - (1 - (ny + 1) / 2) * (p.taperBottom ?? 0))
              let srcNx = nx / ((p.scaleX ?? 1) * taper) - (p.skewX ?? 0) * ny
              let srcNy = ny / (p.scaleY ?? 1) - (p.skewY ?? 0) * nx
              const sx = srcNx * scx + scx, sy = srcNy * scy + scy
              const si = (Math.round(sy) * sw + Math.round(sx)) * 4
              if (si < 0 || si >= d.length) continue
              const di = (y * sw + x) * 4
              d[di] = src[si]; d[di+1] = src[si+1]; d[di+2] = src[si+2]; d[di+3] = src[si+3]
            }
          }
        })
        addPad(20); continue
      }

      // ── Gradient Overlay — Konva Rect di atas node ────
      if (id === 'gradientOverlay' && val) {
        this._applyGradientOverlay(node, val)
        continue
      }

      // ── Mask Fade — rect-based alpha mask filter ────────
      if (id === 'maskFade' && val) {
        const p = val
        filterList.push(function maskFadeFilter(imgData) {
          const w = imgData.width, h = imgData.height, d = imgData.data
          const size = p.size ?? 1
          const feather = p.feather ?? 0.3
          const offsetX = p.offsetX ?? 0
          const offsetY = p.offsetY ?? -0.85
          const rotation = p.rotation ?? 0
          const cx = w / 2 + offsetX * w * 0.5
          const cy = h / 2 + offsetY * h * 0.5
          const halfW = w * size / 2
          const halfH = h * size / 2
          const fadeSize = feather * Math.min(w, h) * 0.3
          const rad = rotation * Math.PI / 180
          const cosR = Math.cos(rad), sinR = Math.sin(rad)
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const dx = x - cx, dy = y - cy
              const lx = dx * cosR + dy * sinR
              const ly = -dx * sinR + dy * cosR
              if (Math.abs(lx) <= halfW && Math.abs(ly) <= halfH) continue
              const idx = (y * w + x) * 4
              if (fadeSize <= 1) {
                d[idx + 3] = 0
              } else {
                const dxEdge = Math.max(0, Math.abs(lx) - halfW)
                const dyEdge = Math.max(0, Math.abs(ly) - halfH)
                const dist = Math.sqrt(dxEdge * dxEdge + dyEdge * dyEdge)
                d[idx + 3] = Math.round(d[idx + 3] * Math.max(0, 1 - dist / fadeSize))
              }
            }
          }
        })
        continue
      }

      // ── Geometry — diproses terpisah setelah filter ───
      if (id === 'repeater' && val) { this._applyRepeater(node, val); continue }
    }

    // Adjustments (brightness, contrast, etc.) — via MoodSpaceCombined
    if (adjustments) {
      const ADJ_KEYS = ['exposure','temperature','hue','highlights','shadows','whites','blacks','brightness','contrast','saturation','sharpen','vignette','blur']
      const hasAny = ADJ_KEYS.some((k) => (adjustments[k] ?? 0) !== 0)
      if (hasAny) {
        for (const key of ADJ_KEYS) node.setAttr(key, adjustments[key] ?? 0)
        filterList.push(Konva.Filters.MoodSpaceCombined)
      }
    }

    // Terapkan semua filter sekaligus
    node.filters(filterList)
    if (filterList.length > 0) {
      const fontSize = typeof node.fontSize === 'function' ? (node.fontSize() || 0) : 0
      const pr = Math.min(window.devicePixelRatio || 1, 3)
      const pad = Math.max(cachePad, 2)
      const nw = typeof node.width === 'function' ? node.width() : (node.getAttr('width') || 0)
      const nh = typeof node.height === 'function' ? node.height() : (node.getAttr('height') || 0)
      let w = nw > 0 ? nw : 0
      let h = nh > 0 ? nh : 0
      if (w <= 0 || h <= 0) {
        const cr = node.getClientRect({ skipTransform: true, skipShadow: true, skipStroke: true })
        if (w <= 0) w = cr.width > 0 ? cr.width : 100
        if (h <= 0) h = cr.height > 0 ? cr.height : 100
      }
      // ── Text overflow padding ─────────────────────────────────
      // Measure actual visual bounds via measureText and add padding so script/cursive
      // swashes (ascenders, descenders, left/right flourishes) are not clipped by cache.
      let textPadL = 0, textPadT = 0, textPadR = 0, textPadB = 0
      let _mea;
      if (w > 0 && typeof node.measureSize === 'function') {
        try {
          const text = typeof node.text === 'function' ? (node.text() || '') : ''
          if (text) {
            const m = node.measureSize('M')
            const mAcc = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent ?? fontSize * 0.7
            const mDesc = m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent ?? fontSize * 0.2
            const lh = (typeof node.lineHeight === 'function' ? node.lineHeight() : 1) || 1
            const lineH = fontSize * lh
            const translateY = (mAcc - mDesc) / 2 + lineH / 2
            const cvs = document.createElement('canvas')
            const cctx = cvs.getContext('2d')
            if (typeof node._getContextFont === 'function') cctx.font = node._getContextFont()
            const mt = cctx.measureText(text)
            const textAcc = mt.actualBoundingBoxAscent || 0
            const textDec = mt.actualBoundingBoxDescent || 0
            const textL = mt.actualBoundingBoxLeft || 0
            const textR = mt.actualBoundingBoxRight || 0
            const textW = mt.width || 0
            const align = typeof node.align === 'function' ? node.align() : 'left'
            let lineX = 0
            if (align === 'center') lineX = (w - textW) / 2
            else if (align === 'right') lineX = w - textW
            textPadL = Math.max(0, -(lineX + textL))
            textPadR = Math.max(0, lineX + textR - w)
            textPadT = Math.max(0, -(translateY - textAcc))
            textPadB = Math.max(0, translateY + textDec - h)
            const safety = 5
            textPadL += safety; textPadR += safety; textPadT += safety; textPadB += safety
            _mea = { textAcc, textDec, textL, textR, textW, translateY, font: cctx.font, textLen: text.length, w, h }
          }
        } catch (_) {}
      } else if (w > 0 && typeof node.getChildren === 'function') {
        try {
          const children = node.getChildren()
          if (children.length > 0) {
            let minVisT = Infinity, maxVisB = -Infinity, minVisL = Infinity, maxVisR = -Infinity
            let totalWorked = 0, groupFs = 0
            const cvs2 = document.createElement('canvas')
            const cctx2 = cvs2.getContext('2d')
            children.forEach((child) => {
              if (typeof child.text !== 'function' || typeof child.fontFamily !== 'function') return
              const ct = child.text() || ''
              if (!ct) return
              const cx = typeof child.x === 'function' ? child.x() : 0
              const cy = typeof child.y === 'function' ? child.y() : 0
              const cf = child.fontFamily ? child.fontFamily() : 'Inter, Arial'
              const cs = (typeof child.fontStyle === 'function' ? child.fontStyle() : 'normal') || 'normal'
              const cfs = typeof child.fontSize === 'function' ? (child.fontSize() || 0) : 0
              if (cfs <= 0) return
              if (!groupFs) groupFs = cfs
              const ctxFont = `${cs} ${cfs}px ${cf}`
              cctx2.font = ctxFont
              const mt2 = cctx2.measureText(ct)
              const charAcc = mt2.actualBoundingBoxAscent || 0
              const charDec = mt2.actualBoundingBoxDescent || 0
              const mM = cctx2.measureText('M')
              const mAscent = (mM.fontBoundingBoxAscent ?? mM.actualBoundingBoxAscent) || cfs * 0.7
              const mDescent = (mM.fontBoundingBoxDescent ?? mM.actualBoundingBoxDescent) || cfs * 0.2
              const tY = (mAscent - mDescent) / 2 + cfs / 2
              const visT = cy + tY - charAcc
              const visB = cy + tY + charDec
              const visL = cx + (mt2.actualBoundingBoxLeft || 0)
              const visR = cx + (mt2.actualBoundingBoxRight || mt2.width || 0)
              if (visT < minVisT) minVisT = visT
              if (visB > maxVisB) maxVisB = visB
              if (visL < minVisL) minVisL = visL
              if (visR > maxVisR) maxVisR = visR
              totalWorked++
            })
            if (totalWorked > 0 && (minVisT < Infinity)) {
              textPadT = Math.max(0, -minVisT)
              textPadB = Math.max(0, maxVisB - h)
              textPadL = Math.max(0, -minVisL)
              textPadR = Math.max(0, maxVisR - w)
              const safety = 5
              textPadL += safety; textPadR += safety; textPadT += safety; textPadB += safety
              _mea = { mode: 'group', minVisT, maxVisB, minVisL, maxVisR, w, h, fs: groupFs, children: totalWorked }
            }
          }
        } catch (_) {}
      }
      console.log('[EFFECT CACHE PAD]', {
        id: (typeof node.id === 'function' ? node.id() : null) || (typeof node._id !== 'undefined' ? node._id : '?'),
        textPadL, textPadT, textPadR, textPadB,
        cacheX: -textPadL, cacheY: -textPadT,
        cacheW: Math.ceil(w + textPadL + textPadR + pad * 2),
        cacheH: Math.ceil(h + textPadT + textPadB + pad * 2),
        isText: typeof node.measureSize === 'function',
        isGroup: typeof node.getChildren === 'function',
        fontSize,
        raw: _mea,
      })
      node.cache({ x: -textPadL, y: -textPadT, width: w + textPadL + textPadR + pad * 2, height: h + textPadT + textPadB + pad * 2, pixelRatio: pr })
    } else {
      node.clearCache()
    }

    node.getLayer()?.batchDraw()
  }

  removeAll(node) {
    this._clearFilters(node)
    this._clearOverlay(node)
    this._clearRepeater(node)
    node.visible(true)
    this._clearBounds(node)
    // Reset rotation ke nilai asli
    if (this._origRotation.has(node)) {
      node.rotation(this._origRotation.get(node))
      this._origRotation.delete(node)
    }
    node.filters([])
    node.clearCache()
    node.getLayer()?.batchDraw()
  }

  // ── Internal ───────────────────────────────────────────

  _clearFilters(node) {
    node.filters([])
    node.clearCache()
  }

  _clearOverlay(node) {
    const overlays = this._overlays.get(node)
    if (overlays) { overlays.forEach(o => o.destroy()); this._overlays.delete(node) }
  }

  _clearRepeater(node) {
    const copies = this._repeaters.get(node)
    if (copies) { copies.forEach(c => c.destroy()); this._repeaters.delete(node) }
  }

  _clearBounds(node) {
    // Reserved for future bounds-based effects
  }

  // Spectral map is a pure WebGL shader — no animation loop needed.

  _applyGradientOverlay(node, p) {
    const rawColors = p.colors ?? ['#000000', '#ffffff']
    const rawStops  = p.stops  ?? [0, 1]
    const colors = Array.isArray(rawColors) ? rawColors : ['#000000', '#ffffff']
    const stops  = Array.isArray(rawStops)  ? rawStops  : [0, 1]
    while (stops.length > colors.length) stops.pop()
    const angle  = (p.angle ?? 0) * Math.PI / 180
    const w = node.width(), h = node.height()
    const len = Math.sqrt(w*w+h*h)/2
    const parent = node.getParent()
    const isChild = parent && parent.getClassName() !== 'Layer'
    const rect = new Konva.Rect({
      x: isChild ? node.x() : 0,
      y: isChild ? node.y() : 0,
      width: w,
      height: h,
      fillLinearGradientStartPoint: { x: w/2-Math.cos(angle)*len, y: h/2-Math.sin(angle)*len },
      fillLinearGradientEndPoint:   { x: w/2+Math.cos(angle)*len, y: h/2+Math.sin(angle)*len },
      fillLinearGradientColorStops: stops.flatMap((s,i) => [s, colors[i]]),
      opacity: p.opacity ?? 1.0,
      globalCompositeOperation: p.blendMode ?? 'overlay',
      listening: false, name: 'fx-gradientOverlay',
    })
    if (isChild) {
      parent.add(rect)
    } else {
      node.add(rect)
    }
    node.getLayer()?.batchDraw()
    const existing = this._overlays.get(node) || []
    this._overlays.set(node, [...existing, rect])
  }

  _applyRepeater(node, p) {
    applyRepeater(node, p, this._repeaters)
  }

  // ── Apply effects to raw ImageData (for adjustment layers & export) ──
  applyEffectsToImageData(imageData, effects = {}) {
    const w = imageData.width, h = imageData.height
    const d = imageData.data

    for (const [id, val] of Object.entries(effects)) {
      if (!val && val !== 0) continue
      if (val === false || val === 'none' || val === '') continue

      // ── Built-in Konva (no node attrs needed) ──
      if (id === 'invert' && val) {
        for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i+1] = 255 - d[i+1]; d[i+2] = 255 - d[i+2] }
        continue
      }
      if (id === 'grayscale' && val) {
        for (let i = 0; i < d.length; i += 4) { const l = 0.299*d[i] + 0.587*d[i+1] + 0.114*d[i+2]; d[i] = d[i+1] = d[i+2] = l }
        continue
      }
      if (id === 'sepia' && val) {
        for (let i = 0; i < d.length; i += 4) {
          const r=d[i], g=d[i+1], b=d[i+2]
          d[i] = Math.min(255, r*0.393 + g*0.769 + b*0.189)
          d[i+1] = Math.min(255, r*0.349 + g*0.686 + b*0.168)
          d[i+2] = Math.min(255, r*0.272 + g*0.534 + b*0.131)
        }
        continue
      }
      if (id === 'solarize' && val) {
        for (let i = 0; i < d.length; i += 4) {
          d[i] = d[i] > 128 ? 255 - d[i] : d[i]
          d[i+1] = d[i+1] > 128 ? 255 - d[i+1] : d[i+1]
          d[i+2] = d[i+2] > 128 ? 255 - d[i+2] : d[i+2]
        }
        continue
      }
      if (id === 'threshold' && val) {
        const p = val; webglEngine.processSync(imageData, 'threshold', { uThreshold: p.threshold ?? 128, uInvert: p.invert ? 1 : 0 })
        continue
      }

      // ── Built-in Konva (need mock for node attrs) ──
      if (id === 'noise' && val) {
        const amount = typeof val === 'number' ? val : (val.amount ?? 0.3)
        const mono = typeof val === 'object' && val.monochrome
        if (amount > 0) {
          if (mono) { monoNoisePixels(d, w, h, amount) }
          else { const mock = { noise: () => amount }; Konva.Filters.Noise.call(mock, imageData) }
        }
        continue
      }
      if (id === 'pixelate' && val > 0) {
        const mock = { pixelSize: () => Math.max(1, Math.round(val)) }
        Konva.Filters.Pixelate.call(mock, imageData)
        continue
      }
      if (id === 'gaussianBlur' && val > 0) {
        const mock = { blurRadius: () => val }
        Konva.Filters.Blur.call(mock, imageData)
        continue
      }

      // ── Mirror (pixel helpers) ──
      if (id === 'mirror' && val !== 'none') { mirrorPixels(d, w, h, val); continue }

      // ── WebGL filters ──
      if (id === 'directionalBlur' && val) {
        const p = val; webglEngine.processSync(imageData, 'directionalBlur', { uAngle: (p.angle ?? 0) * Math.PI / 180, uStrength: p.strength ?? 0.5, uSamples: p.samples ?? 16 })
        continue
      }
      if (id === 'rgbSplit' && val) {
        const p = val; const modeVal = { g: 0, r: 1, b: 2 }[p.mode ?? 'g'] ?? 0; webglEngine.processSync(imageData, 'rgbSplit', { uOffset: p.offset ?? 0.01, uAngle: (p.angle ?? 0) * Math.PI / 180, uMode: modeVal, uPadUV: [0, 0], uImgUV: [1, 1] })
        continue
      }
      if (id === 'zoomBlur' && val) {
        const p = typeof val === 'number' ? { strength: val, centerX: 0.5, centerY: 0.5 } : val; webglEngine.processSync(imageData, 'zoomBlur', { uStrength: p.strength ?? 0.3, uCenterX: p.centerX ?? 0.5, uCenterY: p.centerY ?? 0.5, uSamples: 16 })
        continue
      }
      if (id === 'spinBlur' && val) {
        const p = typeof val === 'number' ? { angle: val, centerX: 0.5, centerY: 0.5 } : val; webglEngine.processSync(imageData, 'spinBlur', { uAngle: p.angle ?? 0.3, uCenterX: p.centerX ?? 0.5, uCenterY: p.centerY ?? 0.5, uSamples: 16 })
        continue
      }
      if (id === 'halftone' && val) {
        const p = val; const hx1=p.color1??'#000000'; const hc1r=parseInt(hx1.slice(1,3),16)/255; const hc1g=parseInt(hx1.slice(3,5),16)/255; const hc1b=parseInt(hx1.slice(5,7),16)/255; const hx2=p.color2??'#ffffff'; const hc2r=parseInt(hx2.slice(1,3),16)/255; const hc2g=parseInt(hx2.slice(3,5),16)/255; const hc2b=parseInt(hx2.slice(5,7),16)/255; webglEngine.processSync(imageData, 'halftone', { uDotSize: p.dotSize ?? 8, uAngle: (p.angle ?? 0) * Math.PI / 180, uSoftness: p.softness ?? 0.3, uInvert: p.invert ? 1 : 0, uColor1: [hc1r, hc1g, hc1b], uColor2: [hc2r, hc2g, hc2b] })
        continue
      }
      if (id === 'roughenEdge' && val) {
        const p = val; webglEngine.processSync(imageData, 'roughenEdge', { uScale: p.scale ?? 10, uStrength: p.strength ?? 0.5, uBorder: p.border ?? 0.1, uSpeed: p.speed ?? 1 })
        continue
      }
      if (id === 'waveWarp' && val) {
        const p = val; webglEngine.processSync(imageData, 'waveWarp', { uAmplitude: p.amplitude ?? 20, uFrequency: p.frequency ?? 5, uSpeed: p.speed ?? 1, uAngle: (p.rotation ?? 0) * Math.PI / 180 })
        continue
      }
      if (id === 'risograph' && val) {
        const p = val
        const hex1 = p.color1 ?? '#2d5a27', hexP = p.paper ?? '#f4cfc6'
        const c1r = parseInt(hex1.slice(1,3),16), c1g = parseInt(hex1.slice(3,5),16), c1b = parseInt(hex1.slice(5,7),16)
        const pr = parseInt(hexP.slice(1,3),16), pg = parseInt(hexP.slice(3,5),16), pb = parseInt(hexP.slice(5,7),16)
        const thr = p.threshold ?? 0.5, grain = p.grain ?? 0.15
        if (p.mode === 'texture') {
          const density = p.density ?? 0.5, misalignment = p.misalignment ?? 0.3
          applyRisographTextureFullColor(imageData, { pr, pg, pb, density, misalignment })
        } else {
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4
              const noise = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1
              const n = noise < 0 ? noise + 1 : noise
              let L = (d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114) / 255
              L = Math.max(0, Math.min(1, L + (n - 0.5) * grain * 2))
              if (L < thr) {
                d[i] = c1r; d[i+1] = c1g; d[i+2] = c1b
              } else {
                d[i] = pr; d[i+1] = pg; d[i+2] = pb
              }
            }
          }
        }
        continue
      }
      if (id === 'dotMatrix' && val) {
        const p = val
        const dotHex = p.dotColor ?? '#00ff00'
        const dcr = parseInt(dotHex.slice(1,3),16)/255
        const dcg = parseInt(dotHex.slice(3,5),16)/255
        const dcb = parseInt(dotHex.slice(5,7),16)/255
        webglEngine.processSync(imageData, 'dotMatrix', {
          uTileSize: p.tileSize ?? 10,
          uUseOriginalColor: p.useOriginalColor === false ? 0 : 1,
          uDotColor: [dcr, dcg, dcb],
          uShape: (p.shape ?? 'circle') === 'square' ? 1 : 0,
        })
        continue
      }
      if (id === 'feather' && val > 0) {
        const w = imageData.width, h = imageData.height, d = imageData.data
        const fadeSize = val * Math.min(w, h) * 0.5
        if (fadeSize > 1) {
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const minDist = Math.min(x, w - 1 - x, y, h - 1 - y)
              if (minDist < fadeSize) {
                const idx = (y * w + x) * 4
                d[idx + 3] = Math.round(d[idx + 3] * (minDist / fadeSize))
              }
            }
          }
        }
        continue
      }
      if (id === 'edgeGlow' && val) {
        const p = val
        const w = imageData.width, h = imageData.height
        const d = imageData.data
        const orig = new Uint8ClampedArray(d)
        webglEngine.processSync(imageData, 'edgeGlow', {
          uResolution: [w, h],
          uThreshold: p.threshold ?? 0.1,
        })
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.putImageData(imageData, 0, 0)
        const blurW = document.createElement('canvas')
        blurW.width = w; blurW.height = h
        const blurCtx = blurW.getContext('2d')
        blurCtx.filter = `blur(${p.width ?? 5}px)`
        blurCtx.drawImage(canvas, 0, 0)
        blurCtx.filter = 'none'
        const blurred = blurCtx.getImageData(0, 0, w, h).data
        const hex = p.color ?? '#00ffff'
        const cr = parseInt(hex.slice(1,3), 16)
        const cg = parseInt(hex.slice(3,5), 16)
        const cb = parseInt(hex.slice(5,7), 16)
        const intensity = p.intensity ?? 0.5
        for (let i = 0; i < d.length; i += 4) {
          const glow = (blurred[i + 3] / 255) * intensity
          d[i] = orig[i] * (1 - glow) + cr * glow
          d[i+1] = orig[i+1] * (1 - glow) + cg * glow
          d[i+2] = orig[i+2] * (1 - glow) + cb * glow
          d[i+3] = orig[i+3]
        }
        continue
      }
      if (id === 'jpegDamage' && val) {
        const p = val; webglEngine.processSync(imageData, 'jpegDamage', { uDamage: p.damage ?? 0.4, uBlockSize: p.blockSize ?? 16, uColorBleed: p.colorBleed ?? 0.5, uQuantize: p.quantize ?? 0.3, uRinging: p.ringing ?? 0.2 })
        continue
      }
      if (id === 'filmDamage' && val) {
        const p = val; webglEngine.processSync(imageData, 'filmDamage', { uGrain: p.grain ?? 0.5, uScratches: p.scratches ?? 0.4, uDust: p.dust ?? 0.3, uFlicker: p.flicker ?? 0.2, uVignette: p.vignette ?? 0.5, uColorAge: p.colorAge ?? 0.4 })
        continue
      }
      if (id === 'vhs' && val) {
        const p = val; webglEngine.processSync(imageData, 'vhs', { uChromaOffset: p.chromaOffset ?? 0.3, uJitter: p.jitter ?? 0.4, uSyncLoss: p.syncLoss ?? 0.2, uNoise: p.noise ?? 0.3, uScanlines: p.scanlines ?? 0.3, uColorBleed: p.colorBleed ?? 0.5, uHeadSwitching: p.headSwitching ?? 0.2, uFade: p.fade ?? 0.2 })
        continue
      }

      // ── Canvas 2D custom filters ──
      if (id === 'spotColor' && val) {
        const p = val; spotColorPixels(d, w, h, p.color ?? '#ff0000', p.threshold ?? 30, p.feather ?? 0.2)
        continue
      }
      if (id === 'duotone' && val) {
        const p = val; duotonePixels(d, w, h, p.colorA ?? '#000000', p.colorB ?? '#ffffff')
        continue
      }
      if (id === 'spectralMap' && val) {
        const p = val
        const hueOf = hex => {
          const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
          const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx - mn
          if (d === 0) return 0
          let h; if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          else if (mx === g) h = ((b - r) / d + 2) / 6
          else h = ((r - g) / d + 4) / 6
          return h
        }
        webglEngine.processSync(imageData, 'spectralMap', {
          uHue0: hueOf(p.shadowColor ?? '#ff0000'),
          uHue1: hueOf(p.midColor ?? '#00ff00'),
          uHue2: hueOf(p.highlightColor ?? '#0000ff'),
          uTahap: p.tahap ?? p.stage ?? 0,
          uRepeat: p.repeat ?? 1,
          uSaturation: p.saturation ?? 1,
          uAlpha: p.alpha ?? 1,
        })
        continue
      }
      if (id === 'chromaKey' && val) {
        const p = val; chromaKeyPixels(d, w, h, p.keyColor ?? '#00ff00', p.threshold ?? 80, p.feather ?? 0.1)
        continue
      }
      if (id === 'lumaKey' && val) {
        const p = val; lumaKeyPixels(d, w, h, p.threshold ?? 128, p.feather ?? 0.1, p.invertKey ?? false)
        continue
      }
      if (id === 'replaceColor' && val) {
        const p = val; replaceColorPixels(d, w, h, p.fromColor ?? '#ff0000', p.toColor ?? '#00ff00', p.threshold ?? 30, p.feather ?? 0.2)
        continue
      }

      // ── Gradient Overlay — canvas composited onto ImageData ──
      if (id === 'gradientOverlay' && val) {
        const p = val
        const colors = Array.isArray(p.colors) ? p.colors : ['#000000', '#ffffff']
        const stops  = Array.isArray(p.stops)  ? p.stops  : [0, 1]
        while (stops.length > colors.length) stops.pop()
        const angle = (p.angle ?? 0) * Math.PI / 180
        const len = Math.sqrt(w * w + h * h) / 2
        const cx = w / 2, cy = h / 2
        const src = document.createElement('canvas')
        src.width = w; src.height = h
        const sctx = src.getContext('2d')
        const gradient = sctx.createLinearGradient(
          cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
          cx + Math.cos(angle) * len, cy + Math.sin(angle) * len,
        )
        for (let i = 0; i < stops.length; i++) {
          gradient.addColorStop(stops[i], colors[i] || '#000000')
        }
        sctx.fillStyle = gradient
        sctx.fillRect(0, 0, w, h)
        const blendMode = p.blendMode ?? 'overlay'
        const blendMap = { overlay: 'overlay', multiply: 'multiply', screen: 'screen', color: 'color', normal: 'source-over' }
        const bm = blendMap[blendMode] || 'overlay'
        const tmpCanvas = document.createElement('canvas')
        tmpCanvas.width = w; tmpCanvas.height = h
        const tctx = tmpCanvas.getContext('2d')
        const srcData = new ImageData(new Uint8ClampedArray(d), w, h)
        tctx.putImageData(srcData, 0, 0)
        tctx.globalCompositeOperation = bm
        tctx.globalAlpha = p.opacity ?? 1
        tctx.drawImage(src, 0, 0)
        const out = tctx.getImageData(0, 0, w, h)
        d.set(out.data)
        continue
      }
    }
  }
}

export const effectManager = new EffectManager()
