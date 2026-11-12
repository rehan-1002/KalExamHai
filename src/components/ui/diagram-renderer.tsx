"use client";

import React, { useEffect, useState, useId } from "react";
import { interpretDiagramInput } from "@/lib/diagrams/parametric-engine";
import { Copy, Check, Code, Eye, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mermaid?: any;
  }
}

// Client-side loader for Mermaid from global fast edge CDN
// Prevents heavy serverless bundle bloat (keeps Vercel function < 2MB instead of 58MB)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadMermaidFromCdn(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.mermaid) return Promise.resolve(window.mermaid);

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("mermaid-cdn-script") as HTMLScriptElement | null;
    if (existing) {
      if (window.mermaid) return resolve(window.mermaid);
      existing.addEventListener("load", () => resolve(window.mermaid));
      existing.addEventListener("error", () => reject(new Error("Failed to load vector rendering engine from CDN.")));
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
      reject(new Error("Failed to load vector rendering engine from CDN."));
    };
    document.head.appendChild(script);
  });
}

export interface DiagramRendererProps {
  code: string;
  type?: "mermaid" | "circuit" | "beam" | "svg" | string;
  caption?: string;
  className?: string;
  allowCopy?: boolean;
}

export function DiagramRenderer({
  code,
  type = "mermaid",
  caption,
  className = "",
  allowCopy = true,
}: DiagramRendererProps) {
  const reactId = useId();
  const cleanId = `diag_${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawCode, setShowRawCode] = useState<boolean>(false);

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
              fontSize: "13px",
            },
          });

          // Render mermaid code to SVG
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!code || !code.trim()) return null;

  return (
    <div
      className={`my-3.5 p-3.5 bg-white border border-slate-200 dark:border-slate-700/60 rounded-[8px] print:rounded-none print:border-slate-300 print:p-2 print:my-1.5 break-inside-avoid print:break-inside-avoid shadow-xs ${className}`}
    >
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-sans print:hidden">
        <span className="font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
          {type === "beam"
            ? "Vector Beam Layout"
            : type === "circuit"
            ? "Circuit Schematic"
            : "Engineering Vector Diagram"}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowRawCode(!showRawCode)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-[6px] border border-slate-200 transition-colors cursor-pointer"
            title="Toggle Raw Code / Diagram"
          >
            {showRawCode ? <Eye className="w-3 h-3" /> : <Code className="w-3 h-3" />}
            <span>{showRawCode ? "Visual" : "Code"}</span>
          </button>

          {allowCopy && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-[6px] border border-slate-200 transition-colors cursor-pointer"
              title="Copy Diagram Code"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Raw Code View Mode */}
      {showRawCode ? (
        <pre className="p-3 bg-slate-900 text-slate-100 text-xs font-mono rounded-[6px] overflow-x-auto text-left leading-relaxed">
          <code>{code.trim()}</code>
        </pre>
      ) : (
        /* Visual Render View Mode */
        <div className="flex flex-col items-center justify-center">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400 font-sans animate-pulse">
              Generating vector graphic...
            </div>
          )}

          {!loading && error && (
            <div className="w-full text-left p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-xs text-amber-900">
              <div className="flex items-center gap-1.5 font-bold mb-1 text-amber-800">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Diagram Specification</span>
              </div>
              <p className="text-[11px] text-amber-700 mb-2">{error}</p>
              <pre className="p-2 bg-white/80 border border-amber-200 rounded-[4px] text-[10px] font-mono overflow-x-auto">
                <code>{code.trim()}</code>
              </pre>
            </div>
          )}

          {!loading && !error && svgHtml && (
            <div
              className="w-full max-w-full overflow-x-auto flex justify-center items-center py-1 diagram-svg-container"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          )}
        </div>
      )}

      {/* Figure Caption Underneath (Overleaf/MU Exam Style) */}
      {caption && (
        <p className="mt-2 text-center text-xs font-serif italic text-slate-700 print:text-black">
          {caption.startsWith("Figure") || caption.startsWith("Fig.")
            ? caption
            : `Fig. ${caption}`}
        </p>
      )}
    </div>
  );
}
