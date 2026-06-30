package co.uempresarial.sivu.calificacion.web.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Desglose trazable de la nota final del proceso de Coformación (BI-10 / RNF-03).
 *
 * Cada corte indica de qué formulario institucional salió su nota, su peso y si
 * está completo. {@code notaFinal} es null cuando falta algún insumo (parcial).
 */
public record CalificacionDesgloseResponse(
    Long convenioId,
    BigDecimal notaCorte1,
    BigDecimal notaCorte2,
    BigDecimal notaCorte3,
    BigDecimal notaFinal,
    boolean completa,
    boolean bloqueada,
    OffsetDateTime calculadaEn,
    List<ComponenteNota> componentes
) {
    /**
     * Componente trazable: identifica el formulario origen (código y nombre),
     * el corte al que aporta, el peso aplicado y la nota leída (null si falta).
     */
    public record ComponenteNota(
        String corte,
        String formularioCodigo,
        String formularioNombre,
        BigDecimal peso,
        BigDecimal nota,
        boolean presente
    ) {}
}
