'use client';

import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';
import React, { useEffect, useMemo, useRef } from 'react';
import './Aurora.css';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
     ColorStop currentColor = colors[i];                    \
     bool isInBetween = currentColor.position <= factor;    \
     index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

type AuroraVariant = 'default' | 'subtle';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  className?: string;
  variant?: AuroraVariant;
}

export default function Aurora(props: AuroraProps) {
  const {
    amplitude = 1.0,
    blend = 0.5,
    variant = 'default'
  } = props;
  const resolvedColorStops = useMemo(
    () => props.colorStops ?? ['#5227FF', '#7cff67', '#5227FF'],
    [props.colorStops?.join('|') ?? 'default']
  );
  const propsRef = useRef<AuroraProps>({ ...props, colorStops: resolvedColorStops });
  propsRef.current = { ...props, colorStops: props.colorStops ?? resolvedColorStops };

  // Adjust settings based on variant
  const isSubtle = variant === 'subtle';
  const effectiveAmplitude = isSubtle ? amplitude * 0.7 : amplitude;
  const effectiveSpeed = isSubtle ? 0.6 : 1.0;

  const ctnDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctn = ctnDom.current;
    if (!ctn) return;

    let cleanup: (() => void) | undefined;
    let idleId: number | null = null;
    let animationFrameId: number | null = null;

    const startAurora = () => {
      const renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        dpr: 1, // Force low resolution for performance
      });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.canvas.style.backgroundColor = 'transparent';

      const geometry = new Triangle(gl);
      if (geometry.attributes.uv) {
        delete geometry.attributes.uv;
      }

      let program: Program;
      const baseColorStops = resolvedColorStops.map(hex => {
        const c = new Color(hex);
        return [c.r, c.g, c.b];
      });

      program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAmplitude: { value: effectiveAmplitude },
          uColorStops: { value: baseColorStops },
          uResolution: { value: [ctn.offsetWidth, ctn.offsetHeight] },
          uBlend: { value: blend }
        }
      });

      const mesh = new Mesh(gl, { geometry, program });
      ctn.appendChild(gl.canvas);

      let lastStopsKey = '';
      const updateColorStops = (stops: string[]) => {
        const key = stops.join('|');
        if (key === lastStopsKey) return;
        lastStopsKey = key;
        program.uniforms.uColorStops.value = stops.map(hex => {
          const c = new Color(hex);
          return [c.r, c.g, c.b];
        });
      };

      const RENDER_SCALE = 0.5; // Reduce internal resolution by 50% for performance

      const resize = () => {
        const width = ctn.offsetWidth;
        const height = ctn.offsetHeight;
        // Render at lower resolution and let CSS upscale it
        renderer.setSize(width * RENDER_SCALE, height * RENDER_SCALE);
        // Force style to stretch back to full size
        if (renderer.gl.canvas instanceof HTMLCanvasElement) {
          renderer.gl.canvas.style.width = '100%';
          renderer.gl.canvas.style.height = '100%';
        }
        program.uniforms.uResolution.value = [width * RENDER_SCALE, height * RENDER_SCALE];
      };

      window.addEventListener('resize', resize);
      resize();

      // FPS Limiting Logic
      const targetFPS = 30;
      const frameInterval = 1000 / targetFPS;
      let lastFrameTime = 0;
      let isVisible = true;

      const update = (t: number) => {
        animationFrameId = requestAnimationFrame(update);

        if (!isVisible) return;

        const elapsed = t - lastFrameTime;
        if (elapsed < frameInterval) return;

        lastFrameTime = t - (elapsed % frameInterval);

        const { time = t * 0.01, speed = effectiveSpeed } = propsRef.current;
        program.uniforms.uTime.value = time * speed * 0.1;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? effectiveAmplitude;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        const stops = propsRef.current.colorStops ?? resolvedColorStops;
        updateColorStops(stops);
        renderer.render({ scene: mesh });
      };

      animationFrameId = requestAnimationFrame(update);

      // Intersection Observer to pause when off-screen
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0 });

      observer.observe(ctn);

      cleanup = () => {
        if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resize);
        observer.disconnect();
        if (ctn && gl.canvas.parentNode === ctn) {
          ctn.removeChild(gl.canvas);
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
    };

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(() => {
        startAurora();
      }, { timeout: 300 });
    } else {
      startAurora();
    }

    return () => {
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      cleanup?.();
    };
  }, [blend, resolvedColorStops, effectiveAmplitude, effectiveSpeed]);

  return <div ref={ctnDom} className={`aurora-container ${isSubtle ? 'aurora-subtle' : ''} ${props.className || ''}`} />;
}
