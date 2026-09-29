import * as THREE from 'three'

// Final "CRT monitor" pass: chromatic aberration, scanlines, a rolling refresh band,
// film grain, tinted vignette and a slice glitch that can be kicked on demand.
// It runs after OutputPass, so it works directly on display (sRGB) values.
export const Y2KScreenShader = {
  name: 'Y2KScreenShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPixelRatio: { value: 1 },
    uAberration: { value: 0.012 },
    uScanline: { value: 0.04 },
    uGrain: { value: 0.03 },
    uVignette: { value: 0.3 },
    uVignetteColor: { value: new THREE.Color('#000000') },
    uRoll: { value: 0.03 },
    uGlitch: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uPixelRatio;
    uniform float uAberration;
    uniform float uScanline;
    uniform float uGrain;
    uniform float uVignette;
    uniform vec3 uVignetteColor;
    uniform float uRoll;
    uniform float uGlitch;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Horizontal slice glitch.
      float slice = floor(uv.y * 36.0);
      float tick = floor(uTime * 24.0);
      float sliceOn = step(1.0 - uGlitch * 0.55, hash(vec2(slice, tick)));
      uv.x += (hash(vec2(tick, slice)) - 0.5) * 0.12 * sliceOn * uGlitch;

      vec2 fromCenter = uv - 0.5;
      float dist = length(fromCenter);
      vec2 shift = fromCenter * dist * uAberration * 2.0 + vec2(uGlitch * 0.012 * sliceOn, 0.0);

      vec4 base = texture2D(tDiffuse, uv);
      float r = texture2D(tDiffuse, uv + shift).r;
      float b = texture2D(tDiffuse, uv - shift).b;
      vec3 color = vec3(r, base.g, b);

      // Scanlines every ~3 CSS pixels.
      float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 3.14159 / (1.5 * uPixelRatio));
      color *= 1.0 - uScanline * (1.0 - scan);

      // Slow refresh band travelling down the screen.
      float band = fract(uv.y + uTime * 0.06);
      color += exp(-pow((band - 0.5) * 14.0, 2.0)) * uRoll;

      // Grain.
      color += (hash(uv * uResolution + fract(uTime * 7.0) * 91.0) - 0.5) * uGrain;

      // Tinted vignette.
      float vignette = smoothstep(0.35, 0.95, dist * 1.25);
      color = mix(color, uVignetteColor, vignette * uVignette);

      gl_FragColor = vec4(color, base.a);
    }
  `,
}
