import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { SNOW_IS_FALLING_FRAGMENT, SNOW_IS_FALLING_VERTEX } from '../../shaders/snowIsFalling.frag';

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[SnowIsFalling]', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

type Props = {
  active: boolean;
  className?: string;
};

export function SnowIsFallingBackground({ active, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
      premultipliedAlpha: false,
    });
    if (!gl) {
      console.warn('[SnowIsFalling] WebGL2 not supported');
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, SNOW_IS_FALLING_VERTEX);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, SNOW_IS_FALLING_FRAGMENT);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[SnowIsFalling]', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return;
    }

    const locRes = gl.getUniformLocation(prog, 'iResolution');
    const locTime = gl.getUniformLocation(prog, 'iTime');
    const locMouse = gl.getUniformLocation(prog, 'iMouse');

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const t0 = performance.now();
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const bw = Math.max(1, Math.floor(w * dpr));
      const bh = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();

    const draw = () => {
      if (!activeRef.current) return;
      resize();
      gl.useProgram(prog);
      const t = (performance.now() - t0) / 1000;
      gl.uniform3f(locRes, canvas.width, canvas.height, 1.0);
      gl.uniform1f(locTime, t);
      // 默认固定到模板较自然的位置
      gl.uniform3f(locMouse, canvas.width * 0.55, canvas.height * 0.32, 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (vao) gl.deleteVertexArray(vao);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 z-0 block h-full w-full', className)}
      aria-hidden
    />
  );
}
