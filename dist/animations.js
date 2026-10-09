(() => {
  'use strict';
  const scenes = [...document.querySelectorAll('[data-motion-scene]')];
  if (!scenes.length) return;
  const buttons = [...document.querySelectorAll('[data-motion-toggle]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visibility = new WeakMap();
  let paused = false;
  let earth = null;

  function updateMotion() {
    const disabled = paused || reducedMotion.matches;
    for (const scene of scenes) {
      const visible = visibility.get(scene) === true && !document.hidden;
      const active = visible && !disabled;
      scene.dataset.motionActive = String(active);
      if (scene.dataset.motionScene === 'earth') earth?.setState({ visible, active });
    }
    for (const button of buttons) {
      button.hidden = reducedMotion.matches;
      button.setAttribute('aria-pressed', String(paused));
      const label = paused ? 'Animatsiyalarni yoqish' : 'Animatsiyalarni to‘xtatish';
      button.setAttribute('aria-label', label);
      button.title = label;
    }
  }
  buttons.forEach(button => button.addEventListener('click', () => { paused = !paused; updateMotion(); }));
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);

  const canvas = document.getElementById('earth-canvas');
  if (canvas) earth = createEarth(canvas);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visibility.set(entry.target, entry.isIntersecting));
      updateMotion();
    }, { threshold: 0 });
    scenes.forEach(scene => observer.observe(scene));
  } else {
    scenes.forEach(scene => visibility.set(scene, true));
  }
  updateMotion();

  function createEarth(target) {
    const stage = target.closest('.earth-stage');
    let gl, program, texture, buffer, uniforms;
    let loaded = false, started = false, lost = false, failed = false;
    let visible = false, active = false, frame = 0, previous = 0, painted = 0;
    let angle = 0.62;
    const image = new Image();
    image.decoding = 'async';

    const vertexSource = `
      attribute vec2 aPosition;
      varying vec2 vUV;
      void main() { vUV = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }
    `;
    const fragmentSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      varying vec2 vUV;
      uniform sampler2D uEarth;
      uniform vec2 uRotation;
      uniform float uPixels;
      const float PI = 3.14159265359;
      void main() {
        vec2 p = (vUV * 2.0 - 1.0) * 1.22;
        float radius = length(p);
        vec3 atmosphere = vec3(0.22, 0.57, 0.96);
        if (radius > 1.0) {
          float glow = 0.26 * exp(-(radius - 1.0) * 28.0);
          gl_FragColor = vec4(atmosphere, glow);
          return;
        }
        // Orthographic ray/sphere intersection. Lighting stays in view space.
        vec3 normal = vec3(p, sqrt(max(0.0, 1.0 - dot(p, p))));
        // Fixed axial tilt; only the surface coordinates rotate over time.
        vec3 mapNormal = vec3(0.93358 * normal.x - 0.35837 * normal.y,
                              0.35837 * normal.x + 0.93358 * normal.y, normal.z);
        mapNormal = vec3(mapNormal.x, 0.98723 * mapNormal.y + 0.15932 * mapNormal.z,
                          -0.15932 * mapNormal.y + 0.98723 * mapNormal.z);
        mapNormal = vec3(uRotation.x * mapNormal.x + uRotation.y * mapNormal.z,
                          mapNormal.y, -uRotation.y * mapNormal.x + uRotation.x * mapNormal.z);
        vec2 uv = vec2(0.5 + atan(mapNormal.x, mapNormal.z) / (2.0 * PI),
                       0.5 - asin(clamp(mapNormal.y, -1.0, 1.0)) / PI);
        vec3 surface = texture2D(uEarth, uv).rgb;
        vec3 lightDirection = normalize(vec3(-0.65, 0.5, 0.95));
        float daylight = max(0.0, dot(normal, lightDirection));
        vec3 color = pow(surface, vec3(2.2)) * (0.11 + 1.04 * daylight);
        float ocean = smoothstep(0.025, 0.18, surface.b - max(surface.r, surface.g));
        vec3 halfway = normalize(lightDirection + vec3(0.0, 0.0, 1.0));
        color += vec3(0.42, 0.66, 1.0) * pow(max(dot(normal, halfway), 0.0), 42.0) * ocean * 0.2;
        float rim = pow(1.0 - normal.z, 3.5) * (0.24 + 0.45 * daylight);
        color += vec3(0.035, 0.16, 0.38) * rim;
        color = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
        float edge = 1.0 - smoothstep(1.0 - 3.66 / uPixels, 1.0, radius);
        gl_FragColor = vec4(mix(atmosphere, color, edge), max(edge, 0.26));
      }
    `;

    function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; painted = 0; }
    function fallback() { stop(); loaded = false; failed = true; stage.classList.remove('is-ready'); }
    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); throw new Error('Earth shader unavailable'); }
      return shader;
    }
    function setup() {
      try {
        gl = target.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
        if (!gl) return fallback();
        const vertex = compile(gl.VERTEX_SHADER, vertexSource);
        const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
        program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
        gl.deleteShader(vertex); gl.deleteShader(fragment);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Earth renderer unavailable');
        gl.useProgram(program);
        buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        uniforms = { rotation: gl.getUniformLocation(program, 'uRotation'), pixels: gl.getUniformLocation(program, 'uPixels') };
        texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
        // Top row of the HTML image maps to v=0; the shader handles north/south.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        const powerOfTwo = value => value > 0 && (value & (value - 1)) === 0;
        const pot = powerOfTwo(image.naturalWidth) && powerOfTwo(image.naturalHeight);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pot ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pot ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        if (pot) gl.generateMipmap(gl.TEXTURE_2D);
        gl.uniform1i(gl.getUniformLocation(program, 'uEarth'), 0);
        gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('Earth texture unavailable');
        loaded = true; failed = false; lost = false;
        resize(); render(); stage.classList.add('is-ready'); schedule();
      } catch { fallback(); }
    }
    function load() {
      if (started || failed) return;
      started = true;
      image.onload = setup;
      image.onerror = fallback;
      image.src = 'assets/earth-blue-marble.jpg';
    }
    function resize() {
      if (!loaded || lost) return;
      const size = Math.min(720, Math.max(1, Math.round(stage.clientWidth * Math.min(window.devicePixelRatio || 1, 1.5))));
      if (target.width !== size || target.height !== size) { target.width = size; target.height = size; gl.viewport(0, 0, size, size); }
      render();
    }
    function render() {
      if (!loaded || lost) return;
      gl.useProgram(program); gl.uniform2f(uniforms.rotation, Math.cos(angle), Math.sin(angle));
      gl.uniform1f(uniforms.pixels, target.width); gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function tick(time) {
      frame = 0;
      if (!active || !visible || !loaded || lost) return;
      if (previous) angle = (angle - Math.min((time - previous) / 1000, 0.08) * Math.PI * 2 / 95) % (Math.PI * 2);
      previous = time;
      if (time - painted >= 1000 / 30) { render(); painted = time; }
      frame = requestAnimationFrame(tick);
    }
    function schedule() { if (active && visible && loaded && !lost && !frame) frame = requestAnimationFrame(tick); }
    target.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; stop(); stage.classList.remove('is-ready'); });
    target.addEventListener('webglcontextrestored', () => { lost = false; if (image.complete && image.naturalWidth) setup(); });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize, { passive: true });
    return { setState(state) {
      visible = state.visible; active = state.active;
      if (visible) load();
      if (active && visible) schedule(); else { stop(); if (visible) render(); }
    }};
  }
})();
