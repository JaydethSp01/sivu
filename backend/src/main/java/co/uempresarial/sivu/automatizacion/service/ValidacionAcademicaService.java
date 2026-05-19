package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ValidacionAcademicaService {

    private final EstudianteRepository estudianteRepository;
    private final MockUniversidadApiService universidadApi;

    public MockUniversidadApiService.VerificacionAcademica verificar(Long estudianteId) {
        return estudianteRepository.findById(estudianteId)
            .map(universidadApi::verificar)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));
    }
}
