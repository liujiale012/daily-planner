import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import {
  RAINFOREST_LANDSCAPE_FRAGMENT,
  RAINFOREST_LANDSCAPE_VERTEX,
} from '../../shaders/rainforestLandscape.frag';

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('[RainforestLandscape]', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function createRenderTexture(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  useFloat: boolean
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  if (useFloat) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  } else {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

type Props = {
  active: boolean;
  isRunning: boolean;
  className?: string;
};

export function RainforestLandscapeBackground({ active, isRunning, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const isRunningRef = useRef(isRunning);
  activeRef.current = active;
  isRunningRef.current = isRunning;

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
      console.warn('[RainforestLandscape] WebGL2 not supported');
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, RAINFOREST_LANDSCAPE_VERTEX);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, RAINFOREST_LANDSCAPE_FRAGMENT);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[RainforestLandscape]', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return;
    }

    const locRes = gl.getUniformLocation(prog, 'iResolution');
    const locTime = gl.getUniformLocation(prog, 'iTime');
    const locFrame = gl.getUniformLocation(prog, 'iFrame');
    const locCh0 = gl.getUniformLocation(prog, 'iChannel0');
    const locQuality = gl.getUniformLocation(prog, 'uQualityTier');

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const textures: Array<WebGLTexture | null> = [null, null];
    const framebuffers: Array<WebGLFramebuffer | null> = [null, null];
    const hasFloatColorBuffer = !!gl.getExtension('EXT_color_buffer_float');
    const useFloatFeedback = hasFloatColorBuffer;
    let w = 0;
    let h = 0;
    let frame = 0;
    const t0 = performance.now();
    const nav = navigator as Navigator & { deviceMemory?: number };
    const deviceMemory = nav.deviceMemory ?? 8;
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    const lowTierDevice = deviceMemory <= 8 || cpuCores <= 8;
    const renderScaleRunning = lowTierDevice ? 0.62 : 0.72;
    const renderScalePaused = lowTierDevice ? 0.5 : 0.58;
    const runningFps = lowTierDevice ? 30 : 45;
    const pausedFps = 15;
    let lastFrameTs = 0;

    const releaseBuffers = () => {
      for (const fb of framebuffers) if (fb) gl.deleteFramebuffer(fb);
      for (const tex of textures) if (tex) gl.deleteTexture(tex);
      framebuffers[0] = null;
      framebuffers[1] = null;
      textures[0] = null;
      textures[1] = null;
    };

    const ensureBuffers = (bw: number, bh: number) => {
      if (bw === w && bh === h && textures[0] && textures[1] && framebuffers[0] && framebuffers[1]) return;
      releaseBuffers();
      w = bw;
      h = bh;
      for (let i = 0; i < 2; i += 1) {
        const tex = createRenderTexture(gl, w, h, useFloatFeedback);
        const fb = gl.createFramebuffer();
        if (!fb) continue;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          gl.deleteFramebuffer(fb);
          gl.deleteTexture(tex);
          continue;
        }
        textures[i] = tex;
        framebuffers[i] = fb;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      frame = 0;
    };

    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const renderScale = isRunningRef.current ? renderScaleRunning : renderScalePaused;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const bw = Math.max(1, Math.floor(w * dpr * renderScale));
      const bh = Math.max(1, Math.floor(h * dpr * renderScale));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ensureBuffers(canvas.width, canvas.height);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    resize();

    const draw = (now: number) => {
      if (!activeRef.current) return;
      const targetFps = isRunningRef.current ? runningFps : pausedFps;
      const minInterval = 1000 / targetFps;
      if (now - lastFrameTs < minInterval) {
        raf = requestAnimationFrame(draw);
        return;
      }
      lastFrameTs = now;
      resize();
      if (!textures[0] || !textures[1] || !framebuffers[0] || !framebuffers[1]) return;
      const readIdx = frame & 1;
      const writeIdx = (frame + 1) & 1;
      const srcTex = textures[readIdx]!;
      const dstFb = framebuffers[writeIdx]!;

      gl.bindFramebuffer(gl.FRAMEBUFFER, dstFb);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(prog);
      gl.uniform3f(locRes, canvas.width, canvas.height, 1.0);
      gl.uniform1f(locTime, (performance.now() - t0) / 1000);
      gl.uniform1i(locFrame, useFloatFeedback ? frame : 0);
      gl.uniform1f(locQuality, isRunningRef.current ? 1.0 : 0.0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.uniform1i(locCh0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, dstFb);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.blitFramebuffer(
        0,
        0,
        canvas.width,
        canvas.height,
        0,
        0,
        canvas.width,
        canvas.height,
        gl.COLOR_BUFFER_BIT,
        gl.LINEAR
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      if (useFloatFeedback) frame += 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      releaseBuffers();
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
