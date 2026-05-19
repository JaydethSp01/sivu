package co.uempresarial.sivu.trimestre.service;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.ActaReunion;
import co.uempresarial.sivu.trimestre.domain.EstadoPlanActividades;
import co.uempresarial.sivu.trimestre.domain.EstadoTrimestre;
import co.uempresarial.sivu.trimestre.domain.MomentoProceso;
import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import co.uempresarial.sivu.trimestre.domain.TipoReunion;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import co.uempresarial.sivu.trimestre.persistence.*;
import co.uempresarial.sivu.trimestre.web.TrimestreMapper;
import co.uempresarial.sivu.trimestre.web.dto.TrimestreRequest;
import co.uempresarial.sivu.trimestre.web.dto.TrimestreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrimestreService {

    private final TrimestreRepository repository;
    private final ConvenioRepository convenioRepository;
    private final PlanActividadesRepository planActividadesRepository;
    private final ActaReunionRepository actaRepository;
    private final PlanMejoraRepository planMejoraRepository;
    private final EvaluacionTutorTrimestreRepository evalTutorRepository;
    private final EvaluacionProfesorTrimestreRepository evalProfRepository;
    private final TrimestreMapper mapper;

    public TrimestreResponse crear(Long convenioId, TrimestreRequest request) {
        Convenio convenio = convenioRepository.findById(convenioId)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));
        if (repository.existsByConvenioIdAndNumero(convenioId, request.numero())) {
            throw new BusinessException("Ya existe el trimestre " + request.numero()
                + " para este convenio");
        }
        Trimestre t = Trimestre.builder()
            .convenio(convenio)
            .numero(request.numero())
            .materiaNucleo(request.materiaNucleo())
            .fechaInicio(request.fechaInicio())
            .fechaFin(request.fechaFin())
            .estado(request.estado() != null ? request.estado() : EstadoTrimestre.ABIERTO)
            .build();
        Trimestre saved = repository.save(t);

        // Crear PA automáticamente en BORRADOR si no existe
        if (planActividadesRepository.findByTrimestreId(saved.getId()).isEmpty()) {
            PlanActividades pa = PlanActividades.builder()
                .trimestre(saved)
                .estado(EstadoPlanActividades.BORRADOR)
                .build();
            planActividadesRepository.save(pa);
        }

        // F7 #56 — Auto-crear las 3 actas predefinidas (INICIO/MITAD/CIERRE)
        // según la guía Uniempresarial. Se crean en BORRADOR para que tutor
        // empresarial y estudiante las completen llegado el momento.
        autoGenerar3Actas(saved);

        return toResponse(saved);
    }

    private void autoGenerar3Actas(Trimestre t) {
        short numero = 1;
        for (MomentoProceso momento : MomentoProceso.values()) {
            if (actaRepository.existsByTrimestreIdAndMomentoProceso(t.getId(), momento)) {
                continue;
            }
            String asunto = switch (momento) {
                case INICIO -> "Reunión de inicio del período";
                case MITAD  -> "Reunión de seguimiento de mitad de período";
                case CIERRE -> "Reunión de cierre del período";
            };
            TipoReunion tipo = switch (momento) {
                case INICIO -> TipoReunion.INICIAL;
                case MITAD  -> TipoReunion.SEGUIMIENTO;
                case CIERRE -> TipoReunion.EVALUACION_FINAL;
            };
            actaRepository.save(ActaReunion.builder()
                .trimestre(t)
                .numero(numero++)
                .fecha(t.getFechaInicio() != null ? t.getFechaInicio() : LocalDate.now())
                .asunto(asunto)
                .tipoReunion(tipo)
                .momentoProceso(momento)
                .build());
        }
    }

    public TrimestreResponse actualizar(Long id, TrimestreRequest request) {
        Trimestre t = obtener(id);
        t.setMateriaNucleo(request.materiaNucleo());
        t.setFechaInicio(request.fechaInicio());
        t.setFechaFin(request.fechaFin());
        if (request.estado() != null) t.setEstado(request.estado());
        // numero también se permite si no colisiona
        if (request.numero() != null && !request.numero().equals(t.getNumero())) {
            if (repository.existsByConvenioIdAndNumero(t.getConvenio().getId(), request.numero())) {
                throw new BusinessException("Ya existe el trimestre " + request.numero()
                    + " para este convenio");
            }
            t.setNumero(request.numero());
        }
        return toResponse(t);
    }

    public void eliminar(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Trimestre", id);
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public TrimestreResponse buscarPorId(Long id) {
        return toResponse(obtener(id));
    }

    @Transactional(readOnly = true)
    public List<TrimestreResponse> listarPorConvenio(Long convenioId) {
        if (!convenioRepository.existsById(convenioId)) {
            throw new ResourceNotFoundException("Convenio", convenioId);
        }
        return repository.findByConvenioIdOrderByNumeroAsc(convenioId).stream()
            .map(this::toResponse).toList();
    }

    public Trimestre obtener(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Trimestre", id));
    }

    private TrimestreResponse toResponse(Trimestre t) {
        boolean tienePA = planActividadesRepository.findByTrimestreId(t.getId()).isPresent();
        long totalActas = actaRepository.countByTrimestreId(t.getId());
        long totalPM = planMejoraRepository.countByTrimestreId(t.getId());
        boolean tieneET = evalTutorRepository.findByTrimestreId(t.getId()).isPresent();
        boolean tieneEP = evalProfRepository.findByTrimestreId(t.getId()).isPresent();
        return mapper.toResponse(t, tienePA, totalActas, totalPM, tieneET, tieneEP);
    }
}
