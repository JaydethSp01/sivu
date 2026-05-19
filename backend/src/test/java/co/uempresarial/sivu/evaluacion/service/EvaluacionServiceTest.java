package co.uempresarial.sivu.evaluacion.service;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.evaluacion.domain.Evaluacion;
import co.uempresarial.sivu.evaluacion.domain.Recomendacion;
import co.uempresarial.sivu.evaluacion.domain.TipoEvaluacion;
import co.uempresarial.sivu.evaluacion.persistence.EvaluacionRepository;
import co.uempresarial.sivu.evaluacion.web.EvaluacionMapper;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionRequest;
import co.uempresarial.sivu.evaluacion.web.dto.EvaluacionResponse;
import co.uempresarial.sivu.evaluacion.web.dto.ResumenEvaluacionesResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvaluacionServiceTest {

    @Mock private EvaluacionRepository repository;
    @Mock private ConvenioRepository convenioRepository;
    @Mock private TutorRepository tutorRepository;
    @Mock private EvaluacionMapper mapper;

    @InjectMocks private EvaluacionService service;

    private EvaluacionRequest req(TipoEvaluacion tipo, BigDecimal cal) {
        return new EvaluacionRequest(1L, 10L, tipo, null, cal,
            new BigDecimal("4.0"), new BigDecimal("4.0"), Recomendacion.CONTINUAR, "obs");
    }

    @Test
    @DisplayName("Crear evaluación válida persiste y retorna response")
    void crearOk() {
        Tutor t = Tutor.builder().id(10L).tipo(TipoTutor.ACADEMICO).build();
        when(convenioRepository.findById(1L)).thenReturn(Optional.of(Convenio.builder().id(1L).build()));
        when(tutorRepository.findById(10L)).thenReturn(Optional.of(t));
        when(repository.findByConvenioIdAndTipoAndEvaluadorTipo(any(), any(), any())).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any())).thenReturn(mock(EvaluacionResponse.class));

        var r = service.crear(req(TipoEvaluacion.FINAL, new BigDecimal("4.5")));
        assertThat(r).isNotNull();
    }

    @Test
    @DisplayName("Evaluación duplicada (mismo convenio+tipo+evaluador) lanza BusinessException")
    void duplicada() {
        Tutor t = Tutor.builder().id(10L).tipo(TipoTutor.ACADEMICO).build();
        when(convenioRepository.findById(1L)).thenReturn(Optional.of(Convenio.builder().id(1L).build()));
        when(tutorRepository.findById(10L)).thenReturn(Optional.of(t));
        when(repository.findByConvenioIdAndTipoAndEvaluadorTipo(any(), any(), any()))
            .thenReturn(Optional.of(Evaluacion.builder().id(99L).build()));

        assertThatThrownBy(() -> service.crear(req(TipoEvaluacion.FINAL, new BigDecimal("4.5"))))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Ya existe");
    }

    @Test
    @DisplayName("Resumen calcula promedios y sugiere calificación si ambas FINAL existen")
    void resumenConSugerencia() {
        when(convenioRepository.existsById(1L)).thenReturn(true);
        Evaluacion finAca = Evaluacion.builder()
            .tipo(TipoEvaluacion.FINAL).evaluadorTipo(TipoTutor.ACADEMICO)
            .calificacion(new BigDecimal("4.5"))
            .competenciasTecnicas(new BigDecimal("4.0"))
            .competenciasBlandas(new BigDecimal("4.0")).build();
        Evaluacion finEmp = Evaluacion.builder()
            .tipo(TipoEvaluacion.FINAL).evaluadorTipo(TipoTutor.EMPRESARIAL)
            .calificacion(new BigDecimal("4.3"))
            .competenciasTecnicas(new BigDecimal("4.2"))
            .competenciasBlandas(new BigDecimal("4.4")).build();
        when(repository.findByConvenioIdOrderByFechaEvaluacionAsc(1L)).thenReturn(List.of(finAca, finEmp));
        when(mapper.toResponse(any())).thenReturn(mock(EvaluacionResponse.class));

        ResumenEvaluacionesResponse r = service.resumenPorConvenio(1L);
        assertThat(r.totalEvaluaciones()).isEqualTo(2);
        assertThat(r.tieneEvaluacionFinalAcademica()).isTrue();
        assertThat(r.tieneEvaluacionFinalEmpresarial()).isTrue();
        // (4.5 + 4.3) / 2 = 4.40
        assertThat(r.calificacionFinalSugerida()).isEqualByComparingTo(new BigDecimal("4.40"));
    }

    @Test
    @DisplayName("Resumen sin evaluaciones devuelve estructura vacía")
    void resumenVacio() {
        when(convenioRepository.existsById(1L)).thenReturn(true);
        when(repository.findByConvenioIdOrderByFechaEvaluacionAsc(1L)).thenReturn(List.of());

        var r = service.resumenPorConvenio(1L);
        assertThat(r.totalEvaluaciones()).isEqualTo(0);
        assertThat(r.calificacionFinalSugerida()).isNull();
    }
}
