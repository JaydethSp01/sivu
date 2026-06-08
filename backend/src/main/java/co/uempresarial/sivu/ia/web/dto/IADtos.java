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
}
