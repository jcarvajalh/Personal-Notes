"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

interface PageEditorProps {
  pageId: string;
  initialContent: unknown;
  initialVersion: number;
}

// Carga diferida del editor BlockNote (sin SSR: usa APIs del navegador y es
// pesado; 8.1 pide carga diferida de módulos grandes).
const Editor = dynamic(() => import("@/components/editor/editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="mx-auto mt-4 w-full max-w-(--content-max-width) space-y-3 px-12">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-4/5" />
    </div>
  ),
});

export function PageEditor({ pageId, initialContent, initialVersion }: PageEditorProps) {
  return (
    <Editor
      key={pageId}
      pageId={pageId}
      initialContent={initialContent}
      initialVersion={initialVersion}
    />
  );
}
