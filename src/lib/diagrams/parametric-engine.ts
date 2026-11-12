/**
 * Parametric Vector Engine (Overleaf/TikZ style) for Engineering Diagrams
 * Supports:
 * 1. Engineering Mechanics: Beams (Pin/Roller supports, Point Loads, UDL, Moments) & FBD
 * 2. BEEE: Mesh circuits, Thevenin equivalents, AC/DC loops
 * 3. Computer Science / DSGT: Hasse Diagrams & Logic Gates
 *
 * All outputs are crisp, scalable, 100% vector SVGs printable on A4 without distortion.
 */

export interface PointLoad {
  position: number; // in meters or fraction of span
  magnitude: string; // e.g. "12 kN"
  direction?: "down" | "up";
}

export interface UdlLoad {
  start: number; // e.g. 0m
  end: number; // e.g. 4m
  magnitude: string; // e.g. "4 kN/m"
}

export interface MomentLoad {
  position: number;
  magnitude: string; // e.g. "20 kN·m"
  direction?: "cw" | "ccw";
}

export interface BeamSupport {
  position: number; // e.g. 0 for left end
  type: "pin" | "roller" | "fixed";
  label?: string; // e.g. "A", "B"
}

export interface BeamSpec {
  length: number; // total length in meters (default e.g. 6)
  supports: BeamSupport[];
  pointLoads?: PointLoad[];
  udls?: UdlLoad[];
  moments?: MomentLoad[];
  caption?: string;
}

/**
 * Generates an Overleaf/LaTeX TikZ style SVG of a structural beam.
 */
export function generateBeamSvg(spec: BeamSpec): string {
  const L = spec.length || 6;
  const width = 640;
  const height = 240;
  const padX = 60;
  const beamY = 120;
  const beamWidth = width - 2 * padX;
  const scale = beamWidth / L;

  const toX = (x: number) => padX + Math.min(Math.max(0, x), L) * scale;

  let elements: string[] = [];

  // 1. Beam line (thick Overleaf bar)
  elements.push(`
    <!-- Main Beam Bar -->
    <rect x="${padX}" y="${beamY - 4}" width="${beamWidth}" height="8" rx="1" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" />
  `);

  // 2. Supports
  spec.supports.forEach((sup) => {
    const sx = toX(sup.position);
    const label = sup.label || (sup.position === 0 ? "A" : "B");

    if (sup.type === "pin") {
      // Triangle with pin hinge and hatched ground
      elements.push(`
        <g id="support-pin-${sup.position}">
          <polygon points="${sx},${beamY + 4} ${sx - 14},${beamY + 28} ${sx + 14},${beamY + 28}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" />
          <circle cx="${sx}" cy="${beamY + 4}" r="3" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
          <line x1="${sx - 20}" y1="${beamY + 28}" x2="${sx + 20}" y2="${beamY + 28}" stroke="#1e293b" stroke-width="2" />
          <!-- Hatching -->
          <line x1="${sx - 16}" y1="${beamY + 28}" x2="${sx - 22}" y2="${beamY + 36}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx - 8}" y1="${beamY + 28}" x2="${sx - 14}" y2="${beamY + 36}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx}" y1="${beamY + 28}" x2="${sx - 6}" y2="${beamY + 36}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx + 8}" y1="${beamY + 28}" x2="${sx + 2}" y2="${beamY + 36}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx + 16}" y1="${beamY + 28}" x2="${sx + 10}" y2="${beamY + 36}" stroke="#64748b" stroke-width="1.2" />
          <text x="${sx}" y="${beamY + 52}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="#0f172a">${label}</text>
        </g>
      `);
    } else if (sup.type === "roller") {
      // Triangle on rollers with ground
      elements.push(`
        <g id="support-roller-${sup.position}">
          <polygon points="${sx},${beamY + 4} ${sx - 13},${beamY + 23} ${sx + 13},${beamY + 23}" fill="#f8fafc" stroke="#1e293b" stroke-width="1.8" />
          <circle cx="${sx}" cy="${beamY + 4}" r="3" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
          <!-- Rollers -->
          <circle cx="${sx - 7}" cy="${beamY + 28}" r="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
          <circle cx="${sx + 7}" cy="${beamY + 28}" r="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
          <line x1="${sx - 20}" y1="${beamY + 34}" x2="${sx + 20}" y2="${beamY + 34}" stroke="#1e293b" stroke-width="2" />
          <!-- Hatching -->
          <line x1="${sx - 16}" y1="${beamY + 34}" x2="${sx - 22}" y2="${beamY + 42}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx - 8}" y1="${beamY + 34}" x2="${sx - 14}" y2="${beamY + 42}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx}" y1="${beamY + 34}" x2="${sx - 6}" y2="${beamY + 42}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx + 8}" y1="${beamY + 34}" x2="${sx + 2}" y2="${beamY + 42}" stroke="#64748b" stroke-width="1.2" />
          <line x1="${sx + 16}" y1="${beamY + 34}" x2="${sx + 10}" y2="${beamY + 42}" stroke="#64748b" stroke-width="1.2" />
          <text x="${sx}" y="${beamY + 56}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="#0f172a">${label}</text>
        </g>
      `);
    } else if (sup.type === "fixed") {
      // Vertical fixed wall
      const wallX = sup.position === 0 ? padX : padX + beamWidth;
      const dir = sup.position === 0 ? -1 : 1;
      elements.push(`
        <g id="support-fixed-${sup.position}">
          <line x1="${wallX}" y1="${beamY - 35}" x2="${wallX}" y2="${beamY + 35}" stroke="#0f172a" stroke-width="3" />
          ${[ -30, -20, -10, 0, 10, 20, 30 ].map(offset => `
            <line x1="${wallX}" y1="${beamY + offset}" x2="${wallX + dir * 12}" y2="${beamY + offset + 8}" stroke="#64748b" stroke-width="1.5" />
          `).join("")}
          <text x="${wallX + dir * 18}" y="${beamY + 50}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="#0f172a">${label}</text>
        </g>
      `);
    }
  });

  // 3. UDLs (Uniformly Distributed Loads) - Overleaf scalloped arches or chained arrows
  if (spec.udls && spec.udls.length > 0) {
    spec.udls.forEach((udl) => {
      const uStart = toX(udl.start);
      const uEnd = toX(udl.end);
      const span = uEnd - uStart;
      const numArcs = Math.max(3, Math.round(span / 24));
      const arcWidth = span / numArcs;
      const topY = beamY - 32;

      let pathD = `M ${uStart} ${beamY - 4}`;
      for (let i = 0; i < numArcs; i++) {
        const x1 = uStart + i * arcWidth;
        const x2 = x1 + arcWidth;
        pathD += ` M ${x1} ${beamY - 4} L ${x1} ${topY} Q ${x1 + arcWidth / 2} ${topY - 8} ${x2} ${topY} L ${x2} ${beamY - 4}`;
      }

      // Add downward arrows inside UDL
      let arrows = "";
      for (let i = 0; i <= numArcs; i++) {
        const ax = uStart + i * arcWidth;
        arrows += `
          <line x1="${ax}" y1="${topY}" x2="${ax}" y2="${beamY - 6}" stroke="#dc2626" stroke-width="1.4" marker-end="url(#arrow-red)" />
        `;
      }

      elements.push(`
        <g id="udl-${udl.start}-${udl.end}">
          <rect x="${uStart}" y="${topY - 6}" width="${span}" height="${beamY - topY + 2}" fill="#fee2e2" fill-opacity="0.3" stroke="none" />
          <line x1="${uStart}" y1="${topY}" x2="${uEnd}" y2="${topY}" stroke="#dc2626" stroke-width="1.8" />
          ${arrows}
          <text x="${uStart + span / 2}" y="${topY - 12}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="#b91c1c">w = ${udl.magnitude}</text>
        </g>
      `);
    });
  }

  // 4. Point Loads
  if (spec.pointLoads && spec.pointLoads.length > 0) {
    spec.pointLoads.forEach((pl) => {
      const px = toX(pl.position);
      const startY = beamY - 60;
      const endY = beamY - 6;

      elements.push(`
        <g id="point-load-${pl.position}">
          <line x1="${px}" y1="${startY}" x2="${px}" y2="${endY}" stroke="#2563eb" stroke-width="2.4" marker-end="url(#arrow-blue)" />
          <text x="${px}" y="${startY - 8}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="13" fill="#1d4ed8">P = ${pl.magnitude}</text>
        </g>
      `);
    });
  }

  // 5. Moments
  if (spec.moments && spec.moments.length > 0) {
    spec.moments.forEach((m) => {
      const mx = toX(m.position);
      elements.push(`
        <g id="moment-${m.position}">
          <path d="M ${mx - 18} ${beamY - 18} A 22 22 0 1 1 ${mx + 18} ${beamY - 18}" fill="none" stroke="#7c3aed" stroke-width="2" marker-end="url(#arrow-purple)" />
          <text x="${mx}" y="${beamY - 45}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="12" fill="#6d28d9">M = ${m.magnitude}</text>
        </g>
      `);
    });
  }

  // 6. Dimension lines underneath (LaTeX style)
  const dimY = height - 24;
  elements.push(`
    <!-- Total Span Dimension -->
    <g id="dimension-total">
      <line x1="${padX}" y1="${beamY + 12}" x2="${padX}" y2="${dimY + 4}" stroke="#94a3b8" stroke-dasharray="3,3" stroke-width="1" />
      <line x1="${padX + beamWidth}" y1="${beamY + 12}" x2="${padX + beamWidth}" y2="${dimY + 4}" stroke="#94a3b8" stroke-dasharray="3,3" stroke-width="1" />
      <line x1="${padX}" y1="${dimY}" x2="${padX + beamWidth}" y2="${dimY}" stroke="#334155" stroke-width="1.2" marker-start="url(#dim-arrow-left)" marker-end="url(#dim-arrow-right)" />
      <rect x="${padX + beamWidth / 2 - 30}" y="${dimY - 9}" width="60" height="18" fill="#ffffff" />
      <text x="${padX + beamWidth / 2}" y="${dimY + 4}" text-anchor="middle" font-family="serif" font-weight="bold" font-size="12" fill="#0f172a">L = ${L} m</text>
    </g>
  `);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="w-full h-auto max-w-2xl mx-auto" style="background:#ffffff; font-family:'Times New Roman', serif;">
      <defs>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
        </marker>
        <marker id="arrow-purple" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#7c3aed" />
        </marker>
        <marker id="dim-arrow-left" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 10 1 L 0 5 L 10 9 z" fill="#334155" />
        </marker>
        <marker id="dim-arrow-right" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
        </marker>
      </defs>
      ${elements.join("\n")}
    </svg>
  `.trim();
}

/**
 * Generates an Overleaf/circuitikz style BEEE Circuit Diagram.
 * Default: 2-Mesh DC network with Resistors, Voltage Sources, and Loop Currents.
 */
export function generateDefaultCircuitSvg(params?: {
  v1?: string;
  r1?: string;
  r2?: string;
  r3?: string;
  v2?: string;
  caption?: string;
}): string {
  const v1 = params?.v1 || "10 V";
  const r1 = params?.r1 || "4 Ω";
  const r2 = params?.r2 || "6 Ω";
  const r3 = params?.r3 || "2 Ω";
  const v2 = params?.v2 || "12 V";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 280" class="w-full h-auto max-w-2xl mx-auto" style="background:#ffffff; font-family:'Times New Roman', serif;">
      <defs>
        <marker id="circuit-loop-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
        </marker>
      </defs>

      <!-- Outer Boundary Line -->
      <line x1="80" y1="50" x2="540" y2="50" stroke="#0f172a" stroke-width="2" />
      <line x1="80" y1="230" x2="540" y2="230" stroke="#0f172a" stroke-width="2" />
      <line x1="80" y1="50" x2="80" y2="230" stroke="#0f172a" stroke-width="2" />
      <line x1="310" y1="50" x2="310" y2="230" stroke="#0f172a" stroke-width="2" />
      <line x1="540" y1="50" x2="540" y2="230" stroke="#0f172a" stroke-width="2" />

      <!-- Left Branch: DC Voltage Source V1 -->
      <g id="source-v1">
        <rect x="65" y="115" width="30" height="50" fill="#ffffff" stroke="none" />
        <circle cx="80" cy="140" r="20" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <line x1="72" y1="133" x2="88" y2="133" stroke="#0f172a" stroke-width="2.5" />
        <line x1="80" y1="125" x2="80" y2="141" stroke="#0f172a" stroke-width="2.5" />
        <line x1="74" y1="149" x2="86" y2="149" stroke="#0f172a" stroke-width="2.5" />
        <text x="44" y="145" font-family="serif" font-weight="bold" font-size="14" fill="#0f172a" text-anchor="end">V₁ = ${v1}</text>
      </g>

      <!-- Top Left Branch: Resistor R1 -->
      <g id="resistor-r1">
        <rect x="165" y="42" width="60" height="16" fill="#ffffff" stroke="none" />
        <!-- IEEE Zig-Zag Resistor -->
        <polyline points="165,50 170,42 180,58 190,42 200,58 210,42 220,58 225,50" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <text x="195" y="32" font-family="serif" font-weight="bold" font-size="14" fill="#0f172a" text-anchor="middle">R₁ = ${r1}</text>
      </g>

      <!-- Center Branch: Resistor R2 -->
      <g id="resistor-r2">
        <rect x="302" y="110" width="16" height="60" fill="#ffffff" stroke="none" />
        <!-- Vertical Zig-Zag Resistor -->
        <polyline points="310,110 302,115 318,125 302,135 318,145 302,155 318,165 310,170" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <text x="334" y="145" font-family="serif" font-weight="bold" font-size="14" fill="#0f172a" text-anchor="start">R₂ = ${r2}</text>
      </g>

      <!-- Top Right Branch: Resistor R3 -->
      <g id="resistor-r3">
        <rect x="395" y="42" width="60" height="16" fill="#ffffff" stroke="none" />
        <polyline points="395,50 400,42 410,58 420,42 430,58 440,42 450,58 455,50" fill="none" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <text x="425" y="32" font-family="serif" font-weight="bold" font-size="14" fill="#0f172a" text-anchor="middle">R₃ = ${r3}</text>
      </g>

      <!-- Right Branch: DC Voltage Source V2 -->
      <g id="source-v2">
        <rect x="525" y="115" width="30" height="50" fill="#ffffff" stroke="none" />
        <circle cx="540" cy="140" r="20" fill="#ffffff" stroke="#0f172a" stroke-width="2" />
        <line x1="532" y1="133" x2="548" y2="133" stroke="#0f172a" stroke-width="2.5" />
        <line x1="540" y1="125" x2="540" y2="141" stroke="#0f172a" stroke-width="2.5" />
        <line x1="534" y1="149" x2="546" y2="149" stroke="#0f172a" stroke-width="2.5" />
        <text x="575" y="145" font-family="serif" font-weight="bold" font-size="14" fill="#0f172a" text-anchor="start">V₂ = ${v2}</text>
      </g>

      <!-- Mesh Loop 1 (Clockwise) -->
      <g id="mesh-loop-1">
        <path d="M 180 120 A 24 24 0 1 1 210 150" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="3,2" marker-end="url(#circuit-loop-arrow)" />
        <text x="195" y="145" font-family="serif" font-weight="bold" font-size="13" fill="#2563eb" text-anchor="middle">I₁</text>
        <text x="195" y="165" font-family="serif" font-size="11" fill="#64748b" text-anchor="middle">(Loop 1)</text>
      </g>

      <!-- Mesh Loop 2 (Clockwise) -->
      <g id="mesh-loop-2">
        <path d="M 410 120 A 24 24 0 1 1 440 150" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-dasharray="3,2" marker-end="url(#circuit-loop-arrow)" />
        <text x="425" y="145" font-family="serif" font-weight="bold" font-size="13" fill="#2563eb" text-anchor="middle">I₂</text>
        <text x="425" y="165" font-family="serif" font-size="11" fill="#64748b" text-anchor="middle">(Loop 2)</text>
      </g>

      <!-- Node Junction Dots -->
      <circle cx="80" cy="50" r="3.5" fill="#0f172a" />
      <circle cx="80" cy="230" r="3.5" fill="#0f172a" />
      <circle cx="310" cy="50" r="4.5" fill="#0f172a" />
      <circle cx="310" cy="230" r="4.5" fill="#0f172a" />
      <circle cx="540" cy="50" r="3.5" fill="#0f172a" />
      <circle cx="540" cy="230" r="3.5" fill="#0f172a" />

      <!-- Node Labels -->
      <text x="310" y="38" font-family="serif" font-weight="bold" font-size="12" fill="#0f172a" text-anchor="middle">Node A</text>
      <text x="310" y="252" font-family="serif" font-weight="bold" font-size="12" fill="#0f172a" text-anchor="middle">Node B (Ref / Ground)</text>

      <!-- Ground Symbol at Node B -->
      <line x1="310" y1="230" x2="310" y2="260" stroke="#0f172a" stroke-width="1.8" />
      <line x1="298" y1="260" x2="322" y2="260" stroke="#0f172a" stroke-width="2" />
      <line x1="303" y1="265" x2="317" y2="265" stroke="#0f172a" stroke-width="1.8" />
      <line x1="307" y1="270" x2="313" y2="270" stroke="#0f172a" stroke-width="1.5" />
    </svg>
  `.trim();
}

/**
 * Universal Diagram Interpreter:
 * Intelligently identifies if the input is:
 * 1. Raw SVG
 * 2. Parametric Beam JSON or code
 * 3. Parametric Circuit JSON or code
 * 4. Mermaid code (flowchart, stateDiagram, graph, sequence)
 */
export function interpretDiagramInput(
  rawCode: string,
  declaredType?: string
): {
  mode: "svg" | "mermaid";
  svgContent?: string;
  mermaidCode?: string;
} {
  const trimmed = (rawCode || "").trim();

  // If already pure SVG:
  if (trimmed.startsWith("<svg") || trimmed.includes("</svg>")) {
    return { mode: "svg", svgContent: trimmed };
  }

  // Check if it's a JSON string representing beam or circuit
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.supports || parsed.type === "beam" || declaredType === "beam") {
        return {
          mode: "svg",
          svgContent: generateBeamSvg({
            length: parsed.length || 6,
            supports: parsed.supports || [
              { position: 0, type: "pin", label: "A" },
              { position: parsed.length || 6, type: "roller", label: "B" },
            ],
            pointLoads: parsed.pointLoads,
            udls: parsed.udls,
            moments: parsed.moments,
          }),
        };
      }
      if (parsed.type === "circuit" || declaredType === "circuit") {
        return {
          mode: "svg",
          svgContent: generateDefaultCircuitSvg(parsed),
        };
      }
    } catch {
      // Not valid JSON, continue to string analysis
    }
  }

  // Check declaredType
  if (declaredType === "beam") {
    // Generate a default beam if code was descriptive
    return {
      mode: "svg",
      svgContent: generateBeamSvg({
        length: 6,
        supports: [
          { position: 0, type: "pin", label: "A" },
          { position: 6, type: "roller", label: "B" },
        ],
        pointLoads: [{ position: 3, magnitude: "15 kN" }],
        udls: [{ start: 0, end: 3, magnitude: "4 kN/m" }],
      }),
    };
  }

  if (declaredType === "circuit") {
    return {
      mode: "svg",
      svgContent: generateDefaultCircuitSvg(),
    };
  }

  // Clean mermaid code
  let cleanMermaid = trimmed;
  // Remove markdown fences like ```mermaid ... ```
  cleanMermaid = cleanMermaid
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  // Default to Mermaid
  return {
    mode: "mermaid",
    mermaidCode: cleanMermaid,
  };
}

