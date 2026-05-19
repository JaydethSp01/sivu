package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Mock de "la API de la universidad". En el TO-BE original (ver doc de análisis)
 * la idea era que n8n consultara el sistema académico real. Para esta demo
 * académica, sustituimos esa integración por una validación local determinística:
 * el estudiante cumple si y sólo si:
 *   - está ACTIVO
 *   - tiene créditos aprobados ≥ {@code creditosMinimos}
 *   - promedio acumulado ≥ {@code promedioMinimo}
 */
@Service
@Slf4j
public class MockUniversidadApiService {

    private final int creditosMinimos;
    private final BigDecimal promedioMinimo;

    public MockUniversidadApiService(
        @Value("${app.universidad.creditos-minimos:120}") int creditosMinimos,
        @Value("${app.universidad.promedio-minimo:3.5}") BigDecimal promedioMinimo
    ) {
        this.creditosMinimos = creditosMinimos;
        this.promedioMinimo = promedioMinimo;
    }

    public record VerificacionAcademica(boolean cumple, String motivo) {}

    public VerificacionAcademica verificar(Estudiante estudiante) {
        if (estudiante == null) {
            return new VerificacionAcademica(false, "Estudiante inexistente");
        }
        if (estudiante.getEstado() != EstadoEstudiante.ACTIVO) {
            return new VerificacionAcademica(false,
                "El estudiante no está ACTIVO (estado: " + estudiante.getEstado() + ")");
        }
        if (estudiante.getCreditosAprobados() == null
            || estudiante.getCreditosAprobados() < creditosMinimos) {
            return new VerificacionAcademica(false,
                "Créditos insuficientes (%d < %d requeridos)".formatted(
                    estudiante.getCreditosAprobados() == null ? 0 : estudiante.getCreditosAprobados(),
                    creditosMinimos));
        }
        if (estudiante.getPromedioAcumulado() == null
            || estudiante.getPromedioAcumulado().compareTo(promedioMinimo) < 0) {
            return new VerificacionAcademica(false,
                "Promedio insuficiente (%s < %s requerido)".formatted(
                    estudiante.getPromedioAcumulado(), promedioMinimo));
        }
        return new VerificacionAcademica(true,
            "Cumple condiciones académicas: créditos=%d, promedio=%s".formatted(
                estudiante.getCreditosAprobados(), estudiante.getPromedioAcumulado()));
    }

    public int getCreditosMinimos() { return creditosMinimos; }
    public BigDecimal getPromedioMinimo() { return promedioMinimo; }
}
