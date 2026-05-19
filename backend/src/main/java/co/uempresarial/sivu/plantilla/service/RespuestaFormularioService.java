package co.uempresarial.sivu.plantilla.service;

import co.uempresarial.sivu.automatizacion.service.NotificacionService;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.plantilla.domain.*;
import co.uempresarial.sivu.plantilla.persistence.CriterioPlantillaRepository;
import co.uempresarial.sivu.plantilla.persistence.PlantillaFormularioRepository;
import co.uempresarial.sivu.plantilla.persistence.RespuestaFormularioRepository;
import co.uempresarial.sivu.plantilla.web.dto.RespuestaDtos.*;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.persistence.TrimestreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RespuestaFormularioService {

    private final RespuestaFormularioRepository respuestaRepo;
    private final PlantillaFormularioRepository plantillaRepo;
    private final CriterioPlantillaRepository criterioRepo;
    private final ConvenioRepository convenioRepo;
    private final TrimestreRepository trimestreRepo;
    private final EstudianteRepository estudianteRepo;
    private final CurrentUserService currentUser;
    private final NotificacionService notificacionService;

    /**
     * Abre (o crea) una respuesta para el usuario autenticado contra la
     * plantilla vigente del tipo, en el contexto dado. Es la puerta que usan
     * las pantallas viejas para conectar con el sistema configurable.
     */
    public RespuestaResponse abrirParaSelf(AbrirSelfRequest req) {
        var usuario = currentUser.current().orElseThrow(() ->
            new BusinessException("Usuario no autenticado"));

        PlantillaFormulario plantilla = plantillaRepo.findByTipoAndVigenteTrue(req.tipo())
            .orElseThrow(() -> new BusinessException(
                "No hay plantilla vigente para el tipo " + req.tipo()));

        Optional<RespuestaFormulario> existente = respuestaRepo
            .findByAsignadoAMongoIdOrderByFechaAsignacionDesc(usuario.getId()).stream()
            .filter(r -> r.getPlantilla().getId().equals(plantilla.getId()))
            .filter(r -> sameRef(r.getConvenio() == null ? null : r.getConvenio().getId(), req.convenioId()))
            .filter(r -> sameRef(r.getTrimestre() == null ? null : r.getTrimestre().getId(), req.trimestreId()))
            .findFirst();
        if (existente.isPresent()) return toResponse(existente.get());

        RespuestaFormulario r = RespuestaFormulario.builder()
            .plantilla(plantilla)
            .asignadoAMongoId(usuario.getId())
            .asignadoANombre((usuario.getNombres() + " " + usuario.getApellidos()).trim())
            .asignadoARol(usuario.getRoles().isEmpty() ? null : usuario.getRoles().iterator().next().name())
            .asignadoPorNombre("Sistema (auto)")
            .estado(EstadoRespuesta.PENDIENTE)
            .build();
        if (req.convenioId() != null) {
            r.setConvenio(convenioRepo.findById(req.convenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convenio", req.convenioId())));
        }
        if (req.trimestreId() != null) {
            r.setTrimestre(trimestreRepo.findById(req.trimestreId())
                .orElseThrow(() -> new ResourceNotFoundException("Trimestre", req.trimestreId())));
        }
        if (req.estudianteId() != null) {
            r.setEstudiante(estudianteRepo.findById(req.estudianteId())
                .orElseThrow(() -> new ResourceNotFoundException("Estudiante", req.estudianteId())));
        }
        return toResponse(respuestaRepo.save(r));
    }

    private static boolean sameRef(Long a, Long b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    public RespuestaResponse asignar(AsignarRequest req) {
        PlantillaFormulario plantilla = plantillaRepo.findById(req.plantillaId())
            .orElseThrow(() -> new ResourceNotFoundException("Plantilla", req.plantillaId()));

        RespuestaFormulario r = RespuestaFormulario.builder()
            .plantilla(plantilla)
            .asignadoAMongoId(req.asignadoAMongoId())
            .asignadoANombre(req.asignadoANombre())
            .asignadoARol(req.asignadoARol())
            .fechaLimite(req.fechaLimite())
            .estado(EstadoRespuesta.PENDIENTE)
            .asignadoPorNombre(currentUser.current()
                .map(u -> u.getNombres() + " " + u.getApellidos()).orElse(null))
            .build();

        if (req.convenioId() != null) {
            r.setConvenio(convenioRepo.findById(req.convenioId())
                .orElseThrow(() -> new ResourceNotFoundException("Convenio", req.convenioId())));
        }
        if (req.trimestreId() != null) {
            r.setTrimestre(trimestreRepo.findById(req.trimestreId())
                .orElseThrow(() -> new ResourceNotFoundException("Trimestre", req.trimestreId())));
        }
        if (req.estudianteId() != null) {
            r.setEstudiante(estudianteRepo.findById(req.estudianteId())
                .orElseThrow(() -> new ResourceNotFoundException("Estudiante", req.estudianteId())));
        }

        r = respuestaRepo.save(r);
        return toResponse(r);
    }

    @Transactional(readOnly = true)
    public List<RespuestaResponse> mias() {
        String uid = currentUser.current().map(u -> u.getId()).orElse(null);
        if (uid == null) return List.of();
        return respuestaRepo.findByAsignadoAMongoIdOrderByFechaAsignacionDesc(uid).stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RespuestaResponse> bandeja(EstadoRespuesta estado) {
        return respuestaRepo.findByEstadoOrderByFechaAsignacionAsc(estado).stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RespuestaResponse obtener(Long id) {
        return toResponse(obtenerEntidad(id));
    }

    public RespuestaFormulario obtenerEntidad(Long id) {
        return respuestaRepo.findWithDetailsById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Respuesta", id));
    }

    public RespuestaResponse llenar(Long id, LlenarRequest req) {
        RespuestaFormulario r = obtenerEntidad(id);
        if (r.getEstado() == EstadoRespuesta.FIRMADO || r.getEstado() == EstadoRespuesta.APROBADO) {
            throw new BusinessException("El formulario ya está cerrado (" + r.getEstado() + ")");
        }

        // Upsert por criterio
        Map<Long, RespuestaCriterio> indice = new HashMap<>();
        for (RespuestaCriterio rc : r.getRespuestas()) {
            if (rc.getCriterio() != null) indice.put(rc.getCriterio().getId(), rc);
        }

        if (req.valores() != null) {
            for (ValorCriterio v : req.valores()) {
                if (v.criterioId() == null) continue;
                RespuestaCriterio rc = indice.get(v.criterioId());
                if (rc == null) {
                    CriterioPlantilla c = criterioRepo.findById(v.criterioId())
                        .orElseThrow(() -> new ResourceNotFoundException("Criterio", v.criterioId()));
                    rc = RespuestaCriterio.builder().respuesta(r).criterio(c).build();
                    r.getRespuestas().add(rc);
                    indice.put(v.criterioId(), rc);
                }
                rc.setValorNumero(v.valorNumero());
                rc.setValorTexto(v.valorTexto());
                rc.setValorBool(v.valorBool());
            }
        }

        if (req.observaciones() != null) r.setObservaciones(req.observaciones());
        r.setNotaCalculada(calcularNota(r));
        if (r.getEstado() == EstadoRespuesta.PENDIENTE) r.setEstado(EstadoRespuesta.EN_PROGRESO);
        return toResponse(r);
    }

    public RespuestaResponse entregar(Long id) {
        RespuestaFormulario r = obtenerEntidad(id);
        if (r.getEstado() != EstadoRespuesta.PENDIENTE && r.getEstado() != EstadoRespuesta.EN_PROGRESO
            && r.getEstado() != EstadoRespuesta.RECHAZADO) {
            throw new BusinessException("No se puede entregar en estado " + r.getEstado());
        }
        r.setEstado(EstadoRespuesta.ENTREGADO);
        r.setFechaEntrega(OffsetDateTime.now());
        return toResponse(r);
    }

    public RespuestaResponse firmar(Long id) {
        RespuestaFormulario r = obtenerEntidad(id);
        if (r.getEstado() != EstadoRespuesta.ENTREGADO && r.getEstado() != EstadoRespuesta.EN_PROGRESO) {
            throw new BusinessException("Solo se puede firmar un formulario entregado");
        }
        r.setEstado(EstadoRespuesta.FIRMADO);
        r.setFechaFirma(OffsetDateTime.now());
        currentUser.current().ifPresent(u -> {
            r.setFirmadoPorMongoId(u.getId());
            r.setFirmadoPorNombre(u.getNombres() + " " + u.getApellidos());
        });
        return toResponse(r);
    }

    public RespuestaResponse aprobar(Long id, ResolverRequest body) {
        RespuestaFormulario r = obtenerEntidad(id);
        r.setEstado(EstadoRespuesta.APROBADO);
        if (body != null && body.observaciones() != null) r.setObservaciones(body.observaciones());
        return toResponse(r);
    }

    public RespuestaResponse rechazar(Long id, ResolverRequest body) {
        if (body == null || body.observaciones() == null || body.observaciones().isBlank()) {
            throw new BusinessException("Observaciones obligatorias al rechazar");
        }
        RespuestaFormulario r = obtenerEntidad(id);
        r.setEstado(EstadoRespuesta.RECHAZADO);
        r.setObservaciones(body.observaciones());
        return toResponse(r);
    }

    private BigDecimal calcularNota(RespuestaFormulario r) {
        PlantillaFormulario p = r.getPlantilla();
        if (p == null || p.getSecciones().isEmpty()) return null;

        Map<Long, BigDecimal> valorPorCriterio = new HashMap<>();
        for (RespuestaCriterio rc : r.getRespuestas()) {
            if (rc.getCriterio() != null && rc.getValorNumero() != null) {
                valorPorCriterio.put(rc.getCriterio().getId(), rc.getValorNumero());
            }
        }

        BigDecimal total = BigDecimal.ZERO;
        boolean huboPeso = false;
        for (SeccionPlantilla s : p.getSecciones()) {
            BigDecimal pesoSeccion = s.getPeso();
            if (pesoSeccion == null) continue;
            huboPeso = true;

            BigDecimal aporteSeccion = BigDecimal.ZERO;
            boolean criteriosConPeso = s.getCriterios().stream().anyMatch(c -> c.getPeso() != null);
            if (criteriosConPeso) {
                for (CriterioPlantilla c : s.getCriterios()) {
                    if (c.getPeso() == null) continue;
                    BigDecimal v = valorPorCriterio.getOrDefault(c.getId(), BigDecimal.ZERO);
                    aporteSeccion = aporteSeccion.add(v.multiply(c.getPeso()));
                }
            } else {
                // Promedio simple de los criterios numéricos × peso de sección
                BigDecimal suma = BigDecimal.ZERO;
                int n = 0;
                for (CriterioPlantilla c : s.getCriterios()) {
                    BigDecimal v = valorPorCriterio.get(c.getId());
                    if (v != null) { suma = suma.add(v); n++; }
                }
                if (n > 0) {
                    BigDecimal prom = suma.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP);
                    aporteSeccion = prom.multiply(pesoSeccion);
                }
            }
            total = total.add(aporteSeccion);
        }
        return huboPeso ? total.setScale(2, RoundingMode.HALF_UP) : null;
    }

    public RespuestaResponse toResponse(RespuestaFormulario r) {
        return new RespuestaResponse(
            r.getId(),
            r.getPlantilla().getId(),
            r.getPlantilla().getCodigo(),
            r.getPlantilla().getNombre(),
            r.getConvenio() != null ? r.getConvenio().getId() : null,
            r.getTrimestre() != null ? r.getTrimestre().getId() : null,
            r.getEstudiante() != null ? r.getEstudiante().getId() : null,
            r.getEstudiante() != null
                ? (r.getEstudiante().getNombres() + " " + r.getEstudiante().getApellidos()).trim()
                : null,
            r.getAsignadoANombre(),
            r.getAsignadoARol(),
            r.getAsignadoPorNombre(),
            r.getFechaAsignacion(),
            r.getFechaLimite(),
            r.getEstado(),
            r.getNotaCalculada(),
            r.getObservaciones(),
            r.getFechaEntrega(),
            r.getFechaFirma(),
            r.getFirmadoPorNombre(),
            r.getRespuestas().stream()
                .map(rc -> new ValorCriterio(
                    rc.getCriterio() != null ? rc.getCriterio().getId() : null,
                    rc.getValorNumero(), rc.getValorTexto(), rc.getValorBool()))
                .toList(),
            r.getCreatedAt(),
            r.getUpdatedAt());
    }
}
