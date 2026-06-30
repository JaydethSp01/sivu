package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.agendamiento.domain.Modalidad;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.*;
import co.uempresarial.sivu.trimestre.persistence.ActaReunionRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.ActaReunionRequest;
import co.uempresarial.sivu.trimestre.web.dto.ActaReunionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ActaReunionService {

    private final ActaReunionRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final TrimestreMapper mapper;
    private final co.uempresarial.sivu.trimestre.pdf.ActaReunionPdfGenerator pdfGenerator;

    @Transactional(readOnly = true)
    public byte[] generarPdf(Long id) {
        return pdfGenerator.generar(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<ActaReunionResponse> listarPorTrimestre(Long trimestreId) {
        if (!trimestreRepository.existsById(trimestreId)) {
            throw new ResourceNotFoundException("Trimestre", trimestreId);
        }
        return repository.findByTrimestreIdOrderByNumeroAsc(trimestreId).stream()
            .map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ActaReunionResponse obtener(Long id) {
        return mapper.toResponse(obtenerEntidad(id));
    }

    public ActaReunion obtenerEntidad(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ActaReunion", id));
    }

    public ActaReunionResponse crear(Long trimestreId, ActaReunionRequest request) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));
        if (repository.existsByTrimestreIdAndNumero(trimestreId, request.numero())) {
            throw new BusinessException("Ya existe el acta número " + request.numero()
                + " en este trimestre");
        }
        ActaReunion acta = ActaReunion.builder()
            .trimestre(trimestre)
            .numero(request.numero())
            .fecha(request.fecha())
            .hora(request.hora())
            .lugar(request.lugar())
            .asunto(request.asunto())
            .tipoReunion(request.tipoReunion())
            .modalidad(request.modalidad() != null ? request.modalidad() : Modalidad.PRESENCIAL)
            .asistentesJson(mapper.asistentesToJson(request.asistentes()))
            .observaciones(request.observaciones())
            .build();
        aplicarTemas(acta, request.temas());
        ActaReunion saved = repository.save(acta);
        return mapper.toResponse(saved);
    }

    /**
     * BI-15 / RF-B02: crea un borrador de Acta de Acompañamiento (GAC-FM-11) prellenado
     * a partir de una reunión agendada confirmada.
     *
     * <p>Se ejecuta en una transacción independiente ({@link Propagation#REQUIRES_NEW}) para que,
     * si la creación del acta falla (p. ej. colisión del número), el fallo quede aislado y NO
     * arrastre la transacción de confirmación de la reunión. El acta queda sin firmar
     * (firmadoEstudiante/Tutor/Profesor = false), que es el estado "borrador" del modelo.</p>
     *
     * @return el id del acta borrador creada.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Long crearBorradorParaReunion(Long trimestreId,
                                         LocalDate fecha,
                                         String hora,
                                         String lugar,
                                         String asunto,
                                         Modalidad modalidad,
                                         List<ActaReunionRequest.AsistenteRequest> asistentes,
                                         String observaciones) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));
        short numero = (short) (repository.countByTrimestreId(trimestreId) + 1);
        ActaReunion acta = ActaReunion.builder()
            .trimestre(trimestre)
            .numero(numero)
            .fecha(fecha)
            .hora(hora)
            .lugar(lugar)
            .asunto(asunto)
            .tipoReunion(TipoReunion.SEGUIMIENTO)
            .modalidad(modalidad != null ? modalidad : Modalidad.PRESENCIAL)
            .asistentesJson(mapper.asistentesToJson(asistentes))
            .observaciones(observaciones)
            .build();
        return repository.save(acta).getId();
    }

    public ActaReunionResponse actualizar(Long id, ActaReunionRequest request) {
        ActaReunion acta = obtenerEntidad(id);
        if (request.numero() != null && !request.numero().equals(acta.getNumero())) {
            if (repository.existsByTrimestreIdAndNumero(acta.getTrimestre().getId(), request.numero())) {
                throw new BusinessException("Ya existe el acta número " + request.numero()
                    + " en este trimestre");
            }
            acta.setNumero(request.numero());
        }
        acta.setFecha(request.fecha());
        acta.setHora(request.hora());
        acta.setLugar(request.lugar());
        acta.setAsunto(request.asunto());
        if (request.tipoReunion() != null) acta.setTipoReunion(request.tipoReunion());
        if (request.modalidad() != null) acta.setModalidad(request.modalidad());
        acta.setAsistentesJson(mapper.asistentesToJson(request.asistentes()));
        acta.setObservaciones(request.observaciones());
        acta.getTemas().clear();
        aplicarTemas(acta, request.temas());
        return mapper.toResponse(acta);
    }

    public ActaReunionResponse firmar(Long id, ParteFirmaTrimestre parte) {
        ActaReunion acta = obtenerEntidad(id);
        switch (parte) {
            case ESTUDIANTE -> {
                if (Boolean.TRUE.equals(acta.getFirmadoEstudiante())) {
                    throw new BusinessException("El estudiante ya firmó esta acta");
                }
                acta.setFirmadoEstudiante(true);
            }
            case TUTOR -> {
                if (Boolean.TRUE.equals(acta.getFirmadoTutor())) {
                    throw new BusinessException("El tutor ya firmó esta acta");
                }
                acta.setFirmadoTutor(true);
            }
            case PROFESOR -> {
                if (Boolean.TRUE.equals(acta.getFirmadoProfesor())) {
                    throw new BusinessException("El profesor ya firmó esta acta");
                }
                acta.setFirmadoProfesor(true);
            }
        }
        return mapper.toResponse(acta);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ActaReunion", id);
        }
        repository.deleteById(id);
    }

    private void aplicarTemas(ActaReunion acta, List<ActaReunionRequest.TemaRequest> temas) {
        if (temas == null) return;
        int i = 0;
        for (ActaReunionRequest.TemaRequest t : temas) {
            acta.getTemas().add(ActaTema.builder()
                .acta(acta)
                .tema(t.tema())
                .observaciones(t.observaciones())
                .orden(t.orden() != null ? t.orden() : (short) i++)
                .build());
        }
    }
}
