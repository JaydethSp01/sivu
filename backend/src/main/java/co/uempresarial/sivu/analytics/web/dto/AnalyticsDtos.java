package co.uempresarial.sivu.analytics.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public final class AnalyticsDtos {
    private AnalyticsDtos() {}

    public record Resumen(
        long estudiantesActivos,
        long empresasActivas,
        long vacantesPublicadas,
        long convenios_BORRADOR,
        long convenios_ACTIVOS,
        long convenios_FINALIZADOS,
        long hvAprobadas,
        long hvEnRevision,
        long postulacionesAbiertas,
        long entrevistasAgendadas,
        long solicitudesProgramaInternoPendientes,
        long alertasPlazoUrgente
    ) {}

    public record EmbudoPostulaciones(Map<String, Long> conteoPorEstado, long total) {}

    public record EmpleabilidadEmpresa(
        Long empresaId,
        String razonSocial,
        long convenios,
        long continuidadSi,
        long continuidadNo,
        BigDecimal tasaContinuidad
    ) {}

    public record EmpleabilidadResumen(
        long convenios,
        long continuidadSi,
        long continuidadNo,
        BigDecimal tasaContinuidadGlobal,
        List<EmpleabilidadEmpresa> topEmpresas
    ) {}

    public record EstudianteEnRiesgo(
        Long id,
        String nombreCompleto,
        String email,
        String programa,
        String motivo
    ) {}
}
