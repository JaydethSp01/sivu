package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.*;
import co.uempresarial.sivu.trimestre.persistence.PlanActividadesRepository;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesRequest;
import co.uempresarial.sivu.trimestre.web.dto.PlanActividadesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanActividadesService {

    private final PlanActividadesRepository repository;
    private final TrimestreRepository trimestreRepository;
    private final TrimestreMapper mapper;

    @Transactional(readOnly = true)
    public PlanActividadesResponse obtener(Long trimestreId) {
        return mapper.toResponse(obtenerEntidad(trimestreId));
    }

    public PlanActividades obtenerEntidad(Long trimestreId) {
        return repository.findByTrimestreId(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "No existe Plan de Actividades para el trimestre " + trimestreId));
    }

    public PlanActividadesResponse guardar(Long trimestreId, PlanActividadesRequest request) {
        Trimestre trimestre = trimestreRepository.findById(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", trimestreId));

        PlanActividades pa = repository.findByTrimestreId(trimestreId)
            .orElseGet(() -> PlanActividades.builder().trimestre(trimestre).build());

        pa.setEscenarioCoformacion(request.escenarioCoformacion());
        pa.setPemDescripcionEscenario(request.pemDescripcionEscenario());
        pa.setPemObjetivoGeneral(request.pemObjetivoGeneral());

        pa.getObjetivos().clear();
        if (request.objetivos() != null) {
            int i = 0;
            for (PlanActividadesRequest.ObjetivoRequest o : request.objetivos()) {
                pa.getObjetivos().add(PlanActividadesObjetivo.builder()
                    .planActividades(pa)
                    .escenario(o.escenario())
                    .descripcion(o.descripcion())
                    .seleccionado(o.seleccionado() == null || o.seleccionado())
                    .orden(o.orden() != null ? o.orden() : (short) i++)
                    .build());
            }
        }

        pa.getMeses().clear();
        if (request.meses() != null) {
            for (PlanActividadesRequest.MesRequest m : request.meses()) {
                pa.getMeses().add(PlanActividadesMes.builder()
                    .planActividades(pa)
                    .mes(m.mes())
                    .areaRotacion(m.areaRotacion())
                    .actividades(m.actividades())
                    .tutorNombre(m.tutorNombre())
                    .build());
            }
        }

        PlanActividades saved = repository.save(pa);
        return mapper.toResponse(saved);
    }

    public PlanActividadesResponse firmar(Long trimestreId, ParteFirmaTrimestre parte) {
        PlanActividades pa = obtenerEntidad(trimestreId);
        OffsetDateTime ahora = OffsetDateTime.now();
        switch (parte) {
            case ESTUDIANTE -> {
                if (Boolean.TRUE.equals(pa.getFirmadoEstudiante())) {
                    throw new BusinessException("El estudiante ya firmó este PA");
                }
                pa.setFirmadoEstudiante(true);
                pa.setFechaFirmaEstudiante(ahora);
            }
            case TUTOR -> {
                if (Boolean.TRUE.equals(pa.getFirmadoTutor())) {
                    throw new BusinessException("El tutor ya firmó este PA");
                }
                pa.setFirmadoTutor(true);
                pa.setFechaFirmaTutor(ahora);
                if (pa.getEstado() == EstadoPlanActividades.BORRADOR
                    || pa.getEstado() == EstadoPlanActividades.ENVIADO_TUTOR) {
                    pa.setEstado(EstadoPlanActividades.APROBADO_TUTOR);
                }
            }
            case PROFESOR -> {
                if (Boolean.TRUE.equals(pa.getFirmadoProfesor())) {
                    throw new BusinessException("El profesor ya firmó este PA");
                }
                pa.setFirmadoProfesor(true);
                pa.setFechaFirmaProfesor(ahora);
            }
        }
        if (Boolean.TRUE.equals(pa.getFirmadoEstudiante())
            && Boolean.TRUE.equals(pa.getFirmadoTutor())
            && Boolean.TRUE.equals(pa.getFirmadoProfesor())) {
            pa.setEstado(EstadoPlanActividades.APROBADO_PROFESOR);
        }
        return mapper.toResponse(pa);
    }
}
