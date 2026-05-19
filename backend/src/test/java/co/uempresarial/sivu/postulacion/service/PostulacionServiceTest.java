package co.uempresarial.sivu.postulacion.service;

import co.uempresarial.sivu.automatizacion.service.MatchingService;
import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.postulacion.persistence.PostulacionEventoRepository;
import co.uempresarial.sivu.postulacion.persistence.PostulacionRepository;
import co.uempresarial.sivu.postulacion.web.PostulacionMapper;
import co.uempresarial.sivu.postulacion.web.dto.CambioEstadoRequest;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionRequest;
import co.uempresarial.sivu.postulacion.web.dto.PostulacionResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.vacante.domain.AreaPractica;
import co.uempresarial.sivu.vacante.domain.EstadoVacante;
import co.uempresarial.sivu.vacante.domain.Modalidad;
import co.uempresarial.sivu.vacante.domain.Vacante;
import co.uempresarial.sivu.vacante.persistence.VacanteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostulacionServiceTest {

    @Mock private PostulacionRepository postulacionRepository;
    @Mock private PostulacionEventoRepository eventoRepository;
    @Mock private EstudianteRepository estudianteRepository;
    @Mock private VacanteRepository vacanteRepository;
    @Mock private MatchingService matchingService;
    @Mock private NotificacionService notificacionService;
    @Mock private PostulacionMapper mapper;

    @InjectMocks private PostulacionService service;

    private Estudiante estudiante() {
        return Estudiante.builder()
            .id(1L).tipoDocumento(TipoDocumento.CC).numeroDocumento("1")
            .nombres("Kelly").apellidos("D").email("k@u.co")
            .programaAcademico("Ing. Sistemas").semestre((short) 9)
            .creditosAprobados((short) 140).promedioAcumulado(new BigDecimal("4.3"))
            .estado(EstadoEstudiante.ACTIVO).build();
    }

    private Vacante vacante(EstadoVacante estado) {
        return Vacante.builder()
            .id(10L).empresa(Empresa.builder().id(100L).razonSocial("Coally").build())
            .titulo("Backend").descripcion("d").areaPractica(AreaPractica.DESARROLLO_SW)
            .modalidad(Modalidad.HIBRIDO).ciudad("Bogotá")
            .requisitosKeywords("java").creditosMinimos((short) 120)
            .promedioMinimo(new BigDecimal("3.5")).programasDirigidos("")
            .duracionMeses((short) 6).cuposDisponibles((short) 1)
            .fechaInicio(LocalDate.now().plusMonths(1))
            .fechaCierrePostulaciones(LocalDate.now().plusWeeks(2))
            .estado(estado).build();
    }

    @Test
    @DisplayName("Crear postulación calcula score, persiste, registra evento y notifica")
    void crearOk() {
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudiante()));
        when(vacanteRepository.findById(10L)).thenReturn(Optional.of(vacante(EstadoVacante.PUBLICADA)));
        when(postulacionRepository.findByEstudianteIdAndVacanteId(1L, 10L)).thenReturn(Optional.empty());
        when(matchingService.calcular(any(), any())).thenReturn(
            new MatchingService.ResultadoMatching(
                new BigDecimal("75.00"), "ok", true, java.util.List.of()));
        when(postulacionRepository.save(any())).thenAnswer(inv -> {
            Postulacion p = inv.getArgument(0);
            p.setId(123L);
            return p;
        });
        when(mapper.toResponse(any())).thenReturn(mock(PostulacionResponse.class));

        service.crear(new PostulacionRequest(1L, 10L, "Me interesa"));

        verify(eventoRepository).save(any());
        verify(notificacionService).enviarCambioEstadoPostulacion(
            any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Vacante no PUBLICADA bloquea la postulación")
    void vacanteNoPublicada() {
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudiante()));
        when(vacanteRepository.findById(10L)).thenReturn(Optional.of(vacante(EstadoVacante.BORRADOR)));

        assertThatThrownBy(() -> service.crear(new PostulacionRequest(1L, 10L, null)))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("no está publicada");
    }

    @Test
    @DisplayName("Postulación duplicada (mismo est+vacante) bloquea")
    void postulacionDuplicada() {
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudiante()));
        when(vacanteRepository.findById(10L)).thenReturn(Optional.of(vacante(EstadoVacante.PUBLICADA)));
        when(postulacionRepository.findByEstudianteIdAndVacanteId(1L, 10L))
            .thenReturn(Optional.of(Postulacion.builder().id(99L).build()));

        assertThatThrownBy(() -> service.crear(new PostulacionRequest(1L, 10L, null)))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("ya se postuló");
    }

    @Test
    @DisplayName("Cambio de estado válido (POSTULADA -> EN_REVISION)")
    void cambioEstadoValido() {
        Postulacion p = Postulacion.builder()
            .id(1L)
            .estudiante(estudiante())
            .vacante(vacante(EstadoVacante.PUBLICADA))
            .estado(EstadoPostulacion.POSTULADA).build();
        when(postulacionRepository.findById(1L)).thenReturn(Optional.of(p));
        when(mapper.toResponse(any())).thenReturn(mock(PostulacionResponse.class));

        service.cambiarEstado(1L,
            new CambioEstadoRequest(EstadoPostulacion.EN_REVISION, "Revisando"), "coord@u.co");

        assertThat(p.getEstado()).isEqualTo(EstadoPostulacion.EN_REVISION);
        verify(eventoRepository).save(any());
        verify(notificacionService).enviarCambioEstadoPostulacion(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Cambio de estado inválido (POSTULADA -> ACEPTADA) lanza BusinessException")
    void cambioEstadoInvalido() {
        Postulacion p = Postulacion.builder()
            .id(1L).estado(EstadoPostulacion.POSTULADA).build();
        when(postulacionRepository.findById(1L)).thenReturn(Optional.of(p));

        assertThatThrownBy(() -> service.cambiarEstado(1L,
            new CambioEstadoRequest(EstadoPostulacion.ACEPTADA, null), "x"))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Transición no permitida");
    }
}
