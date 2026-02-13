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
  forceStatic?: boolean; // New prop for manual override
}

export function Aurora(props: AuroraProps) {
  const {
    amplitude = 1.0,
    blend = 0.5,
    variant = 'default',
    forceStatic = false
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

  // Null means "environment not resolved yet" (first paint / hydration window).
  const [shouldAnimate, setShouldAnimate] = React.useState<boolean | null>(null);

  // 1. Handle Environment Detection (Client-side only)
  useEffect(() => {
    const checkRequirements = () => {
      const isMobile = window.innerWidth < 768;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const shouldRunWebGL = !forceStatic && !isMobile && !prefersReducedMotion;
      setShouldAnimate(shouldRunWebGL);
    };

    // Initial check
    checkRequirements();

    // Listeners
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleResize = () => checkRequirements();
    const handleMotionChange = () => checkRequirements();

    window.addEventListener('resize', handleResize);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [forceStatic]);

  // 2. WebGL Logic (Only runs if shouldAnimate is explicitly true)
  useEffect(() => {
    if (shouldAnimate !== true) return;

    const ctn = ctnDom.current;
    if (!ctn) return;

    let cleanup: (() => void) | undefined;
    let idleId: number | null = null;
    let animationFrameId: number | null = null;

    // ... Copy exact WebGL logic from previous version, just wrapped in this effect ...
    const startAurora = () => {
      const renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        powerPreference: 'high-performance',
        depth: false,
        dpr: Math.min(window.devicePixelRatio, 1.2),
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

      gl.canvas.style.display = 'block';
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      gl.canvas.style.willChange = 'transform';

      // Ensure canvas is absolute positioned to overlay the gradient fallback
      gl.canvas.style.position = 'absolute';
      gl.canvas.style.top = '0';
      gl.canvas.style.left = '0';

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

      const handleScroll = () => {
        isScrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 150);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      const update = (t: number) => {
        animationFrameId = requestAnimationFrame(update);
        if (!isVisible || isScrolling) return;
        frameCount++;
        if (frameCount % 3 !== 0) return;

        const now = performance.now();
        let dt = (now - lastTime) * 0.001;
        lastTime = now;
        if (dt > 0.05) dt = 0.05;

        timeAccumulator += dt * (propsRef.current.speed ?? effectiveSpeed) * 0.1;
        if (timeAccumulator > 10000) timeAccumulator -= 10000;

        program.uniforms.uTime.value = timeAccumulator;
        program.uniforms.uAmplitude.value = propsRef.current.amplitude ?? effectiveAmplitude;
        program.uniforms.uBlend.value = propsRef.current.blend ?? blend;
        const stops = propsRef.current.colorStops ?? resolvedColorStops;
        updateColorStops(stops);
        renderer.render({ scene: mesh });
      };

      animationFrameId = requestAnimationFrame(update);

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
        if (ctn && gl.canvas && gl.canvas.parentNode === ctn) {
          try {
            ctn.removeChild(gl.canvas);
          } catch (e) {
            // Ignore if child already removed
          }
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      };
    };

    const idleWindow = window as typeof window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    startAurora();

    return () => {
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      cleanup?.();
    };
  }, [blend, resolvedColorStops, effectiveAmplitude, effectiveSpeed, shouldAnimate]);

  // Neutral boot style to avoid bright blue flash before we know mobile/desktop mode.
  const bootStyle: React.CSSProperties = {
    backgroundColor: '#050913',
    backgroundImage: 'linear-gradient(180deg, #04070f 0%, #050913 55%, #070e1d 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };

  // Static fallback for mobile / reduced motion.
  // Keep this visually close to desktop Aurora so hard refresh does not look flat.
  const staticStyle = {
    backgroundColor: '#050913',
    backgroundImage: `
      radial-gradient(120% 85% at 50% -10%, ${resolvedColorStops[1]}40 0%, transparent 58%),
      radial-gradient(90% 70% at 90% 20%, ${resolvedColorStops[2]}30 0%, transparent 62%),
      radial-gradient(90% 70% at 10% 18%, ${resolvedColorStops[0]}2b 0%, transparent 64%),
      linear-gradient(180deg, #04070f 0%, #050913 45%, #070e1d 100%)
    `,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    filter: isSubtle ? 'saturate(0.9) brightness(0.9)' : 'saturate(1.05) brightness(1)',
  } as React.CSSProperties;

  const resolvedStyle =
    shouldAnimate === null
      ? bootStyle
      : shouldAnimate
        ? undefined
        : staticStyle;

  return (
    <div
      ref={ctnDom}
      className={`aurora-container ${isSubtle ? 'aurora-subtle' : ''} ${props.className || ''} `}
      style={resolvedStyle}
    />
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(Aurora);
