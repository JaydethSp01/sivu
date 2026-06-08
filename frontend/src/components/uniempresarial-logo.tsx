import { cn } from "@/lib/utils";

interface Props {
  /** Tamaño en px (cuadrado). Default 36 */
  size?: number;
  /** Si true, no envuelve el logo en una caja con gradiente — solo la imagen */
  bare?: boolean;
  className?: string;
}

/**
 * Logo oficial de Uniempresarial (PNG sin fondo, 5001x5001).
 * Reemplaza el GraduationCap genérico que usábamos antes.
 *
 * Usar {@code bare} cuando el logo va sobre un fondo claro y debe verse
 * con sus colores institucionales sin halo gradient.
 */
export function UniempresarialLogo({ size = 36, bare = false, className }: Props): JSX.Element {
  if (bare) {
    return (
      <img
        src="/brand/uniempresarial-logo.png"
        alt="Uniempresarial"
        width={size}
        height={size}
        className={cn("object-contain", className)}
        loading="eager"
      />
    );
  }
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        aria-hidden
        className="absolute inset-0 -m-1 rounded-xl bg-uni-gradient opacity-20 blur-md"
      />
      <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-border/60 p-1.5">
        <img
          src="/brand/uniempresarial-logo.png"
          alt="Uniempresarial"
          className="h-full w-full object-contain"
          loading="eager"
        />
      </div>
    </div>
  );
}
