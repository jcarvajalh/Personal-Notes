"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { recordVisitAction } from "@/server/actions/pages";
import { pageKeys } from "@/hooks/use-pages";

/** Registra una visita a la página (NV-009) al abrirla. */
export function VisitRecorder({ pageId }: { pageId: string }) {
  const qc = useQueryClient();
  useEffect(() => {
    void recordVisitAction({ id: pageId }).then(() => {
      qc.invalidateQueries({ queryKey: pageKeys.recents });
    });
  }, [pageId, qc]);
  return null;
}
