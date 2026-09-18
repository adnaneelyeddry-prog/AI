/* =========================================================
   VARAILLY — site-wide spatial environment
   Native WebGL background + restrained depth interactions.
   ========================================================= */
(function () {
  'use strict';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  const saveData = Boolean(navigator.connection?.saveData);
  const lowMemory = Boolean(navigator.deviceMemory && navigator.deviceMemory <= 4);
  const constrainedDevice = coarsePointer || saveData || lowMemory;
  const canvas = document.querySelector('#spatialCanvas');
  const pointerLight = document.querySelector('#spatialPointerLight');

  /* ---------- Shared pointer light ---------- */
  let pointerX = innerWidth * 0.5;
  let pointerY = innerHeight * 0.35;
  let smoothX = pointerX;
  let smoothY = pointerY;
  document.addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, { passive: true });

  function animatePointerLight() {
    smoothX += (pointerX - smoothX) * 0.09;
    smoothY += (pointerY - smoothY) * 0.09;
    if (pointerLight) pointerLight.style.transform = `translate3d(${smoothX}px,${smoothY}px,0)`;
    if (!reducedMotion) requestAnimationFrame(animatePointerLight);
  }
  if (pointerLight && !reducedMotion && !coarsePointer) animatePointerLight();

  /* ---------- Elegant card depth ---------- */
  const depthTargets = document.querySelectorAll([
    '.product-card', '.feature-card', '.step-card', '.category-tile',
    '.testimonial-card', '.amazon-card', '.cta-banner-inner', '.faq-list',
    '.info-card', '.value-card', '.team-card', '.job-card', '.sus-stat',
    '.contact-sidebar', '.size-table-wrapper'
  ].join(','));

  depthTargets.forEach(target => {
    target.classList.add('depth-surface');
    const light = document.createElement('span');
    light.className = 'depth-surface-light';
    light.setAttribute('aria-hidden', 'true');
    target.appendChild(light);

    if (coarsePointer || reducedMotion) return;
    let frame = 0;
    const reset = () => {
      target.style.setProperty('--depth-rx', '0deg');
      target.style.setProperty('--depth-ry', '0deg');
      target.style.setProperty('--depth-x', '50%');
      target.style.setProperty('--depth-y', '50%');
    };
    target.addEventListener('pointermove', event => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
        const maxTilt = target.classList.contains('product-card') ? 2.4 : 1.5;
        target.style.setProperty('--depth-rx', `${(0.5 - y) * maxTilt}deg`);
        target.style.setProperty('--depth-ry', `${(x - 0.5) * maxTilt}deg`);
        target.style.setProperty('--depth-x', `${x * 100}%`);
        target.style.setProperty('--depth-y', `${y * 100}%`);
      });
    });
    target.addEventListener('pointerleave', reset);
  });

  /* ---------- Spatial section rail + active scene ---------- */
  const sectionDefinitions = [
    ['.hero', 'Origin'],
    ['#products', 'Drop'],
    ['#variant-lab', '3D Lab'],
    ['.features', 'Material'],
    ['.manifesto', 'Manifesto'],
    ['#video-section', 'Film'],
    ['#categories', 'Categories'],
    ['#lookbook', 'Lookbook'],
    ['.testimonials', 'Reviews'],
    ['.amazon-section', 'Amazon']
  ];
  const sections = sectionDefinitions
    .map(([selector, label]) => ({ element: document.querySelector(selector), label }))
    .filter(item => item.element);

  sections.forEach((item, index) => {
    item.element.dataset.spatialSection = String(index);
    item.element.style.setProperty('--section-index', index);
    const coordinate = document.createElement('span');
    coordinate.className = 'section-coordinate';
    coordinate.setAttribute('aria-hidden', 'true');
    coordinate.textContent = `${String(index + 1).padStart(2, '0')} / ${item.label}`;
    item.element.appendChild(coordinate);
  });

  if (sections.length) {
    const rail = document.createElement('nav');
    rail.className = 'spatial-rail';
    rail.setAttribute('aria-label', 'Page sections');
    const label = document.createElement('span');
    label.className = 'spatial-rail-label';
    label.textContent = sections[0].label;
    rail.appendChild(label);
    const dots = sections.map((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spatial-rail-dot';
      button.setAttribute('aria-label', `Go to ${item.label}`);
      button.addEventListener('click', () => item.element.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      rail.appendChild(button);
      return button;
    });
    document.body.appendChild(rail);

    const activate = index => {
      dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
      label.textContent = sections[index].label;
      document.documentElement.style.setProperty('--active-scene', index);
      window.dispatchEvent(new CustomEvent('varailly:scene', { detail: { index } }));
    };
    activate(0);

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) activate(Number(visible.target.dataset.spatialSection));
      }, { threshold: [0.18, 0.35, 0.55, 0.75], rootMargin: '-12% 0px -20%' });
      sections.forEach(item => observer.observe(item.element));
    }
  }

  /* ---------- Native WebGL world ---------- */
  if (!canvas) return;
  try {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!gl) {
    canvas.classList.add('spatial-canvas-failed');
    return;
  }

  const vertexSource = `
    precision highp float;
    attribute vec3 aPosition;
    attribute float aSize;
    attribute float aKind;
    uniform vec2 uMouse;
    uniform float uScroll;
    uniform float uTime;
    uniform float uAspect;
    varying float vKind;
    varying float vDepth;

    void main() {
      vec3 p = aPosition;
      float travel = uScroll * 0.0025 + uTime * 0.025;
      p.z = mod(p.z + travel + 12.0, 24.0) - 12.0;
      float depth = 14.0 - p.z;
      p.x += uMouse.x * (0.12 + (14.0 - depth) * 0.008);
      p.y += uMouse.y * 0.09;
      float perspective = 3.6 / max(depth, 1.0);
      gl_Position = vec4(p.x * perspective / uAspect, p.y * perspective, 0.0, 1.0);
      gl_PointSize = clamp(aSize * perspective * 3.1, 1.0, 4.0);
      vKind = aKind;
      vDepth = perspective;
    }
  `;

  const fragmentSource = `
    precision highp float;
    uniform float uScene;
    uniform float uTime;
    varying float vKind;
    varying float vDepth;

    vec3 palette(float scene, float kind) {
      vec3 lime = vec3(0.78, 1.0, 0.24);
      vec3 cyan = vec3(0.25, 0.89, 1.0);
      vec3 violet = vec3(0.51, 0.34, 1.0);
      vec3 orange = vec3(1.0, 0.54, 0.24);
      float phase = mod(scene, 4.0);
      vec3 a = phase < 1.0 ? cyan : phase < 2.0 ? violet : phase < 3.0 ? lime : orange;
      vec3 b = phase < 1.0 ? violet : phase < 2.0 ? lime : phase < 3.0 ? cyan : violet;
      return mix(a, b, kind);
    }

    void main() {
      vec2 p = gl_PointCoord - 0.5;
      float circle = 1.0 - smoothstep(0.32, 0.5, length(p));
      float twinkle = 0.68 + sin(uTime * 1.7 + vKind * 17.0) * 0.22;
      vec3 color = palette(uScene, vKind);
      gl_FragColor = vec4(color, circle * twinkle * clamp(vDepth * 3.0, 0.12, 0.72));
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);

  const isMobile = innerWidth < 700;
  const count = reducedMotion || saveData ? 70 : constrainedDevice || isMobile ? 120 : 360;
  const data = new Float32Array(count * 5);
  for (let index = 0; index < count; index += 1) {
    data[index * 5] = (Math.random() - 0.5) * 20;
    data[index * 5 + 1] = (Math.random() - 0.5) * 12;
    data[index * 5 + 2] = (Math.random() - 0.5) * 24;
    data[index * 5 + 3] = Math.random() * 2.4 + 0.7;
    data[index * 5 + 4] = Math.random();
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  const stride = 5 * Float32Array.BYTES_PER_ELEMENT;
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 3, gl.FLOAT, false, stride, 0);
  const size = gl.getAttribLocation(program, 'aSize');
  gl.enableVertexAttribArray(size);
  gl.vertexAttribPointer(size, 1, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
  const kind = gl.getAttribLocation(program, 'aKind');
  gl.enableVertexAttribArray(kind);
  gl.vertexAttribPointer(kind, 1, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);

  const uniforms = {
    mouse: gl.getUniformLocation(program, 'uMouse'),
    scroll: gl.getUniformLocation(program, 'uScroll'),
    time: gl.getUniformLocation(program, 'uTime'),
    aspect: gl.getUniformLocation(program, 'uAspect'),
    scene: gl.getUniformLocation(program, 'uScene')
  };

  let currentMouseX = 0;
  let currentMouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentScene = 0;
  let targetScene = 0;
  let currentScroll = scrollY;
  let targetScroll = scrollY;
  let frameId = 0;
  let visible = !document.hidden;
  let contextLost = false;
  let lastFrame = 0;
  const minimumFrameInterval = constrainedDevice ? 1000 / 30 : 0;
  const start = performance.now();

  const resize = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.35);
    const width = Math.floor(innerWidth * ratio);
    const height = Math.floor(innerHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };
  resize();
  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', () => { targetScroll = scrollY; }, { passive: true });
  addEventListener('pointermove', event => {
    targetMouseX = (event.clientX / innerWidth - 0.5) * 2;
    targetMouseY = (0.5 - event.clientY / innerHeight) * 2;
  }, { passive: true });
  addEventListener('varailly:scene', event => { targetScene = event.detail.index; });
  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    if (visible && !frameId && !contextLost) frameId = requestAnimationFrame(render);
    if (!visible && frameId) { cancelAnimationFrame(frameId); frameId = 0; }
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    canvas.classList.add('spatial-canvas-failed');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    // Resources are deliberately not reused after pressure-related context loss.
    // The CSS spatial fallback remains active and avoids a reload loop.
    contextLost = true;
    canvas.classList.add('spatial-canvas-failed');
  });

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  function render(now) {
    frameId = 0;
    if (!visible || contextLost) return;
    if (minimumFrameInterval && now - lastFrame < minimumFrameInterval) {
      frameId = requestAnimationFrame(render);
      return;
    }
    lastFrame = now;
    currentMouseX += (targetMouseX - currentMouseX) * 0.035;
    currentMouseY += (targetMouseY - currentMouseY) * 0.035;
    currentScroll += (targetScroll - currentScroll) * 0.06;
    currentScene += (targetScene - currentScene) * 0.035;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(uniforms.mouse, currentMouseX, currentMouseY);
    gl.uniform1f(uniforms.scroll, currentScroll);
    gl.uniform1f(uniforms.time, reducedMotion ? 0 : (now - start) * 0.001);
    gl.uniform1f(uniforms.aspect, canvas.width / canvas.height);
    gl.uniform1f(uniforms.scene, currentScene);
    gl.drawArrays(gl.POINTS, 0, count);
    if (!reducedMotion && !saveData) frameId = requestAnimationFrame(render);
  }
  frameId = requestAnimationFrame(render);
  } catch (error) {
    canvas.classList.add('spatial-canvas-failed');
    canvas.dataset.error = error instanceof Error ? error.message : String(error);
    console.warn('VARAILLY spatial background fallback enabled:', error);
  }
})();
