"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DocumentUploadDropzone } from "./upload-dropzone";
import { DocumentTable, type DocumentItem } from "./document-table";
import { getUserDocumentsAction } from "@/app/tutor/documents/actions";

interface DocumentsManagerProps {
  initialDocuments: DocumentItem[];
}

export function DocumentsManager({ initialDocuments }: DocumentsManagerProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleRefresh = async () => {
    try {
      const freshDocs = await getUserDocumentsAction();
      if (freshDocs) {
        setDocuments(freshDocs);
      }
    } catch (err) {
      console.warn("Failed to refresh documents dynamically:", err);
    }
    router.refresh();
  };

  const handleDeleted = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Upload & Ingestion Component */}
      <DocumentUploadDropzone onIngestionComplete={handleRefresh} />

      {/* 2. Documents Knowledge Library Table */}
      <DocumentTable
        documents={documents}
        onRefresh={handleRefresh}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

