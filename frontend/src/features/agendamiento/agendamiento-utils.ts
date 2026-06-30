import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";

/** Recorta un LocalTime serializado ("HH:mm:ss") a "HH:mm". */
export function hhmm(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

/** Fecha YYYY-MM-DD legible: "lun 14 jul". */
export function fechaLegible(fecha: string): string {
  try {
    return format(parseISO(fecha), "EEE d MMM", { locale: es });
  } catch {
    return fecha;
  }
}

/** Fecha YYYY-MM-DD legible larga: "lunes 14 de julio de 2025". */
export function fechaLarga(fecha: string): string {
  try {
    return format(parseISO(fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return fecha;
  }
}

/** Devuelve el lunes de la semana que contiene `base` (formato YYYY-MM-DD). */
export function inicioSemana(base: Date): Date {
  return startOfWeek(base, { weekStartsOn: 1 });
}

export function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Rango [desde, hasta] de la semana del lunes dado. */
export function rangoSemana(lunes: Date): { desde: string; hasta: string } {
  return { desde: toIsoDate(lunes), hasta: toIsoDate(addDays(lunes, 6)) };
}

/** Etiqueta "14 – 20 jul" para una semana. */
export function etiquetaSemana(lunes: Date): string {
  const fin = addDays(lunes, 6);
  return `${format(lunes, "d", { locale: es })} – ${format(fin, "d 'de' MMMM", { locale: es })}`;
}
