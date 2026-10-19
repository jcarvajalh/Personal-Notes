"use client";

interface PageEditorProps {
  pageId: string;
  initialContent: unknown;
  initialVersion: number;
}

/**
 * Editor de la página. En el bloque 1A es un marcador de posición; el editor
 * BlockNote con autoguardado se implementa en el bloque 1B.
 */
export function PageEditor(props: PageEditorProps) {
  void props; // se usará en el bloque 1B (editor BlockNote + autoguardado).
  return (
    <div className="mx-auto mt-4 w-full max-w-(--content-max-width) px-12">
      <p className="text-muted-foreground text-sm">El editor se activará en el bloque 1B.</p>
    </div>
  );
}
