package co.uempresarial.sivu.plantilla.web.dto;

import co.uempresarial.sivu.plantilla.domain.EstadoRespuesta;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public final class RespuestaDtos {
    private RespuestaDtos() {}

    public record RespuestaResponse(
        Long id,
        Long plantillaId,
        String plantillaCodigo,
        String plantillaNombre,
        Long convenioId,
        Long trimestreId,
        Long estudianteId,
        String estudianteNombre,
        String asignadoANombre,
        String asignadoARol,
        String asignadoPorNombre,
        OffsetDateTime fechaAsignacion,
        LocalDate fechaLimite,
        EstadoRespuesta estado,
        BigDecimal notaCalculada,
        String observaciones,
        OffsetDateTime fechaEntrega,
        OffsetDateTime fechaFirma,
        String firmadoPorNombre,
        List<ValorCriterio> valores,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {}

    public record ValorCriterio(
        Long criterioId,
        BigDecimal valorNumero,
        String valorTexto,
        Boolean valorBool
    ) {}

    public record AsignarRequest(
        @NotNull Long plantillaId,
        Long convenioId,
        Long trimestreId,
        Long estudianteId,
        String asignadoAMongoId,
        String asignadoANombre,
        String asignadoARol,
        LocalDate fechaLimite
    ) {}

    public record LlenarRequest(
        List<ValorCriterio> valores,
        String observaciones
    ) {}

    public record ResolverRequest(String observaciones) {}

    /**
     * El usuario autenticado pide abrir la plantilla vigente de un tipo para
     * un convenio/trimestre. Si ya tiene una respuesta abierta para ese
     * contexto, devuelve esa misma.
     */
    public record AbrirSelfRequest(
        @NotNull co.uempresarial.sivu.plantilla.domain.TipoPlantilla tipo,
        Long convenioId,
        Long trimestreId,
        Long estudianteId
    ) {}
}
