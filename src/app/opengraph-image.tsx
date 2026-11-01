import { ImageResponse } from "next/og";

export const alt = "KalExamHai — AI Exam Prep & Paper Generator for Mumbai University";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9F9F6",
          padding: "60px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            width: "700px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%)",
          }}
        />

        {/* Top Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              color: "#1E40AF",
              fontSize: "18px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Mumbai University NEP-2020
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              color: "#065F46",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "1px",
            }}
          >
            Free Launch Access
          </div>
        </div>

        {/* Main Brand Title */}
        <div
          style={{
            fontSize: "82px",
            fontWeight: 900,
            color: "#1F2937",
            letterSpacing: "-2px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
          }}
        >
          <span>KalExamHai</span>
        </div>

        {/* Subtitle / Punchline */}
        <div
          style={{
            fontSize: "30px",
            fontWeight: 500,
            color: "#4B5563",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.35,
            marginBottom: "44px",
          }}
        >
          Turn your college notes and syllabus into strict university question papers, 3D memory flashcards, and viva prep in 60 seconds.
        </div>

        {/* Feature Pills (No rounded-full, strictly rounded-[8px]) */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#2563EB",
              color: "#FFFFFF",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            IAT 20M &amp; End-Sem 60M
          </div>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#FFFFFF",
              color: "#1F2937",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            3D Holo Flashcards
          </div>
          <div
            style={{
              padding: "12px 24px",
              backgroundColor: "#FFFFFF",
              color: "#1F2937",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            24h Survival Kit
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

