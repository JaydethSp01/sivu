package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import co.uempresarial.sivu.vacante.domain.AreaPractica;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Modalidad;
import co.uempresarial.sivu.vacante.domain.Vacante;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock private ConvenioRepository convenioRepository;
    private MatchingService service;

    @BeforeEach
    void setup() {
        service = new MatchingService(70, convenioRepository);
        // Default: estudiante NO tiene historial con la empresa (sin bonus continuidad).
        lenient().when(convenioRepository.existsByEstudianteIdAndEmpresaId(any(), any()))
            .thenReturn(false);
    }

    private Estudiante estudianteIngSistemas() {
        return Estudiante.builder()
            .id(1L)
            .tipoDocumento(TipoDocumento.CC)
            .numeroDocumento("123")
            .nombres("Kelly")
            .apellidos("Delgado")
            .email("kelly@u.edu.co")
            .programaAcademico("Ingeniería de Sistemas")
            .semestre((short) 9)
            .creditosAprobados((short) 140)
            .promedioAcumulado(new BigDecimal("4.30"))
            .estado(EstadoEstudiante.ACTIVO)
            .build();
    }

    private Vacante vacanteBackendJava() {
        return Vacante.builder()
            .id(10L)
            .empresa(Empresa.builder().id(100L).razonSocial("Coally").build())
            .titulo("Practicante Backend Java")
            .descripcion("Desarrollo Spring Boot")
            .areaPractica(AreaPractica.DESARROLLO_SW)
            .modalidad(Modalidad.HIBRIDO)
            .ciudad("Bogotá")
            .requisitosKeywords("java, spring, sistemas, postgres")
            .creditosMinimos((short) 120)
            .promedioMinimo(new BigDecimal("3.50"))
            .programasDirigidos("Ingeniería de Sistemas")
            .duracionMeses((short) 6)
            .cuposDisponibles((short) 2)
            .fechaInicio(LocalDate.now().plusMonths(1))
            .fechaCierrePostulaciones(LocalDate.now().plusWeeks(3))
            .estado(EstadoVacante.PUBLICADA)
            .build();
    }

    @Test
    @DisplayName("Score alto cuando cumple créditos, promedio, programa y al menos algunas keywords")
    void scoreAlto() {
        var r = service.calcular(estudianteIngSistemas(), vacanteBackendJava());

        assertThat(r.score()).isGreaterThanOrEqualTo(new BigDecimal("60.00"));
        assertThat(r.justificacion())
            .contains("Programa académico afín")
            .contains("Créditos mínimos")
            .contains("Promedio acumulado");
    }

    @Test
    @DisplayName("No cumple créditos ni promedio resta puntos correctamente")
    void noCumpleCreditosNiPromedio() {
        Estudiante est = estudianteIngSistemas();
        est.setCreditosAprobados((short) 50);
        est.setPromedioAcumulado(new BigDecimal("2.80"));

        var r = service.calcular(est, vacanteBackendJava());

        // Pierde 20 (créditos) + 15 (promedio) = 35 pts. Máximo restante = 65.
        assertThat(r.score()).isLessThan(new BigDecimal("66.00"));
    }

    @Test
    @DisplayName("Programa no dirigido NO suma los 25 pts del criterio programa")
    void programaNoDirigido() {
        Estudiante est = estudianteIngSistemas();
        est.setProgramaAcademico("Derecho");
        var conMatch = service.calcular(estudianteIngSistemas(), vacanteBackendJava());
        var sinMatch = service.calcular(est, vacanteBackendJava());
        // Hay un mínimo de 25 pts menos cuando el programa no aplica.
        assertThat(conMatch.score().subtract(sinMatch.score())).isGreaterThanOrEqualTo(new BigDecimal("25"));
    }

    @Test
    @DisplayName("Vacante sin keywords da puntaje base por la sección de keywords")
    void vacanteSinKeywords() {
        Vacante v = vacanteBackendJava();
        v.setRequisitosKeywords("");
        var r = service.calcular(estudianteIngSistemas(), v);
        assertThat(r.justificacion()).contains("no definió keywords");
    }

    @Test
    @DisplayName("Score >= umbral marca recomendado=true")
    void recomendadoCuandoSuperaUmbral() {
        var r = service.calcular(estudianteIngSistemas(), vacanteBackendJava());
        assertThat(r.recomendado()).isEqualTo(r.score().intValue() >= 70);
    }

    @Test
    @DisplayName("Bonus continuidad: +10 pts cuando el estudiante ya tuvo convenio con la empresa")
    void bonusContinuidad() {
        when(convenioRepository.existsByEstudianteIdAndEmpresaId(1L, 100L)).thenReturn(true);
        var conBonus = service.calcular(estudianteIngSistemas(), vacanteBackendJava());

        when(convenioRepository.existsByEstudianteIdAndEmpresaId(1L, 100L)).thenReturn(false);
        var sinBonus = service.calcular(estudianteIngSistemas(), vacanteBackendJava());

        assertThat(conBonus.score().subtract(sinBonus.score())).isEqualByComparingTo(new BigDecimal("10.00"));
    }

    @Test
    @DisplayName("Score se devuelve con 2 decimales")
    void scoreConDosDecimales() {
        var r = service.calcular(estudianteIngSistemas(), vacanteBackendJava());
        assertThat(r.score().scale()).isEqualTo(2);
    }
}
