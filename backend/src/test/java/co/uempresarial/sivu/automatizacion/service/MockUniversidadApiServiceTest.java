package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MockUniversidadApiServiceTest {

    private final MockUniversidadApiService service =
        new MockUniversidadApiService(120, new BigDecimal("3.5"));

    private Estudiante base() {
        return Estudiante.builder()
            .id(1L)
            .estado(EstadoEstudiante.ACTIVO)
            .creditosAprobados((short) 140)
            .promedioAcumulado(new BigDecimal("4.0"))
            .build();
    }

    @Test
    @DisplayName("Estudiante ACTIVO con créditos y promedio cumple")
    void cumple() {
        var r = service.verificar(base());
        assertThat(r.cumple()).isTrue();
        assertThat(r.motivo()).contains("Cumple");
    }

    @Test
    @DisplayName("Estudiante GRADUADO no cumple")
    void noCumpleEstado() {
        Estudiante e = base();
        e.setEstado(EstadoEstudiante.GRADUADO);
        var r = service.verificar(e);
        assertThat(r.cumple()).isFalse();
        assertThat(r.motivo()).contains("ACTIVO");
    }

    @Test
    @DisplayName("Pocos créditos no cumple")
    void noCumpleCreditos() {
        Estudiante e = base();
        e.setCreditosAprobados((short) 100);
        var r = service.verificar(e);
        assertThat(r.cumple()).isFalse();
        assertThat(r.motivo()).contains("Créditos insuficientes");
    }

    @Test
    @DisplayName("Promedio bajo no cumple")
    void noCumplePromedio() {
        Estudiante e = base();
        e.setPromedioAcumulado(new BigDecimal("3.0"));
        var r = service.verificar(e);
        assertThat(r.cumple()).isFalse();
        assertThat(r.motivo()).contains("Promedio insuficiente");
    }

    @Test
    @DisplayName("Estudiante null no cumple")
    void noCumpleNull() {
        var r = service.verificar(null);
        assertThat(r.cumple()).isFalse();
    }
}
