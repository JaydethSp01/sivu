package co.uempresarial.sivu.estudiante.service;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.domain.TipoDocumento;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.estudiante.web.EstudianteMapper;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteRequest;
import co.uempresarial.sivu.estudiante.web.dto.EstudianteResponse;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EstudianteServiceTest {

    @Mock private EstudianteRepository repository;
    @Mock private EstudianteMapper mapper;
    @InjectMocks private EstudianteService service;

    private EstudianteRequest req() {
        return new EstudianteRequest(
            TipoDocumento.CC, "1010111111", "Kelly", "Delgado",
            "kelly@u.edu.co", "3000000000", "Ingeniería de Sistemas",
            (short) 9, (short) 140, new BigDecimal("4.30"), EstadoEstudiante.ACTIVO);
    }

    private Estudiante entidad() {
        return Estudiante.builder()
            .id(1L).tipoDocumento(TipoDocumento.CC).numeroDocumento("1010111111")
            .nombres("Kelly").apellidos("Delgado").email("kelly@u.edu.co")
            .programaAcademico("Ingeniería de Sistemas").semestre((short) 9)
            .creditosAprobados((short) 140).promedioAcumulado(new BigDecimal("4.30"))
            .estado(EstadoEstudiante.ACTIVO)
            .build();
    }

    @Test
    @DisplayName("Crear estudiante OK")
    void crearOk() {
        when(repository.existsByNumeroDocumento(any())).thenReturn(false);
        when(repository.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(mapper.toEntity(any())).thenReturn(entidad());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponse(any())).thenReturn(mock(EstudianteResponse.class));

        var resp = service.crear(req());
        assertThat(resp).isNotNull();
        verify(repository).save(any());
    }

    @Test
    @DisplayName("Crear estudiante con documento duplicado lanza BusinessException")
    void crearDocumentoDuplicado() {
        when(repository.existsByNumeroDocumento("1010111111")).thenReturn(true);
        assertThatThrownBy(() -> service.crear(req()))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("documento");
    }

    @Test
    @DisplayName("Crear estudiante con email duplicado lanza BusinessException")
    void crearEmailDuplicado() {
        when(repository.existsByNumeroDocumento(any())).thenReturn(false);
        when(repository.existsByEmailIgnoreCase("kelly@u.edu.co")).thenReturn(true);
        assertThatThrownBy(() -> service.crear(req()))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("email");
    }

    @Test
    @DisplayName("Obtener por id inexistente lanza ResourceNotFoundException")
    void obtenerInexistente() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.obtener(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Eliminar id inexistente lanza ResourceNotFoundException")
    void eliminarInexistente() {
        when(repository.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> service.eliminar(99L))
            .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Eliminar id existente borra")
    void eliminarOk() {
        when(repository.existsById(1L)).thenReturn(true);
        service.eliminar(1L);
        verify(repository).deleteById(1L);
    }
}
