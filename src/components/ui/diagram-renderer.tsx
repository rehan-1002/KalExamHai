"use client";

import React, { useEffect, useState, useId } from "react";
import { interpretDiagramInput } from "@/lib/diagrams/parametric-engine";
import { AlertCircle } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mermaid?: any;
  }
}

// Client-side loader for Mermaid from global fast edge CDN
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadMermaidFromCdn(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.mermaid) return Promise.resolve(window.mermaid);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("mermaid-cdn-script") as HTMLScriptElement | null;
    if (existing) {
      if (window.mermaid) return resolve(window.mermaid);
      existing.addEventListener("load", () => resolve(window.mermaid));
      existing.addEventListener("error", () => reject(new Error("Failed to load vector rendering engine.")));
      return;
    }

    const script = document.createElement("script");
    script.id = "mermaid-cdn-script";
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      if (window.mermaid) {
        resolve(window.mermaid);
      } else {
        reject(new Error("Mermaid loaded but window.mermaid is undefined."));
      }
    };
    script.onerror = () => {
      reject(new Error("Failed to load vector rendering engine."));
    };
    document.head.appendChild(script);
  });
}

export interface DiagramRendererProps {
  code: string;
  type?: "mermaid" | "circuit" | "beam" | "svg" | string;
  caption?: string;
  className?: string;
}

export function DiagramRenderer({
  code,
  type = "mermaid",
  caption,
  className = "",
}: DiagramRendererProps) {
  const reactId = useId();
  const cleanId = `diag_${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    const interpreted = interpretDiagramInput(code, type);

    if (interpreted.mode === "svg" && interpreted.svgContent) {
      setSvgHtml(interpreted.svgContent);
      setLoading(false);
      return;
    }

    if (interpreted.mode === "mermaid" && interpreted.mermaidCode) {
      const codeToRender = interpreted.mermaidCode;
      setLoading(true);

      loadMermaidFromCdn()
        .then((mermaid) => {
          if (!isMounted) return;

          mermaid.initialize({
            startOnLoad: false,
            theme: "neutral",
            securityLevel: "loose",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            flowchart: {
              curve: "basis",
              useMaxWidth: true,
              htmlLabels: true,
            },
            themeVariables: {
              primaryColor: "#f1f5f9",
              primaryTextColor: "#0f172a",
              primaryBorderColor: "#334155",
              lineColor: "#1e293b",
              secondaryColor: "#ffffff",
              tertiaryColor: "#f8fafc",
              fontSize: "12px",
            },
          });

          return mermaid.render(cleanId, codeToRender);
        })
        .then((result) => {
          if (!isMounted) return;
          if (result && result.svg) {
            setSvgHtml(result.svg);
          }
          setLoading(false);
        })
        .catch((err) => {
          if (!isMounted) return;
          console.warn("[DiagramRenderer] Mermaid render error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to parse diagram syntax."
          );
          setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [code, type, cleanId]);

  if (!code || !code.trim()) return null;

  const headerTitle =
    type === "beam"
      ? "Beam Layout"
      : type === "circuit"
      ? "Circuit Diagram"
      : "Flowchart";

  return (
    <div
      className={`my-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] print:rounded-none print:border print:border-slate-300 print:p-2 print:my-1.5 break-inside-avoid print:break-inside-avoid shadow-xs ${className}`}
    >
      {/* Clean Heading Only (No Code Toggle, No Copy Button) */}
      <div className="flex items-center gap-1.5 pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>
        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
          {headerTitle}
        </span>
      </div>

      {/* Crisp Flowchart / Vector Visual */}
      <div className="flex flex-col items-center justify-center">
        {loading && (
          <div className="py-6 text-center text-xs text-slate-400 font-sans animate-pulse print:hidden">
            Rendering diagram...
          </div>
        )}

        {!loading && error && (
          <div className="w-full text-left p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-xs text-amber-900 print:hidden">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Diagram Specification</span>
            </div>
            <p className="text-[11px] text-amber-700">{error}</p>
          </div>
        )}

        {!loading && !error && svgHtml && (
          <div
            className="w-full max-w-full flex justify-center items-center py-1 diagram-svg-container overflow-visible"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        )}
      </div>

      {/* Figure Caption Underneath */}
      {caption && (
        <p className="mt-2 text-center text-xs font-serif italic text-slate-600 dark:text-slate-400 print:text-black print:text-[10px] print:mt-1">
          {caption.startsWith("Figure") || caption.startsWith("Fig.")
            ? caption
            : `Fig. ${caption}`}
        </p>
      )}
    </div>
  );
}
