package co.uempresarial.sivu.plantilla.web.dto;

import co.uempresarial.sivu.plantilla.domain.TipoCampo;
import co.uempresarial.sivu.plantilla.domain.TipoPlantilla;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** DTOs agrupados del módulo Plantilla, para evitar 10 archivos sueltos. */
public final class PlantillaDtos {
    private PlantillaDtos() {}

    public record PlantillaResponse(
        Long id,
        String codigo,
        String version,
        TipoPlantilla tipo,
        String nombre,
        String descripcion,
        boolean vigente,
        LocalDate fechaVigencia,
        String creadoPorNombre,
        List<SeccionResponse> secciones,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {}

    public record SeccionResponse(
        Long id,
        Short orden,
        String codigo,
        String titulo,
        String descripcion,
        BigDecimal peso,
        List<CriterioResponse> criterios
    ) {}

    public record CriterioResponse(
        Long id,
        Short orden,
        String codigo,
        String descripcion,
        BigDecimal peso,
        String placeholder,
        TipoCampo tipo,
        String opciones
    ) {}

    public record PlantillaRequest(
        @NotBlank String codigo,
        @NotBlank String version,
        @NotNull TipoPlantilla tipo,
        @NotBlank String nombre,
        String descripcion,
        LocalDate fechaVigencia
    ) {}

    public record SeccionRequest(
        Short orden,
        String codigo,
        @NotBlank String titulo,
        String descripcion,
        BigDecimal peso
    ) {}

    public record CriterioRequest(
        Short orden,
        String codigo,
        @NotBlank String descripcion,
        BigDecimal peso,
        String placeholder,
        TipoCampo tipo,
        String opciones
    ) {}

    public record ReordenarRequest(
        java.util.List<Long> ids
    ) {}
}
