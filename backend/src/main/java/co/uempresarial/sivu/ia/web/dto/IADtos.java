package co.uempresarial.sivu.ia.web.dto;

import java.util.List;

public final class IADtos {
    private IADtos() {}

    public record HallazgoIA(String severidad, String seccion, String detalle) {}

    public record FeedbackInformeResponse(
        /** "claude" si vino del LLM real, "heuristico" si fue fallback local. */
        String fuente,
        /** Reporte completo en Markdown. */
        String reporteMarkdown,
        /** Hallazgos estructurados (cuando se logran parsear). */
        List<HallazgoIA> hallazgos,
        /** Mensaje informativo opcional (por qué se usó fallback, etc.). */
        String aviso
    ) {}

    /**
     * Resultado del chequeo de coherencia del Plan de Actividades (GAC-FM-10).
     * NO bloquea: es informativo. Las advertencias reutilizan {@link HallazgoIA}.
     */
    public record CoherenciaPlanResponse(
        /** "claude-code" si vino del sidecar, "local" si fue fallback heurístico. */
        String fuente,
        /** Reporte completo en Markdown. */
        String reporteMarkdown,
        /** Advertencias/sugerencias estructuradas (no bloquean el flujo). */
        List<HallazgoIA> advertencias,
        /** Mensaje informativo opcional. */
        String aviso
    ) {}
}
