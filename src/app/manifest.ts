import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KalExamHai — Mumbai University AI Exam Prep",
    short_name: "KalExamHai",
    description: "Turn your college notes and syllabus into strict NEP-2020 question papers, 3D flashcards, and viva prep.",
    start_url: "/",
    display: "standalone",
    background_color: "#F9F9F6",
    theme_color: "#2563EB",
    icons: [
      {
        src: "/keh-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

