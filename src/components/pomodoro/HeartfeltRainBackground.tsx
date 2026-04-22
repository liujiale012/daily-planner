import { useEffect, useRef } from 'react';
import { HEARTFELT_RAIN_FRAGMENT, HEARTFELT_RAIN_VERTEX } from '../../shaders/heartfeltRain.frag';
import { cn } from '../../lib/utils';

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[HeartfeltRain]', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

/**
 * iChannel0：贴近 Shadertoy Heartfelt 默认的「室内暗景透过玻璃」——偏冷灰蓝、中心略亮，便于着色器闪电/色调叠加。
 */
function createHeartfeltChannel0Texture(gl: WebGL2RenderingContext): WebGLTexture {
  const tex = gl.createTexture()!;
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const lg = ctx.createLinearGradient(0, 0, size, size);
  lg.addColorStop(0, '#1c222e');
  lg.addColorStop(0.35, '#12161c');
  lg.addColorStop(0.7, '#0a0c10');
  lg.addColorStop(1, '#040508');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, size, size);
  const rg = ctx.createRadialGradient(
    size * 0.38,
    size * 0.32,
    0,
    size * 0.45,
    size * 0.42,
    size * 0.72
  );
  rg.addColorStop(0, 'rgba(55, 65, 85, 0.55)');
  rg.addColorStop(0.45, 'rgba(28, 34, 44, 0.22)');
  rg.addColorStop(1, 'rgba(8, 10, 14, 0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] = Math.min(255, Math.max(0, img.data[i] + n * 0.9));
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 0.95));
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 1.05));
  }
  ctx.putImageData(img, 0, 0);

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

type Props = {
  active: boolean;
  className?: string;
};

/**
 * Heartfelt 雨滴玻璃着色器背景（WebGL2）。不支持时由父级底色兜底。
 */
export function HeartfeltRainBackground({ active, className }: Props) {
  // Heartfelt 原版前几秒有明显淡入叙事段，给一个时间偏移让雨滴更快出现。
  const START_TIME_OFFSET_SECONDS = 12;
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
      console.warn('[HeartfeltRain] WebGL2 不可用');
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, HEARTFELT_RAIN_VERTEX);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, HEARTFELT_RAIN_FRAGMENT);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[HeartfeltRain]', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return;
    }

    const tex = createHeartfeltChannel0Texture(gl);
    const locRes = gl.getUniformLocation(prog, 'iResolution');
    const locTime = gl.getUniformLocation(prog, 'iTime');
    const locMouse = gl.getUniformLocation(prog, 'iMouse');
    const locCh0 = gl.getUniformLocation(prog, 'iChannel0');

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const t0 = performance.now();
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
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
      const t = START_TIME_OFFSET_SECONDS + (performance.now() - t0) / 1000;
      gl.useProgram(prog);
      gl.uniform3f(locRes, canvas.width, canvas.height, 1.0);
      gl.uniform1f(locTime, t);
      gl.uniform3f(locMouse, 0.0, 0.0, 0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(locCh0, 0);
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
      gl.deleteTexture(tex);
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
