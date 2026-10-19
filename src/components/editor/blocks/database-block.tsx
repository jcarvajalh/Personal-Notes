"use client";

import { createReactBlockSpec } from "@blocknote/react";

import { InlineDatabase } from "@/components/database/database-view";

// Base de datos embebida (DB-001 "inline"): se muestra dentro del documento, no
// como subpágina. El bloque solo guarda el id de la página contenedora de la BD
// (kind=database); el contenido real (propiedades, vistas, filas) se carga del
// servidor por ese id.
export const DatabaseBlock = createReactBlockSpec(
  {
    type: "databaseView",
    propSchema: {
      pageId: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const { pageId } = block.props;
      return (
        <div contentEditable={false} className="my-2">
          {pageId ? (
            <InlineDatabase pageId={pageId} />
          ) : (
            <p className="text-muted-foreground rounded-md border px-3 py-2 text-sm">
              Base de datos sin asignar.
            </p>
          )}
        </div>
      );
    },
  },
);
