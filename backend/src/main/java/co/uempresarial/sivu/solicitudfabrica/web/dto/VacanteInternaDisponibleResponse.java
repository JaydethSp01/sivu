package co.uempresarial.sivu.solicitudfabrica.web.dto;

/**
 * Vacante interna disponible para asignar a una solicitud APROBADA. Es un
 * proyección recortada del catálogo de vacantes pensada para el selector
 * que ve Coformación al momento de elegir qué proyecto le toca al estudiante.
 */
public record VacanteInternaDisponibleResponse(
    Long id,
    String titulo,
    String areaPractica,
    String modalidad,
    String ciudad,
    Integer cuposDisponibles,
    String programasDirigidos
) {}
