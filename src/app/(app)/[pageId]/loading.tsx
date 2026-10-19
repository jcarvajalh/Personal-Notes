import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto de carga para la ruta de página. Next lo muestra al instante durante
 * la navegación mientras el Server Component (sesión + consulta) resuelve, de modo
 * que el cambio de página se percibe inmediato en lugar de "colgado".
 */
export default function PageLoading() {
  return (
    <div className="mx-auto w-full max-w-(--content-max-width) px-12 pt-10">
      <Skeleton className="mb-6 size-12 rounded-md" />
      <Skeleton className="mb-8 h-9 w-2/3" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    </div>
  );
}
