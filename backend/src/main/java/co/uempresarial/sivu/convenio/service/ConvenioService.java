package co.uempresarial.sivu.convenio.service;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.convenio.web.ConvenioMapper;
import co.uempresarial.sivu.convenio.web.dto.ConvenioRequest;
import co.uempresarial.sivu.convenio.web.dto.ConvenioResponse;
import co.uempresarial.sivu.convenio.web.dto.ParteFirmaConvenio;
import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.persistence.DocumentoRepository;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.persistence.EmpresaRepository;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.shared.pagination.PageResponse;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.tutor.persistence.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ConvenioService {

    private final ConvenioRepository repository;
    private final EstudianteRepository estudianteRepository;
    private final EmpresaRepository empresaRepository;
    private final DocumentoRepository documentoRepository;
    private final TutorRepository tutorRepository;
    private final ConvenioMapper mapper;
    private final CurrentUserService currentUser;

    /**
     * Crea la práctica de Coformación directamente (sin vacante ni postulación):
     * la Oficina de Coformación asigna estudiante + empresa + tutores.
     */
    public ConvenioResponse crear(ConvenioRequest request) {
        String numeroSolicitado = request.numeroConvenio();
        boolean autogenerar = numeroSolicitado == null || numeroSolicitado.isBlank();
        if (!autogenerar && repository.existsByNumeroConvenio(numeroSolicitado)) {
            throw new BusinessException("Ya existe un convenio con ese número");
        }

        Convenio entity = mapper.toEntity(request);
        entity.setEstudiante(resolverEstudiante(request.estudianteId()));
        entity.setEmpresa(resolverEmpresa(request.empresaId()));
        if (request.tutorAcademicoId() != null) {
            entity.setTutorAcademico(resolverTutorTipado(request.tutorAcademicoId(), TipoTutor.ACADEMICO));
        }
        if (request.tutorEmpresarialId() != null) {
            entity.setTutorEmpresarial(resolverTutorTipado(request.tutorEmpresarialId(), TipoTutor.EMPRESARIAL));
        }
        if (request.documentoPdfId() != null) {
            entity.setDocumentoPdf(resolverDocumento(request.documentoPdfId()));
        }
        if (entity.getEstado() == null) {
            entity.setEstado(EstadoConvenio.BORRADOR);
        }

        // Asignar un placeholder único antes de persistir cuando hay que autogenerar,
        // porque numero_convenio es NOT NULL y UNIQUE en BD.
        entity.setNumeroConvenio(autogenerar
            ? "TMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
            : numeroSolicitado);

        Convenio saved = repository.save(entity);

        if (autogenerar) {
            String numeroFinal = "CONV-" + LocalDate.now().getYear()
                + "-" + String.format("%05d", saved.getId());
            saved.setNumeroConvenio(numeroFinal);
        }

        return mapper.toResponse(saved);
    }

    public ConvenioResponse actualizar(Long id, ConvenioRequest request) {
        Convenio existing = obtener(id);

        if (request.numeroConvenio() != null && !request.numeroConvenio().isBlank()
            && !request.numeroConvenio().equals(existing.getNumeroConvenio())) {
            if (repository.existsByNumeroConvenio(request.numeroConvenio())) {
                throw new BusinessException("Ya existe un convenio con ese número");
            }
            existing.setNumeroConvenio(request.numeroConvenio());
        }

        mapper.updateEntity(request, existing);

        if (request.estudianteId() != null
            && !request.estudianteId().equals(existing.getEstudiante().getId())) {
            existing.setEstudiante(resolverEstudiante(request.estudianteId()));
        }
        if (request.empresaId() != null
            && !request.empresaId().equals(existing.getEmpresa().getId())) {
            existing.setEmpresa(resolverEmpresa(request.empresaId()));
        }
        if (request.tutorAcademicoId() != null) {
            existing.setTutorAcademico(resolverTutorTipado(request.tutorAcademicoId(), TipoTutor.ACADEMICO));
        }
        if (request.tutorEmpresarialId() != null) {
            existing.setTutorEmpresarial(resolverTutorTipado(request.tutorEmpresarialId(), TipoTutor.EMPRESARIAL));
        }
        if (request.documentoPdfId() != null) {
            existing.setDocumentoPdf(resolverDocumento(request.documentoPdfId()));
        }

        return mapper.toResponse(existing);
    }

    public ConvenioResponse firmar(Long id, ParteFirmaConvenio parte) {
        Convenio existing = obtener(id);
        EstadoConvenio anterior = existing.getEstado();
        switch (parte) {
            case ESTUDIANTE -> {
                if (anterior != EstadoConvenio.BORRADOR) {
                    throw new BusinessException(
                        "El estudiante debe firmar primero (estado actual: " + anterior + ")");
                }
                existing.setEstado(EstadoConvenio.FIRMADO_ESTUDIANTE);
            }
            case EMPRESA -> {
                if (anterior != EstadoConvenio.FIRMADO_ESTUDIANTE) {
                    throw new BusinessException(
                        "La empresa firma después del estudiante (estado actual: " + anterior + ")");
                }
                existing.setEstado(EstadoConvenio.FIRMADO_EMPRESA);
            }
            case UNIVERSIDAD -> {
                if (anterior != EstadoConvenio.FIRMADO_EMPRESA) {
                    throw new BusinessException(
                        "La universidad firma de última, luego de estudiante y empresa "
                            + "(estado actual: " + anterior + ")");
                }
                // Tras la firma de la universidad el convenio queda activo automáticamente.
                existing.setEstado(EstadoConvenio.ACTIVO);
            }
        }
        return mapper.toResponse(existing);
    }

    public ConvenioResponse asignarTutores(Long id, Long tutorAcademicoId, Long tutorEmpresarialId) {
        Convenio convenio = obtener(id);
        if (tutorAcademicoId != null) {
            convenio.setTutorAcademico(resolverTutorTipado(tutorAcademicoId, TipoTutor.ACADEMICO));
        }
        if (tutorEmpresarialId != null) {
            convenio.setTutorEmpresarial(resolverTutorTipado(tutorEmpresarialId, TipoTutor.EMPRESARIAL));
        }
        return mapper.toResponse(convenio);
    }

    public ConvenioResponse finalizar(Long id, BigDecimal calificacionFinal) {
        Convenio convenio = obtener(id);
        if (convenio.getEstado() != EstadoConvenio.ACTIVO) {
            throw new BusinessException("Solo se puede finalizar un convenio en estado ACTIVO (actual: "
                + convenio.getEstado() + ")");
        }
        if (calificacionFinal == null
            || calificacionFinal.compareTo(BigDecimal.ZERO) < 0
            || calificacionFinal.compareTo(new BigDecimal("5.0")) > 0) {
            throw new BusinessException("La calificación final debe estar entre 0.0 y 5.0");
        }
        convenio.setCalificacionFinal(calificacionFinal);
        convenio.setEstado(EstadoConvenio.FINALIZADO);
        return mapper.toResponse(convenio);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Convenio", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public ConvenioResponse buscarPorId(Long id) {
        return mapper.toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public PageResponse<ConvenioResponse> listar(EstadoConvenio estado,
                                                 Long estudianteId,
                                                 Long empresaId,
                                                 Pageable pageable) {
        // Auto-scope EMPRESA pura: solo convenios donde su empresa es parte.
        Long empresaIdEffective = empresaId;
        if (currentUser.esEmpresaPura()) {
            empresaIdEffective = currentUser.currentEmpresaId().orElse(-1L);
        }
        return PageResponse.of(
            repository.buscar(estado, estudianteId, empresaIdEffective, pageable).map(mapper::toResponse)
        );
    }

    public Convenio obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", id));
    }

    private Estudiante resolverEstudiante(Long estudianteId) {
        return estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));
    }

    private Empresa resolverEmpresa(Long empresaId) {
        return empresaRepository.findById(empresaId)
            .orElseThrow(() -> new ResourceNotFoundException("Empresa", empresaId));
    }

    private Documento resolverDocumento(Long documentoId) {
        return documentoRepository.findById(documentoId)
            .orElseThrow(() -> new ResourceNotFoundException("Documento", documentoId));
    }

    private Tutor resolverTutorTipado(Long tutorId, TipoTutor tipoEsperado) {
        Tutor t = tutorRepository.findById(tutorId)
            .orElseThrow(() -> new ResourceNotFoundException("Tutor", tutorId));
        if (t.getTipo() != tipoEsperado) {
            throw new BusinessException("El tutor " + tutorId + " no es " + tipoEsperado);
        }
        return t;
    }
}
