"use client";
import { useEffect, useState } from "react";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import { canImport, canExport } from "@/lib/auth";

export default function ImportExportDropdown() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
      });
  }, []);

  const role = user?.role as any;
  const allowImport = !!role && (role === "ADMIN" || role === "TECH");
  const allowExport = !!role && (role === "ADMIN" || role === "TECH" || role === "OFFICE");

  if (!allowImport && !allowExport) {
    return null;
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-zinc-700 hover:text-black transition inline-flex items-center gap-1"
        >
          <span>Import/Export</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full mt-2 right-0 bg-white border rounded-xl shadow-lg py-2 min-w-[180px] z-20">
              {allowImport && (
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                >
                  <span>Import</span>
                </button>
              )}
              {allowExport && (
                <button
                  type="button"
                  onClick={() => {
                    setExportModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                >
                  <span>Export</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </>
  );
}

