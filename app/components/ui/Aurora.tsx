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

// Smoother, more liquid-like noise
const FRAG = `#version 300 es
precision mediump float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

float snoise(vec2 v) {
    // Smoother wave function with 3 components
    return (sin(v.x * 6.0 + uTime * 0.2) + sin(v.y * 4.0 + uTime * 0.35) + sin((v.x + v.y) * 2.0 - uTime * 0.1)) / 3.0;
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) { \
  int index = 0; \
  for (int i = 0; i < 2; i++) { \
    ColorStop currentColor = colors[i]; \
    bool isInBetween = currentColor.position <= factor; \
    index = int(mix(float(index), float(i), float(isInBetween))); \
  } \
  ColorStop currentColor = colors[index]; \
  ColorStop nextColor = colors[index + 1]; \
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
  
  // Slower, more organic movement
  float height = snoise(vec2(uv.x * 1.5, uTime)) * 0.5 * uAmplitude;
  height = exp(height);
  // Adjusted vertical position to prevent bottom cutoff
  height = (uv.y * 2.0 - height + 0.0); 
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

export function Aurora(props: AuroraProps) {
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
        antialias: false,
        powerPreference: 'high-performance', // optimize for speed
        depth: false,
        dpr: Math.min(window.devicePixelRatio, 1.5), // Cap at 1.5 for better quality but good performance
      });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
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

      // Force canvas to fill container via CSS
      gl.canvas.style.display = 'block';
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';

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

      const resize = () => {
        if (!ctn) return;
        const width = ctn.offsetWidth;
        const height = ctn.offsetHeight;

        renderer.setSize(width, height);
        program.uniforms.uResolution.value = [width, height];
      };

      window.addEventListener('resize', resize);
      resize();

      let isVisible = true;
      let isScrolling = false;
      let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
      let timeAccumulator = 0;
      let lastTime = performance.now();
      let frameCount = 0;

      // Scroll pause handler - stop rendering while scrolling for smooth performance
      const handleScroll = () => {
        isScrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 150); // Resume 150ms after scroll stops
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      const update = (t: number) => {
        animationFrameId = requestAnimationFrame(update);

        // Skip rendering when not visible or during scroll
        if (!isVisible || isScrolling) return;

        // Throttle to 30fps (render every other frame)
        frameCount++;
        if (frameCount % 2 !== 0) return;

        // Calculate delta time
        const now = performance.now();
        const dt = (now - lastTime) * 0.001; // seconds
        lastTime = now;

        // Wrap time to avoid float precision loss (lag) over time
        // 1000 is arbitrary large number, period of sine is 2PI
        timeAccumulator += dt * (propsRef.current.speed ?? effectiveSpeed) * 0.1; // Reduced from 0.15 to 0.1 for smoother flow
        if (timeAccumulator > 10000) timeAccumulator -= 10000;

        program.uniforms.uTime.value = timeAccumulator;
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
        if (scrollTimeout) clearTimeout(scrollTimeout);
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', handleScroll);
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

    // Force immediate start
    startAurora();

    return () => {
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      cleanup?.();
    };
  }, [blend, resolvedColorStops, effectiveAmplitude, effectiveSpeed]);

  return <div ref={ctnDom} className={`aurora-container ${isSubtle ? 'aurora-subtle' : ''} ${props.className || ''} `} />;
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(Aurora);
