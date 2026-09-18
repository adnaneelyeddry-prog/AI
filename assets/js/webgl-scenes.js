/* =========================================================
   VARAILLY — dependency-free native WebGL garment renderer
   Procedural low-poly tee, lighting, graphics, drag + scroll motion.
   ========================================================= */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERTEX_SHADER = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  attribute vec2 aUv;
  attribute float aFace;

  uniform vec2 uRotation;
  uniform float uAspect;
  uniform float uTime;
  uniform float uScale;

  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vFace;
  varying float vDepth;

  vec3 rotateY(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  }

  vec3 rotateX(vec3 p, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
  }

  void main() {
    vec3 position = aPosition;
    float front = step(0.5, aFace);
    position.z += front * (
      sin(position.y * 4.0 + uTime * 0.9) * 0.025 +
      sin(position.x * 5.2 - uTime * 0.7) * 0.014
    );

    position = rotateY(position, uRotation.y);
    position = rotateX(position, uRotation.x);
    vec3 normal = rotateX(rotateY(aNormal, uRotation.y), uRotation.x);

    float cameraDistance = 5.0 - position.z;
    float perspective = uScale / cameraDistance;
    gl_Position = vec4(
      position.x * perspective / max(uAspect, 0.45),
      position.y * perspective,
      (2.0 - position.z) / 8.0,
      1.0
    );

    vNormal = normal;
    vUv = aUv;
    vFace = aFace;
    vDepth = position.z;
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec3 uBaseColor;
  uniform vec3 uAccent;
  uniform float uTime;
  uniform int uGraphic;

  varying vec3 vNormal;
  varying vec2 vUv;
  varying float vFace;
  varying float vDepth;

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  float ellipseRing(vec2 p, vec2 center, vec2 radius, float width) {
    vec2 q = (p - center) / radius;
    return 1.0 - smoothstep(width, width * 2.0, abs(length(q) - 1.0));
  }

  float boxMask(vec2 p, vec2 center, vec2 halfSize, float soft) {
    vec2 d = abs(p - center) - halfSize;
    return 1.0 - smoothstep(0.0, soft, max(d.x, d.y));
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightA = normalize(vec3(-0.55, 0.7, 1.0));
    vec3 lightB = normalize(vec3(0.9, -0.2, 0.45));
    float diffuse = max(dot(normal, lightA), 0.0);
    float fill = max(dot(normal, lightB), 0.0) * 0.28;
    float rim = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.2);
    float sideShade = mix(0.68, 1.0, step(0.5, abs(vFace)));

    vec3 color = uBaseColor * (0.53 + diffuse * 0.68 + fill) * sideShade;
    color += uAccent * rim * 0.055;
    color += vec3(1.0) * pow(max(normal.z, 0.0), 18.0) * 0.07;

    if (vFace > 0.5) {
      vec2 uv = vUv;
      float graphic = 0.0;
      float secondary = 0.0;

      if (uGraphic == 0) {
        graphic += ellipseRing(uv, vec2(0.5, 0.61), vec2(0.19, 0.105), 0.026);
        secondary += ellipseRing(uv, vec2(0.5, 0.61), vec2(0.115, 0.185), 0.024);
        graphic += boxMask(uv, vec2(0.5, 0.60), vec2(0.145, 0.022), 0.009);
        secondary += boxMask(uv, vec2(0.5, 0.45), vec2(0.085, 0.009), 0.005);
      } else if (uGraphic == 1) {
        float stripeField = step(0.55, fract((uv.x + uv.y * 0.28) * 10.0));
        float area = boxMask(uv, vec2(0.5, 0.61), vec2(0.21, 0.17), 0.025);
        graphic = stripeField * area;
        secondary = boxMask(uv, vec2(0.5, 0.42), vec2(0.14, 0.016), 0.007);
      } else {
        float leftV = segmentDistance(uv, vec2(0.37, 0.72), vec2(0.50, 0.45));
        float rightV = segmentDistance(uv, vec2(0.50, 0.45), vec2(0.63, 0.72));
        graphic = 1.0 - smoothstep(0.018, 0.033, min(leftV, rightV));
        secondary = boxMask(uv, vec2(0.5, 0.39), vec2(0.15, 0.015), 0.007);
      }

      float neckFill = 1.0 - smoothstep(0.86, 1.0, length((uv - vec2(0.5, 0.935)) / vec2(0.115, 0.055)));
      float neckRib = ellipseRing(uv, vec2(0.5, 0.915), vec2(0.14, 0.072), 0.08);
      float weave = sin(uv.x * 420.0) * sin(uv.y * 440.0) * 0.008;
      float sideFold = pow(abs(uv.x - 0.5) * 2.0, 3.0) * sin(uv.y * 26.0 + uTime * 0.18) * 0.035;
      color = mix(color, uAccent, clamp(graphic, 0.0, 1.0) * 0.94);
      color = mix(color, vec3(0.24, 0.89, 1.0), clamp(secondary, 0.0, 1.0) * 0.82);
      color = mix(color, uBaseColor * 0.42, neckRib * 0.45);
      color = mix(color, vec3(0.012, 0.014, 0.019), neckFill * 0.94);
      color += weave + sideFold;
    }

    color += sin((vUv.y + uTime * 0.025) * 18.0) * 0.012;
    color = pow(max(color, 0.0), vec3(0.88));
    gl_FragColor = vec4(color, 1.0);
  }
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`WebGL shader error: ${message}`);
  }
  return shader;
}

function createProgram(gl) {
  const program = gl.createProgram();
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`WebGL program error: ${message}`);
  }
  return program;
}

function polygonArea(points) {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const next = (index + 1) % points.length;
    area += points[index][0] * points[next][1] - points[next][0] * points[index][1];
  }
  return area * 0.5;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function insideTriangle(point, a, b, c) {
  const c1 = cross(a, b, point);
  const c2 = cross(b, c, point);
  const c3 = cross(c, a, point);
  return c1 >= -1e-7 && c2 >= -1e-7 && c3 >= -1e-7;
}

function triangulate(points) {
  const order = points.map((_, index) => index);
  if (polygonArea(points) < 0) order.reverse();
  const triangles = [];
  let guard = 0;

  while (order.length > 3 && guard < 500) {
    let clipped = false;
    for (let index = 0; index < order.length; index += 1) {
      const previous = order[(index - 1 + order.length) % order.length];
      const current = order[index];
      const next = order[(index + 1) % order.length];
      if (cross(points[previous], points[current], points[next]) <= 1e-7) continue;
      let containsPoint = false;
      for (const candidate of order) {
        if (candidate === previous || candidate === current || candidate === next) continue;
        if (insideTriangle(points[candidate], points[previous], points[current], points[next])) {
          containsPoint = true;
          break;
        }
      }
      if (containsPoint) continue;
      triangles.push(previous, current, next);
      order.splice(index, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
    guard += 1;
  }
  if (order.length === 3) triangles.push(order[0], order[1], order[2]);
  return triangles;
}

function createShirtMesh() {
  let points = [
    [-0.58, 1.43], [-0.82, 1.61], [-1.04, 1.74], [-1.53, 1.39],
    [-1.42, 1.08], [-1.20, 0.75], [-0.84, 0.94], [-0.82, -1.50],
    [-0.56, -1.58], [-0.28, -1.62], [0, -1.64], [0.28, -1.62],
    [0.56, -1.58], [0.82, -1.50], [0.84, 0.94], [1.20, 0.75],
    [1.42, 1.08], [1.53, 1.39], [1.04, 1.74], [0.82, 1.61],
    [0.58, 1.43], [0.36, 1.29], [0, 1.20], [-0.36, 1.29]
  ];
  if (polygonArea(points) < 0) points = points.reverse();

  const depth = 0.29;
  const minX = -1.55;
  const maxX = 1.55;
  const minY = -1.64;
  const maxY = 1.76;
  const vertices = [];
  const indices = [];
  const triangles = triangulate(points);

  const pushVertex = (x, y, z, nx, ny, nz, face) => {
    const u = (x - minX) / (maxX - minX);
    const v = (y - minY) / (maxY - minY);
    vertices.push(x, y, z, nx, ny, nz, u, v, face);
  };

  // Front and back share polygon topology but keep independent normals.
  points.forEach(([x, y]) => pushVertex(x, y, depth * 0.5, 0, 0, 1, 1));
  points.forEach(([x, y]) => pushVertex(x, y, -depth * 0.5, 0, 0, -1, -1));
  for (let index = 0; index < triangles.length; index += 3) {
    indices.push(triangles[index], triangles[index + 1], triangles[index + 2]);
    indices.push(points.length + triangles[index + 2], points.length + triangles[index + 1], points.length + triangles[index]);
  }

  // Independent side vertices create hard tailored edges and readable depth.
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const dx = next[0] - point[0];
    const dy = next[1] - point[1];
    const length = Math.hypot(dx, dy) || 1;
    const normalX = dy / length;
    const normalY = -dx / length;
    const base = vertices.length / 9;
    pushVertex(point[0], point[1], depth * 0.5, normalX, normalY, 0, 0);
    pushVertex(next[0], next[1], depth * 0.5, normalX, normalY, 0, 0);
    pushVertex(next[0], next[1], -depth * 0.5, normalX, normalY, 0, 0);
    pushVertex(point[0], point[1], -depth * 0.5, normalX, normalY, 0, 0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices) };
}

function setFallbackState(stage, message = 'Static preview') {
  if (!stage) return;
  stage.classList.remove('webgl-ready');
  stage.classList.add('webgl-failed');
  const badge = stage.querySelector('.hero-3d-badge');
  if (badge) badge.textContent = '3D fallback';
  const status = stage.querySelector('.viewer-status');
  if (status) status.textContent = message;
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255];
}

function createScene({ canvas, stage, color, graphic = 0, hero = false }) {
  if (!canvas || !stage) return null;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('WebGL is unavailable');

  const program = createProgram(gl);
  const mesh = createShirtMesh();
  const buffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  gl.useProgram(program);

  const stride = 9 * Float32Array.BYTES_PER_ELEMENT;
  const attribute = (name, size, offset) => {
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, offset * Float32Array.BYTES_PER_ELEMENT);
  };
  attribute('aPosition', 3, 0);
  attribute('aNormal', 3, 3);
  attribute('aUv', 2, 6);
  attribute('aFace', 1, 8);

  const uniforms = {
    rotation: gl.getUniformLocation(program, 'uRotation'),
    aspect: gl.getUniformLocation(program, 'uAspect'),
    time: gl.getUniformLocation(program, 'uTime'),
    scale: gl.getUniformLocation(program, 'uScale'),
    base: gl.getUniformLocation(program, 'uBaseColor'),
    accent: gl.getUniformLocation(program, 'uAccent'),
    graphic: gl.getUniformLocation(program, 'uGraphic')
  };

  let baseColor = hexToRgb(color);
  let graphicStyle = graphic;
  let active = true;
  let dragging = false;
  let pointerX = 0;
  let pointerY = 0;
  let lastPointerX = 0;
  let dragRotation = 0;
  let currentX = -0.035;
  let currentY = hero ? -0.38 : 0.24;
  let targetX = currentX;
  let targetY = currentY;
  let scrollRotation = 0;
  let lastInteraction = performance.now();
  let frameId = 0;
  let contextLost = false;
  const startTime = performance.now();

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const requestRender = () => {
    if (!frameId && active && !contextLost && !document.hidden) frameId = requestAnimationFrame(render);
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
    const width = Math.max(1, Math.floor(stage.clientWidth * ratio));
    const height = Math.max(1, Math.floor(stage.clientHeight * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      requestRender();
    }
  };
  let resizeObserver = null;
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
  } else {
    window.addEventListener('resize', resize, { passive: true });
  }
  resize();

  const updateScroll = () => {
    const rect = stage.getBoundingClientRect();
    scrollRotation = reducedMotion ? 0 : Math.max(-0.18, Math.min(0.18, ((rect.top + rect.height * 0.5) / window.innerHeight - 0.5) * 0.28));
    requestRender();
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  const pointerMove = event => {
    const rect = stage.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (dragging) {
      dragRotation += (event.clientX - lastPointerX) * 0.012;
      lastPointerX = event.clientX;
      lastInteraction = performance.now();
    }
    targetY = (hero ? -0.34 : 0.18) + pointerX * 0.20 + dragRotation;
    targetX = -0.035 + pointerY * 0.085;
    requestRender();
  };
  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    lastPointerX = event.clientX;
    lastInteraction = performance.now();
    stage.classList.add('is-dragging');
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', pointerMove);
  const endDrag = event => {
    dragging = false;
    stage.classList.remove('is-dragging');
    canvas.releasePointerCapture?.(event.pointerId);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  let visibilityObserver = null;
  if ('IntersectionObserver' in window) {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (!active && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (active) requestRender();
    }, { threshold: 0.01 });
    visibilityObserver.observe(stage);
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    setFallbackState(stage, 'Static preview — WebGL paused');
  });

  function render(now) {
    frameId = 0;
    if (!active || contextLost || document.hidden) return;
    const elapsed = (now - startTime) * 0.001;
    const idle = performance.now() - lastInteraction > 1800;
    const idleRotation = !reducedMotion && idle ? Math.sin(elapsed * 0.5) * 0.11 : 0;
    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY + scrollRotation + idleRotation - currentY) * 0.065;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.uniform2f(uniforms.rotation, currentX, currentY);
    gl.uniform1f(uniforms.aspect, canvas.width / canvas.height);
    gl.uniform1f(uniforms.time, reducedMotion ? 0 : elapsed);
    gl.uniform1f(uniforms.scale, hero ? 2.18 : 2.24);
    gl.uniform3fv(uniforms.base, baseColor);
    gl.uniform3fv(uniforms.accent, [0.78, 1.0, 0.24]);
    gl.uniform1i(uniforms.graphic, graphicStyle);
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);

    if (!reducedMotion) requestRender();
  }
  requestRender();
  document.addEventListener('visibilitychange', requestRender);

  stage.classList.add('webgl-ready');
  stage.querySelector('.hero-3d-badge')?.replaceChildren(Object.assign(document.createElement('span'), { className: 'live-dot' }), document.createTextNode(' 3D PREVIEW'));
  const status = stage.querySelector('.viewer-status');
  if (status) status.innerHTML = '<span class="live-dot"></span> 3D preview';

  return {
    reset() {
      dragRotation = 0;
      targetX = -0.035;
      targetY = hero ? -0.34 : 0.18;
      lastInteraction = performance.now();
      requestRender();
    },
    setColor(value) { baseColor = hexToRgb(value); requestRender(); },
    setGraphic(value) { graphicStyle = ({ orbit: 0, signal: 1, core: 2 })[value] ?? 0; requestRender(); }  };
}

function initializeScene(options) {
  try {
    return createScene(options);
  } catch (error) {
    console.warn('VARAILLY native WebGL fallback enabled:', error);
    setFallbackState(options.stage);
    return null;
  }
}

function init() {
  const heroStage = document.querySelector('#hero3dStage');
  const hero = initializeScene({
    canvas: document.querySelector('#hero3dCanvas'),
    stage: heroStage,
    color: '#242936',
    graphic: 0,
    hero: true
  });
  document.querySelector('#hero3dReset')?.addEventListener('click', () => hero?.reset());

  const labStage = document.querySelector('#lab3dStage');
  let lab = null;
  let labInitialized = false;
  const initializeLab = () => {
    if (labInitialized) return;
    labInitialized = true;
    lab = initializeScene({
      canvas: document.querySelector('#lab3dCanvas'),
      stage: labStage,
      color: '#202530',
      graphic: 0
    });
  };

  // The below-the-fold scene is created only when it approaches the viewport.
  if (labStage && 'IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      initializeLab();
      lazyObserver.disconnect();
    }, { rootMargin: '600px 0px' });
    lazyObserver.observe(labStage);
  } else {
    initializeLab();
  }

  const fallbackShirt = document.querySelector('#fallbackShirtPath');
  const fallbackGraphic = document.querySelector('#fallbackGraphicLabel');
  document.querySelectorAll('#variantColors .variant-swatch').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('#variantColors .variant-swatch').forEach(item => item.classList.toggle('active', item === button));
      if (fallbackShirt) fallbackShirt.setAttribute('fill', button.dataset.color);
      lab?.setColor(button.dataset.color);
    });
  });
  document.querySelectorAll('#variantGraphics .graphic-tab').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('#variantGraphics .graphic-tab').forEach(item => item.classList.toggle('active', item === button));
      if (fallbackGraphic) fallbackGraphic.textContent = `${button.dataset.graphic.toUpperCase()} / VARAILLY.`;
      lab?.setGraphic(button.dataset.graphic);
    });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
