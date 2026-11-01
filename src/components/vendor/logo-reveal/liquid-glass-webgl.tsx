"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Liquid Glass Logo Reveal (WebGL2 Shader Engine with Fail-Safe SVG Fallback)
 * Author: Denis Kuzin (@shepovalovdenis) on 21st.dev / based on zanwei/glass-icon-reveal
 * Licensed: MIT
 */

interface LiquidGlassCanvasProps {
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  isPlaying?: boolean;
}

export function LiquidGlassCanvas({
  onProgress,
  onComplete,
  isPlaying = true,
}: LiquidGlassCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // 1. Get WebGL 2 Context
      const gl = canvas.getContext("webgl2", {
        antialias: true,
        premultipliedAlpha: false,
        alpha: true,
        preserveDrawingBuffer: true,
      });

      if (!gl) {
        console.warn("WebGL2 not available; activating fallback.");
        setHasError(true);
        if (onComplete) onComplete();
        return;
      }

      const TEX = 1024;
      const BOX = 0.86;

      const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`.trim();

      const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uCenter;
uniform float uTile;
uniform sampler2D uSdf;
uniform sampler2D uCol;
uniform float uTexSize;
uniform float uBoxFrac;

uniform float uPlateScale;
uniform float uShapeN;
uniform float uCornerN;
uniform float uOptics;
uniform float uPlateAlpha;
uniform float uLogoHalf;
uniform vec2 uLogoOff;
uniform float uBold;
uniform float uBlur;
uniform float uFrost;
uniform float uDome;
uniform float uDrop;
uniform float uPinch;
uniform float uTilt;
uniform float uRim;
uniform float uHalo;
uniform float uShadow;
uniform float uGhost;
uniform float uRipR;
uniform float uRipA;
uniform float uBare;
uniform float uReach;
uniform float uCornerPull;
uniform float uStreak;
uniform float uWiden;
uniform float uSlab;
uniform float uEtaSpread;
uniform float uFocus;
uniform float uFocusK;
uniform float uFocusSplit;
uniform float uRimLine;
uniform float uCornerOn;
uniform float uDissolve;
uniform float uGlow;
uniform float uFaceDisp;
uniform float uVivid;

uniform float uDepth;
uniform float uDisp;
uniform float uDouble;
uniform float uBevelW;
uniform float uSpec;
uniform float uIconPlate;
uniform float uUseColor;
uniform float uLightScene;

uniform vec3 uBg;
uniform vec3 uPlateCol;
uniform vec3 uLogoCol;

vec4 logoAt(vec2 q, float blur, float aa) {
  float L = uLogoHalf;
  float k = 0.5 * uBoxFrac / L;
  vec2 uv = vec2(0.5 + (q.x - uLogoOff.x) * k, 0.5 - (q.y - uLogoOff.y) * k);
  float d = texture(uSdf, uv).r / k;
  float w = 0.75 * aa + blur;
  float a = 1.0 - smoothstep(-w, w, d - uBold * L);
  vec3 c = uLogoCol;
  if (uUseColor > 0.5) {
    float lod = log2(max(1.0, w * k * uTexSize));
    vec4 c0 = textureLod(uCol, uv, lod);
    vec4 c1 = textureLod(uCol, uv, lod + 3.0);
    vec4 c2 = textureLod(uCol, uv, 7.0);
    c = c2.rgb / max(c2.a, 1e-4);
    c = mix(c, c1.rgb / max(c1.a, 1e-4), smoothstep(0.0, 0.06, c1.a));
    c = mix(c, c0.rgb / max(c0.a, 1e-4), smoothstep(0.02, 0.3, c0.a));
  }
  return vec4(c, a);
}

float shape(vec2 p, float scale, float n, out vec2 nOut, out float g, out vec2 dg) {
  vec2 pp = p / scale;
  vec2 a = max(abs(pp), vec2(1e-6));
  g = pow(pow(a.x, n) + pow(a.y, n), 1.0 / n);
  dg = sign(pp) * pow(a, vec2(n - 1.0)) * pow(max(g, 1e-6), 1.0 - n);
  float dgl = max(length(dg), 1e-6);
  nOut = dg / dgl;
  return (g - 1.0) / dgl * scale;
}

float contourRadius(vec2 p, float scale, float n) {
  vec2 a = max(abs(p / scale), vec2(1e-4));
  vec2 a1 = pow(a, vec2(n - 1.0));
  vec2 a2 = pow(a, vec2(n - 2.0));
  float k = (n - 1.0) * (a2.x * a1.y * a1.y + a2.y * a1.x * a1.x) / pow(max(dot(a1, a1), 1e-30), 1.5);
  return scale / max(k, 1e-3);
}

vec2 refractSample(float x, float bwF, float eta, float R, vec2 dirOut, vec2 p, float dome, float offMul) {
  float u = clamp(1.0 - x, 0.0, 0.995);
  float th = asin(u), thr = asin(u / eta);
  float z = uSlab + bwF * sqrt(1.0 - u * u);
  float off = offMul * z * tan(th - thr);
  off = off / (1.0 + off / (6.0 * R));
  return p - (dirOut * off + p * dome) * uOptics;
}

float gauss(float x, float c, float w) { float d = (x - c) / w; return exp(-0.5 * d * d); }
float band(float x, float a, float b, float w) { return smoothstep(a - w, a, x) * (1.0 - smoothstep(b, b + w, x)); }
float bump(float x, float c, float w) { float d = (x - c) / w; return exp(-0.5 * d * d); }
vec3 spectrum(float x) {
  return vec3(bump(x, 0.34, 0.2) + 0.08 * bump(x, 0.93, 0.05), bump(x, 0.58, 0.1), bump(x, 0.8, 0.11));
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  float px = 2.0 / uTile;
  vec2 p = (gl_FragCoord.xy - uCenter) * px;

  vec4 lg = logoAt(p, uBlur, px);
  vec3 plain = mix(uBg, lg.rgb, lg.a * uBare);

  vec2 nOut, dg; float g;
  float sd = shape(p, uPlateScale, uShapeN, nOut, g, dg);
  float s = -sd;
  float bw = max(uBevelW, 0.004) * uPlateScale;
  float x = clamp(s / bw, 0.0, 1.0);
  float R = contourRadius(p, uPlateScale, uShapeN);
  vec2 pq = p * p;
  float diag = 4.0 * pq.x * pq.y / max((pq.x + pq.y) * (pq.x + pq.y), 1e-6);
  float tilt = mix(1.0 - uTilt, 1.0, smoothstep(-0.02, 0.02, p.x * p.y));
  float pinchPart = uPinch * min(g * g, 1.0) * diag * diag * tilt;
  float dome = uDome * (1.0 - min(g * g, 1.0)) + pinchPart;
  vec2 dirOut = normalize(mix(nOut, p / max(length(p), 1e-4), 0.2));
  float cornerness = max(smoothstep(0.1, 0.9, 4.0 * nOut.x * nOut.x * nOut.y * nOut.y), smoothstep(0.15, 0.75, diag));
  float offMul = 1.0 + 0.4 * max(uCornerPull - 1.0, 0.0) * tilt * cornerness * uCornerOn;
  vec2 focus = sign(p) * (pow(0.5, 1.0 / uShapeN) - uFocus * 0.70710678) * uPlateScale;
  float focusW = tilt * cornerness * uOptics * uCornerOn;
  float bwF = max(uReach, 0.004) * (1.0 + uWiden * tilt * cornerness * uCornerOn);
  float xf = clamp(s / bwF, 0.0, 1.0);
  vec2 qc = refractSample(xf, bwF, 1.5, R, dirOut, p, dome, offMul);
  float foot = max(max(length(dFdx(qc)), length(dFdy(qc))), 0.25 * px);

  vec3 bg = uBg;
  vec3 lift = mix(uBg + vec3(0.06), mix(uBg, vec3(1.0), 0.55), uLightScene);
  if (uGhost > 0.001) {
    vec2 gn, gdg; float gg;
    float gsd = shape(p, 1.0, uCornerN, gn, gg, gdg);
    bg = mix(bg, lift, uGhost * 0.12 * (1.0 - smoothstep(-0.16, 0.14, gsd)));
    bg *= 1.0 - uGhost * 0.03 * uLightScene * exp(-max(gsd, 0.0) / 0.12) * step(0.0, gsd);
  }
  float outside = max(sd, 0.0);
  if (uRipA > 0.001) {
    float d0 = (uRipR - 1.0) * uPlateScale;
    float rx = (sd - d0) / 0.022;
    float ring = exp(-rx * rx);
    bg += uRipA * ring * (0.04 * (0.55 + 0.45 * dot(nOut, normalize(vec2(-0.5, 0.8))))) * mix(0.5, 1.0, uLightScene);
    bg -= uRipA * 0.016 * uLightScene * exp(-(rx - 1.6) * (rx - 1.6));
  }
  float shadowFall = max(sd, 0.0) / (0.9 * uPlateScale);
  bg *= 1.0 - uShadow * 0.03 * exp(-shadowFall * shadowFall) * step(0.0, sd);
  vec3 haloCol = mix(vec3(0.62, 0.69, 0.80), vec3(1.0), uLightScene);
  bg = mix(bg, haloCol, clamp(uHalo * (0.30 * exp(-outside / (0.025 * uPlateScale)) + 0.07 * exp(-outside / (0.12 * uPlateScale))), 0.0, 1.0) * step(0.0, sd));

  vec3 col = bg;
  float soft = px + uBlur * 0.8 + 0.06 * uDissolve * uPlateScale;
  if (sd < soft) {
    float y1 = 1.0 - x;
    const float K = 2.6;
    float base1 = max(1.0 - pow(y1, K), 1e-4);
    float db = min(pow(y1, K - 1.0) * pow(base1, 1.0 / K - 1.0), 25.0);
    float s1 = bw * 0.62;
    float w2 = bw * 0.22;
    float t2 = clamp((s - s1) / w2, -1.0, 1.0);
    float dh2 = uDouble * bw * 0.16;
    float dd = dh2 * 0.5 * cos(t2 * 1.5707963) * 1.5707963 / w2 * step(abs(t2), 0.999);
    vec2 gDome = -uDome * 2.0 * g * dg * step(g, 1.0);
    vec2 grad = -(db + dd) * nOut + gDome;

    vec3 back = mix(uBg, uPlateCol, uIconPlate);
    float rblur = uBlur + 0.05 * length(qc - p) + min(uGlow * uOptics * (1.0 - xf) * foot / px, 0.04);
    float cornerW = smoothstep(0.1, 0.9, 4.0 * nOut.x * nOut.x * nOut.y * nOut.y);
    float streak = 0.35 * uStreak * bw * mix(0.15, 1.0, cornerW) * pow(1.0 - xf, 1.5) * uOptics;
    vec2 tangent = vec2(-nOut.y, nOut.x);
    vec3 acc = vec3(0.0), wsum = vec3(0.0);
    for (int i = 0; i < 20; i++) {
      float lam = (float(i) + 0.5) / 20.0;
      float c = uDisp * (1.0 - 2.0 * lam);
      vec2 along = tangent * (streak * 2.0 * (fract(float(i) * 0.618034 + 0.31) - 0.5));
      float cf = uDisp * (1.0 - 2.0 * lam) * (lam > 0.5 ? 1.0 : 0.5);
      vec2 sp = refractSample(xf, bwF, 1.5 + uEtaSpread * c, R, dirOut, p + along,
                              dome + pinchPart * 0.3 * c, offMul);
      vec2 focusL = focus - sign(p) * (0.70710678 * uFocusSplit * c * uPlateScale);
      float wFocus = pow(1.0 - xf, uFocusK) * smoothstep(0.0, uRimLine * (1.0 + 0.6 * c), xf);
      sp = mix(sp, mix(p + along, focusL, wFocus), focusW);
      float faceOnly = smoothstep(0.7, 1.0, xf) * uOptics;
      sp *= 1.0 + uFaceDisp * cf * faceOnly;
      vec4 l = logoAt(sp, rblur + 0.12 * streak + uFaceDisp * 0.5 * max(c, 0.0) * faceOnly, foot);
      vec3 w = spectrum(lam);
      acc += mix(back, l.rgb, l.a) * w;
      wsum += w;
    }
    vec3 trans = acc / wsum;
    float tl = dot(trans, vec3(0.2126, 0.7152, 0.0722));
    trans = clamp(tl + (trans - tl) * (1.0 + uVivid * uOptics), 0.0, 1.0);
    float hazeLum = dot(trans, vec3(0.2126, 0.7152, 0.0722));
    float hazeGate = mix(1.0 - smoothstep(0.25, 0.75, hazeLum), smoothstep(0.25, 0.75, hazeLum), uLightScene);
    trans = mix(trans, lift, uFrost * 0.45 * hazeGate);

    float glassAmt = pow(1.0 - uDissolve, 1.5);
    float lit = uSpec * glassAmt;
    vec3 rimCol = mix(vec3(0.80, 0.87, 0.97), vec3(1.0), uLightScene);

    float sc = uPlateScale;
    float tLum = dot(trans, vec3(0.2126, 0.7152, 0.0722));
    float lightOnly = smoothstep(0.35, 0.85, tLum);
    float hw = smoothstep(-0.85, 0.5, dot(nOut, vec2(0.5, 0.866)));
    float tileBand = band(s, 0.016 * sc, 0.075 * sc, 0.022 * sc);
    float dropBand = (1.0 - smoothstep(0.06 * sc, 0.13 * sc, s)) * smoothstep(0.0, 0.004 * sc, s);
    float glow = mix(0.32 * tileBand, 0.75 * dropBand, uDrop) * lightOnly;
    float edgeLine = gauss(s, 0.005 * sc, 0.0045 * sc);
    float lip = gauss(s, 0.15 * sc, 0.007 * sc) * uDouble * (1.0 - uDrop);
    vec3 lightGlass = mix(trans, vec3(1.0), glow * glassAmt);
    lightGlass += (0.075 * hw * edgeLine + 0.06 * (0.4 + 0.6 * hw) * lip) * lit;
    lightGlass *= 1.0 - 0.05 * (1.0 - hw) * edgeLine * glassAmt * (1.0 - uDrop);
    lightGlass = mix(lightGlass, vec3(1.0), 0.55 * uDrop * glassAmt * edgeLine);

    vec3 Nl = normalize(vec3(-grad, 1.0));
    float edge = 1.0 - Nl.z;
    vec2 ldir = normalize(vec2(-0.62, 0.78));
    float side = dot(nOut, ldir);
    float fres = pow(edge, 1.5);
    vec3 rim = rimCol * fres * (0.35 + 0.65 * max(side, -side * 0.8)) * uRim * 0.65;
    vec3 Hv = normalize(normalize(vec3(-0.45, 0.6, 0.66)) + vec3(0.0, 0.0, 1.0));
    float sp = pow(max(dot(Nl, Hv), 0.0), 140.0) * 0.8 * smoothstep(0.0, 0.25, y1);
    vec3 darkGlass = trans * (1.0 - 0.25 * fres) + (rim + vec3(sp)) * lit;
    darkGlass = mix(darkGlass, rimCol, uDrop * 0.4 * uSpec * (1.0 - smoothstep(0.0, 0.1 * uPlateScale, s)));
    vec3 glass = mix(darkGlass, lightGlass, uLightScene);

    float cov = clamp(0.5 - sd / soft, 0.0, 1.0);
    col = mix(bg, glass, cov);
  }

  vec3 outc = mix(plain, col, uPlateAlpha);
  outc += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(outc, 1.0);
}`.trim();

      // Compile helper
      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src.replace(/\r/g, ""));
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(sh);
          console.warn("Shader compilation detail:", log);
          throw new Error(log || "Shader compile error");
        }
        return sh;
      };

      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(prog) || "Program link error");
      }
      gl.useProgram(prog);

      // Geometry & uniforms setup
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const U: Record<string, WebGLUniformLocation> = {};
      const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(prog, i)!;
        U[info.name] = gl.getUniformLocation(prog, info.name)!;
      }

      const sdfTex = gl.createTexture();
      const colTex = gl.createTexture();
      gl.uniform1i(U.uSdf, 0);
      gl.uniform1i(U.uCol, 1);

      function edt1d(grid: Float64Array, offset: number, stride: number, f: Float64Array, v: Uint16Array, z: Float64Array, INF: number) {
        v[0] = 0; z[0] = -INF; z[1] = INF; f[0] = grid[offset];
        for (let q = 1, k = 0, s = 0; q < TEX; q++) {
          f[q] = grid[offset + q * stride];
          const q2 = q * q;
          do {
            const r = v[k];
            s = (f[q] - f[r] + q2 - r * r) / (q - r) / 2;
          } while (s <= z[k] && --k > -1);
          k++; v[k] = q; z[k] = s; z[k + 1] = INF;
        }
        for (let q = 0, k = 0; q < TEX; q++) {
          while (z[k + 1] < q) k++;
          const r = v[k], qr = q - r;
          grid[offset + q * stride] = f[r] + qr * qr;
        }
      }

      function buildSdf(can: HTMLCanvasElement) {
        const n = TEX * TEX;
        const alpha = can.getContext("2d")!.getImageData(0, 0, TEX, TEX).data;
        const INF = 1e20;
        const outer = new Float64Array(n), inner = new Float64Array(n);
        for (let i = 0; i < n; i++) {
          const a = alpha[i * 4 + 3] / 255;
          if (a >= 1) { outer[i] = 0; inner[i] = INF; }
          else if (a <= 0) { outer[i] = INF; inner[i] = 0; }
          else {
            const dd = 0.5 - a;
            outer[i] = dd > 0 ? dd * dd : 0;
            inner[i] = dd < 0 ? dd * dd : 0;
          }
        }
        const f = new Float64Array(TEX), z = new Float64Array(TEX + 1), v = new Uint16Array(TEX);
        for (let x = 0; x < TEX; x++) edt1d(outer, x, TEX, f, v, z, INF);
        for (let y = 0; y < TEX; y++) edt1d(outer, y * TEX, 1, f, v, z, INF);
        for (let x = 0; x < TEX; x++) edt1d(inner, x, TEX, f, v, z, INF);
        for (let y = 0; y < TEX; y++) edt1d(inner, y * TEX, 1, f, v, z, INF);
        const sdf = new Float32Array(n);
        for (let i = 0; i < n; i++) sdf[i] = (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) / TEX;
        return sdf;
      }

      let hasLogo = false;
      const logoImg = new window.Image();
      logoImg.src = "/keh-logo.svg";
      logoImg.onload = () => {
        const tmp = document.createElement("canvas");
        tmp.width = TEX;
        tmp.height = TEX;
        const ctx = tmp.getContext("2d")!;
        const scale = (TEX * BOX) / Math.max(logoImg.width, logoImg.height);
        const dx = (TEX - logoImg.width * scale) / 2;
        const dy = (TEX - logoImg.height * scale) / 2;
        ctx.drawImage(logoImg, dx, dy, logoImg.width * scale, logoImg.height * scale);

        const sdfData = buildSdf(tmp);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sdfTex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, TEX, TEX, 0, gl.RED, gl.FLOAT, sdfData);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, colTex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, tmp);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        hasLogo = true;
      };

      function spring(t: number, response: number, damping: number) {
        if (t <= 0) return 0;
        const w = (2 * Math.PI) / response;
        if (damping >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
        const wd = w * Math.sqrt(1 - damping * damping);
        return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t));
      }

      const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
      const smooth = (a: number, b: number, x: number) => {
        const t = clamp01((x - a) / (b - a));
        return t * t * (3 - 2 * t);
      };

      const hexToRgb = (h: string) => {
        const v = parseInt(h.slice(1), 16);
        return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
      };

      const bgRgb = hexToRgb("#F9F9F6");
      const plateRgb = hexToRgb("#FFFFFF");
      const logoRgb = hexToRgb("#282E3C");

      const P = {
        tileSize: 270,
        logoScale: 0.84,
        finalScale: 0.80,
        opticalDepth: 1.15,
        dispersion: 1.75,
        glow: 1.3,
        doubleBevel: 1,
        bevelWidth: 0.15,
        corner: 4.8,
        cornerPull: 2.1,
        cornerWidth: 2.2,
        cornerFocus: 0.58,
        edgeSmear: 2.85,
        stretch: 0.1,
        tilt: 0.35,
        bulge: 1.05,
        specular: 1.1,
        halo: 0.2,
        shadow: 1.0,
        ripple: 1.0,
        bounce: 0.05,
        response: 0.38,
        startSize: 0.22,
        startZoom: 2.4,
        present: 1.35,
        drift: 0.1,
        focus: 1,
        swell: 0.5,
      };

      let startTime = performance.now();
      let completedTriggered = false;

      const FRAME_KEYS = [
        "uPlateScale", "uShapeN", "uCornerN", "uOptics", "uPlateAlpha", "uLogoHalf", "uBold", "uBlur",
        "uFrost", "uDome", "uDrop", "uPinch", "uTilt", "uBare", "uReach", "uCornerPull", "uStreak",
        "uWiden", "uSlab", "uEtaSpread", "uFocus", "uFocusK", "uFocusSplit", "uRimLine", "uCornerOn",
        "uDissolve", "uGlow", "uFaceDisp", "uVivid", "uRim", "uHalo", "uShadow", "uGhost", "uRipR",
        "uRipA", "uDepth", "uDisp", "uDouble", "uBevelW", "uSpec", "uIconPlate", "uUseColor", "uLightScene"
      ];

      function loop(now: number) {
        if (!canvas || !gl) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(canvas.clientWidth * dpr);
        const h = Math.round(canvas.clientHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const elapsed = (now - startTime) / 1000;
        const totalDuration = P.present + 0.95;
        const T = isPlaying ? Math.min(elapsed, totalDuration) : totalDuration;

        if (onProgressRef.current) {
          onProgressRef.current(Math.min(1, T / totalDuration));
        }

        if (elapsed >= totalDuration && !completedTriggered) {
          completedTriggered = true;
          if (onCompleteRef.current) onCompleteRef.current();
        }

        if (hasLogo) {
          const tx = P.present;
          const damping = 1 - P.bounce;
          const grow = spring(T + 0.01, P.response, damping);
          const tl = 0.22;
          const tm = 0.26;
          const morph = spring(T - tm, 0.32, 1);
          const drop = 1 - smooth(0.05, 1, morph);
          const appear = smooth(0, 0.06, T);
          const drift = P.drift * spring(T - 0.25, 1.5, 1);
          const zoomIn = spring(T, 0.7, 1);
          const settle = spring(T - 0.4, 1.6, 1);
          const exit = spring(T - tx, 0.8, 1);
          const release = spring(T - tx - 0.05, 0.5, 1);
          const dome = 0.15 * P.bulge * (1 - smooth(0.4, 0.95, grow));
          const viewScale = (1 + (P.startZoom - 1) * (1 - zoomIn)) * (1 - 0.045 * settle) * ((1 - exit) + P.finalScale * exit);
          const bandW = (1 - drop) * P.bevelWidth + drop * Math.max(P.bevelWidth, 0.4);
          const plateScale = ((1 - grow) * P.startSize + grow) * (1 + drift) * (1 + 0.14 * release);

          const fr: Record<string, number> = {
            uPlateScale: plateScale,
            uShapeN: (1 - morph) * 2 + morph * P.corner,
            uCornerN: P.corner,
            uOptics: 1 - smooth(0.55, 1, release),
            uPlateAlpha: appear * (1 - smooth(0.45, 1, release)),
            uLogoHalf: P.logoScale * viewScale,
            uBold: P.swell * 0.03 * (1 - zoomIn),
            uBlur: P.focus * 0.05 * (1 - smooth(0.3, 0.95, grow)),
            uFrost: P.focus * (1 - smooth(0.5, 0.95, grow)),
            uPinch: 0.38 * P.stretch * smooth(0.1, 0.9, morph) * smooth(0.75, 0.97, zoomIn),
            uTilt: P.tilt,
            uDome: dome,
            uDrop: drop,
            uRim: 1 + 0.8 * drop,
            uHalo: P.halo * (0.5 + 0.5 * drop),
            uShadow: P.shadow * smooth(0.45, 0.8, grow) * (1 - smooth(0, 0.6, morph)),
            uGhost: smooth(0, 0.03, T) * (1 - smooth(0.04, 0.08, T)),
            uRipR: 1 + 0.9 * Math.max(0, T - tl),
            uRipA: P.ripple * smooth(tl, tl + 0.06, T) * Math.exp(-Math.max(0, T - tl) / 0.5),
            uBare: smooth(tx - 0.2, tx, T),
            uReach: bandW * plateScale,
            uCornerPull: P.cornerPull,
            uStreak: P.edgeSmear,
            uWiden: P.cornerWidth,
            uSlab: 0.3 * P.opticalDepth,
            uEtaSpread: 0.06,
            uFocus: P.cornerFocus,
            uFocusK: 1.0,
            uFocusSplit: 0.056 * P.glow,
            uRimLine: 0.09,
            uCornerOn: smooth(0.35, 1, morph),
            uGlow: 0.012 * P.glow,
            uFaceDisp: 0.012 * P.dispersion,
            uVivid: 0.85,
            uDissolve: release,
            uDepth: P.opticalDepth,
            uDisp: P.dispersion,
            uDouble: P.doubleBevel,
            uBevelW: bandW * (1 - release),
            uSpec: P.specular,
            uIconPlate: 0,
            uUseColor: 1,
            uLightScene: 1,
          };

          gl.viewport(0, 0, w, h);
          gl.uniform2f(U.uCenter, w / 2, h / 2);
          const dynamicTile = Math.min(canvas.clientHeight * 0.95, 260) * dpr;
          gl.uniform1f(U.uTile, dynamicTile);
          gl.uniform1f(U.uTexSize, TEX);
          gl.uniform1f(U.uBoxFrac, BOX);

          for (const k of FRAME_KEYS) {
            if (U[k]) gl.uniform1f(U[k], fr[k]);
          }

          gl.uniform3fv(U.uBg, bgRgb);
          gl.uniform3fv(U.uPlateCol, plateRgb);
          gl.uniform3fv(U.uLogoCol, logoRgb);
          gl.uniform2fv(U.uLogoOff, [0, 0]);

          gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        // Once the reveal finishes and settles at rest, freeze on final frame
        if (elapsed >= totalDuration + 0.1) {
          animFrameRef.current = null;
          return;
        }

        animFrameRef.current = requestAnimationFrame(loop);
      }

      animFrameRef.current = requestAnimationFrame(loop);

      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
      };
    } catch (err) {
      console.warn("WebGL initialization caught error, switching to graceful fallback:", err);
      setHasError(true);
      if (onCompleteRef.current) onCompleteRef.current();
    }
  }, [isPlaying]);

  if (hasError) {
    // Graceful SVG Glassmorphic Refraction Fallback (Never crashes)
    return (
      <div className="relative w-full h-full flex items-center justify-center p-8">
        <div className="relative w-64 h-64 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 shadow-[0_8px_32px_rgba(31,41,55,0.08)] flex items-center justify-center p-6 overflow-hidden">
          {/* Specular Liquid Sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent transform -skew-x-12 animate-shimmer" />
          <Image
            src="/keh-logo.svg"
            alt="KalExamHai Logo"
            width={340}
            height={156}
            className="w-full h-auto drop-shadow-sm"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block touch-none"
      aria-label="Liquid Glass Logo Reveal"
    />
  );
}
