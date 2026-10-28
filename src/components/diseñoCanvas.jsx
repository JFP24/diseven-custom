import { Stage, Layer, Image as KonvaImage, Rect, Group, Text, Line, Path } from 'react-konva';
import useImage from 'use-image';
import React ,{ useEffect, useRef, useState, useCallback } from 'react';
import styles from './diseñoCanvas.module.css';
const reloadIcon = "/assets/ICONOS/icono-reload.png";
const logoDiseven = "/assets/imgHome/disevenhome.png";
import { FolderKanban, Save, RotateCcw } from "lucide-react";
import ProfileBar from "./Auth/ProfileBar.jsx";
import LoginModal from "./Auth/LoginModal.jsx";
import PrefsToggle from "./PrefsToggle.jsx";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { usePrefs } from "../i18n/PrefsContext.jsx";
import { LogIn, Eye } from "lucide-react";
import Swal from 'sweetalert2';

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { iconLabel, iconMatches } from "../data/iconNames.js";
// --- Métrica unificada del icono+etiqueta (usada por editor y exportación) ---
const ICON_LABEL_GAP = 6;     // separación icono → etiqueta
const LABEL_LINE_HEIGHT = 1.15;

// Ajusta la etiqueta: intenta 1 línea (reduciendo la fuente si hace falta)
// y, si aún no cabe, la parte en 2 líneas balanceadas por palabras.
// Devuelve { lines: string[], fontSize }.
function fitLabel(rawText, size, baseRatio = 0.19) {
  const text = (rawText || "").trim();
  if (text.length < 1) return { lines: [], fontSize: 0 };

  const maxW = size + 56; // ancho "cómodo" para una línea
  const baseFs = Math.max(10, Math.round(size * baseRatio));
  const minFs = Math.max(8, Math.round(size * (baseRatio * 0.74)));
  // ancho aproximado de Montserrat 600 (~0.6 del tamaño de fuente por carácter)
  const widthAt = (str, fs) => str.length * fs * 0.6;

  // 1) Intentar una sola línea, reduciendo la fuente hasta el mínimo
  let fs = baseFs;
  while (fs > minFs && widthAt(text, fs) > maxW) fs -= 1;
  if (widthAt(text, fs) <= maxW) return { lines: [text], fontSize: fs };

  // 2) Dos líneas balanceadas por palabras, ajustando la fuente para que la
  //    línea más larga quepa COMPLETA (sin recortes).
  const words = text.split(/\s+/);
  if (words.length >= 2) {
    const half = Math.ceil(words.length / 2);
    const l1 = words.slice(0, half).join(" ");
    const l2 = words.slice(half).join(" ");
    const longest = Math.max(l1.length, l2.length);
    let f2 = baseFs;
    while (f2 > minFs && widthAt("x".repeat(longest), f2) > maxW) f2 -= 1;
    return { lines: [l1, l2], fontSize: f2 };
  }

  // 3) Palabra única muy larga: al mínimo (se muestra completa aunque sobresalga)
  return { lines: [text], fontSize: minFs };
}

// Cuánto se sube el bloque icono+texto cuando hay 2 líneas (para que quepa todo)
function labelYShift(fit) {
  return ((Math.max(1, fit.lines.length) - 1) * fit.fontSize * LABEL_LINE_HEIGHT) / 2;
}

// Etiqueta para exportación: MAYÚSCULAS; si tiene 2+ palabras → 2 líneas
// balanceadas (como la referencia). 1 palabra → 1 línea.
function exportLabelLines(rawText, upper = true) {
  let txt = (rawText || "").trim();
  if (upper) txt = txt.toUpperCase();
  const words = txt.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words;
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

// --- Escribir la medida física (DPI) en un PNG mediante el chunk pHYs ---
const _CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function _crc32(bytes, start, end) {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = _CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
// Inserta un chunk pHYs (pixeles por metro) tras IHDR. ppm = px por metro.
function addPngPhys(dataURL, ppmX, ppmY) {
  try {
    const bin = atob(dataURL.split(",")[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const chunk = new Uint8Array(21); // 4 len + 4 type + 9 data + 4 crc
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9);
    chunk[4] = 0x70; chunk[5] = 0x48; chunk[6] = 0x59; chunk[7] = 0x73; // "pHYs"
    dv.setUint32(8, ppmX >>> 0);
    dv.setUint32(12, ppmY >>> 0);
    chunk[16] = 1; // unidad = metro
    dv.setUint32(17, _crc32(chunk, 4, 17));

    // Firma PNG (8) + IHDR (25) = 33 → insertamos aquí
    const out = new Uint8Array(bytes.length + 21);
    out.set(bytes.subarray(0, 33), 0);
    out.set(chunk, 33);
    out.set(bytes.subarray(33), 33 + 21);

    let s = "";
    for (let i = 0; i < out.length; i++) s += String.fromCharCode(out[i]);
    return "data:image/png;base64," + btoa(s);
  } catch {
    return dataURL;
  }
}

// Un paso morfológico sobre un canvas: dilata (une copias) o erosiona
// (intersección), desplazando el dibujo r px en 8 direcciones.
function morphStep(cv, dilate, r) {
  const w = cv.width, h = cv.height;
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const t = out.getContext("2d");
  t.drawImage(cv, 0, 0);
  // 16 direcciones → morfología más circular = bordes más lisos (sin ondulación)
  const N = 16;
  t.globalCompositeOperation = dilate ? "source-over" : "destination-in";
  for (let a = 0; a < N; a++) {
    const ang = (2 * Math.PI * a) / N;
    t.drawImage(cv, r * Math.cos(ang), r * Math.sin(ang));
  }
  t.globalCompositeOperation = "source-over";
  return out;
}

// Mide el grosor de trazo (px) de un canvas: MODA de longitudes de tramo (robusto a rellenos).
function measureStrokeCanvas(cv) {
  const w = cv.width, h = cv.height;
  let data;
  try { data = cv.getContext("2d").getImageData(0, 0, w, h).data; } catch { return 0; }
  const op = (x, y) => data[(y * w + x) * 4 + 3] > 128;
  const hist = new Array(Math.max(w, h) + 2).fill(0);
  for (let y = 0; y < h; y++) { let r = 0; for (let x = 0; x < w; x++) { if (op(x, y)) r++; else { if (r) hist[r]++; r = 0; } } if (r) hist[r]++; }
  for (let x = 0; x < w; x++) { let r = 0; for (let y = 0; y < h; y++) { if (op(x, y)) r++; else { if (r) hist[r]++; r = 0; } } if (r) hist[r]++; }
  let mode = 0, best = 0;
  for (let len = 1; len < hist.length; len++) if (hist[len] > best) { best = hist[len]; mode = len; }
  return mode;
}

// Recorta un canvas a su contenido (alpha > 20). Devuelve { canvas, wPx, hPx }.
function trimCanvas(cv) {
  const w = cv.width, h = cv.height;
  let data;
  try { data = cv.getContext("2d").getImageData(0, 0, w, h).data; } catch { return { canvas: cv, wPx: w, hPx: h }; }
  let ax = w, ay = h, bx = -1, by = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 20) { if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; }
  }
  if (bx < ax) return { canvas: cv, wPx: w, hPx: h };
  const fw = bx - ax + 1, fh = by - ay + 1;
  const out = document.createElement("canvas");
  out.width = fw; out.height = fh;
  out.getContext("2d").drawImage(cv, ax, ay, fw, fh, 0, 0, fw, fh);
  return { canvas: out, wPx: fw, hPx: fh };
}

// Recorta al contenido y escala para que la dimensión mayor mida boxPx (tamaño
// FIJO), centrado con margen. Mantiene estable el tamaño del icono aunque la
// erosión/dilatación cambien el contorno.
function fitContentToBox(cv, boxPx, pad) {
  const t = trimCanvas(cv);
  const md = Math.max(t.wPx, t.hPx) || 1;
  const sc = boxPx / md;
  const fw = Math.max(1, Math.round(t.wPx * sc));
  const fh = Math.max(1, Math.round(t.hPx * sc));
  const out = document.createElement("canvas");
  out.width = fw + pad * 2; out.height = fh + pad * 2;
  const o = out.getContext("2d");
  o.imageSmoothingEnabled = true;
  o.imageSmoothingQuality = "high";
  o.drawImage(t.canvas, 0, 0, t.wPx, t.hPx, pad, pad, fw, fh);
  return out;
}

// Afila los bordes (trazo nítido como las líneas vectoriales) y fuerza negro
// puro. Rampa centrada en 128 → conserva el ancho de trazo medido.
function crispenCanvas(cv, lo = 98, hi = 158) {
  const w = cv.width, h = cv.height;
  const ctx = cv.getContext("2d");
  let d;
  try { d = ctx.getImageData(0, 0, w, h); } catch { return cv; }
  const a = d.data, span = hi - lo;
  for (let i = 0; i < a.length; i += 4) {
    const al = a[i + 3];
    a[i + 3] = al <= lo ? 0 : al >= hi ? 255 : Math.round(((al - lo) / span) * 255);
    if (a[i + 3] > 0) { a[i] = 0; a[i + 1] = 0; a[i + 2] = 0; }
  }
  ctx.putImageData(d, 0, 0);
  return cv;
}

// Prepara un icono para exportar: escala el dibujo para que su dimensión mayor
// mida boxPx, AJUSTA el grosor a targetStrokePx midiendo el resultado real y
// corrigiendo, FIJA el tamaño exacto al final (para que no se encoja al adelgazar)
// y AFILA los bordes. Devuelve { canvas, wPx, hPx }.
function prepareIconForExport(img, boxPx, targetStrokePx) {
  const w = img.naturalWidth || 195;
  const h = img.naturalHeight || 195;

  // bbox del contenido (alpha > 20)
  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  const sctx = src.getContext("2d");
  sctx.drawImage(img, 0, 0, w, h);
  let minx = w, miny = h, maxx = 0, maxy = 0;
  try {
    const d = sctx.getImageData(0, 0, w, h).data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 20) {
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    }
  } catch { minx = 0; miny = 0; maxx = w - 1; maxy = h - 1; }
  if (maxx < minx) { minx = 0; miny = 0; maxx = w - 1; maxy = h - 1; }
  const cw = maxx - minx + 1, ch = maxy - miny + 1;
  const scale = boxPx / Math.max(cw, ch);
  const dwPx = Math.max(1, Math.round(cw * scale));
  const dhPx = Math.max(1, Math.round(ch * scale));

  // canvas de trabajo (con margen para la dilatación)
  const pad = Math.max(4, Math.round(boxPx * 0.12));
  let cv = document.createElement("canvas");
  cv.width = dwPx + pad * 2; cv.height = dhPx + pad * 2;
  const octx = cv.getContext("2d");
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(img, minx, miny, cw, ch, pad, pad, dwPx, dhPx);

  // retroalimentación: medir el grosor real y corregirlo hasta targetStrokePx
  for (let i = 0; i < 14; i++) {
    const s = measureStrokeCanvas(cv);
    if (!s) break;
    const delta = targetStrokePx - s;
    if (Math.abs(delta) <= 0.5) break;
    cv = morphStep(cv, delta > 0, Math.min(1.1, Math.abs(delta) / 2));
  }

  cv = fitContentToBox(cv, boxPx, pad); // fija el tamaño exacto (la erosión lo encoge)
  crispenCanvas(cv);                    // bordes nítidos + negro puro
  return trimCanvas(cv);
}

// Renderiza un bloque de texto (1..n líneas centradas) en PX REALES y ajusta el
// grosor del trazo de las letras al MISMO estándar que las líneas (0.36 mm).
// El engrosado se hace con strokeText siguiendo el CONTORNO VECTORIAL de la letra
// (unión en punta / miter) → las letras quedan RECTAS, sin redondear las esquinas.
// Devuelve { canvas, wPx, hPx, pad }. `pad` = margen superior hasta la 1.ª línea.
function renderLabelBlock(lines, fsPx, styleStr, lhPx, targetStrokePx, family = 'Montserrat') {
  const fontSpec = `${styleStr} ${fsPx}px "${family}"`;
  const pad = Math.ceil(fsPx * 0.7); // margen para engrosar sin recortar
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = fontSpec;
  let maxLineW = 1;
  for (const ln of lines) maxLineW = Math.max(maxLineW, meas.measureText(ln).width);
  const wPx = Math.ceil(maxLineW) + pad * 2;
  const hPx = Math.ceil(lines.length * lhPx) + pad * 2;

  const cv = document.createElement("canvas");
  cv.width = wPx; cv.height = hPx;
  const c = cv.getContext("2d");
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = "high";
  c.textAlign = "center";
  c.textBaseline = "top";
  c.font = fontSpec;
  c.lineJoin = "miter";   // esquinas en punta (rectas, no redondeadas)
  c.miterLimit = 3;
  c.lineCap = "butt";

  // Dibuja el bloque con un grosor de contorno dado (strokeText engrosa recto).
  const draw = (lw) => {
    c.clearRect(0, 0, wPx, hPx);
    c.fillStyle = "#000";
    c.strokeStyle = "#000";
    c.lineWidth = lw;
    lines.forEach((ln, li) => {
      const y = pad + li * lhPx;
      c.fillText(ln, wPx / 2, y);
      if (lw > 0) c.strokeText(ln, wPx / 2, y);
    });
  };

  // Retroalimentación: medir el grosor real y ajustar el ancho de contorno hasta
  // llegar a targetStrokePx (strokeText añade ≈ lw al ancho del trazo relleno).
  let lw = 0;
  draw(0);
  for (let i = 0; i < 8; i++) {
    const s = measureStrokeCanvas(cv);
    if (!s) break;
    const delta = targetStrokePx - s;
    if (Math.abs(delta) <= 0.5) break;
    lw = Math.max(0, lw + delta);
    draw(lw);
  }
  crispenCanvas(cv); // bordes nítidos + negro puro
  return { canvas: cv, wPx, hPx, pad };
}

// Prepara un icono SVG para exportar con GROSOR UNIFORME (0.35 mm) sin importar el
// tamaño de la casilla. Como los SVG son de relleno, el grosor escala con el tamaño;
// para igualarlo: (1) rasterizamos el CONTENIDO del SVG a ALTA resolución (vector →
// nítido, no pixelado), (2) ajustamos el grosor real al objetivo con morfología a
// esa alta resolución, (3) al reducir de escala al dibujar, las micro-ondas de la
// morfología se promedian → bordes lisos. Devuelve { canvas, wPx, hPx }.
function prepareSvgIconForExport(img, boxPx, targetStrokePx) {
  // 1) bbox del contenido: rasterizamos el SVG a una resolución de sondeo
  const probe = 340;
  const pc = document.createElement("canvas");
  pc.width = probe; pc.height = probe;
  const pctx = pc.getContext("2d");
  pctx.imageSmoothingEnabled = true;
  pctx.imageSmoothingQuality = "high";
  pctx.drawImage(img, 0, 0, probe, probe);
  let minx = probe, miny = probe, maxx = 0, maxy = 0;
  try {
    const d = pctx.getImageData(0, 0, probe, probe).data;
    for (let y = 0; y < probe; y++) for (let x = 0; x < probe; x++) {
      if (d[(y * probe + x) * 4 + 3] > 20) {
        if (x < minx) minx = x; if (x > maxx) maxx = x;
        if (y < miny) miny = y; if (y > maxy) maxy = y;
      }
    }
  } catch { minx = 0; miny = 0; maxx = probe - 1; maxy = probe - 1; }
  if (maxx < minx) { minx = 0; miny = 0; maxx = probe - 1; maxy = probe - 1; }

  // bbox en coordenadas del SVG (tamaño natural del <img>)
  const nw = img.naturalWidth || probe, nh = img.naturalHeight || probe;
  const sx = (minx / probe) * nw, sy = (miny / probe) * nh;
  const sw = ((maxx - minx + 1) / probe) * nw, sh = ((maxy - miny + 1) / probe) * nh;

  // 2) dibujar el CONTENIDO a alta resolución llenando boxPx (el navegador rasteriza
  //    el SVG al tamaño destino → nítido, sin ampliar un bitmap de baja resolución)
  const cw = maxx - minx + 1, ch = maxy - miny + 1;
  const scl = boxPx / Math.max(cw, ch);
  const dwPx = Math.max(1, Math.round(cw * scl));
  const dhPx = Math.max(1, Math.round(ch * scl));
  const pad = Math.max(4, Math.round(boxPx * 0.14));
  let cv = document.createElement("canvas");
  cv.width = dwPx + pad * 2; cv.height = dhPx + pad * 2;
  const octx = cv.getContext("2d");
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(img, sx, sy, sw, sh, pad, pad, dwPx, dhPx);

  // 3) retroalimentación: medir el grosor real y llevarlo a targetStrokePx (0.35 mm)
  for (let i = 0; i < 14; i++) {
    const s = measureStrokeCanvas(cv);
    if (!s) break;
    const delta = targetStrokePx - s;
    if (Math.abs(delta) <= 0.5) break;
    cv = morphStep(cv, delta > 0, Math.min(1.1, Math.abs(delta) / 2));
  }
  cv = fitContentToBox(cv, boxPx, pad); // fija el tamaño exacto (la morfología lo mueve)
  crispenCanvas(cv);                    // bordes nítidos + negro puro
  return trimCanvas(cv);
}

// Traza un rectángulo redondeado en un contexto 2D (sin pintar; luego .stroke()/.fill())
function ctxRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const IconWithLabel = ({
  x, y, size, src, label, isWhite, onSelect
}) => {
  const [iconImg] = useImage(src);
  if (!iconImg) return null;

  const labelText = label?.trim() || "";
  const hasLabel = labelText.length > 1;

  const fit = fitLabel(labelText, size);
  const labelHeight = Math.max(1, fit.lines.length) * fit.fontSize * LABEL_LINE_HEIGHT;
  // Si hay 2 líneas, subimos un poco el bloque para que la etiqueta quepa entera.
  const yShift = labelYShift(fit);
  // Caja de texto amplia y centrada en el icono: garantiza que nunca se recorte.
  const LABEL_BOX_W = size + 140;

  return (
    <Group x={x} y={y} listening onClick={onSelect} onTap={onSelect}>
      {/* Icono: arriba; se sube un poco si la etiqueta ocupa 2 líneas */}
      <KonvaImage image={iconImg} width={size} height={size} y={-yShift} />

      {/* Etiqueta: justo debajo del icono. Caja MUY ancha (centrada en el icono)
          para que el texto nunca se recorte; el salto de línea ya viene en fit.lines. */}
      {hasLabel && (
        <Text
          x={(size - LABEL_BOX_W) / 2}
          y={size + ICON_LABEL_GAP - yShift}
          width={LABEL_BOX_W}
          height={labelHeight}
          text={fit.lines.join("\n")}
          fontFamily="Montserrat"
          fontSize={fit.fontSize}
          fontStyle="600"
          fill={isWhite ? "#ffffff" : "#1e1e1e"}
          align="center"
          verticalAlign="top"
          wrap="word"
          ellipsis={false}
          lineHeight={LABEL_LINE_HEIGHT}
          listening={false}
        />
      )}
    </Group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Vista "como se exporta" en el EDITOR (WYSIWYG). Dibuja el icono con el MISMO
// estilo de la ficha exportada: negro/estándar (15/9 mm por tipo de casilla),
// content-fit, layout PAREJO y texto en MAYÚSCULAS. Es solo visual; la lógica del
// export (renderPlateExport) NO se toca. Se puede desactivar con EDITOR_EXPORT_STYLE.
const EDITOR_EXPORT_STYLE = true;

// Métrica del icono por LÍNEA DE PRODUCTO. Antes `ED_U_PER_MM` estaba fijo a la
// medida de la placa retro (34.469 mm), así que en Legrand (45 mm) el editor
// dibujaba a una escala distinta de la del export. Ahora ambas salen de aquí.
//   uPerMm      → unidades de diseño por mm (la placa mide 215 uds de ancho)
//   big/small   → tamaño del icono en mm según el tipo de casilla
//   largeCellMm → alto de casilla a partir del cual el icono va grande
//   labelMm     → alto de letra, el mismo en todas las casillas
// Legrand: medido sobre la ficha de referencia (IMAGENES CESAR). En una casilla
// de 22.5 × 22.67 mm el icono ocupa el 52.5% del alto → 11.9 ≈ 12 mm, y la altura
// de mayúscula del texto es 1.52 mm → cuerpo ≈ 2.1 mm. El icono grande sale de
// escalar el de retro por 45/34.469 ≈ 1.31 → 20 mm.
// labelMm: UN SOLO tamaño de letra para todas las casillas (antes la casilla
// grande usaba otro, calculado en píxeles sobre el ancho de la placa; eso hacía
// que la doble diera letras distintas a la sencilla y al export). El icono sí
// cambia de tamaño según la casilla; la letra no.
const ICON_METRICS = {
  retro:   { uPerMm: 215 / 34.469, big: 15, small: 9,  largeCellMm: 25, labelMm: 1.87 },
  legrand: { uPerMm: 215 / 45,     big: 20, small: 12, largeCellMm: 32, labelMm: 2.10 },
};
// Ancho físico de la placa según la línea (cada mitad de la doble mide lo mismo
// que una sencilla). Es función para poder usar las constantes de más abajo.
const plateWidthMm = (st) => (isLegrand(st) ? LEGRAND_PLATE_MM.w : RETRO_PLATE_MM.w);

// Reparto del espacio sobrante de la casilla por encima del bloque icono+texto.
// 0.5 = bloque centrado; >0.5 lo baja, dejando la etiqueta más pegada a la línea
// divisoria de abajo (como en las fichas de referencia).
// El bloque va CENTRADO y, si hay etiqueta, se baja un poco para que el texto
// quede cerca de la línea divisoria. El desplazamiento se mide contra la altura
// del TEXTO, no contra la casilla: así una casilla alta (la sencilla) no manda
// el icono al fondo, y en las bajas el texto igual queda pegado a la línea.
const blockTopY = (cell, blockH, labelH) => {
  const leftover = Math.max(0, cell.h - blockH);
  const shift = labelH > 0 ? Math.min(leftover / 2, labelH * 0.6) : 0;
  return cell.y + leftover / 2 + shift;
};
const iconMetrics = (switchType) => ICON_METRICS[isLegrand(switchType) ? 'legrand' : 'retro'];

const ExportStyleIcon = ({ icon, slot, plate, isWhite, onSelect, fontOpt, switchType }) => {
  const fo = fontOpt || FONT_OPTIONS[0];
  const M = iconMetrics(switchType);
  const [img] = useImage(iconSvgPath(icon.num, isWhite));
  const [bbox, setBbox] = useState(null);

  useEffect(() => {
    if (!img) return;
    const nw = img.naturalWidth || 191, nh = img.naturalHeight || 191;
    const probe = 200;
    const c = document.createElement("canvas");
    c.width = probe; c.height = probe;
    const cx = c.getContext("2d");
    cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
    cx.drawImage(img, 0, 0, probe, probe);
    let minx = probe, miny = probe, maxx = 0, maxy = 0;
    try {
      const d = cx.getImageData(0, 0, probe, probe).data;
      for (let y = 0; y < probe; y++) for (let x = 0; x < probe; x++) {
        if (d[(y * probe + x) * 4 + 3] > 20) {
          if (x < minx) minx = x; if (x > maxx) maxx = x;
          if (y < miny) miny = y; if (y > maxy) maxy = y;
        }
      }
    } catch { setBbox({ x: 0, y: 0, w: nw, h: nh }); return; }
    if (maxx < minx) { setBbox({ x: 0, y: 0, w: nw, h: nh }); return; }
    setBbox({
      x: (minx / probe) * nw, y: (miny / probe) * nh,
      w: ((maxx - minx + 1) / probe) * nw, h: ((maxy - miny + 1) / probe) * nh,
    });
  }, [img]);

  if (!img || !bbox || !icon?.num || !slot) return null;

  // Escala del ÁREA: cada placa (sencilla, izquierda, derecha) representa el mismo
  // ancho físico, aunque en el editor se dibujen con distinto número de unidades.
  // Derivarla del ancho real hace que la doble mida igual que la sencilla.
  const U = plate?.w ? plate.w / plateWidthMm(switchType) : M.uPerMm;
  const cellHeightMm = slot.h / U;
  const isLarge = cellHeightMm >= M.largeCellMm && slot.w >= (plate?.w || slot.w) * 0.7;
  const isSmall = !isLarge;
  // Área REAL delimitada por las líneas (inset del marco donde no llegan las líneas).
  const cell = contentRect(slot, plate, switchType);
  const fscale = fo.scale || 1; // scripts se ven más pequeñas → se agrandan

  // 1) TEXTO primero (para reservar su espacio).
  const lines = exportLabelLines(icon.label, fo.upper !== false);
  const maxW = cell.w * 0.94;
  const longest = lines.length ? Math.max(...lines.map((l) => l.length)) : 0;
  let fs = M.labelMm * U * fscale;
  const minFs = slot.w * 0.075;
  while (fs > minFs && longest * fs * 0.72 > maxW) fs -= 0.5;
  const lh = fs * LABEL_LINE_HEIGHT;
  const gap = fs * (isLarge ? 0.7 : 0.5);
  const labelH = lines.length ? gap + lines.length * lh : 0;

  // 2) ICONO: limitado por ancho del cuadro y por el espacio del texto (no se sale).
  const boxDesign = Math.min(
    (isLarge ? M.big : M.small) * U,
    cell.w * 0.72,
    Math.max(cell.h * 0.28, cell.h * 0.92 - labelH)
  );

  // content-fit: dimensión mayor = boxDesign (conserva proporción del contenido)
  const scl = boxDesign / Math.max(bbox.w, bbox.h);
  const iconW = bbox.w * scl, iconH = bbox.h * scl;

  // 3) Colocar el BLOQUE (icono + texto) en el cuadro: con etiqueta va algo más
  //    abajo, para que el texto quede pegado a la línea divisoria.
  const blockH = boxDesign + labelH;
  const cx = cell.x + cell.w / 2;
  const top = blockTopY(cell, blockH, labelH);
  const iconBandCenterY = top + boxDesign / 2;
  const textTop = top + boxDesign + gap;

  return (
    <Group listening onClick={onSelect} onTap={onSelect}>
      <KonvaImage
        image={img}
        crop={{ x: bbox.x, y: bbox.y, width: bbox.w, height: bbox.h }}
        x={cx - iconW / 2}
        y={iconBandCenterY - iconH / 2}
        width={iconW}
        height={iconH}
      />
      {lines.length > 0 && (
        <Text
          x={cell.x}
          y={textTop}
          width={cell.w}
          text={lines.join("\n")}
          fontFamily={fo.family}
          fontSize={fs}
          fontStyle={fontStyleStr(fo)}
          fill={isWhite ? "#ffffff" : "#000000"}
          align="center"
          verticalAlign="top"
          lineHeight={LABEL_LINE_HEIGHT}
          listening={false}
        />
      )}
    </Group>
  );
};

// Capa de SEPARACIÓN estilo "botón" dibujada nativa en Konva (editor). Para el
// estilo 'lineas' no dibuja nada (se usa la imagen de plantilla).
const SeparationLayer = ({ slots, styleId, color, plate }) => {
  if (!slots?.length || !styleId || styleId === 'lineas') return null;
  const prims = buildSeparationPrimitives(styleId, slots, plate);
  return (
    <>
      {prims.map((p, i) => {
        if (p.t === 'rrect')
          return <Rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} cornerRadius={p.r}
            stroke={color} strokeWidth={SEP_STROKE_ED} listening={false} />;
        if (p.t === 'line')
          return <Line key={i} points={[p.x1, p.y1, p.x2, p.y2]} stroke={color}
            strokeWidth={SEP_STROKE_ED} lineCap="round" listening={false} />;
        if (p.t === 'poly')
          return <Line key={i} points={p.pts} closed stroke={color}
            strokeWidth={SEP_STROKE_ED} lineJoin="round" listening={false} />;
        if (p.t === 'path')
          return <Path key={i} data={p.d} stroke={color}
            strokeWidth={SEP_STROKE_ED} listening={false} />;
        return null;
      })}
    </>
  );
};

// Divisorias de la línea LEGRAND dibujadas nativas en Konva (editor). Sustituye
// a la imagen de plantilla cuando el tipo de interruptor es 'legrand'.
const LegrandLayer = ({ slots, color, plate }) => {
  if (!slots?.length || !plate?.w) return null;
  return (
    <>
      {buildLegrandPrimitives(slots, plate).map((p, i) => (
        <Line key={i} points={[p.x1, p.y1, p.x2, p.y2]} stroke={color}
          strokeWidth={SEP_STROKE_ED} lineCap="round" listening={false} />
      ))}
    </>
  );
};

// Miniatura de una plantilla LEGRAND. No hay PNG: se dibuja con la misma
// geometría que usa la placa, así la miniatura nunca se desincroniza.
const LegrandThumb = ({ plantillaId, className }) => {
  const W = 46, H = 76;
  const plate = { x: 0, y: 0, w: W, h: H };
  const slots = (PLANTILLA_SLOTS[getSlotsKey(plantillaId)] || []).map((s) => ({
    x: s.x * W, y: s.y * H, w: s.w * W, h: s.h * H,
  }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={className}
         style={{ display: 'block', color: 'currentColor' }}>
      <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} rx={5} ry={5}
            fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.55} />
      {buildLegrandPrimitives(slots, plate).map((p, i) => (
        <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
              stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
      ))}
    </svg>
  );
};

// Miniatura SVG de un estilo de separación (para el selector del editor).
const SEP_THUMB_SLOTS = [
  { x: 0, y: 0, w: 0.5, h: 0.5 }, { x: 0.5, y: 0, w: 0.5, h: 0.5 },
  { x: 0, y: 0.5, w: 0.5, h: 0.5 }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
];
const SepThumb = ({ styleId }) => {
  const W = 42, H = 76, pad = 3, pw = W - 2 * pad, ph = H - 2 * pad, sw = 1.5;
  const slots = SEP_THUMB_SLOTS.map((s) => ({ x: pad + s.x * pw, y: pad + s.y * ph, w: s.w * pw, h: s.h * ph }));
  const prims = styleId === 'lineas'
    ? [
        { t: 'line', x1: pad + pw * 0.16, y1: pad + ph * 0.5, x2: pad + pw * 0.84, y2: pad + ph * 0.5 },
        { t: 'line', x1: pad + pw * 0.5, y1: pad + ph * 0.16, x2: pad + pw * 0.5, y2: pad + ph * 0.84 },
      ]
    : buildSeparationPrimitives(styleId, slots, { x: pad, y: pad, w: pw, h: ph });
  const fr = Math.min(pw, ph) * 0.14;
  return (
    <svg width={W} height={H} style={{ display: 'block', color: 'var(--text)' }}>
      <rect x={pad} y={pad} width={pw} height={ph} rx={fr} ry={fr} fill="none" stroke="currentColor" strokeWidth={sw} />
      {prims.map((p, i) => {
        if (p.t === 'rrect') return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} ry={p.r} fill="none" stroke="currentColor" strokeWidth={sw} />;
        if (p.t === 'line') return <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />;
        if (p.t === 'poly') { const pts = []; for (let j = 0; j < p.pts.length; j += 2) pts.push(`${p.pts[j]},${p.pts[j + 1]}`); return <polygon key={i} points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" />; }
        if (p.t === 'path') return <path key={i} d={p.d} fill="none" stroke="currentColor" strokeWidth={sw} />;
        return null;
      })}
    </svg>
  );
};


// Espera a que TODAS las imágenes del stage estén cargadas
const waitForImages = (stage) => {
  return new Promise((resolve) => {
    const layer = stage.getLayers()[0];
    const images = layer.find('Image');

    let pending = images.length;
    if (pending === 0) return resolve();

    images.forEach(imgNode => {
      const image = imgNode.image();
      if (!image) {
        pending--;
        if (pending === 0) resolve();
        return;
      }

      if (image.complete) {
        pending--;
        if (pending === 0) resolve();
      } else {
        image.onload = () => {
          pending--;
          if (pending === 0) resolve();
        };
      }
    });
  });
};

// Espera un frame real de Konva
const waitFrame = () => new Promise(res => requestAnimationFrame(res));

const dataSuiche = {

  suiche1: { color: '#FFFFFF', image: '/assets/suichesSencillo/suiche.png' , label: 'Blanca'  },
  suiche2: { color: '#000000', image: '/assets/suichesSencillo/suiche2.png', label: 'Negra' },
  suiche3: { color: '#3A2C28', image: '/assets/suichesSencillo/suiche3.png' , label: 'Cafe'},
  suiche4: { image: '/assets/suichesSencillo/suiche4.png', cssClass: 'brushed', label: 'Negra Cepillada' },
  suiche5: { image: '/assets/suichesSencillo/suiche5.png', cssClass: 'brushedGold', label: 'Dorado Cepillado' },
  suiche6: { image: '/assets/suichesSencillo/suiche6.png', cssClass: 'brushedGray', label: 'Gris Cepillado' },
  suiche7: { image: '/assets/suichesSencillo/suiche7.png', cssClass: 'brushedAlmond', label: 'Almendra Cepillado' },
  suiche8: { image: '/assets/suichesSencillo/suiche8.png', cssClass: 'brushedNickel', label: 'Niquel Cepillado' },
  suiche9: { image: '/assets/suichesSencillo/suiche9.png', cssClass: 'brushedSilver', label: 'Plateada Cepillado' },
  suiche10: { image: '/assets/suichesSencillo/suiche10.png', cssClass: 'brushedTitanium', label: 'Gris Espacil Cepillado' },
  suiche11: { image: '/assets/suichesSencillo/suiche11.png', cssClass: 'brushedWhite', label: 'Blanca Cepillado' },
  suiche12: { color: '#D49A06', image: '/assets/suichesSencillo/suiche12.png', label: 'Dorada ' },
  suiche13: { color: '#818181', image: '/assets/suichesSencillo/suiche13.png', label: 'Gris Lisa' },
  suiche14: { color: '#cbc6a3', image: '/assets/suichesSencillo/suiche14.png', label: 'Marfil' },
  suiche15: { color: '#ece8d2', image: '/assets/suichesSencillo/suiche15.png', label: 'Almendra clara' },
  suiche16: { color: '#a4948e', image: '/assets/suichesSencillo/suiche16.png', label: 'Niquel' },
  suiche17: { color: '#D3D3D3', image: '/assets/suichesSencillo/suiche17.png', label: 'Plateada' },
  suiche18: { color: '#504f4e', image: '/assets/suichesSencillo/suiche18.png', label: 'Gris Espacial' },
  suiche19: { color: '#d4af37ff', image: '/assets/suichesSencillo/suiche19.png', label: 'Dorado Espejo Acrilica' },
  suiche20: { color: '#d1a38aff', image: '/assets/suichesSencillo/suiche20.png', label: 'Rosa Espejo Metalico' },
  suiche21: { color: '#b1b1b1ff', image: '/assets/suichesSencillo/suiche21.png', label: 'Plateada Espejo Acrilica' },

};



const plantillaIds = ['04','05','06','07','08','09','10','11','12','13','14','15','16','17','18'];
const getSlotsKey = (id) => `plantillas-${id}.png`;

// Ruta de los iconos SVG nuevos (2026). blanco=true → versión blanca (fondo oscuro).
const iconSvgPath = (num, blanco = false) =>
  blanco
    ? `/assets/ICONOS SVG BLANCOS/ICONOS APP-${num}.svg`
    : `/assets/ICONOS SVG NEGROS/ICONOS APP-${num}.svg`;

// Rectángulo REAL de una casilla para centrar/seleccionar: en los lados que dan al
// MARCO exterior se inseta (las líneas de la plantilla no llegan al borde), y en los
// lados que dan a una DIVISORIA se deja igual. Así el centrado (y el cuadro azul de
// selección) queda dentro del área delimitada por las líneas, no hasta el borde.
// Rectángulo donde se centra el contenido. En Legrand NO se aplica el inset: la
// casilla se toma completa, de borde a borde, para que el icono quede centrado
// de verdad dentro de cada cuadro de la plantilla.
function contentRect(slot, plate, switchType) {
  return isLegrand(switchType) ? slot : innerCellRect(slot, plate);
}

function innerCellRect(slot, plate) {
  if (!plate || !plate.w) return slot;
  const m = plate.w * 0.075;   // margen ≈ el de las líneas de la plantilla
  const tol = plate.w * 0.02;
  const atL = slot.x <= plate.x + tol;
  const atR = slot.x + slot.w >= plate.x + plate.w - tol;
  const atT = slot.y <= plate.y + tol;
  const atB = slot.y + slot.h >= plate.y + plate.h - tol;
  const x = slot.x + (atL ? m : 0);
  const r = slot.x + slot.w - (atR ? m : 0);
  const y = slot.y + (atT ? m : 0);
  const b = slot.y + slot.h - (atB ? m : 0);
  return { x, y, w: Math.max(1, r - x), h: Math.max(1, b - y) };
}

// ── ESTILOS DE SEPARACIÓN entre botones ──────────────────────────────────────
// 'lineas' = rejilla clásica (imagen de plantilla). El resto se dibujan por
// código a partir de las casillas (slots), sirven para TODAS las plantillas y
// se ven idénticos en el editor y en la exportación.
const SEPARATION_STYLES = [
  { id: 'lineas',   label: 'Líneas' },
  { id: 'boton',    label: 'Botón' },
  { id: 'cuadrado', label: 'Cuadrado' },
  { id: 'capsula',  label: 'Cápsula' },
  { id: 'pildora',  label: 'Píldora' },
  { id: 'esquinas', label: 'Esquinas' },
  { id: 'chaflan',  label: 'Chaflán' },
  { id: 'burbuja',  label: 'Burbuja' },
];

// Contorno "squircle/burbuja" (superelipse) como path SVG suave. n≈4 = squircle.
// Muestreamos la superelipse y unimos con curvas (Catmull-Rom → Bézier) → borde liso.
function superellipsePath(cx, cy, rx, ry, n = 4, samples = 16) {
  const pts = [];
  for (let k = 0; k < samples; k++) {
    const t = (k / samples) * 2 * Math.PI;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = cx + rx * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n);
    const y = cy + ry * Math.sign(st) * Math.pow(Math.abs(st), 2 / n);
    pts.push([x, y]);
  }
  const N = pts.length;
  const f = (v) => v.toFixed(2);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])} `;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C ${f(c1x)} ${f(c1y)}, ${f(c2x)} ${f(c2y)}, ${f(p2[0])} ${f(p2[1])} `;
  }
  return d + 'Z';
}

// Grosor de separación en el EDITOR (0.36 mm ≈ 2.25 uds de diseño con placa=215).
const SEP_STROKE_ED = 2.25;

// ── FUENTES seleccionables para el texto de las etiquetas ────────────────────
// italic: cursiva mecánica; upper=false: NO forzar mayúsculas (para scripts).
const FONT_OPTIONS = [
  { id: 'montserrat',    label: 'Montserrat',   family: 'Montserrat',        weight: 600 },
  { id: 'montserrat-it', label: 'Montserrat it.', family: 'Montserrat',      weight: 600, italic: true },
  { id: 'poppins',       label: 'Poppins',      family: 'Poppins',           weight: 600 },
  { id: 'oswald',        label: 'Oswald',       family: 'Oswald',            weight: 500 },
  { id: 'bebas',         label: 'Bebas Neue',   family: 'Bebas Neue',        weight: 400 },
  { id: 'roboto',        label: 'Roboto Cond.', family: 'Roboto Condensed',  weight: 600 },
  { id: 'playfair',      label: 'Playfair',     family: 'Playfair Display',  weight: 600 },
  { id: 'playfair-it',   label: 'Playfair it.', family: 'Playfair Display',  weight: 600, italic: true },
  { id: 'dancing',       label: 'Dancing',      family: 'Dancing Script',    weight: 600, upper: false, scale: 1.35 },
  { id: 'pacifico',      label: 'Pacifico',     family: 'Pacifico',          weight: 400, upper: false, scale: 1.45 },
  { id: 'greatvibes',    label: 'Great Vibes',  family: 'Great Vibes',       weight: 400, upper: false, scale: 1.7 },
];
// crypto.randomUUID sólo existe en contexto seguro (HTTPS o localhost): al
// abrir la app por IP plana no está, y poner un icono reventaba. Se usa cuando
// está disponible y si no se genera un id equivalente a mano.
let _uidSeq = 0;
const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `id-${Date.now().toString(16)}-${(_uidSeq++).toString(16)}-${rnd()}`;
};

const getFontOption = (id) => FONT_OPTIONS.find((f) => f.id === id) || FONT_OPTIONS[0];
// Estilo de fuente para Konva/CSS (ej. "italic 600" | "600").
const fontStyleStr = (o) => `${o.italic ? 'italic ' : ''}${o.weight}`;

// ── TIPOS DE INTERRUPTOR ─────────────────────────────────────────────────────
// Línea de producto. 'retro' = el interruptor retroiluminado de siempre (no
// cambia nada de lo que ya existía). 'legrand' = línea Legrand: las divisorias
// de la plantilla se dibujan por código con su geometría propia.
// TODO carcasas Legrand: cuando lleguen las imágenes, rellenar `carcasas` abajo
// y el selector de ESTILO DEL SUICHE las tomará automáticamente.
const SWITCH_TYPES = [
  { id: 'retro',   label: 'Retroiluminado' },
  { id: 'legrand', label: 'Legrand' },
];
const isLegrand = (t) => t === 'legrand';

// Carcasas (marcos) de la línea Legrand. `win` es el hueco interior medido
// sobre el PNG ya recortado, normalizado 0..1 — con él la placa se encaja
// exactamente dentro de la ventana sin deformar la foto del marco.
const LEGRAND_SUICHES = {
  legrandBlanca: {
    image: '/assets/suichesLegrand/legrand-blanca.png', label: 'Blanca', color: '#FFFFFF',
    win: { x: 0.25474, y: 0.22280, w: 0.48947, h: 0.53800 },
  },
  legrandNegra: {
    image: '/assets/suichesLegrand/legrand-negra.png', label: 'Negra', color: '#000000',
    win: { x: 0.25789, y: 0.22255, w: 0.48421, h: 0.53996 },
  },
};
const getLegrandSuiche = (src) =>
  Object.values(LEGRAND_SUICHES).find((s) => s.image === src) || LEGRAND_SUICHES.legrandNegra;

// Rectángulo donde se dibuja un marco para que su ventana caiga justo sobre
// `plate`. Conserva la proporción original de la imagen.
const legrandFrameRect = (win, plate) => {
  const w = plate.w / win.w, h = plate.h / win.h;
  return { x: plate.x - win.x * w, y: plate.y - win.y * h, width: w, height: h };
};

// Rejilla de divisorias medida sobre la referencia "plantillas legrand.png":
// las líneas NO llegan al borde de la placa, se cortan a un margen uniforme del
// 7.5% del lado MENOR (horizontales ≈85% del ancho, vertical ≈90% del alto).
// Las divisorias se derivan de las casillas, así sirve para las 15 plantillas.
const LEGRAND_INSET_RATIO = 0.075;

// Agrupa valores casi iguales (las plantillas traen 0.4996 / 0.5 / 0.495…).
function clusterEdges(values, tol) {
  const out = [];
  for (const v of [...values].sort((a, b) => a - b)) {
    const last = out[out.length - 1];
    if (last && Math.abs(last.sum / last.n - v) <= tol) { last.sum += v; last.n++; }
    else out.push({ sum: v, n: 1 });
  }
  return out.map((c) => c.sum / c.n);
}

function buildLegrandPrimitives(slots, plate) {
  if (!slots?.length || !plate?.w) return [];
  const P = [];
  const m = Math.min(plate.w, plate.h) * LEGRAND_INSET_RATIO;
  const pL = plate.x, pR = plate.x + plate.w, pT = plate.y, pB = plate.y + plate.h;
  const L = pL + m, R = pR - m, T = pT + m, B = pB - m;
  const tol = Math.min(plate.w, plate.h) * 0.02;
  const inside = (v, lo, hi) => v > lo + tol && v < hi - tol;

  // Divisorias HORIZONTALES: cada borde interno compartido entre filas.
  const yEdges = clusterEdges(
    slots.flatMap((s) => [s.y, s.y + s.h]).filter((y) => inside(y, pT, pB)), tol);
  for (const y of yEdges) {
    const touching = slots.filter((s) => Math.abs(s.y - y) <= tol || Math.abs(s.y + s.h - y) <= tol);
    if (!touching.length) continue;
    const s0 = Math.min(...touching.map((s) => s.x));
    const s1 = Math.max(...touching.map((s) => s.x + s.w));
    // Se insetan sólo los extremos que dan al MARCO de la placa.
    const x1 = s0 <= pL + tol ? L : s0;
    const x2 = s1 >= pR - tol ? R : s1;
    if (x2 > x1) P.push({ t: 'line', x1, y1: y, x2, y2: y });
  }

  // Divisorias VERTICALES: continuas a lo largo de las filas que separan.
  const xEdges = clusterEdges(
    slots.flatMap((s) => [s.x, s.x + s.w]).filter((x) => inside(x, pL, pR)), tol);
  for (const x of xEdges) {
    const touching = slots.filter((s) => Math.abs(s.x - x) <= tol || Math.abs(s.x + s.w - x) <= tol);
    if (!touching.length) continue;
    const s0 = Math.min(...touching.map((s) => s.y));
    const s1 = Math.max(...touching.map((s) => s.y + s.h));
    const y1 = s0 <= pT + tol ? T : s0;
    const y2 = s1 >= pB - tol ? B : s1;
    if (y2 > y1) P.push({ t: 'line', x1: x, y1, x2: x, y2 });
  }
  return P;
}

// Devuelve primitivas de dibujo en el MISMO espacio de coords que los slots:
//   {t:'rrect',x,y,w,h,r} | {t:'line',x1,y1,x2,y2} | {t:'poly',pts:[...],closed}
function buildSeparationPrimitives(styleId, slots) {
  const P = [];
  const rr = (x, y, w, h, r) => { if (w > 0 && h > 0) P.push({ t: 'rrect', x, y, w, h, r: Math.max(0, r) }); };
  const ln = (x1, y1, x2, y2) => P.push({ t: 'line', x1, y1, x2, y2 });
  const pl = (pts) => P.push({ t: 'poly', pts, closed: true });
  for (const s of slots || []) {
    const { x, y, w, h } = s;
    const m = Math.min(w, h);
    const g = m * 0.07; // inset uniforme respecto al lado menor (formas más amplias)
    const ix = x + g, iy = y + g, iw = w - 2 * g, ih = h - 2 * g;
    if (iw <= 0 || ih <= 0) continue;
    const rB = Math.min(iw, ih);
    switch (styleId) {
      case 'boton':    rr(ix, iy, iw, ih, rB * 0.22); break;
      case 'cuadrado': rr(ix, iy, iw, ih, rB * 0.10); break;
      case 'capsula':  rr(ix, iy, iw, ih, rB * 0.42); break;
      case 'pildora':  rr(ix, iy, iw, ih, rB * 0.5); break;
      case 'esquinas': {
        const L = rB * 0.28;
        ln(ix, iy + L, ix, iy); ln(ix, iy, ix + L, iy);
        ln(ix + iw - L, iy, ix + iw, iy); ln(ix + iw, iy, ix + iw, iy + L);
        ln(ix, iy + ih - L, ix, iy + ih); ln(ix, iy + ih, ix + L, iy + ih);
        ln(ix + iw - L, iy + ih, ix + iw, iy + ih); ln(ix + iw, iy + ih, ix + iw, iy + ih - L);
        break;
      }
      case 'chaflan':  { const c = rB * 0.20; pl([ix + c, iy, ix + iw - c, iy, ix + iw, iy + c, ix + iw, iy + ih - c, ix + iw - c, iy + ih, ix + c, iy + ih, ix, iy + ih - c, ix, iy + c]); break; }
      case 'burbuja':  P.push({ t: 'path', d: superellipsePath(ix + iw / 2, iy + ih / 2, iw / 2, ih / 2, 4, 16) }); break;
      default: break; // 'lineas' se maneja con la imagen de plantilla
    }
  }
  return P;
}

// Dibuja las primitivas de separación en un contexto Canvas 2D (exportación).
function drawSeparationOnCtx(ctx, prims, strokeW) {
  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = strokeW;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const p of prims) {
    ctx.beginPath();
    if (p.t === 'rrect') { ctxRoundRect(ctx, p.x, p.y, p.w, p.h, p.r); ctx.stroke(); }
    else if (p.t === 'line') { ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke(); }
    else if (p.t === 'poly') { const q = p.pts; ctx.moveTo(q[0], q[1]); for (let i = 2; i < q.length; i += 2) ctx.lineTo(q[i], q[i + 1]); if (p.closed) ctx.closePath(); ctx.stroke(); }
    else if (p.t === 'path') { ctx.stroke(new Path2D(p.d)); }
  }
  ctx.restore();
}




// Iconos SVG nuevos (2026): archivos "ICONOS APP-446.svg" … "ICONOS APP-611.svg".
// Numeración contigua 446–611. Los PNG viejos se conservan por si hay que revertir.
const iconNumbers = Array.from({ length: 611 - 446 + 1 }, (_, i) => String(446 + i));


// Categorías del set nuevo (SVG 446–611), repartidas por tipo de icono.
// "Todos" siempre contiene la lista completa (ningún icono se pierde).
const ICON_CATEGORIES = {
  Todos: iconNumbers,
  Luces: ['446','454','498','499','500','501','502','503','527','544','571','582'],
  'Habitación': ['450','452','453','455','456','457','475'],
  'Baño': ['458','459','460','461','462','528','585','590'],
  Cocina: ['448','470','489','557','558','569','581','584','595','600'],
  Sala: ['463','465','471','472'],
  'Electrodomésticos': ['447','515','526','538','549','580'],
  Ventanas: ['466','504','505','506','507','508','509','511','512','513','530','535','536'],
  Exteriores: ['476','479','482','483','484','485','486','493','494','495','521','522','532','533','540','548','551','563','565','568','570','589','592','598','599','606'],
  'Zona Húmeda': ['477','478','480','481','564','588'],
  Entretenimiento: ['464','490','491','492','496','517','518','523','524','529','539','559','562','567','572','573','574','575','576','577','596','601','607','608','610'],
  Control: ['514','516','534','541','542','543','547','561','586','587','593','597','602','604','605','611'],
  'Zonas Comunes': ['449','451','467','468','469','473','474','487','488','497','510','519','520','525','531','537','545','546','550','552','553','554','555','556','560','566','578','579','583','591','594','603','609'],
};

// Slots normalizados
const PLANTILLA_SLOTS = {
  'plantillas-04.png': [
    { x: 0, y: 0, w: 1, h: 1 }
  ],
  'plantillas-05.png': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 }
  ],
  'plantillas-06.png': [
    { x: 0, y: 0, w: 1, h: 0.74 },
    { x: 0, y: 0.74, w: 1, h: 0.26 }
  ],
  'plantillas-07.png': [
    { x: 0, y: 0, w: 0.5, h: 1 },
    { x: 0.5, y: 0, w: 0.5, h: 1 }
  ],
  'plantillas-08.png': [
    { x: 0, y: 0, w: 1, h: 0.50 },
    { x: 0, y: 0.4996, w: 1, h: 0.245 },
    { x: 0, y: 0.7443, w: 1, h: 0.245 }
  ],
  'plantillas-09.png': [
    { x: 0, y: 0, w: 1, h: 0.74 },
    { x: 0, y: 0.74, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.74, w: 0.5, h: 0.25 }
  ],
  'plantillas-10.png': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
  ],
  'plantillas-11.png': [
    { x: 0, y: 0, w: 1, h: 0.25 },
    { x: 0, y: 0.25, w: 1, h: 0.25 },
    { x: 0, y: 0.50, w: 1, h: 0.25 },
    { x: 0, y: 0.75, w: 1, h: 0.25 }
  ],
  'plantillas-12.png': [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
  ],
  'plantillas-13.png': [
    { x: 0, y: 0, w: 1, h: 0.495 },
    { x: 0, y: 0.5, w: 1, h: 0.24 },
    { x: 0, y: 0.7433, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.7433, w: 0.5, h: 0.25 }
  ],
  'plantillas-14.png': [
    { x: 0, y: 0, w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 }
  ],
  'plantillas-15.png': [
    { x: 0, y: 0, w: 1, h: 0.2433 },
    { x: 0, y: 0.2433, w: 1, h: 0.25 },
    { x: 0, y: 0.4953, w: 1, h: 0.25 },
    { x: 0, y: 0.7436, w: 0.5, h: 0.2533 },
    { x: 0.5, y: 0.7436, w: 0.5, h: 0.2533 }
  ],
  'plantillas-16.png': [
    { x: 0, y: 0, w: 1, h: 0.24 },
    { x: 0, y: 0.2433, w: 1, h: 0.25 },
    { x: 0, y: 0.495, w: 0.5, h: 0.2433 },
    { x: 0.5, y: 0.4966, w: 0.5, h: 0.2433 },
    { x: 0, y: 0.7466, w: 0.5, h: 0.2433 },
    { x: 0.5, y: 0.7466, w: 0.5, h: 0.2433 }
  ],
  'plantillas-17.png': [
    { x: 0, y: 0, w: 1, h: 0.25 },
    { x: 0, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 }
  ],
  'plantillas-18.png': [
    { x: 0, y: 0, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0, w: 0.5, h: 0.25 },
    { x: 0, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
    { x: 0, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.25 },
    { x: 0, y: 0.75, w: 0.5, h: 0.25 },
    { x: 0.5, y: 0.75, w: 0.5, h: 0.25 }
  ],

  // ── Plantillas de la línea LEGRAND ────────────────────────────────────────
  // Las 4 de la referencia "plantillas legrand.png". Filas siempre repartidas
  // en partes iguales; la columna parte la placa por la mitad.
  'plantillas-L1.png': [
    { x: 0, y: 0, w: 1, h: 1 }
  ],
  'plantillas-L2.png': [
    { x: 0, y: 0,   w: 1, h: 0.5 },
    { x: 0, y: 0.5, w: 1, h: 0.5 }
  ],
  'plantillas-L3.png': [
    { x: 0, y: 0,      w: 1, h: 1 / 3 },
    { x: 0, y: 1 / 3,  w: 1, h: 1 / 3 },
    { x: 0, y: 2 / 3,  w: 1, h: 1 / 3 }
  ],
  'plantillas-L6.png': [
    { x: 0,   y: 0,     w: 0.5, h: 1 / 3 },
    { x: 0.5, y: 0,     w: 0.5, h: 1 / 3 },
    { x: 0,   y: 1 / 3, w: 0.5, h: 1 / 3 },
    { x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 },
    { x: 0,   y: 2 / 3, w: 0.5, h: 1 / 3 },
    { x: 0.5, y: 2 / 3, w: 0.5, h: 1 / 3 }
  ],
};

// Plantillas disponibles según la línea de producto.
const LEGRAND_PLANTILLA_IDS = ['L1', 'L2', 'L3', 'L6'];
const getPlantillaIds = (switchType) =>
  isLegrand(switchType) ? LEGRAND_PLANTILLA_IDS : plantillaIds;
const defaultPlantillaId = (switchType) => (isLegrand(switchType) ? 'L1' : '04');




const PL_X = 490, PL_Y = 235, PL_W = 205, PL_H = 395;
// Helpers para saber si el click está dentro de la “carcasa”
const SINGLE_PLATE = { x: 485, y: 228, w: 215, h: 405 };
const DOUBLE_PLATE_LEFT  = { x: 360, y: 235, w: 205, h: 395 };
const DOUBLE_PLATE_RIGHT = { x: 620, y: 235, w: 205, h: 395 };

// ── Medida FÍSICA de la placa, por línea de producto ─────────────────────────
// Única fuente de verdad: de aquí salen tanto el dibujo del editor como el
// tamaño real del PNG exportado, así nunca se desincronizan.
// Retro: la de siempre. Legrand: 45 × 68 mm, medida real de la plantilla.
const RETRO_PLATE_MM   = { w: 34.469, h: 67.379 };
const LEGRAND_PLATE_MM = { w: 45, h: 68 };
const plateMM = (switchType, horizontal) => {
  if (isLegrand(switchType)) return LEGRAND_PLATE_MM;   // Legrand siempre vertical
  return horizontal
    ? { w: RETRO_PLATE_MM.h, h: RETRO_PLATE_MM.w }
    : RETRO_PLATE_MM;
};

// Placa de la línea LEGRAND en coordenadas de diseño: mismo centro y mismo
// ANCHO que la retroiluminada (así los iconos conservan su escala en mm).
const LEGRAND_PLATE = (() => {
  const w = SINGLE_PLATE.w;
  const h = Math.round(w * (LEGRAND_PLATE_MM.h / LEGRAND_PLATE_MM.w));
  return {
    x: SINGLE_PLATE.x,
    y: Math.round(SINGLE_PLATE.y + (SINGLE_PLATE.h - h) / 2),
    w, h,
  };
})();

// Placa SENCILLA en HORIZONTAL: mismo centro, ancho y alto intercambiados.
const SC = { x: SINGLE_PLATE.x + SINGLE_PLATE.w / 2, y: SINGLE_PLATE.y + SINGLE_PLATE.h / 2 };
const SINGLE_PLATE_H = { x: SC.x - SINGLE_PLATE.h / 2, y: SC.y - SINGLE_PLATE.w / 2, w: SINGLE_PLATE.h, h: SINGLE_PLATE.w };
// Rota un slot normalizado 90° en sentido horario (para casar con la imagen rotada).
const rotSlotCW = (s) => ({ x: 1 - (s.y + s.h), y: s.x, w: s.h, h: s.w });



const getSlotsFor = (filename) => {
  const slots = PLANTILLA_SLOTS[filename] || [];
  return slots.map(s => ({ x: PL_X + s.x * PL_W, y: PL_Y + s.y * PL_H, w: s.w * PL_W, h: s.h * PL_H }));
};


const getSlotsForArea = (area, plantillaId, orientation = 'vertical') => {
  let base = PLANTILLA_SLOTS[getSlotsKey(plantillaId)] || [];
  if (orientation === 'horizontal') base = base.map(rotSlotCW);
  return base.map(s => ({
    x: area.x + s.x * area.w,
    y: area.y + s.y * area.h,
    w: s.w * area.w,
    h: s.h * area.h
  }));
};



const Modal = ({ title, isOpen, onClose, children, width = 720, variant = 'light' }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div
        className={`${styles.modal} ${variant === 'dark' ? styles.modalDark : styles.modalLight}`}
        style={{ maxWidth: width }}
      >
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
};


// Tamaño objetivo del icono (ajusta a gusto)
const ICON_TARGET = 54;
const LABEL_FS = 12;
const LABEL_GAP = 6;
const PAD_X = 10;       // margen lateral interno del slot
const PAD_BOTTOM = 8;   // margen inferior al borde del slot
const LARGE_SLOT_MIN_H = 120;   // alto mínimo para considerar el slot “grande”
const LARGE_SLOT_MIN_W = 140;   // ancho mínimo
const LARGE_SLOT_SCALE = 2.0;  // icono 50% más grande en slots grandes


function layoutIconInSlot(slot, withLabel = true) {
  const labelBlock = withLabel ? (LABEL_GAP + LABEL_FS) : 0;

  const maxByWidth  = slot.w - PAD_X * 2;
  const maxByHeight = slot.h - PAD_BOTTOM - labelBlock - 6; // aire arriba
  const baseSize = Math.max(32, Math.min(ICON_TARGET, maxByWidth, maxByHeight));

  // detectar slot grande
  const isLarge = slot.h >= LARGE_SLOT_MIN_H || slot.w >= LARGE_SLOT_MIN_W;

  // si es grande, escalar un poco más pero respetando límites del slot
  const size = isLarge
    ? Math.min(Math.round(baseSize * LARGE_SLOT_SCALE), maxByWidth, maxByHeight)
    : baseSize;

  const x = slot.x + (slot.w - size) / 2;

  // en slots grandes: CENTRADO vertical (grupo icono+texto)
  // en slots normales: alineado por base (más ordenado en filas inferiores)
  let y;
  if (isLarge) {
    const groupH = size + labelBlock;
    y = slot.y + (slot.h - groupH) / 2;
  } else {
    const baseline = slot.y + slot.h - PAD_BOTTOM;
    y = baseline - (size + labelBlock);
  }

  return { x, y, size };
}


function useContainerSize() {
  const ref = React.useRef(null);
  const [size, setSize] = React.useState({ w: 100, h: 100 });

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      // Medimos el espacio real disponible (ancho y alto) para que el
      // lienzo se escale y quepa sin provocar scroll.
      const w = Math.max(240, entry.contentRect.width);
      const h = Math.max(240, entry.contentRect.height);
      setSize({ w, h });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return [ref, size];
}
const DESIGN_W = 1100;
const DESIGN_H = 900;

// Región visible de la placa (la carcasa es ~785×785, centrada en el diseño).
// Encuadramos esta zona para que la placa ocupe el máximo del lienzo.
// Encuadre = la placa COMPLETA con sus bordes redondeados, al máximo tamaño
// sin recortar (la carcasa ocupa 200–985 / 40–825 ≈ 785×785, centrada).
// Margen mínimo para que no se corten las esquinas.
const PLATE_VIEW = { x: 195, y: 35, w: 795, h: 795 };


const API_BASE = import.meta.env?.VITE_API_BASE || "https://custom.disevenapp.com/api";

// Helper: Authorization: Bearer <token>
function authHeaders(extra = {}) {
  const t = localStorage.getItem("token");
  return t
    ? { ...extra, Authorization: `Bearer ${t}` }
    : { ...extra };
}

// Helper: manejo de respuesta
async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.msg || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}


//            --- PROYECTOS ---

// Obtener todos los proyectos desde Mongo
async function apiFetchProjects() {
  const res = await fetch(`${API_BASE}/api/v1/proyectos`, {
    method: "GET",
    headers: authHeaders()
  });
  const data = await handle(res); // { data: [...] }
  return data.data;
}


// Crear un proyecto nuevo en Mongo
async function apiCreateProject(name) {
  const res = await fetch(`${API_BASE}/api/v1/crearProyecto`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name }),
  });
  const data = await handle(res); // { message, data }
  return data.data;
}


async function fetchPlantillasByProject(projectId) {
  const res = await fetch(`${API_BASE}/api/v1/plantillas/${projectId}`, {
    headers: authHeaders()
  });
  return handle(res); // { projectId, count, plantillas: [...] }
}

async function fetchPlantillaById(id) {
  const res = await fetch(`${API_BASE}/api/v1/plantilla/${id}`, {
    headers: authHeaders()
  });
  const data = await handle(res); // { message, data }
  return data.data;
}


async function apiDeletePlantilla(id) {
  const res = await fetch(`${API_BASE}/api/v1/plantilla/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  return handle(res); // { message, data: "<id>" }
}

async function apiRenameProject(id, newName) {
  const res = await fetch(`${API_BASE}/api/v1/proyecto/${id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name: newName }),
  });
  const data = await handle(res);
  return data.data;
}

async function apiDeleteProject(id) {
  const res = await fetch(`${API_BASE}/api/v1/proyecto/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  const data = await handle(res); // { message, data: <id> }
  return data.data;
}


const DesignerCanvas = () => {
  const nav = useNavigate();
  const { user, ready, loginAsGuest } = useAuth();
  const { t } = usePrefs();
  const [open, setOpen] = useState(false);
  const [exportPreview, setExportPreview] = useState(null);
  const [showExportView, setShowExportView] = useState(false);
  const [separationStyle, setSeparationStyle] = useState('lineas'); // estilo de separación entre botones
  const [labelFont, setLabelFont] = useState('montserrat'); // fuente del texto de las etiquetas
  const [orientation, setOrientation] = useState('vertical'); // 'vertical' | 'horizontal'

  // Acceso libre: si nadie ha iniciado sesión, entramos como invitado.
  useEffect(() => {
    if (ready && !user) loginAsGuest();
  }, [ready, user, loginAsGuest]);

  // Función ESTABLE para cerrar el login (evita que los efectos del LoginModal
  // se re-ejecuten en cada render y provoquen parpadeo/bucle).
  const closeLogin = useCallback(() => setOpen(false), []);

  // Si el modal de login está abierto y el usuario inicia sesión de verdad
  // (deja de ser invitado), lo cerramos.
  useEffect(() => {
    if (open && user && !user.guest) {
      setOpen(false);
    }
  }, [open, user]);

  // Exige sesión real para guardar. Devuelve true si puede continuar.
  const requireLogin = () => {
    if (user && !user.guest) return true;
    Swal.fire({
      title: "Inicia sesión para guardar",
      text: "Crea una cuenta o inicia sesión para guardar tus proyectos y plantillas.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Iniciar sesión",
      cancelButtonText: "Seguir como invitado",
      confirmButtonColor: "#0fa2da",
    }).then((res) => {
      if (res.isConfirmed) setOpen(true);
    });
    return false;
  };
  const [canvasHostRef, hostSize] = useContainerSize();
  // Encuadramos SOLO la región de la placa (PLATE_VIEW) y la centramos en el
  // lienzo, para darle el máximo protagonismo (especialmente en móvil).
  const scale = Math.min(hostSize.w / PLATE_VIEW.w, hostSize.h / PLATE_VIEW.h);
  const offsetX = (hostSize.w - PLATE_VIEW.w * scale) / 2 - PLATE_VIEW.x * scale;
  const offsetY = (hostSize.h - PLATE_VIEW.h * scale) / 2 - PLATE_VIEW.y * scale;
// === ADD (cerca a tus constantes): solo 3 previews ===
// Previews rápidos: toma 3 primeros de la categoría actual

const [selectedCategory, setSelectedCategory] = useState('Todos');
const [iconSearch, setIconSearch] = useState('');
const PREVIEW_PLANTILLAS = plantillaIds.slice(4, 7);
const getCategoryList = (cat) => (cat === 'Todos' ? iconNumbers : (ICON_CATEGORIES[cat] || []));
const PREVIEW_ICONOS = getCategoryList(selectedCategory).slice(0, 3);



const [selectedPlantilla, setSelectedPlantilla] = useState('04');
const [selectedSuiche, setSelectedSuiche] = useState(dataSuiche.suiche4.image);
const [selectedColor, setSelectedColor] = useState('#000000');


// Paso 1: pedir nombre del proyecto
const [isProjectNameModalOpen, setProjectNameModalOpen] = useState(false);
const [projectName, setProjectName] = useState('');




 // console.log(selectedColor)
useEffect(() => {
  if (selectedColor !== '#FFFFFF' && selectedColor !== '#000000') {
    setSelectedColor('#000000');
  }
}, [selectedColor]);

const [isIconsModalOpen, setIconsModalOpen] = useState(false);
const [isPlantillasModalOpen, setPlantillasModalOpen] = useState(false);

const [isEditingLabel, setIsEditingLabel] = useState(false);
const [labelInput, setLabelInput] = useState('');

const esFondoNegro = selectedColor?.toLowerCase() === '#000000';
const esFondoBlanco = !esFondoNegro;
// --- estados base (deja esto ANTES de cualquier uso) ---
// Línea de producto: 'retro' (retroiluminado, el de siempre) | 'legrand'.
const [switchType, setSwitchType] = useState('retro');
const [plateMode, setPlateMode] = useState('sencilla');
const [selectedCarcasaDoble, setSelectedCarcasaDoble] = useState('/assets/carcasas doble/carcasa1.png');


const [selectedPlantillaSingle, setSelectedPlantillaSingle] = useState('04');
const [selectedPlantillaLeft,  setSelectedPlantillaLeft]  = useState('04');
const [selectedPlantillaRight, setSelectedPlantillaRight] = useState('04');


const [iconsSingle, setIconsSingle] = useState([]);
const [iconsLeft,   setIconsLeft]   = useState([]);
const [iconsRight,  setIconsRight]  = useState([]);


const [activeArea, setActiveArea] = useState('single');
const [activeSlotIdx, setActiveSlotIdx] = useState(null);
// Plantillas traídas del backend, agrupadas por proyecto
const [templatesByProject, setTemplatesByProject] = useState(new Map());

// Guardados (lista plana y agrupada)
const [savedList, setSavedList] = useState([]);
const [projectGroups, setProjectGroups] = useState(new Map());

// UI de proyectos
const [isProjectsModalOpen, setProjectsModalOpen] = useState(false);
const [selectedProjectName, setSelectedProjectName] = useState(null);
// === cerca de tus helpers de storage (junto a loadTemplates/saveTemplates) ===
const loadSavedList = () => loadTemplates();
const refreshSaved = () => {
  const list = loadSavedList(); // ahora es loadTemplates()
  setSavedList(list);
  setProjectGroups(groupByProject(list));
};

// ¿Qué registro (plantilla) está cargado/siendo editado?
const [currentRecordId, setCurrentRecordId] = useState(null);
const [currentProjectBadge, setCurrentProjectBadge] = useState({ id: null, name: "", place: "" });

// Modo de guardado en el modal: 'update' o 'new'

useEffect(() => { refreshSaved(); }, []);

 // Plantilla por área (respeta fondo negro/blanco)
const getPlantillaPath = (id) =>
  esFondoNegro
    ? `/assets/PLANTILLAS BLANCAS/plantillas-blancas-${id}.png`
    : `/assets/PLANTILLAS/plantillas-${id}.png`;

// IMÁGENES cargadas. La línea Legrand no tiene PNG de rejilla (se dibuja por
// código), así que no se pide ninguna imagen para evitar 404.
const plantillaSrc = (id) => (isLegrand(switchType) ? '' : getPlantillaPath(id));
const [plantillaSingle] = useImage(plantillaSrc(selectedPlantillaSingle));
const [plantillaLeft]   = useImage(plantillaSrc(selectedPlantillaLeft));
const [plantillaRight]  = useImage(plantillaSrc(selectedPlantillaRight));
const [carcasaSingle, carcasaSingleStatus] = useImage(selectedSuiche);
const [carcasaDoble, carcasaDobleStatus]   = useImage(selectedCarcasaDoble);
const isLoadingImage = 
  (plateMode === 'sencilla' && carcasaSingleStatus === 'loading') ||
  (plateMode === 'doble' && carcasaDobleStatus === 'loading');


// Placa sencilla según orientación (horizontal = ancho×alto intercambiados).
const isHorizontal = orientation === 'horizontal';
const plateSingle = isLegrand(switchType)
  ? LEGRAND_PLATE
  : (isHorizontal ? SINGLE_PLATE_H : SINGLE_PLATE);

// SLOTS por área
const slotsSingle = getSlotsForArea(plateSingle, selectedPlantillaSingle, orientation) || [];
const slotsLeft   = getSlotsForArea(DOUBLE_PLATE_LEFT,  selectedPlantillaLeft) || [];
const slotsRight  = getSlotsForArea(DOUBLE_PLATE_RIGHT, selectedPlantillaRight) || [];

// Referencia al último snapshot guardado/cargado para comparar


  const slots = getSlotsFor(getSlotsKey(selectedPlantilla));

  const [icons, setIcons] = useState([]); // {id, src, label, slotIdx, x,y,w,h}
  const [selectedIconId, setSelectedIconId] = useState(null);
//  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

const [editingIconId, setEditingIconId] = useState(null);
const [editValue, setEditValue] = useState('');


const [editPos, setEditPos] = useState({ x: 0, y: 0 });
const [editWidth, setEditWidth] = useState(0);


const [isSuicheModalOpen, setSuicheModalOpen] = useState(false);

// Paso 2: guardar plantilla (ya existente)
const [isSaveAskOpen, setSaveAskOpen] = useState(false);

const [isExporting, setIsExporting] = useState(false);
const [showFondo, setShowFondo] = useState(true);
const [showCarcasa, setShowCarcasa] = useState(true);
const [forceBlackIcons, setForceBlackIcons] = useState(false);


const [forceRenderKey, setForceRenderKey] = useState(0);


// ===== PROYECTOS =====
const [projects, setProjects] = useState([]);
const [isSelectProjectOpen, setSelectProjectOpen] = useState(false);

const [selectedProjectId, setSelectedProjectId] = useState(null);

const [viewProjectId, setViewProjectId] = useState(null);

const [newProjectName, setNewProjectName] = useState("");


const refreshProjects = useCallback(async () => {
  // Invitado (o sin sesión): no hay proyectos remotos; dejamos todo vacío
  // y sin alertas. El login se solicita al intentar guardar.
  if (!user || user.guest) {
    setProjects([]);
    setTemplatesByProject(new Map());
    setSavedList([]);
    setProjectGroups(new Map());
    return;
  }
  try {
    // 1. Traer proyectos desde backend
    const list = await apiFetchProjects();
    setProjects(list);

    // 2. Para cada proyecto, traer sus plantillas (resumen)
    const { byProject, flatList } = await fetchAllTemplatesForProjects(list);

    // 3. Guardar en estado React
    setTemplatesByProject(byProject);  // Map(projectId -> [plantillasResumidas])
    setSavedList(flatList);            // lista plana compatible con tu UI actual
    setProjectGroups(groupByProject(flatList));

    // 4. Asegurar selección de proyecto por defecto
    if (!selectedProjectId && list.length > 0) {
      setSelectedProjectId(list[0]._id);
      setSelectedProjectName(list[0].name);
    }

  } catch (err) {
    console.error("No se pudieron cargar proyectos o plantillas:", err);
  }
}, [selectedProjectId, user]);


useEffect(() => {
  refreshProjects();
}, [refreshProjects]);


const handleSaveTemplateClick = async () => {
  // Guardar requiere sesión real
  if (!requireLogin()) return;

  // Traemos última info
  await refreshProjects();
  refreshSaved(); // esto sigue siendo tu cache local de plantillas

  // Caso 1: ya hay una plantilla cargada en el canvas que venía de algún proyecto
  if (currentProjectBadge.id) {
    setSelectedProjectId(currentProjectBadge.id);           // Mongo _id que guardaste antes
    setSelectedProjectName(currentProjectBadge.name || ""); // nombre del proyecto
    setLabelInput(currentProjectBadge.place || "");         // nombre del lugar / habitación
  } else {
    // Caso 2: es la primera vez que va a guardar en esta sesión
    // usamos el primer proyecto de la lista si existe
    if (projects.length > 0) {
      setSelectedProjectId(projects[0]._id);
      setSelectedProjectName(projects[0].name);
      // labelInput lo dejamos como está (así si ya escribió "Habitación 302"
      // en el panel de la izquierda, no lo borramos)
    } else {
      // no hay proyectos todavía -> lo dejamos vacío
      setSelectedProjectId(null);
      setSelectedProjectName("");
      // labelInput se queda como esté
    }
  }

  // Abrimos el modal "Guardar plantilla"
  setSelectProjectOpen(true);
};


async function fetchAllTemplatesForProjects(projectList) {
  const byProject = new Map();
  const flatList = [];

  for (const p of projectList) {
    try {
      const res = await fetchPlantillasByProject(p._id);

      const arr = res.plantillas || [];

      // Guardar en el Map como viene del backend (resumidas)
      byProject.set(p._id, arr);

      // Construimos una versión "flat" parecida a savedList
      for (const tpl of arr) {
        flatList.push({
          id: tpl._id,                  // usamos el _id de Mongo
          projectId: p._id,             // el backend no lo manda, lo inferimos
          projectName: p.name || "",    // el backend no lo manda, lo inferimos
          placeName: tpl.placeName || "(sin nombre)",
          savedAt: tpl.savedAt || new Date().toISOString(),
          plateMode: tpl.plateMode,
          snapshot: null,               // ⚠ todavía no lo tenemos aquí
          preview: null,                // tu backend no manda 'preview' en el listado
          previewThumb: tpl.previewThumb || null,
        });
      }

    } catch (err) {
      console.error("Error cargando plantillas del proyecto", p._id, err);
      byProject.set(p._id, []);
    }
  }

  // orden descendente por fecha
  flatList.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));

  return { byProject, flatList };
}



// --- Helpers de guardado temporal (front-only) ---


const buildTemplateSnapshot = ({ projectName, placeName }) => {
  const base = {
    meta: {
      projectName,
      placeName,
      createdAt: new Date().toISOString(),
      version: "v1",
    },
    plateMode,
    theme: selectedColor,       // '#000000' | '#FFFFFF'
    suiche: selectedSuiche,     // imagen seleccionada
    separationStyle,            // estilo de separación entre botones
    switchType,                 // línea de producto: 'retro' | 'legrand'
    labelFont,                  // fuente del texto de las etiquetas
    orientation,                // 'vertical' | 'horizontal'
  };

  if (plateMode === "sencilla") {
    return {
      ...base,
      areas: {
        single: {
          plantillaId: selectedPlantillaSingle,
          icons: iconsSingle.map(({ num, label, slotIdx }) => ({ num, label, slotIdx })),
        }
      }
    };
  }

  return {
    ...base,
    carcasaDoble: selectedCarcasaDoble,
    areas: {
      left: {
        plantillaId: selectedPlantillaLeft,
        icons: iconsLeft.map(({ num, label, slotIdx }) => ({ num, label, slotIdx })),
      },
      right: {
        plantillaId: selectedPlantillaRight,
        icons: iconsRight.map(({ num, label, slotIdx }) => ({ num, label, slotIdx })),
      },
    },
  };
};
const saveTemplateNow = async () => {
  if (!requireLogin()) return;
  const projectId = selectedProjectId;
  const projectNameClean = (selectedProjectName || "").trim();
  const placeInput = (labelInput || "").trim(); // lo que el usuario está escribiendo ahora

if (!projectId || !projectNameClean) {
  Swal.fire("Proyecto no válido", "Primero selecciona o crea un proyecto", "warning");
  return;
}

if (!placeInput) {
  Swal.fire("Falta el nombre", "Escribe el nombre del lugar", "info");
  return;
}


  // Estado lógico actual del canvas (toda la info necesaria para snapshot)
  const snapshot = buildTemplateSnapshot({
    projectName: projectNameClean,
    placeName: placeInput,
  });

const previewFull = await captureStagePreview();
const thumbSmall  = await captureStageThumb();


  // --- DECISIÓN: ¿update o create? ---
  // Estamos editando si ya tenemos un record cargado
  const isEditingExisting = !!currentRecordId;
  // ¿el nombre del lugar sigue igual al original cargado?
  const samePlaceName = currentProjectBadge.place?.trim() === placeInput;

  // Regla:
  // - Si estoy editando y no cambié el nombre -> PUT (actualizar)
  // - En cualquier otro caso -> POST (crear nueva)
  const shouldUpdate = isEditingExisting && samePlaceName;

  try {
    let response;
    let data;

    if (shouldUpdate) {
      // === UPDATE EXISTENTE (PUT) ===
  // PUT (update)
response = await fetch(`${API_BASE}/api/v1/plantilla/${currentRecordId}`, {
  method: "PUT",
  headers: authHeaders({ "Content-Type": "application/json" }),
  body: JSON.stringify({ projectId, placeName: placeInput, plateMode, preview: previewFull, previewThumb: thumbSmall, snapshot }),
});

      data = await response.json();

  if (!response.ok) {
  console.error("Error actualizando plantilla:", data);
  Swal.fire("Error", "No se pudo actualizar la plantilla.", "error");
  return;
}


    //  console.log("✅ Plantilla actualizada:", data);

      // Mantenemos el mismo currentRecordId
      setCurrentRecordId(currentRecordId);
      setCurrentProjectBadge({
        id: projectId,
        name: projectNameClean,
        place: placeInput,
      });

    } else {
      // === CREAR NUEVA (POST) ===
  response = await fetch(`${API_BASE}/api/v1/crearPlantilla`, { // <- si tu backend usa POST /crearPlantilla; si no, deja /crearPlantilla y crea ese alias en backend o cambia aquí a la ruta que tengas
  method: "POST",
  headers: authHeaders({ "Content-Type": "application/json" }),
  body: JSON.stringify({ projectId, placeName: placeInput, plateMode, preview: previewFull, previewThumb: thumbSmall, snapshot }),
});

      data = await response.json();

      // if (response.status === 409) {
      //   // Chocaste con otra que ya existe con ese nombre y proyecto
      //   // Esto puede pasar si es "nueva" pero eligieron un nombre repetido
      //   alert("Ya existe una placa con ese nombre en este proyecto.");
      //   return;
      // }
if (!response.ok) {
  console.error("Error creando plantilla:", data);
  Swal.fire("Error", "No se pudo crear la plantilla nueva.", "error");
  return;
}



      // Como es nueva, ahora sí actualizamos currentRecordId al nuevo _id
      const created = data.data;
      setCurrentRecordId(created._id);
      setCurrentProjectBadge({
        id: projectId,
        name: projectNameClean,
        place: placeInput,
      });
    }

    // Refrescar la lista en el modal desde Mongo (proyectos + plantillas)
    await refreshProjects();

    // Marcar versión limpia
    anchorCurrentAsClean();

    // Cerrar modal de guardar
    setSelectProjectOpen(false);

    // Reset visual de placa (tú lo querías así)
    resetSwitch();

    Swal.fire({
  icon: "success",
  title: "¡Plantilla guardada!",
  text: shouldUpdate ? "Los cambios fueron actualizados." : "La plantilla fue creada correctamente.",
  timer: 1800,
  showConfirmButton: false
});


  } catch (err) {
    console.error("❌ Error guardando plantilla:", err);
    alert("Error de red guardando la plantilla.");
  }
};



const applySnapshot = (snap) => {
  if (!snap) return;

  // 1) Tema y suiche
  setSelectedColor(snap.theme || '#000000');
  setSelectedSuiche(snap.suiche || dataSuiche.suiche4.image);
  setSeparationStyle(snap.separationStyle || 'lineas');
  setSwitchType(snap.switchType || 'retro');
  setLabelFont(snap.labelFont || 'montserrat');
  setOrientation(snap.orientation || 'vertical');

  if (snap.plateMode === 'doble' && snap.carcasaDoble) {
    setSelectedCarcasaDoble(snap.carcasaDoble);
  }

  // 2) Modo placa
  const mode = snap.plateMode || 'sencilla';
  setPlateMode(mode);

  // 3) LIMPIAR iconos actuales
  setIconsSingle([]);
  setIconsLeft([]);
  setIconsRight([]);

  if (mode === 'sencilla') {
    // --- PLACA SENCILLA ---
    const plantillaId = snap?.areas?.single?.plantillaId || '04';
    setSelectedPlantillaSingle(plantillaId);
    setActiveArea('single');

    const snapIcons = snap?.areas?.single?.icons || [];
    const slots = getSlotsForArea(SINGLE_PLATE, plantillaId);

    const rebuilt = snapIcons.map(({ num, label, slotIdx }) => {
      const safeIdx = slotIdx ?? 0;
      const s =
        slots[safeIdx] ||
        slots[0] ||
        { x: PL_X, y: PL_Y, w: PL_W, h: PL_H };

      const { x, y, size } = layoutIconInSlot(s, true);

      return {
        id: newId(),
        num,
        src: getIconPath(num),
        label,
        slotIdx: safeIdx,
        x,
        y,
        size,
      };
    });

    setIconsSingle(rebuilt);
  } else {
    // --- PLACA DOBLE ---
    const plantillaLeftId = snap?.areas?.left?.plantillaId || '04';
    const plantillaRightId = snap?.areas?.right?.plantillaId || '04';

    setSelectedPlantillaLeft(plantillaLeftId);
    setSelectedPlantillaRight(plantillaRightId);
    setActiveArea('left'); // por defecto

    const leftIconsSnap = snap?.areas?.left?.icons || [];
    const rightIconsSnap = snap?.areas?.right?.icons || [];

    const leftSlots = getSlotsForArea(DOUBLE_PLATE_LEFT, plantillaLeftId);
    const rightSlots = getSlotsForArea(DOUBLE_PLATE_RIGHT, plantillaRightId);

    const rebuiltLeft = leftIconsSnap.map(({ num, label, slotIdx }) => {
      const safeIdx = slotIdx ?? 0;
      const s =
        leftSlots[safeIdx] ||
        leftSlots[0] ||
        DOUBLE_PLATE_LEFT;

      const { x, y, size } = layoutIconInSlot(s, true);

      return {
        id: newId(),
        num,
        src: getIconPath(num),
        label,
        slotIdx: safeIdx,
        x,
        y,
        size,
      };
    });

    const rebuiltRight = rightIconsSnap.map(({ num, label, slotIdx }) => {
      const safeIdx = slotIdx ?? 0;
      const s =
        rightSlots[safeIdx] ||
        rightSlots[0] ||
        DOUBLE_PLATE_RIGHT;

      const { x, y, size } = layoutIconInSlot(s, true);

      return {
        id: newId(),
        num,
        src: getIconPath(num),
        label,
        slotIdx: safeIdx,
        x,
        y,
        size,
      };
    });

    setIconsLeft(rebuiltLeft);
    setIconsRight(rebuiltRight);
  }

  // 4) Limpieza de selección / edición
  setActiveSlotIdx(null);
  setSelectedIconId(null);
  setEditingIconId(null);
};



const groupByProject = (list) => {
  const map = new Map();
  for (const r of list) {
    const name = r.projectName || "Sin proyecto";
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(r);
  }
  // ordenar items por fecha desc
  for (const [k, arr] of map.entries()) {
    arr.sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));
  }
  return map; // Map<projectName, records[]>
};
// ====== STORAGE KEYS
const PROJECTS_KEY = "diseven:projects";
const TEMPLATES_KEY = "diseven:plantillas";




// ====== TEMPLATES helpers
const loadTemplates = () => {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || "[]"); }
  catch { return []; }
};


// persistir un record (plantilla) referenciando un proyecto



  const stageRef = useRef(null);

const getExportRect = () => ({
  x: 200,
  y: 40,
  w: 785,
  h: 785,
});





// PREVIEW EN PNG — *espera imágenes y render antes de capturar*
const captureStagePreview = async () => {
  if (!stageRef.current) return null;

  const stage = stageRef.current;
  const rect = getExportRect();

  await waitForImages(stage);
  await waitFrame();

  return stage.toDataURL({
    mimeType: "image/png",
    pixelRatio: 1,
    x: rect.x,
    y: rect.y,
    width: rect.w,
    height: rect.h,
  });
};

// MINIATURA
const captureStageThumb = async () => {
  if (!stageRef.current) return null;

  const stage = stageRef.current;
  const rect = getExportRect();

  await waitForImages(stage);
  await waitFrame();

  return stage.toDataURL({
    mimeType: "image/png",
    pixelRatio: 0.4,
    x: rect.x,
    y: rect.y,
    width: rect.w,
    height: rect.h,
  });
};





const resetAll = () => {
  setIconsSingle([]); setIconsLeft([]); setIconsRight([]);
  setActiveSlotIdx(null); setSelectedIconId(null); setEditingIconId(null);
};

// Cambiar de línea de producto: cada una tiene su propio juego de plantillas,
// así que las seleccionadas se vuelven a la por defecto de la línea nueva.
const changeSwitchType = (next) => {
  setSwitchType(next);
  // Cada línea tiene sus propias carcasas y su propio juego de plantillas.
  setSelectedSuiche(isLegrand(next) ? LEGRAND_SUICHES.legrandNegra.image : dataSuiche.suiche4.image);
  if (isLegrand(next)) { setPlateMode('sencilla'); setActiveArea('single'); setOrientation('vertical'); }
  const def = defaultPlantillaId(next);
  setSelectedPlantillaSingle(def);
  setSelectedPlantillaLeft(def);
  setSelectedPlantillaRight(def);
  setSelectedPlantilla(def);
  resetAll();
};

// helpers de selección – deben ir ANTES de handleStageMouseDown
const clearSelection = useCallback(() => {
  setActiveSlotIdx(null);
  setSelectedIconId(null);
  setEditingIconId(null);
}, []);

const isInsideAnyPlate = useCallback((p) => {
  if (!p) return false;
  if (plateMode === 'sencilla') {
    return (
      p.x >= SINGLE_PLATE.x && p.x <= SINGLE_PLATE.x + SINGLE_PLATE.w &&
      p.y >= SINGLE_PLATE.y && p.y <= SINGLE_PLATE.y + SINGLE_PLATE.h
    );
  }
  const inLeft =
    p.x >= DOUBLE_PLATE_LEFT.x && p.x <= DOUBLE_PLATE_LEFT.x + DOUBLE_PLATE_LEFT.w &&
    p.y >= DOUBLE_PLATE_LEFT.y && p.y <= DOUBLE_PLATE_LEFT.y + DOUBLE_PLATE_LEFT.h;

  const inRight =
    p.x >= DOUBLE_PLATE_RIGHT.x && p.x <= DOUBLE_PLATE_RIGHT.x + DOUBLE_PLATE_RIGHT.w &&
    p.y >= DOUBLE_PLATE_RIGHT.y && p.y <= DOUBLE_PLATE_RIGHT.y + DOUBLE_PLATE_RIGHT.h;

  return inLeft || inRight;
}, [plateMode]);



const handleStagePointerDown = useCallback((e) => {
  const stage = e.target.getStage();
  const pos = stage.getPointerPosition();
  if (!pos) return;

  // Corrige por scale y desplazamiento (offset) del Stage
  const p = { x: (pos.x - offsetX) / scale, y: (pos.y - offsetY) / scale };

  // Si toca fuera de cualquier carcasa, limpia selección
  if (!isInsideAnyPlate(p)) { clearSelection(); return; }

  // ¿en qué área cayó?
  let area = 'single';
  let areaSlots = slotsSingle;

  if (plateMode === 'doble') {
    const inLeft =
      p.x >= DOUBLE_PLATE_LEFT.x && p.x <= DOUBLE_PLATE_LEFT.x + DOUBLE_PLATE_LEFT.w &&
      p.y >= DOUBLE_PLATE_LEFT.y && p.y <= DOUBLE_PLATE_LEFT.y + DOUBLE_PLATE_LEFT.h;

    const inRight =
      p.x >= DOUBLE_PLATE_RIGHT.x && p.x <= DOUBLE_PLATE_RIGHT.x + DOUBLE_PLATE_RIGHT.w &&
      p.y >= DOUBLE_PLATE_RIGHT.y && p.y <= DOUBLE_PLATE_RIGHT.y + DOUBLE_PLATE_RIGHT.h;

    if (!inLeft && !inRight) { clearSelection(); return; }

    area = inLeft ? 'left' : 'right';
    areaSlots = inLeft ? slotsLeft : slotsRight;
  }

  // ¿Qué slot golpeó?
  const hitIdx = (areaSlots || []).findIndex(
    s => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h
  );

  if (hitIdx === -1) { clearSelection(); return; }

  setActiveArea(area);
  setActiveSlotIdx(hitIdx);
}, [scale, offsetX, offsetY, plateMode, slotsSingle, slotsLeft, slotsRight, clearSelection]);


// Reposicionar cuando cambian plantillas o color
useEffect(() => {
  setIconsSingle(prev =>
    prev.map(ic => {
      const s = slotsSingle[ic.slotIdx ?? 0]; if (!s) return ic;
      const { x, y, size } = layoutIconInSlot(s, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantillaSingle, selectedColor, slotsSingle.length]);

useEffect(() => {
  setIconsLeft(prev =>
    prev.map(ic => {
      const s = slotsLeft[ic.slotIdx ?? 0]; if (!s) return ic;
      const { x, y, size } = layoutIconInSlot(s, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantillaLeft, selectedColor, slotsLeft.length]);

useEffect(() => {
  setIconsRight(prev =>
    prev.map(ic => {
      const s = slotsRight[ic.slotIdx ?? 0]; if (!s) return ic;
      const { x, y, size } = layoutIconInSlot(s, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantillaRight, selectedColor, slotsRight.length]);

// Al cambiar de modo, limpia selección
useEffect(() => { setActiveSlotIdx(null); setSelectedIconId(null); }, [plateMode]);


const getIconPath = (num) => {
  if (forceBlackIcons) {
    return iconSvgPath(num, false);
  }
  return esFondoBlanco
    ? iconSvgPath(num, false)   // fondo claro → icono negro
    : iconSvgPath(num, true);   // fondo oscuro → icono blanco
};



const placeOrReplaceIcon = (num, label = '') => {
  const src = getIconPath(num);
  const area = plateMode === 'sencilla' ? 'single' : activeArea; // 'single'|'left'|'right'
  const slotsMap = { single: slotsSingle, left: slotsLeft, right: slotsRight };
  const iconsMap = { single: iconsSingle, left: iconsLeft, right: iconsRight };
  const setMap   = { single: setIconsSingle, left: setIconsLeft, right: setIconsRight };

  const slots = slotsMap[area] || [];
  const curIcons = iconsMap[area] || [];
  if (!slots.length) return;

  let target = activeSlotIdx != null
    ? activeSlotIdx
    : findFirstEmptySlot(curIcons, slots.length, 0);

  if (target == null) return;

  const slot = slots[target];
  const { x, y, size } = layoutIconInSlot(slot, true);

  const prev = curIcons.filter(ic => (ic.slotIdx ?? -1) !== target);
   const newIcon = {
    id: newId(),
    num,                       // <- guardamos el número
    src,                       // <- ruta acorde al fondo actual
    label,
    slotIdx: target, x, y, size
  };

  setMap[area]([...prev, newIcon]);
  setSelectedIconId(newIcon.id);
  setLabelInput(label ?? '');
  setActiveSlotIdx(target);
};




 const saveLabel = () => {
  const apply = arr => arr.map(ic => ic.id === selectedIconId ? { ...ic, label: labelInput } : ic);
  setIconsSingle(apply);
  setIconsLeft(apply);
  setIconsRight(apply);
  setIsEditingLabel(false);
};// === ADD (arriba, junto a helpers) ===
const isSlotOccupied = (iconsArr, slotIdx) =>
  iconsArr.some(ic => (ic.slotIdx ?? 0) === slotIdx);

const findFirstEmptySlot = (iconsArr, slotsLen, startIdx = 0) => {
  if (!slotsLen) return null;
  for (let step = 0; step < slotsLen; step++) {
    const idx = (startIdx + step) % slotsLen;
    if (!isSlotOccupied(iconsArr, idx)) return idx;
  }
  return null; // no hay libres
};

  // Atajos de teclado para mover icono seleccionado
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!selectedIconId) return;
      const delta = e.shiftKey ? 10 : 1;
      setIcons(prev => prev.map(ic => {
        if (ic.id !== selectedIconId) return ic;
        if (e.key === 'ArrowLeft')  return { ...ic, x: ic.x - delta };
        if (e.key === 'ArrowRight') return { ...ic, x: ic.x + delta };
        if (e.key === 'ArrowUp')    return { ...ic, y: ic.y - delta };
        if (e.key === 'ArrowDown')  return { ...ic, y: ic.y + delta };
        return ic;
      }));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIconId]);


useEffect(() => {
  if (!slots.length) return;
  setIcons(prev =>
    prev.map(ic => {
      const slot = slots[ic.slotIdx ?? 0];
      if (!slot) return ic;
      const { x, y, size } = layoutIconInSlot(slot, true);
      return { ...ic, x, y, size };
    })
  );
}, [selectedPlantilla, selectedColor, slots.length]);

const handleSaveEdit = () => {
  setIcons(prev =>
    prev.map(ic =>
      ic.id === editingIconId ? { ...ic, label: editValue } : ic
    )
  );
  setEditingIconId(null);
};

// Dentro de DesignerCanvas (arriba de return)
const resetIcons = () => {
  setIcons([]);
  setSelectedIconId(null);
  setEditingIconId(null);
  setActiveSlotIdx(0);
};


useEffect(() => {
  resetIcons();
}, [selectedColor]);

useEffect(() => {
  if (plateMode !== 'doble') return;
  const list = Object.values(dataSuiche);
  const idx = list.findIndex(s => s.image === selectedSuiche);
  if (idx >= 0) {
    setSelectedCarcasaDoble(`/assets/carcasas doble/carcasa${idx + 1}.png`); // ajusta ruta/extensión
  }
}, [plateMode, selectedSuiche]);

const labelInputRef = useRef(null);
const overlayInputRef = useRef(null);


const handleSelectIcon = (iconId) => {
  const ic =
    iconsSingle.find(i => i.id === iconId) ||
    iconsLeft.find(i => i.id === iconId) ||
    iconsRight.find(i => i.id === iconId);

  if (!ic) return;

  setSelectedIconId(iconId);
  setLabelInput(ic.label ?? '');

  // Dale un tick para que el input exista en el DOM y fócalo (gesto de usuario activo)
  setTimeout(() => {
    labelInputRef.current?.focus({ preventScroll: true });
    // Opcional: selecciona todo el texto
    try { labelInputRef.current?.setSelectionRange(0, (labelInputRef.current.value || '').length); } catch {}
  }, 0);
};


const modalVariant = selectedColor?.toLowerCase() === '#ffffff' ? 'dark' : 'light';


// Cambia la imagen de TODOS los iconos al set de blanco/negro correspondiente
useEffect(() => {
  const swap = (arr) =>
    arr.map(ic => ic.num ? { ...ic, src: getIconPath(ic.num) } : ic);

  setIconsSingle(prev => swap(prev));
  setIconsLeft(prev => swap(prev));
  setIconsRight(prev => swap(prev));
}, [esFondoBlanco]); // o [selectedColor]

const themeKey = selectedColor?.toLowerCase() === '#000000' ? 'dark' : 'light';

useEffect(() => {
  if (editingIconId && overlayInputRef.current) {
    overlayInputRef.current.focus({ preventScroll: true });
    try { overlayInputRef.current.setSelectionRange(0, overlayInputRef.current.value.length); } catch {}
  }
}, [editingIconId]);

// Marca la versión actual del canvas como "sin cambios pendientes"
const anchorCurrentAsClean = () => {
  // Ojo: aquí vamos a usar el snapshot actual para "congelar" estado guardado,
  // mismo patrón que usas en buildTemplateSnapshot.
  const badgeProjectName =
    currentProjectBadge?.name || selectedProjectName || "";
  const badgePlaceName =
    currentProjectBadge?.place || labelInput || "";

 buildTemplateSnapshot({
    projectName: badgeProjectName,
    placeName: badgePlaceName,
  });


};





const resetSwitch = () => {
  setPlateMode('sencilla');
  setSelectedSuiche(dataSuiche.suiche4.image);              
  setSelectedCarcasaDoble('/assets/carcasas doble/carcasa1.png');
  setSelectedColor('#000000');                                
  setSelectedPlantillaSingle('04');
  setSelectedPlantillaLeft('04');
  setSelectedPlantillaRight('04');
  resetAll();
  setActiveArea('single');
  setActiveSlotIdx(null);
};

// === Nueva función robusta para exportar UNA plantilla ===


const waitableApplySnapshot = async (snapshot) => {
  applySnapshot(snapshot);

  // esperar que React procese cambios
  await new Promise(res => setTimeout(res, 60));

  // 💥 reconstrucción total del canvas (fondos, slots, iconos, rutas)
  await forceFullRebuild();

  // dejar que se apliquen rutas de plantilla
  await new Promise(res => setTimeout(res, 60));
};


const waitForReactRender = () =>
  new Promise(resolve => 
    requestAnimationFrame(() => 
      requestAnimationFrame(resolve)
    )
  );

// Espera varios frames para asegurar que React + Konva + imágenes han terminado
const waitForFullStabilization = () =>
  new Promise((resolve) => {
    let frames = 0;

    function step() {
      frames++;

      // Esperamos ~20 frames (≈ 300 ms aprox.)
      if (frames < 20) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(step);
  });


const waitForPlantillaImages = async () => {
  return new Promise(resolve => {
    let checks = 0;
    function verify() {
      checks++;

      // para plantilla sencilla
      const sReady = plateMode === "sencilla"
        ? plantillaSingle && plantillaSingle.complete && plantillaSingle.naturalWidth > 0
        : true;

      // para plantilla doble
      const leftReady = plateMode === "doble"
        ? plantillaLeft && plantillaLeft.complete && plantillaLeft.naturalWidth > 0
        : true;

      const rightReady = plateMode === "doble"
        ? plantillaRight && plantillaRight.complete && plantillaRight.naturalWidth > 0
        : true;

      if (sReady && leftReady && rightReady) {
        resolve();
      } else if (checks < 60) {  
        // 60 frames = ~1000 ms máximo
        requestAnimationFrame(verify);
      } else {
        resolve(); // evitar bloqueo
      }
    }
    verify();
  });
};

  // Alterna la vista de exportación SOBRE el lienzo (cómo se verá el archivo)
  const toggleExportView = async () => {
    if (showExportView) { setShowExportView(false); return; }
    try {
      const snapshot = buildTemplateSnapshot({ projectName: "", placeName: "preview" });
      const url = await renderPlateExport(snapshot);
      setExportPreview(url);
      setShowExportView(true);
    } catch (e) {
      console.error("Error generando vista de exportación:", e);
      Swal.fire("Error", "No se pudo generar la vista.", "error");
    }
  };

  const handleDownloadCurrentTemplate = async () => {
  // Exporta el diseño actual con el formato "ficha" (contorno + iconos + textos
  // en mayúsculas/negrita, fondo transparente), igual que la exportación ZIP.
  try {
    const snapshot = buildTemplateSnapshot({ projectName: "", placeName: "plantilla" });
    const pngDataURL = await renderPlateExport(snapshot);
    if (!pngDataURL) return;

    const link = document.createElement("a");
    link.href = pngDataURL;
    link.download = "plantilla.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("Error exportando PNG:", e);
    Swal.fire("Error", "No se pudo exportar el PNG.", "error");
  }
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });



const exportOnlyTemplateAndIconsPNG = async () => {
  if (!stageRef.current) {
    console.warn("⛔ exportOnlyTemplateAndIconsPNG: no hay stageRef");
    return;
  }

  // 🔍 LOG de estado ANTES de tocar nada
  console.log("===== 🧪 exportOnlyTemplateAndIconsPNG() =====");
  console.log("🧾 plateMode:", plateMode);
  console.log("🎨 theme (selectedColor):", selectedColor);
  console.log("🧱 selectedPlantillaSingle:", selectedPlantillaSingle);
  console.log("🧱 selectedPlantillaLeft:", selectedPlantillaLeft);
  console.log("🧱 selectedPlantillaRight:", selectedPlantillaRight);
  console.log("🔢 iconsSingle.length:", iconsSingle?.length || 0);
  console.log("🔢 iconsLeft.length:", iconsLeft?.length || 0);
  console.log("🔢 iconsRight.length:", iconsRight?.length || 0);

  // 1) Configuración para exportar SOLO plantilla + íconos
  console.log("⚙️ Desactivando fondo y carcasa, forzando iconos negros...");
  setShowFondo(false);
  setShowCarcasa(false);
  setForceBlackIcons(true);

  // Esperar a que todo se actualice y cargue
  await waitForReactRender();
  await waitForPlantillaImages();
  await waitForImages(stageRef.current);
  await waitFrame();
  await waitForFullStabilization();

  const rect = { x: PL_X, y: PL_Y, width: PL_W, height: PL_H };
  let plantillaImage = null;
if (plateMode === "sencilla") {
  const plantillaId = selectedPlantillaSingle || "04";

  plantillaImage = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    // RUTA CORRECTA FINAL
    img.src = `/assets/PLANTILLAS/plantillas-${plantillaId}.png`;

    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error("❌ Error cargando plantilla sencilla:", img.src, e);
      reject(e);
    };
  });
}
 else {
  const leftId = selectedPlantillaLeft || "04";
  const rightId = selectedPlantillaRight || "04";

  const leftImg = await loadImage(`/assets/PLANTILLAS/plantillas-${leftId}.png`);
  const rightImg = await loadImage(`/assets/PLANTILLAS/plantillas-${rightId}.png`);

  const canvasTemp = document.createElement("canvas");
  canvasTemp.width = PL_W * 2;
  canvasTemp.height = PL_H;
  const ctxTemp = canvasTemp.getContext("2d");

  ctxTemp.drawImage(leftImg, 0, 0, PL_W, PL_H);
  ctxTemp.drawImage(rightImg, PL_W, 0, PL_W, PL_H);

  plantillaImage = await loadImage(canvasTemp.toDataURL("image/png"));
}



  if (!plantillaImage) {
    console.warn("⛔ No hay imagen de plantilla cargada dentro de exportOnlyTemplateAndIconsPNG");
    // Restaurar estado visual
    setShowFondo(true);
    setShowCarcasa(true);
    setForceBlackIcons(false);
    return;
  }

  // 3) Canvas grande para alta resolución
  const pixelRatio = 8; // luego se reduce a la mitad más abajo
  const canvasFull = document.createElement("canvas");
  canvasFull.width = rect.width * pixelRatio;
  canvasFull.height = rect.height * pixelRatio;
  const ctxFull = canvasFull.getContext("2d");
  ctxFull.imageSmoothingEnabled = true;
  ctxFull.imageSmoothingQuality = "high";

  // Dibujar plantilla base
  ctxFull.drawImage(
    plantillaImage,
    0,
    0,
    rect.width * pixelRatio,
    rect.height * pixelRatio
  );

  // 4) Íconos a usar según modo
  const iconsToUse =
    plateMode === "doble" ? [...iconsLeft, ...iconsRight] : iconsSingle;

  console.log("🎯 iconsToUse.length:", iconsToUse?.length || 0);
  console.log(
    "🎯 iconsToUse nums:",
    (iconsToUse || []).map(ic => ic.num)
  );

  for (const icon of iconsToUse || []) {
    // Por si acaso
    if (!icon) continue;

    console.log(
      "   ➕ Pintando icono:",
      icon.num,
      "label:",
      icon.label,
      "slotIdx:",
      icon.slotIdx,
      "x:",
      icon.x,
      "y:",
      icon.y,
      "size:",
      icon.size
    );

    // Forzamos los ICONOS NEGROS (versión imprimible), igual que la exportación ZIP.
    // (Antes usaba icon.src; con placa negra ese src es blanco y quedaba invisible.)
    if (!icon.num) continue;
    const img = await loadImage(iconSvgPath(icon.num, false)).catch(() => null);
    if (!img) continue;

    const size = icon.size;
    const fit = fitLabel(icon.label, size);
    const yShift = labelYShift(fit);

    const drawX = (icon.x - rect.x) * pixelRatio;
    const drawY = (icon.y - rect.y - yShift) * pixelRatio;

    // Ícono
    ctxFull.drawImage(img, drawX, drawY, size * pixelRatio, size * pixelRatio);

    // Texto (mismo modelo que el editor: 1 o 2 líneas balanceadas, completo)
    if (fit.lines.length) {
      ctxFull.font = `600 ${Math.round(fit.fontSize * pixelRatio)}px Montserrat`;
      ctxFull.fillStyle = "#1e1e1e";
      ctxFull.textAlign = "center";
      ctxFull.textBaseline = "top";

      const centerX = (icon.x - rect.x + size / 2) * pixelRatio;
      const topY = (icon.y - rect.y + size + ICON_LABEL_GAP - yShift) * pixelRatio;
      const lh = fit.fontSize * LABEL_LINE_HEIGHT * pixelRatio;

      fit.lines.forEach((ln, li) => ctxFull.fillText(ln, centerX, topY + li * lh));
    }
  }

  // 5) Reducir un poco el tamaño final (suavizado)
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasFull.width * 0.5;
  finalCanvas.height = canvasFull.height * 0.5;

  finalCanvas
    .getContext("2d")
    .drawImage(canvasFull, 0, 0, finalCanvas.width, finalCanvas.height);

  const pngDataURL = finalCanvas.toDataURL("image/png");

  console.log("✅ exportOnlyTemplateAndIconsPNG: PNG generado, length:", pngDataURL.length);

  // 6) Restaurar estado visual del editor
  setShowFondo(true);
  setShowCarcasa(true);
  setForceBlackIcons(false);

  return pngDataURL;
};


async function renderSnapshotToPNG(snapshot) {
  const plateMode = snapshot.plateMode;
  const selectedColor = snapshot.theme || "#000000";

  const rect = { x: PL_X, y: PL_Y, width: PL_W, height: PL_H };

  // === 1) Cargar PLANTILLA EXACTAMENTE IGUAL ===
  let plantillaImage = null;

  if (plateMode === "sencilla") {
    const plantillaId = snapshot.areas.single.plantillaId || "04";
    plantillaImage = await loadImage(`/assets/PLANTILLAS/plantillas-${plantillaId}.png`);
  } else {
    const leftId = snapshot.areas.left.plantillaId;
    const rightId = snapshot.areas.right.plantillaId;

    const leftImg = await loadImage(`/assets/PLANTILLAS/plantillas-${leftId}.png`);
    const rightImg = await loadImage(`/assets/PLANTILLAS/plantillas-${rightId}.png`);

    // Igual que exportOnlyTemplateAndIconsPNG: canvas temporal doble
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = PL_W * 2;
    canvasTemp.height = PL_H;
    const ctxTemp = canvasTemp.getContext("2d");

    ctxTemp.drawImage(leftImg, 0, 0, PL_W, PL_H);
    ctxTemp.drawImage(rightImg, PL_W, 0, PL_W, PL_H);

    plantillaImage = await loadImage(canvasTemp.toDataURL("image/png"));
  }

  // === 2) Crear canvas FULL (misma exportación exacta) ===
  const pixelRatio = 8;
  const canvasFull = document.createElement("canvas");
  canvasFull.width = rect.width * pixelRatio;
  canvasFull.height = rect.height * pixelRatio;
  const ctxFull = canvasFull.getContext("2d");

  ctxFull.imageSmoothingEnabled = true;
  ctxFull.imageSmoothingQuality = "high";

  ctxFull.drawImage(
    plantillaImage,
    0,
    0,
    rect.width * pixelRatio,
    rect.height * pixelRatio
  );

  // === 3) Determinar slots EXACTOS ===
  const finalSlots =
    plateMode === "sencilla"
      ? getSlotsForArea(SINGLE_PLATE, snapshot.areas.single.plantillaId)
      : [
          ...getSlotsForArea(DOUBLE_PLATE_LEFT, snapshot.areas.left.plantillaId),
          ...getSlotsForArea(DOUBLE_PLATE_RIGHT, snapshot.areas.right.plantillaId),
        ];

  // === 4) Determinar íconos EXACTOS ===
  const iconsToUse =
    plateMode === "sencilla"
      ? snapshot.areas.single.icons
      : [...snapshot.areas.left.icons, ...snapshot.areas.right.icons];

  for (const icon of iconsToUse) {
    // Aplicar layout EXACTO (slot → x,y,size)
    const slot = finalSlots[icon.slotIdx];
    if (!slot) continue;

    const layout = layoutIconInSlot(slot, true); // true = FONDO NEGRO (negro)
    const { x, y, size } = layout;

    const img = await loadImage(iconSvgPath(icon.num, false));

    const fit = fitLabel(icon.label, size);
    const yShift = labelYShift(fit);

    const drawX = (x - rect.x) * pixelRatio;
    const drawY = (y - rect.y - yShift) * pixelRatio;

    // === PINTAR ÍCONO ===
    ctxFull.drawImage(
      img,
      drawX,
      drawY,
      size * pixelRatio,
      size * pixelRatio
    );

    // === PINTAR TEXTO (mismo modelo que el editor: completo, sin recortar) ===
    if (fit.lines.length) {
      ctxFull.font = `600 ${Math.round(fit.fontSize * pixelRatio)}px Montserrat`;
      ctxFull.fillStyle = "#1e1e1e";
      ctxFull.textAlign = "center";
      ctxFull.textBaseline = "top";

      const centerX = (x - rect.x + size / 2) * pixelRatio;
      const topY = (y - rect.y + size + ICON_LABEL_GAP - yShift) * pixelRatio;
      const lh = fit.fontSize * LABEL_LINE_HEIGHT * pixelRatio;

      fit.lines.forEach((ln, li) => ctxFull.fillText(ln, centerX, topY + li * lh));
    }
  }

  // === 5) Reducir EXACTAMENTE igual ===
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvasFull.width * 0.5;
  finalCanvas.height = canvasFull.height * 0.5;

  finalCanvas.getContext("2d").drawImage(
    canvasFull,
    0,
    0,
    finalCanvas.width,
    finalCanvas.height
  );

  return finalCanvas.toDataURL("image/png");
}

// ===== Exportación estilo "ficha" (como la referencia): contorno redondeado de
// la placa + divisorias + iconos NEGROS + etiquetas MAYÚSCULAS y negrita.
// Fondo TRANSPARENTE. Se usa tanto para "Exportar PNG" como para "Exportar ZIP".
async function renderPlateExport(snapshot) {
  const plateMode = snapshot.plateMode;

  // Fuente elegida para las etiquetas.
  const fontOpt = getFontOption(snapshot.labelFont);
  const LABEL_STYLE = fontStyleStr(fontOpt);   // p. ej. "italic 600" | "600"

  // Aseguramos que la fuente esté cargada para el canvas.
  try {
    await document.fonts.load(`${LABEL_STYLE} 20px "${fontOpt.family}"`);
    await document.fonts.load("600 20px Montserrat");
  } catch { /* noop */ }

  // Orientación: horizontal = ancho×alto intercambiados (marco acostado).
  const horizontal = snapshot.orientation === 'horizontal';

  // Medida física del MARCO para la máquina láser (Omni1), en milímetros.
  // Sale de plateMM(), la misma que usa el editor → export y pantalla coinciden.
  const _mm = plateMM(snapshot.switchType, horizontal);
  const TARGET_W_MM = _mm.w;
  const TARGET_H_MM = _mm.h;
  const DPI = 1000;            // igual que la referencia (1000 DPI)

  // OUTER = borde EXTERIOR del marco (lo que mide la máquina) = medida objetivo.
  const OUTER_W = 215;

  // Grosor ÚNICO de todas las líneas (marco + divisorias + trazo de icono), en mm.
  const STROKE_MM = 0.36;
  // A unidades de diseño: (unidades por mm) = OUTER_W / TARGET_W_MM
  const STROKE = (STROKE_MM * OUTER_W) / TARGET_W_MM;

  // La ruta del rectángulo se dibuja inset medio grosor por lado, para que el
  // exterior (ruta + grosor) mida exactamente la medida objetivo.
  const OUTER_H = (OUTER_W * TARGET_H_MM) / TARGET_W_MM;
  const PLATE_W = OUTER_W - STROKE;
  const PLATE_H = OUTER_H - STROKE;

  // Resolución: el exterior (OUTER_W) mide exactamente TARGET_W_MM al DPI dado.
  const PR = (TARGET_W_MM / OUTER_W) * (DPI / 25.4);
  const ppm = Math.round((DPI * 1000) / 25.4); // px por metro para el chunk pHYs

  const MARGIN = 10;          // margen pequeño (el marco debe ir ajustado)
  const LABEL_WEIGHT = 600;    // peso de fuente

  // Tamaño ESTÁNDAR del icono según el ALTO de la casilla (en mm). El dibujo LLENA el cuadro.
  // Sale de ICON_METRICS, la misma tabla que usa el editor → WYSIWYG.
  const _M = iconMetrics(snapshot.switchType);
  const U_PER_MM = OUTER_W / TARGET_W_MM; // unidades de diseño por mm
  const ICON_BIG_MM = _M.big;     // casilla alta → icono grande
  const ICON_SMALL_MM = _M.small; // casilla baja → icono pequeño
  const LARGE_CELL_MM = _M.largeCellMm; // umbral de casilla alta
  const LABEL_MM = _M.labelMm;  // alto de letra, igual en TODAS las casillas
  const TARGET_STROKE_PX = STROKE_MM * (ppm / 1000); // 0.36 mm en px reales
  const ICON_STROKE_MM = 0.35; // grosor UNIFORME de los iconos (igual en toda casilla)
  const ICON_STROKE_PX = ICON_STROKE_MM * (ppm / 1000); // 0.35 mm en px reales

  const areas = plateMode === "doble"
    ? [
        { plate: { x: 0, y: 0, w: PLATE_W, h: PLATE_H }, plantillaId: snapshot.areas.left.plantillaId, icons: snapshot.areas.left.icons },
        { plate: { x: PLATE_W + 28, y: 0, w: PLATE_W, h: PLATE_H }, plantillaId: snapshot.areas.right.plantillaId, icons: snapshot.areas.right.icons },
      ]
    : [
        { plate: { x: 0, y: 0, w: PLATE_W, h: PLATE_H }, plantillaId: snapshot.areas.single.plantillaId, icons: snapshot.areas.single.icons },
      ];

  const minX = Math.min(...areas.map(a => a.plate.x)) - MARGIN;
  const minY = Math.min(...areas.map(a => a.plate.y)) - MARGIN;
  const maxX = Math.max(...areas.map(a => a.plate.x + a.plate.w)) + MARGIN;
  const maxY = Math.max(...areas.map(a => a.plate.y + a.plate.h)) + MARGIN;
  const W = maxX - minX, H = maxY - minY;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * PR);
  canvas.height = Math.round(H * PR);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(PR, PR);
  ctx.translate(-minX, -minY);

  for (const area of areas) {
    const p = area.plate;

    // 1) Contorno de la placa (grosor único). Legrand va con esquina VIVA
    //    (sin redondear), como en las fichas de referencia.
    ctx.strokeStyle = "#000";
    ctx.lineWidth = STROKE;
    ctx.lineJoin = isLegrand(snapshot.switchType) ? "miter" : "round";
    ctx.lineCap = "round";
    ctxRoundRect(ctx, p.x, p.y, p.w, p.h,
      isLegrand(snapshot.switchType) ? 0 : Math.min(p.w, p.h) * 0.11);
    ctx.stroke();

    // 2) Divisorias internas. Según el estilo elegido:
    //    - 'lineas'  → imagen de la plantilla normalizada a 0.36 mm (rejilla),
    //                  salvo en la línea Legrand, que trae su propia geometría.
    //    - resto     → estilo "botón" dibujado por código a partir de las casillas.
    const sepStyle = snapshot.separationStyle || 'lineas';
    const legrand = isLegrand(snapshot.switchType);
    if (sepStyle === 'lineas' && legrand) {
      const sepSlots = getSlotsForArea(p, area.plantillaId, snapshot.orientation);
      drawSeparationOnCtx(ctx, buildLegrandPrimitives(sepSlots, p), STROKE);
    } else if (sepStyle === 'lineas') {
      const plImg = await loadImage(`/assets/PLANTILLAS/plantillas-${area.plantillaId}.png`).catch(() => null);
      if (plImg) {
        const dstW = Math.max(1, Math.round(p.w * PR));
        const dstH = Math.max(1, Math.round(p.h * PR));
        let dcv = document.createElement("canvas");
        dcv.width = dstW; dcv.height = dstH;
        const dctx = dcv.getContext("2d");
        dctx.imageSmoothingEnabled = true;
        dctx.imageSmoothingQuality = "high";
        if (horizontal) {
          // Horizontal: rotar la imagen de líneas 90° (igual que rotSlotCW).
          dctx.save();
          dctx.translate(dstW / 2, dstH / 2);
          dctx.rotate(Math.PI / 2);
          dctx.drawImage(plImg, -dstH / 2, -dstW / 2, dstH, dstW);
          dctx.restore();
        } else {
          dctx.drawImage(plImg, 0, 0, dstW, dstH);
        }
        // retroalimentación: medir el grosor real de las líneas y corregirlo a 0.36 mm
        for (let i = 0; i < 14; i++) {
          const s = measureStrokeCanvas(dcv);
          if (!s) break;
          const delta = TARGET_STROKE_PX - s;
          if (Math.abs(delta) <= 0.5) break;
          dcv = morphStep(dcv, delta > 0, Math.min(1.1, Math.abs(delta) / 2));
        }
        crispenCanvas(dcv);              // bordes nítidos + negro puro
        ctx.drawImage(dcv, p.x, p.y, p.w, p.h); // ctx ya está escalado por PR
      }
    } else {
      // Estilo "botón": vectorial, grosor único 0.36 mm, dibujado por casilla.
      const sepSlots = getSlotsForArea(p, area.plantillaId, snapshot.orientation);
      const prims = buildSeparationPrimitives(sepStyle, sepSlots, p);
      drawSeparationOnCtx(ctx, prims, STROKE);
    }

    // 3) Iconos + etiquetas — icono reducido (más fino) y bloque centrado en la casilla
    const slots = getSlotsForArea(p, area.plantillaId, snapshot.orientation);
    for (const icon of area.icons || []) {
      const slot = slots[icon.slotIdx];
      if (!slot || !icon.num) continue;

      const img = await loadImage(iconSvgPath(icon.num, false)).catch(() => null);
      if (!img) continue;

      // Tamaño ESTÁNDAR según el tipo de casilla. Una casilla es GRANDE (icono 15mm)
      // solo si es ALTA **y** de ancho casi completo. Si está partida (angosta, hay
      // línea del medio) va icono PEQUEÑO (9mm), aunque sea alta → no se ve gigante.
      const cellHeightMm = slot.h / U_PER_MM;
      const isLargeCell = cellHeightMm >= LARGE_CELL_MM && slot.w >= p.w * 0.7;
      const isSmallCell = !isLargeCell;
      // Área REAL delimitada por las líneas (inset del marco donde no llegan las líneas).
      const cell = contentRect(slot, p, snapshot.switchType);
      const fscale = fontOpt.scale || 1; // scripts se ven más pequeñas → se agrandan

      // 1) TEXTO primero (para saber cuánto espacio ocupa y reservarlo).
      const lines = exportLabelLines(icon.label, fontOpt.upper !== false);
      const maxW = cell.w * 0.94;
      const longest = lines.length ? Math.max(...lines.map((l) => l.length)) : 0;
      let fs = LABEL_MM * U_PER_MM * fscale;
      const minFs = slot.w * 0.075;
      while (fs > minFs && longest * fs * 0.72 > maxW) fs -= 0.5;
      const lh = fs * LABEL_LINE_HEIGHT;
      const gap = fs * (isLargeCell ? 0.7 : 0.5); // separación icono→texto (no depende del icono)
      const labelH = lines.length ? gap + lines.length * lh : 0;

      // 2) ICONO: estándar, pero LIMITADO por el ancho del cuadro y por el espacio
      // que deja el texto → así el texto largo (2 líneas) NO se sale del cuadro.
      const boxDesign = Math.min(
        (isLargeCell ? ICON_BIG_MM : ICON_SMALL_MM) * U_PER_MM,
        cell.w * 0.72,
        Math.max(cell.h * 0.28, cell.h * 0.92 - labelH)
      );

      // Icono VECTORIAL (SVG): alta resolución (SS=3) + grosor UNIFORME 0.35 mm.
      const SS = 3;
      const boxPx = Math.max(1, Math.round(boxDesign * PR * SS));
      const ic = prepareSvgIconForExport(img, boxPx, ICON_STROKE_PX * SS);
      const iconW = ic.wPx / (PR * SS);   // ancho real del dibujo (unidades diseño)
      const iconH = ic.hPx / (PR * SS);   // alto real del dibujo

      // 3) Colocar el BLOQUE (icono + texto): misma regla que el editor, con la
      //    etiqueta pegada a la línea divisoria cuando hay texto.
      const blockH = boxDesign + labelH;
      const cx = cell.x + cell.w / 2;
      const top = blockTopY(cell, blockH, labelH);
      const iconBandCenterY = top + boxDesign / 2;
      ctx.drawImage(ic.canvas, cx - iconW / 2, iconBandCenterY - iconH / 2, iconW, iconH);

      if (lines.length) {
        const textTop = top + boxDesign + gap;
        // Texto con el MISMO grosor estándar (0.36 mm) que el marco/divisorias/iconos.
        const lb = renderLabelBlock(lines, fs * PR, LABEL_STYLE, lh * PR, TARGET_STROKE_PX, fontOpt.family);
        ctx.drawImage(
          lb.canvas,
          cx - lb.wPx / (2 * PR),   // centrado en la casilla
          textTop - lb.pad / PR,    // el margen superior del canvas alinea la 1.ª línea
          lb.wPx / PR,
          lb.hPx / PR
        );
      }
    }
  }

  // Incrustamos la medida física (pHYs, 1000 DPI) → el marco entra a 34.469 × 67.379 mm.
  return addPngPhys(canvas.toDataURL("image/png"), ppm, ppm);
}

// Exporta TODAS las plantillas del proyecto en UNA SOLA imagen (hoja/montaje),
// a tamaño físico real (1000 DPI), lista para el láser. No genera ZIP.
const exportProjectZIP = async (projectId) => {
  try {
    const res = await fetchPlantillasByProject(projectId);
    const plantillas = res?.plantillas || [];

    if (plantillas.length === 0) {
      Swal.fire("Sin plantillas", "Este proyecto no tiene plantillas", "info");
      return;
    }

    Swal.fire({
      title: "Generando imagen...",
      html: "<b id='progress-text'>Iniciando…</b>",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
      background: "#1e293b",
      color: "#fff",
    });

    // 1) Renderizar cada plantilla (formato ficha) y cargarla como imagen.
    const images = [];
    for (let i = 0; i < plantillas.length; i++) {
      const p = plantillas[i];
      const el = document.getElementById("progress-text");
      if (el) el.textContent = `Procesando ${i + 1}/${plantillas.length}: ${p.placeName || ""}`;

      const full = await fetchPlantillaById(p._id);
      if (!full?.snapshot) continue;

      const url = await renderPlateExport(full.snapshot);
      if (!url) continue;
      const img = await loadImage(url).catch(() => null);
      if (img) images.push(img);
    }

    if (!images.length) {
      Swal.fire("Sin contenido", "No se pudo renderizar ninguna plantilla", "error");
      return;
    }

    // 2) Componer en una CUADRÍCULA, 1:1 (sin escalar → conserva la medida física).
    //    La celda usa el tamaño mayor encontrado (por si hay sencillas y dobles);
    //    cada plantilla se centra en su celda.
    const cellW = Math.max(...images.map((im) => im.naturalWidth));
    const cellH = Math.max(...images.map((im) => im.naturalHeight));
    const GAP = Math.round(cellW * 0.06); // pequeño espacio entre plantillas
    // columnas para que la hoja quede aprox. cuadrada (las placas son altas)
    const cols = Math.max(1, Math.round(Math.sqrt(images.length * (cellH / cellW))));
    const rows = Math.ceil(images.length / cols);

    const W = cols * cellW + (cols - 1) * GAP;
    const H = rows * cellH + (rows - 1) * GAP;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    images.forEach((im, idx) => {
      const c = idx % cols, r = Math.floor(idx / cols);
      const cellX = c * (cellW + GAP), cellY = r * (cellH + GAP);
      // centrar la plantilla dentro de su celda
      const dx = cellX + Math.round((cellW - im.naturalWidth) / 2);
      const dy = cellY + Math.round((cellH - im.naturalHeight) / 2);
      ctx.drawImage(im, dx, dy, im.naturalWidth, im.naturalHeight);
    });

    // 3) Incrustar medida física (pHYs, 1000 DPI) → cada placa entra a tamaño real.
    const ppm = Math.round((1000 * 1000) / 25.4);
    const out = addPngPhys(canvas.toDataURL("image/png"), ppm, ppm);

    // 4) Descargar UNA sola imagen, con el NOMBRE del proyecto.
    const proj = projects.find((p) => p._id === projectId);
    const projName = (proj?.name || selectedProjectName || "proyecto").trim();
    const safeName = projName.replace(/[^a-z0-9_\-]/gi, "_") || "proyecto";
    const a = document.createElement("a");
    a.href = out;
    a.download = `${safeName}_plantillas.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    Swal.fire("¡Listo!", `Se combinaron ${images.length} plantillas en una sola imagen`, "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "No se pudo generar la imagen", "error");
  }
};
const forceFullRebuild = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      setForceRenderKey(prev => prev + 1); // obligar Stage a reconstruirse
      resolve();
    }, 50);
  });
};


  return (
    <div className={styles.contenedor}>
    <div style={{  display: "grid", gridTemplateRows: "auto 1fr" }}>
    <ProfileBar onClickHome={() => nav("/")} />
    <div className={styles.contendor3}>
    <PrefsToggle />
    <button
      className={styles.smallButton3}
      style={showExportView
        ? { color: 'var(--text-ink)', background: 'var(--brand-grad)', borderColor: 'transparent' }
        : { color: 'var(--brand-1)', borderColor: 'var(--stroke-brand)' }}
      onClick={toggleExportView}
    >
      <Eye /> {showExportView ? 'Ver diseño' : 'Vista export'}
    </button>
    {user?.guest && (
      <button
        className={styles.smallButton3}
        style={{ color: 'var(--brand-1)', borderColor: 'var(--stroke-brand)' }}
        onClick={() => setOpen(true)}
      >
        <LogIn /> {t("common.login")}
      </button>
    )}
    <button
      className={styles.smallButton3}
      onClick={() => {
      refreshProjects();
      refreshSaved();
      setViewProjectId(null);
      setProjectsModalOpen(true);
    }}
    >
  <FolderKanban /> {t("editor.myProjects")}
</button>
  <button className={styles.smallButton3} onClick={handleSaveTemplateClick}>
     <Save  /> {t("common.save")}
  </button>

</div>
    </div>



<button
  type="button"
  className={styles.smallButton2reset}
  onClick={resetSwitch}
  title={t("editor.resetTitle")}
>
  <img src={reloadIcon} alt="reload template"  className={styles.imagenR}/>
 
</button>


<button
  className={styles.smallButton2reset}
  style={{ left: 'auto', right: 16, color: 'var(--brand-2)', borderColor: 'var(--stroke-brand)' }}
  onClick={handleDownloadCurrentTemplate}
>
  {t("common.exportPng")}
</button>



<Modal
 title={
    viewProjectId
      ? `${projects.find(p => p._id === viewProjectId)?.name || ''}`
      : t("modal.projects")
  }
  isOpen={isProjectsModalOpen}
  onClose={() => { setProjectsModalOpen(false); setViewProjectId(null); }}
  width={860}
  variant={modalVariant}
>
  <button
  className={styles.smallButton3}
  onClick={() => {
    if (!selectedProjectId) {
      Swal.fire("Selecciona un proyecto", "", "info");
      return;
    }
    exportProjectZIP(selectedProjectId);
  }}
>
  {t("common.exportZip")}
</button>

  {/* 👇 SOLO mostramos selección/creación de proyectos si NO estamos dentro de uno */}
{!viewProjectId && (
  <>
    {/* Lista de proyectos con radio + renombrar + eliminar */}
    <div
      style={{
        maxHeight: 260,
        overflow: 'auto',
        border: '1px solid rgba(0,0,0,.1)',
        borderRadius: 8,
        padding: 8
      }}
    >
      {projects.length === 0 ? (
        <div style={{ fontSize: 13, opacity: .7 }}>{t("modal.noProjects")}</div>
      ) : projects.map(p => (
        <label
          key={p._id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 4px',
            cursor: 'pointer'
          }}
        >
          <input
            type="radio"
            name="proj"
            checked={selectedProjectId === p._id}
            onChange={() => {
              setSelectedProjectId(p._id);
              setSelectedProjectName(p.name);
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ fontSize: 12, opacity: .6 }}>
              {new Date(p.createdAt).toLocaleString()}
            </div>
          </div>

  <button
  className={styles.smallButton2}
  onClick={async (e) => {
    e.preventDefault();

    const { value: newName } = await Swal.fire({
      title: "Renombrar proyecto",
      input: "text",
      inputLabel: "Nuevo nombre",
      inputValue: p.name,
      inputPlaceholder: "Nombre del proyecto",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || !value.trim()) return "Debes escribir un nombre";
        return null;
      },
    });

    if (!newName || !newName.trim()) return;

    try {
      await apiRenameProject(p._id, newName.trim());

      if (selectedProjectId === p._id) {
        setSelectedProjectName(newName.trim());
      }

      await refreshProjects();

      Swal.fire({
        icon: "success",
        title: "Proyecto renombrado",
        text: "El nombre se actualizó correctamente.",
        timer: 1800,
        showConfirmButton: false
      });

    } catch (err) {
      console.error("Error renombrando proyecto:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo renombrar el proyecto.",
      });
    }
  }}
>
  {t("common.rename")}
</button>


<button
  className={styles.smallButton2}
  onClick={async (e) => {
    e.preventDefault();

    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará el proyecto y TODAS sus plantillas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#999",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!isConfirmed) return;

    try {
      await apiDeleteProject(p._id);

      if (selectedProjectId === p._id) {
        setSelectedProjectId(null);
        setSelectedProjectName("");
      }

      if (currentProjectBadge.id === p._id) {
        setCurrentRecordId(null);
        setCurrentProjectBadge({ id: null, name: "", place: "" });
        resetSwitch();
      }

      await refreshProjects();

      Swal.fire({
        icon: "success",
        title: "Proyecto eliminado",
        text: "El proyecto y sus plantillas han sido eliminados.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error eliminando proyecto:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo eliminar el proyecto",
      });
    }
  }}
  style={{ borderColor: "#ef4444", color: "#ef4444" }}
>
  {t("common.delete")}
</button>


        </label>
      ))}
    </div>

  
<div style={{ display: 'grid', gap: 8, marginTop: 8, marginBottom: 18 }}>
  <div style={{ fontSize: 14, opacity: .8 }}>{t("modal.newProject")}</div>

  <div style={{ display: 'flex', gap: 8 }}>
    <input
      type="text"
      placeholder={t("modal.newProjectPlaceholder")}
      value={newProjectName}
      onChange={(e) => setNewProjectName(e.target.value)}
      style={{
        flex: 1,
        padding: '11px 14px',
        borderRadius: 12,
        border: '1px solid var(--stroke)',
        background: 'var(--glass)',
        color: 'var(--text)',
        fontSize: 15,
        outline: 'none',
      }}
    />

  <button
  className={styles.smallButton}
  onClick={async () => {
    const nombreLimpio = newProjectName.trim();

    if (!nombreLimpio) {
      Swal.fire({
        title: 'Campo vacío',
        text: 'Escribe un nombre de proyecto.',
        icon: 'warning',
        confirmButtonText: 'OK',
        background: '#ffffffff',
        color: '#111111ff',
        confirmButtonColor: '#0fa2da',
      });
      return;
    }

    // Crear proyecto requiere sesión real
    if (!requireLogin()) return;

    try {
      const nuevoProyecto = await apiCreateProject(nombreLimpio);

      await refreshProjects();

      setSelectedProjectId(nuevoProyecto._id);
      setSelectedProjectName(nuevoProyecto.name);
      setNewProjectName("");

      Swal.fire({
        icon: 'success',
        title: 'Proyecto creado',
        text: 'El proyecto se creó correctamente.',
        timer: 1600,
        showConfirmButton: false,
        background: '#1e293b',
        color: '#fff',
      });

    } catch (err) {
      console.error("Error creando proyecto:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo crear el proyecto.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#0fa2da',
      });
    }
  }}
>
  {t("common.create")}
</button>

    
  </div>
</div>

  </>
)}

  {/* Ahora la cuadrícula de proyectos o del proyecto abierto */}
  {!viewProjectId ? (
    // VISTA GENERAL DE TODOS LOS PROYECTOS
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16
      }}
    >
      {projects.length === 0 && (
        <div style={{ gridColumn: '1 / -1', opacity: .7 }}>
          {t("modal.noProjects")}
        </div>
      )}

 {projects.map((p) => {
  const items = savedList
    .filter(r => r.projectId === p._id) // ojo aquí
    .sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));

  const last = items[0];
  const hero = last?.previewThumb || last?.preview || null;

  return (
    
    <button
      key={p._id}
      onClick={async () => {
  setViewProjectId(p._id);

  // 🔥 cargar automáticamente LA PRIMERA plantilla real del proyecto
  const items = savedList
    .filter(r => r.projectId === p._id)
    .sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt));

  if (items.length > 0) {
    const first = items[0];
    const full = await fetchPlantillaById(first.id);

    applySnapshot(full.snapshot);
    setCurrentRecordId(full._id);
    setCurrentProjectBadge({
      id: full.projectId,
      name: first.projectName,
      place: full.placeName
    });

    setSelectedProjectId(full.projectId);
    setSelectedProjectName(first.projectName);
    setLabelInput(full.placeName);
  }
}}

      style={{
        textAlign: 'left',
        border: '1px solid var(--stroke)',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--glass-2)',
        cursor: 'pointer',
        padding: 0,
        boxShadow: 'var(--shadow-md)'
      }}
    >

      <div style={{
        height: 220,
        background: 'var(--bg-0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10
      }}>
        {hero ? (
          <img
            src={hero}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              display: 'block',
              objectFit: 'contain'
            }}
            draggable={false}
          />
        ) : (
          <div style={{ opacity: .6, fontSize: 13 }}>{t("modal.noImage")}</div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
        <div style={{ fontSize: 12, opacity: .7 }}>
          {items.length} {t("modal.templatesCount")}
        </div>
        <div style={{ fontSize: 12, opacity: .55, marginTop: 4 }}>
          {t("modal.createdAt")} {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
        </div>
      </div>
    </button>
  );
})}

    </div>
  ) : (
    // DETALLE DENTRO DE UN PROYECTO
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16
      }}
    >
      {/* barra superior con Volver y contador */}
      <div
        style={{
          gridColumn: '1 / -1',
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <button
          className={styles.smallButton2}
          onClick={() => setViewProjectId(null)}
        >
          ← {t("common.back")}
        </button>
        <div style={{ fontSize: 12, opacity: .7 }}>
          {(savedList.filter(r => r.projectId === viewProjectId)).length} elemento(s)
        </div>
      </div>

      {savedList
        .filter(r => r.projectId === viewProjectId)
        .sort((a,b) => new Date(b.savedAt) - new Date(a.savedAt))
        .map((r) => {
          const hero = r.previewThumb || r.preview || null;
          return (
           <div
  key={r.id}
  onClick={async () => {
    // ⭐ SOLO PREVIEW
    const full = await fetchPlantillaById(r.id);

    applySnapshot(full.snapshot);   // muestra en el canvas
    setCurrentProjectBadge({
      id: full.projectId,
      name: r.projectName,
      place: full.placeName
    });

    setSelectedProjectId(full.projectId);
    setSelectedProjectName(r.projectName);
    setLabelInput(full.placeName);
  }}
  style={{
    border: '1px solid var(--stroke)',
    borderRadius: 16,
    overflow: 'hidden',
    background: 'var(--glass-2)',
    boxShadow: 'var(--shadow-md)',
    cursor: 'pointer'
  }}
>
  <div style={{
    height: 290,
    background: 'var(--bg-0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottom: '1px solid rgba(0,0,0,.08)'
  }}>
    {hero ? (
      <img
        src={hero}
        alt=""
        style={{
          maxWidth: '110%',
          maxHeight: '110%',
          objectFit: 'contain'
        }}
        draggable={false}
      />
    ) : (
      <div style={{ opacity: .6, fontSize: 13 }}>{t("modal.noImage")}</div>
    )}
  </div>

  <div style={{ padding: 12 }}>
    <div style={{ fontWeight: 600, fontSize: 15 }}>{r.placeName}</div>
    <div style={{ fontSize: 12, opacity: .7 }}>{new Date(r.savedAt).toLocaleString()}</div>

    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
      
      {/* ⭐ BOTÓN PARA CARGAR COMPLETO (NO PREVIEW) */}
      <button
        className={styles.smallButton2}
        onClick={async (e) => {
          e.stopPropagation(); // 🔥 evita que el click del card haga preview

          const full = await fetchPlantillaById(r.id);

          applySnapshot(full.snapshot);
          setCurrentRecordId(full._id);
          setCurrentProjectBadge({
            id: full.projectId,
            name: r.projectName,
            place: full.placeName
          });

          setSelectedProjectId(full.projectId);
          setSelectedProjectName(r.projectName);
          setLabelInput(full.placeName);

          // Salir al canvas
          setProjectsModalOpen(false);
          setViewProjectId(null);
        }}
      >
        {t("common.load")}
      </button>

      {/* Eliminar */}
<button
  className={styles.smallButton2}
  onClick={async () => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esto eliminará esta plantilla del proyecto.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#999",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });

    if (!isConfirmed) return;

    try {
      await apiDeletePlantilla(r.id);

      if (currentRecordId === r.id) {
        setCurrentRecordId(null);
        setCurrentProjectBadge({ id: null, name: "", place: "" });
        resetSwitch(); // opcional: limpiar canvas
      }

      await refreshProjects();

      Swal.fire({
        icon: "success",
        title: "Plantilla eliminada",
        text: "Se ha eliminado correctamente.",
        timer: 1800,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error eliminando plantilla:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo eliminar la plantilla.",
      });
    }
  }}
  style={{
    borderColor: '#ef4444',
    color: '#ef4444'
  }}
>
  {t("common.delete")}
</button>
    </div>
  </div>
</div>

          );
        })}
    </div>
  )}
</Modal>




<Modal
  title={t("modal.projectName")}
  isOpen={isProjectNameModalOpen}
  onClose={() => setProjectNameModalOpen(false)}
  width={520}
  variant={modalVariant}
>
  <div style={{ display: 'grid', gap: 12, fontSize: 15, lineHeight: 1.5 }}>
    <p>Agrega el nombre del proyecto donde deseas guardar esta plantilla.</p>
<div style={{ display: 'grid', gap: 8 }}>

</div>

    <input
      type="text"
      placeholder="Ejemplo: Hotel Mar Azul, Casa Medellín..."
      value={projectName}
      onChange={(e) => setProjectName(e.target.value)}
      style={{
        padding: '11px 14px',
        borderRadius: 12,
        border: '1px solid var(--stroke)',
        background: 'var(--glass)',
        color: 'var(--text)',
        fontSize: 15,
        width: '100%',
        outline: 'none',
      }}
    />

    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
      <button className={styles.smallButton2} onClick={() => setProjectNameModalOpen(false)}>
        {t("common.cancel")}
      </button>
      <button
        className={styles.smallButton}
        onClick={() => {
          if (!projectName.trim()) return alert('Por favor escribe un nombre de proyecto');
          setProjectNameModalOpen(false);
          setSaveAskOpen(true); // pasa al siguiente paso
        }}
      >
        {t("common.continue")}
      </button>
    </div>
  </div>
</Modal>

<Modal
  title={t("modal.saveTemplate")}
  isOpen={isSelectProjectOpen}
  onClose={() => setSelectProjectOpen(false)}
  width={600}
  variant={modalVariant}
>
  <div style={{ display: 'grid', gap: 16, color: 'var(--text)' }}>
    {/* Paso 1: elegir proyecto existente */}
    
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        {t("modal.selectProject")}
      </div>

      <div
        style={{
          maxHeight: 200,
          overflow: 'auto',
          border: '1px solid var(--stroke)',
          borderRadius: 12,
          padding: 8,
          background: 'var(--bg-0)'
        }}
      >
        {projects.length === 0 ? (
          <div style={{ fontSize: 13, opacity: .7 }}>{t("modal.noProjects")}</div>
        ) : projects.map(p => (
          <label
            key={p._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 4px',
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              name="proj"
              checked={selectedProjectId === p._id}
              onChange={() => { 
                setSelectedProjectId(p._id);
                setSelectedProjectName(p.name);
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 12, opacity: .6 }}>
                {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Renombrar */}
      

      
          </label>
        ))}
      </div>
    </div>


    {/* Paso 2: nombre del lugar */}
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>
        {t("modal.whereInProject")} “{selectedProjectName || '—'}”?
      </div>
      <input
        type="text"
        placeholder={t("modal.placePlaceholder")}
        value={labelInput}
        onChange={(e) => setLabelInput(e.target.value)}
        style={{
          padding: '11px 14px',
          borderRadius: 12,
          border: '1px solid var(--stroke)',
          background: 'var(--glass)',
          color: 'var(--text)',
          fontSize: 15,
          width: '100%',
          outline: 'none',
        }}
      />
    </div>

    {/* Acciones */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 10
      }}
    >
      <button
        className={styles.smallButton2}
        onClick={() => setSelectProjectOpen(false)}
      >
        {t("common.cancel")}
      </button>
      <button
        className={styles.smallButton}
        onClick={saveTemplateNow}
      >
        {t("common.save")}
      </button>
    </div>
  </div>
</Modal>



      <div className={styles.logo}>
        <img src={logoDiseven} className={styles.imgLogo}/>
      </div>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>

<h4 className={styles.sectionTitle}>Tipo de interruptor</h4>
<div className={styles.toggleRow}>
  {SWITCH_TYPES.map((st) => (
    <button
      key={st.id}
      type="button"
      className={`${styles.smallButton} ${styles.switchTypeToggle} ${switchType === st.id ? styles.active : ''}`}
      onClick={() => { if (st.id !== switchType) changeSwitchType(st.id); }}
      aria-pressed={switchType === st.id}
      title={st.label}
      style={{ fontWeight: 700 }}
    >{st.label}</button>
  ))}
</div>

<hr />

<h4 className={styles.sectionTitle}>{t("editor.plateType")}</h4>
<div className={styles.toggleRow}>
  {/* Sencilla */}
  <button
    type="button"
    className={`${styles.smallButton} ${styles.plateToggle} ${plateMode==='sencilla' ? styles.active : ''}`}
    onClick={() => { setPlateMode('sencilla'); setActiveArea('single'); resetAll(); }}
    aria-pressed={plateMode==='sencilla'}
    title="Suiches (sencilla)"
  > 
    <img src="/assets/suichesSencillo/suiche2.png" alt="" className={styles.plateIcon} draggable={false} />
  </button>

  {/* Doble */}
  <button
    type="button"
    className={`${styles.smallButton} ${styles.plateToggle} ${plateMode==='doble' ? styles.active : ''}`}
    onClick={() => { setPlateMode('doble'); setActiveArea('left'); resetAll(); }}
    aria-pressed={plateMode==='doble'}
    title="Carcasa doble"
  >
    <img src="/assets/carcasas doble/carcasa2.png" alt="" className={styles.plateIcon} draggable={false} />
   
    {/* <span className={styles.btnLabel}>Doble</span> */}
  </button>
</div>

<hr />

<h4 className={styles.sectionTitle}>Orientación</h4>
<div className={styles.toggleRow}>
  <button
    type="button"
    className={`${styles.smallButton} ${styles.plateToggle} ${orientation==='vertical' ? styles.active : ''}`}
    onClick={() => setOrientation('vertical')}
    aria-pressed={orientation==='vertical'}
    title="Vertical"
    style={{ fontWeight: 700 }}
  >Vertical</button>
  <button
    type="button"
    className={`${styles.smallButton} ${styles.plateToggle} ${orientation==='horizontal' ? styles.active : ''}`}
    onClick={() => { setPlateMode('sencilla'); setActiveArea('single'); setOrientation('horizontal'); }}
    aria-pressed={orientation==='horizontal'}
    title="Horizontal"
    style={{ fontWeight: 700 }}
  >Horizontal</button>
</div>

<hr />

      <h4 className={styles.sectionTitle}>{t("editor.suicheStyle")}</h4>
<button
  type="button"
  className={styles.previewButton2}
  onClick={() => setSuicheModalOpen(true)}
  aria-label={t("modal.chooseSuiche")}
  title={t("modal.chooseSuiche")}
>
  <span className={styles.suichePreviewInner}>
    {/* Mini preview del suiche actual */}
    <img
      src={selectedSuiche}
      alt={t("editor.suiche")}
      className={styles.thumbMini}
      draggable={false}
    />
    {/* Nombre al lado de la miniatura */}
    <span className={styles.previewCaption}>
      {(Object.values(isLegrand(switchType) ? LEGRAND_SUICHES : dataSuiche).find(s => s.image === selectedSuiche)?.label) || t("editor.suiche")}
    </span>
  </span>
  <span className={styles.previewChevron} aria-hidden>›</span>
</button>

    {/* Toolbar de colores: swatches circulares */}
                <div className={styles.canvasToolbar}>
                    <span className={styles.toolbarLabel}>{t("editor.bgColor")}</span>
                  <div className={styles.toolbarGroup}>
                    <div className={styles.swatchesRow}>
                      {[
                        { hex: '#FFFFFF', label: t('editor.white') },
                        { hex: '#000000', label: t('editor.black') },
                      ].map(({ hex, label }) => {
                        const isActive = selectedColor === hex;
                        return (
                          <div key={hex} className={styles.swatchItem}>
                            <button
                            onClick={() => { setSelectedColor(hex) }}
                              className={`${styles.swatchCircle} ${isActive ? styles.swatchCircleActive : ''}`}
                              style={{ backgroundColor: hex }}
                              aria-label={`Color ${label}`}
                              title={label}
                            />
                            <span className={styles.swatchText}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
<h4 className={styles.sectionTitle}>{t("editor.template")}</h4>
<button
  className={styles.previewButton}
  onClick={() => setPlantillasModalOpen(true)}
  aria-label="Elegir plantilla"
  title="Elegir plantilla"
>
  <div className={styles.thumbStrip}>
    {(isLegrand(switchType) ? LEGRAND_PLANTILLA_IDS.slice(1, 4) : PREVIEW_PLANTILLAS).map((id) => (
      isLegrand(switchType) ? (
        <LegrandThumb
          key={id}
          plantillaId={id}
          className={`${styles.thumbMini} ${styles.thumbMiniPlantilla} ${esFondoNegro ? styles.thumbMiniPlantillaDark : ''}`}
        />
      ) : (
        <img
          key={id}
          src={getPlantillaPath(id)}
          alt={`Plantilla ${id}`}
          className={`${styles.thumbMini} ${styles.thumbMiniPlantilla} ${esFondoNegro ? styles.thumbMiniPlantillaDark : ''}`}
          draggable={false}
        />
      )
    ))}
  </div>
  <span className={styles.previewChevron} aria-hidden>›</span>
</button>



   {/* REPLACE: sección Iconos */}
<h4 className={styles.sectionTitle}>{t("editor.icons")}</h4>
<button
  className={styles.previewButton}
  onClick={() => setIconsModalOpen(true)}
  aria-label="Elegir iconos"
  title="Elegir iconos"
>
  <div className={styles.thumbStrip}>
    {PREVIEW_ICONOS.map((num) => (
      <img
        key={num}
        src={getIconPath(num)}
        alt={iconLabel(num)}
        title={iconLabel(num)}
        className={styles.thumbMiniIcon}
        draggable={false}
      />
    ))}
  </div> 
</button>
<div>
  
{selectedIconId && (
  <div style={{ marginTop: 12, display: 'flex', gap: 7, flexDirection :"column"}}>
    <span style={{ fontSize: 15, opacity: 0.8 }}>{t("editor.iconText")}</span>
<div> <input
  ref={labelInputRef}
  value={labelInput}
  onChange={(e) => setLabelInput(e.target.value)}
  onKeyDown={(e) => { if (e.key === 'Enter') saveLabel(); }}
  placeholder={t("editor.iconTextPlaceholder")}
  style={{
    padding: '9px 12px',
    fontSize: 15,
    width: 150,
    borderRadius: 10,
    border: '1px solid var(--stroke)',
    background: 'var(--glass)',
    color: 'var(--text)',
    outline: 'none',
  }} />

    <button className={styles.smallButton2} onClick={saveLabel}>{t("common.save")}</button></div>
  </div>
)}
</div>



         
        <hr />
        <h4 className={styles.sectionTitle}>Separación</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SEPARATION_STYLES.map((st) => {
            const active = separationStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSeparationStyle(st.id)}
                title={st.label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: 6, borderRadius: 10, cursor: 'pointer',
                  border: active ? '2px solid var(--brand-1)' : '1px solid var(--stroke)',
                  background: active ? 'var(--stroke-brand, rgba(14,165,233,.10))' : 'var(--glass)',
                }}
              >
                <SepThumb styleId={st.id} />
                <span style={{ fontSize: 11, color: 'var(--text)' }}>{st.label}</span>
              </button>
            );
          })}
        </div>

        <hr />
        <h4 className={styles.sectionTitle}>Fuente</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FONT_OPTIONS.map((fo) => {
            const active = labelFont === fo.id;
            return (
              <button
                key={fo.id}
                type="button"
                onClick={() => setLabelFont(fo.id)}
                title={fo.label}
                style={{
                  padding: '6px 12px', borderRadius: 10, cursor: 'pointer',
                  border: active ? '2px solid var(--brand-1)' : '1px solid var(--stroke)',
                  background: active ? 'var(--stroke-brand, rgba(14,165,233,.10))' : 'var(--glass)',
                  color: 'var(--text)',
                  fontFamily: fo.family,
                  fontStyle: fo.italic ? 'italic' : 'normal',
                  fontWeight: fo.weight,
                  fontSize: 15,
                }}
              >
                {fo.label}
              </button>
            );
          })}
        </div>

        </aside>

        <main className={styles.mainArea}>
           {/* Botón Reset Iconos */}

          <div className={styles.workbench}>
            
            <div className={styles.canvasPane}>
              {isLoadingImage && (
<div style={{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 240,
  height: 120,
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: 12,
  zIndex: 50,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontSize: 16,
  fontWeight: 500,
  color: '#1f2937', // tono gris oscuro más moderno
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
}}>
  <div className={styles.spinner} />
  <span style={{ marginTop: 10 }}>Cargando imagen...</span>
</div>

)}

{showExportView && exportPreview && (
  <div style={{
    position: 'absolute',
    inset: 0,
    zIndex: 45,
    background: '#ffffff',
    borderRadius: 'var(--r-xl)',
    display: 'grid',
    placeItems: 'center',
    padding: 18,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-lg)',
  }}>
    <img
      src={exportPreview}
      alt="Vista de exportación"
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
    />
  </div>
)}
             <div ref={canvasHostRef} className={styles.canvasCard}>
    <Stage
      key={forceRenderKey}
    ref={stageRef}
    width={hostSize.w}
    height={hostSize.h}
    scaleX={scale}
    scaleY={scale}
    x={offsetX}
    y={offsetY}
    style={{ width: hostSize.w, height: hostSize.h, touchAction: 'none' }} // <- clave en iOS
    onPointerDown={handleStagePointerDown}>

    <Layer>
    {/* Carcasa */}
    {plateMode === 'sencilla' && carcasaSingle && (
      <>
      
    {showCarcasa && carcasaSingle && (
  isLegrand(switchType) ? (
    // Legrand: el marco se escala para que su ventana calce con la placa.
    <KonvaImage image={carcasaSingle} {...legrandFrameRect(getLegrandSuiche(selectedSuiche).win, LEGRAND_PLATE)} className={styles.carcasa} />
  ) : isHorizontal ? (
    <KonvaImage
      image={carcasaSingle}
      x={592.5} y={432.5} width={785} height={785}
      offsetX={392.5} offsetY={392.5} rotation={90}
      className={styles.carcasa}
    />
  ) : (
    <KonvaImage
      image={carcasaSingle}
      x={200}
      y={40}
      width={785}
      height={785}
      className={styles.carcasa}
    />
  )
)}

  {showFondo && (
  <Rect
    x={plateSingle.x}
    y={plateSingle.y}
    width={plateSingle.w}
    height={plateSingle.h}
    fill={selectedColor}
    cornerRadius={isLegrand(switchType) ? 0 : 15}
  />
)}


      {plantillaSingle && separationStyle === 'lineas' && !isLegrand(switchType) && (
  isHorizontal ? (
    // Horizontal: la imagen de líneas se rota 90° alrededor del centro de la placa.
    <KonvaImage
      image={plantillaSingle}
      x={592.5} y={430.5}
      width={SINGLE_PLATE.w} height={SINGLE_PLATE.h}
      offsetX={SINGLE_PLATE.w / 2} offsetY={SINGLE_PLATE.h / 2} rotation={90}
      listening={false}
    />
  ) : isExporting ? (
    // Durante la exportación la dibujo a tamaño completo del recorte
    <KonvaImage
      image={plantillaSingle}
      x={200} y={40}
      width={785} height={785}
      listening={false}
    />
  ) : (
    // En uso normal, va sobre el rectángulo de la placa
    <KonvaImage
      image={plantillaSingle}
      x={SINGLE_PLATE.x} y={SINGLE_PLATE.y}
      width={SINGLE_PLATE.w} height={SINGLE_PLATE.h}
      listening={false}
    />
  )
)}
{separationStyle === 'lineas' && isLegrand(switchType) && (
  <LegrandLayer slots={slotsSingle} plate={plateSingle} color={esFondoNegro ? '#ffffff' : '#111111'} />
)}
{separationStyle !== 'lineas' && (
  <SeparationLayer slots={slotsSingle} styleId={separationStyle} plate={plateSingle} color={esFondoNegro ? '#ffffff' : '#111111'} />
)}

        {/* Slots + selección de slot (ocultos cuando exportas) */}
     {!isExporting && slotsSingle.map((s, i) => { const c = contentRect(s, plateSingle, switchType); return (
        <Rect
          key={`single-${i}`}
          x={c.x}
          y={c.y}
          width={c.w}
          height={c.h}
          cornerRadius={12}
          listening
          onClick={(e) => { e.cancelBubble = true; setActiveArea('single'); setActiveSlotIdx(i); }}
          onTap={(e) => { e.cancelBubble = true; setActiveArea('single'); setActiveSlotIdx(i); }}
          stroke={activeArea === 'single' && i === activeSlotIdx ? '#0ea5e9' : undefined}
          strokeWidth={activeArea === 'single' && i === activeSlotIdx ? 2 : 0}
          shadowBlur={activeArea === 'single' && i === activeSlotIdx ? 6 : 0}
        />
      );})}


        {iconsSingle.map(icon => (
          EDITOR_EXPORT_STYLE
            ? <ExportStyleIcon key={icon.id} icon={icon} slot={slotsSingle[icon.slotIdx]} plate={plateSingle} isWhite={esFondoNegro} fontOpt={getFontOption(labelFont)} switchType={switchType} onSelect={() => handleSelectIcon(icon.id)} />
            : <IconWithLabel key={icon.id} {...icon} isWhite={esFondoNegro} onSelect={() => handleSelectIcon(icon.id)} />
        ))}
      </>
    )}

    {plateMode === 'doble' && carcasaDoble && (
      <>
        <KonvaImage image={carcasaDoble} x={200} y={40} width={785} height={785} />

        {/* IZQUIERDA */}
        <Rect x={DOUBLE_PLATE_LEFT.x} y={DOUBLE_PLATE_LEFT.y} width={DOUBLE_PLATE_LEFT.w} height={DOUBLE_PLATE_LEFT.h} fill={selectedColor} cornerRadius={15}/>
{plantillaLeft && separationStyle === 'lineas' && !isLegrand(switchType) && (          <KonvaImage image={plantillaLeft} x={DOUBLE_PLATE_LEFT.x} y={DOUBLE_PLATE_LEFT.y} width={DOUBLE_PLATE_LEFT.w} height={DOUBLE_PLATE_LEFT.h}/>
          )}
          {separationStyle === 'lineas' && isLegrand(switchType) && (
            <LegrandLayer slots={slotsLeft} plate={DOUBLE_PLATE_LEFT} color={esFondoNegro ? '#ffffff' : '#111111'} />
          )}
          {separationStyle !== 'lineas' && (
            <SeparationLayer slots={slotsLeft} styleId={separationStyle} plate={DOUBLE_PLATE_LEFT} color={esFondoNegro ? '#ffffff' : '#111111'} />
          )}
          { slotsLeft.map((s, i) => { const c = contentRect(s, DOUBLE_PLATE_LEFT, switchType); return (
            <Rect
              key={`left-${i}`}
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              cornerRadius={12}
              listening
              onClick={(e) => { e.cancelBubble = true; setActiveArea('left'); setActiveSlotIdx(i); }}
              onTap={(e) => { e.cancelBubble = true; setActiveArea('left'); setActiveSlotIdx(i); }}
              stroke={activeArea === 'left' && i === activeSlotIdx ? '#0ea5e9' : undefined}
              strokeWidth={activeArea === 'left' && i === activeSlotIdx ? 2 : 0}
              shadowBlur={activeArea === 'left' && i === activeSlotIdx ? 6 : 0}
            />
          );})}
        {iconsLeft.map(icon => (
          EDITOR_EXPORT_STYLE
            ? <ExportStyleIcon key={icon.id} icon={icon} slot={slotsLeft[icon.slotIdx]} plate={DOUBLE_PLATE_LEFT} isWhite={esFondoNegro} fontOpt={getFontOption(labelFont)} switchType={switchType} onSelect={() => handleSelectIcon(icon.id)} />
            : <IconWithLabel key={icon.id} {...icon} isWhite={esFondoNegro} onSelect={() => handleSelectIcon(icon.id)} />
        ))}

        {/* DERECHA */}
        <Rect x={DOUBLE_PLATE_RIGHT.x} y={DOUBLE_PLATE_RIGHT.y} width={DOUBLE_PLATE_RIGHT.w} height={DOUBLE_PLATE_RIGHT.h} fill={selectedColor} cornerRadius={15}/>
      {plantillaRight && separationStyle === 'lineas' && !isLegrand(switchType) && (
          <KonvaImage image={plantillaRight} x={DOUBLE_PLATE_RIGHT.x} y={DOUBLE_PLATE_RIGHT.y} width={DOUBLE_PLATE_RIGHT.w} height={DOUBLE_PLATE_RIGHT.h}/>
        )}
        {separationStyle === 'lineas' && isLegrand(switchType) && (
          <LegrandLayer slots={slotsRight} plate={DOUBLE_PLATE_RIGHT} color={esFondoNegro ? '#ffffff' : '#111111'} />
        )}
        {separationStyle !== 'lineas' && (
          <SeparationLayer slots={slotsRight} styleId={separationStyle} plate={DOUBLE_PLATE_RIGHT} color={esFondoNegro ? '#ffffff' : '#111111'} />
        )}

{ slotsRight.map((s, i) => { const c = contentRect(s, DOUBLE_PLATE_RIGHT, switchType); return (
  <Rect
    key={`right-${i}`}
    x={c.x}
    y={c.y}
    width={c.w}
    height={c.h}
    cornerRadius={12}
    listening
    onClick={(e) => { e.cancelBubble = true; setActiveArea('right'); setActiveSlotIdx(i); }}
    onTap={(e) => { e.cancelBubble = true; setActiveArea('right'); setActiveSlotIdx(i); }}
    stroke={activeArea === 'right' && i === activeSlotIdx ? '#0ea5e9' : undefined}
    strokeWidth={activeArea === 'right' && i === activeSlotIdx ? 2 : 0}
    shadowBlur={activeArea === 'right' && i === activeSlotIdx ? 6 : 0}
  />
);})}
        {iconsRight.map(icon => (
          EDITOR_EXPORT_STYLE
            ? <ExportStyleIcon key={icon.id} icon={icon} slot={slotsRight[icon.slotIdx]} plate={DOUBLE_PLATE_RIGHT} isWhite={esFondoNegro} fontOpt={getFontOption(labelFont)} switchType={switchType} onSelect={() => handleSelectIcon(icon.id)} />
            : <IconWithLabel key={icon.id} {...icon} isWhite={esFondoNegro} onSelect={() => handleSelectIcon(icon.id)} />
        ))}
      </>
    )}
  </Layer>

</Stage>

{editingIconId && (
  <input
    ref={overlayInputRef}
    style={{
      position: 'fixed',
      top: editPos.y,
      left: editPos.x,
      width: editWidth,
      fontSize: 16,               // <- importante en iPad
      padding: '2px 4px',
      border: '1px solid #ccc',
      borderRadius: 4,
      zIndex: 9999,
      outline: 'none',
      background: '#fff'
    }}
    value={editValue}
    onChange={(e) => setEditValue(e.target.value)}
    onBlur={handleSaveEdit}
    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }}
  />
)}




              </div>


            </div>

          </div>
        </main>
      </div>

     <Modal title={t("modal.chooseTemplate")} isOpen={isPlantillasModalOpen} onClose={() => setPlantillasModalOpen(false)}  variant={modalVariant}>


<div className={styles.plantillaGrid}>
  {getPlantillaIds(switchType).map((id) => {
    const src = getPlantillaPath(id);

    // activo según el área/placa actual
    const isActive =
      plateMode === 'sencilla'
        ? selectedPlantillaSingle === id
        : (activeArea === 'left' ? selectedPlantillaLeft === id : selectedPlantillaRight === id);

    return (
      <button
        key={`${id}-${themeKey}`}
        onClick={() => {
          if (plateMode === 'sencilla') setSelectedPlantillaSingle(id);
          else if (activeArea === 'left') setSelectedPlantillaLeft(id);
          else if (activeArea === 'right') setSelectedPlantillaRight(id);
          setPlantillasModalOpen(false);
        }}
        className={`${styles.plantillaBtn} ${isActive ? styles.plantillaBtnActive : ''}`}
        title={`Plantilla ${id}`}
      >
        {isLegrand(switchType) ? (
          <LegrandThumb
            plantillaId={id}
            className={themeKey === 'dark' ? styles.plantillaThumbDark : styles.plantillaThumbLight}
          />
        ) : (
          <img
            src={src}
            alt={`Plantilla ${id}`}
            className={`${
              themeKey === 'dark' ? styles.plantillaThumbDark : styles.plantillaThumbLight
            }`}
          />
        )}
      </button>
    );
  })}
</div>

</Modal>


      
<Modal
  title={t("modal.chooseIcons")}
  isOpen={isIconsModalOpen}
  onClose={() => setIconsModalOpen(false)}
  width={780}
  variant={modalVariant}
>
  {/* Buscador por nombre */}
  <div className={styles.iconSearchRow}>
    <input
      type="search"
      value={iconSearch}
      onChange={(e) => setIconSearch(e.target.value)}
      placeholder="Buscar icono: luz, baño, cortina, tv…"
      className={styles.iconSearchInput}
      style={{
        background: modalVariant === 'dark' ? '#111' : '#fff',
        color: modalVariant === 'dark' ? '#fff' : '#111',
        borderColor: modalVariant === 'dark' ? '#333' : '#ddd',
      }}
      autoComplete="off"
      aria-label="Buscar icono por nombre"
    />
    {iconSearch && (
      <button
        type="button"
        onClick={() => setIconSearch('')}
        className={styles.iconSearchClear}
        aria-label="Limpiar búsqueda"
        title="Limpiar búsqueda"
      >×</button>
    )}
  </div>

  {/* Tabs de categorías */}
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
    {Object.keys(ICON_CATEGORIES).map((cat) => {
      const active = selectedCategory === cat;
      return (
        <button
          key={cat}
          onClick={() => { setSelectedCategory(cat); setIconSearch(''); }}
          className={`${styles.smallButton} ${active ? styles.active : ''}`}
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: active ? '1px solid #0ea5e9' : '1px solid #ddd',
            background: active ? '#e6f6fe' : (modalVariant === 'dark' ? '#111' : '#fff'),
            color: modalVariant === 'dark' ? '#fff' : '#111'
          }}
          title={cat}
        >
          {cat}
        </button>
      );
    })}
  </div>



  {/* Grid de iconos filtrados */}
  <div
    className={`${styles.iconGridSide} ${
      modalVariant === 'dark' ? styles.lightBody : styles.darkBody
    }`} 
   
  >
    {(() => {
      const baseList = selectedCategory === 'Todos'
        ? iconNumbers
        : (ICON_CATEGORIES[selectedCategory] || []);

      const q = iconSearch.trim();
      // Al buscar se ignora la categoría: se busca en TODO el set, que es lo
      // que uno espera al escribir ("¿dónde está el de ducha?").
      const filtered = q
        ? iconNumbers.filter((num) => iconMatches(num, q))
        : baseList;

      if (!filtered.length) {
        return (
          <div style={{ gridColumn: '1 / -1', opacity: 0.7, fontSize: 14 }}>
            {q ? <>Ningún icono coincide con “{q}”.</> : <>Sin iconos en <b>{selectedCategory}</b>.</>}
          </div>
        );
      }

      return filtered.map((num) => {
        const label = iconLabel(num);
        return (
          <button
            key={`${selectedCategory}-${num}`}
            onClick={() => { placeOrReplaceIcon(num, ''); setIconsModalOpen(false); }}
            className={styles.iconoButton}
            title={`${label} (${num})`}
          >
            <img
              src={getIconPath(num)}
              alt={label}
              className={`${themeKey === 'dark' ? styles.iconoMiniaturaDark : styles.iconoMiniaturaLigh}`}
              draggable={false}
            />
            <div className={styles.iconoMiniaturaTexto}>{label}</div>
          </button>
        );
      });
    })()}
  </div>
</Modal>


  <Modal
    title={t("modal.chooseSuiche")}
    isOpen={isSuicheModalOpen}
    onClose={() => setSuicheModalOpen(false)}
    width={780}
    variant={modalVariant}
  >
  <div
    className={`${styles.suicheList} ${
      modalVariant === 'dark' ? styles.lightBody : styles.darkBody
    }`}
 
  >
    {Object.entries(isLegrand(switchType) ? LEGRAND_SUICHES : dataSuiche).map(([key, value], i) => {
      const extraClass = value.cssClass ? styles[value.cssClass] : '';
      const isActive = selectedSuiche === value.image;

      return (
        <div key={key} className={styles.suicheItem}>
          <button
            onClick={() => {
              // Selecciona el suiche
              setSelectedSuiche(value.image);

              if (plateMode === 'doble') {
                setSelectedCarcasaDoble(`/assets/carcasas doble/carcasa${i + 1}.png`);
              }

              setSuicheModalOpen(false);
            }}
            className={`${styles.suicheButton} ${extraClass} ${isActive ? styles.active : ''}`}
            style={!value.cssClass ? { backgroundColor: value.color } : {}}
            title={value.label ?? key}
          />
          {/* Etiqueta debajo del acabado */}
          {value.label && <span className={styles.suicheLabel}>{value.label}</span>}
        </div>
      );
    })}
  </div>
</Modal>

<LoginModal open={open} onClose={closeLogin} />

    </div>
  );
};

export default DesignerCanvas;
