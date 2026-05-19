package co.uempresarial.sivu.plantilla.service;

import co.uempresarial.sivu.plantilla.domain.*;
import co.uempresarial.sivu.plantilla.persistence.CriterioPlantillaRepository;
import co.uempresarial.sivu.plantilla.persistence.PlantillaFormularioRepository;
import co.uempresarial.sivu.plantilla.persistence.SeccionPlantillaRepository;
import co.uempresarial.sivu.plantilla.web.dto.PlantillaDtos.*;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.BusinessException;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class PlantillaService {

    private final PlantillaFormularioRepository plantillaRepo;
    private final SeccionPlantillaRepository seccionRepo;
    private final CriterioPlantillaRepository criterioRepo;
    private final CurrentUserService currentUser;

    @Transactional(readOnly = true)
    public List<PlantillaResponse> listar() {
        return plantillaRepo.findAllByOrderByTipoAscFechaVigenciaDesc().stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PlantillaResponse> listarPorTipo(TipoPlantilla tipo) {
        return plantillaRepo.findByTipoOrderByFechaVigenciaDesc(tipo).stream()
            .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlantillaResponse obtener(Long id) {
        return toResponse(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public Optional<PlantillaFormulario> vigentePor(TipoPlantilla tipo) {
        return plantillaRepo.findByTipoAndVigenteTrue(tipo);
    }

    public PlantillaFormulario obtenerEntidad(Long id) {
        return plantillaRepo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Plantilla", id));
    }

    public PlantillaResponse crear(PlantillaRequest req) {
        PlantillaFormulario p = PlantillaFormulario.builder()
            .codigo(req.codigo().trim())
            .version(req.version().trim())
            .tipo(req.tipo())
            .nombre(req.nombre().trim())
            .descripcion(req.descripcion())
            .fechaVigencia(req.fechaVigencia())
            .vigente(false)
            .creadoPorNombre(currentUser.current().map(u -> u.getNombres() + " " + u.getApellidos()).orElse(null))
            .build();
        return toResponse(plantillaRepo.save(p));
    }

    public PlantillaResponse actualizar(Long id, PlantillaRequest req) {
        PlantillaFormulario p = obtenerEntidad(id);
        if (Boolean.TRUE.equals(p.getVigente())) {
            throw new BusinessException(
                "No se puede editar una plantilla vigente. Crea una versión nueva o desactiva la vigencia antes.");
        }
        p.setCodigo(req.codigo().trim());
        p.setVersion(req.version().trim());
        p.setTipo(req.tipo());
        p.setNombre(req.nombre().trim());
        p.setDescripcion(req.descripcion());
        p.setFechaVigencia(req.fechaVigencia());
        return toResponse(p);
    }

    /** Marca esta plantilla como vigente y desactiva la anterior del mismo tipo. */
    public PlantillaResponse marcarVigente(Long id) {
        PlantillaFormulario p = obtenerEntidad(id);
        plantillaRepo.findByTipoAndVigenteTrue(p.getTipo())
            .filter(otra -> !otra.getId().equals(p.getId()))
            .ifPresent(otra -> otra.setVigente(false));
        p.setVigente(true);
        return toResponse(p);
    }

    public void eliminar(Long id) {
        PlantillaFormulario p = obtenerEntidad(id);
        if (Boolean.TRUE.equals(p.getVigente())) {
            throw new BusinessException("No se puede eliminar una plantilla vigente");
        }
        plantillaRepo.delete(p);
    }

    public SeccionResponse agregarSeccion(Long plantillaId, SeccionRequest req) {
        PlantillaFormulario p = obtenerEntidad(plantillaId);
        if (Boolean.TRUE.equals(p.getVigente())) {
            throw new BusinessException("Plantilla vigente: crea una nueva versión para modificar secciones.");
        }
        SeccionPlantilla s = SeccionPlantilla.builder()
            .plantilla(p)
            .orden(req.orden() == null ? (short) p.getSecciones().size() : req.orden())
            .codigo(req.codigo())
            .titulo(req.titulo().trim())
            .descripcion(req.descripcion())
            .peso(req.peso())
            .build();
        return toSeccionResponse(seccionRepo.save(s));
    }

    public SeccionResponse actualizarSeccion(Long seccionId, SeccionRequest req) {
        SeccionPlantilla s = seccionRepo.findById(seccionId)
            .orElseThrow(() -> new ResourceNotFoundException("Sección", seccionId));
        if (Boolean.TRUE.equals(s.getPlantilla().getVigente())) {
            throw new BusinessException("Plantilla vigente: crea una nueva versión para modificar secciones.");
        }
        if (req.orden() != null) s.setOrden(req.orden());
        s.setCodigo(req.codigo());
        s.setTitulo(req.titulo().trim());
        s.setDescripcion(req.descripcion());
        s.setPeso(req.peso());
        return toSeccionResponse(s);
    }

    public void eliminarSeccion(Long seccionId) {
        SeccionPlantilla s = seccionRepo.findById(seccionId)
            .orElseThrow(() -> new ResourceNotFoundException("Sección", seccionId));
        if (Boolean.TRUE.equals(s.getPlantilla().getVigente())) {
            throw new BusinessException("Plantilla vigente: crea nueva versión para borrar secciones.");
        }
        seccionRepo.delete(s);
    }

    public CriterioResponse agregarCriterio(Long seccionId, CriterioRequest req) {
        SeccionPlantilla s = seccionRepo.findById(seccionId)
            .orElseThrow(() -> new ResourceNotFoundException("Sección", seccionId));
        if (Boolean.TRUE.equals(s.getPlantilla().getVigente())) {
            throw new BusinessException("Plantilla vigente: crea nueva versión para modificar criterios.");
        }
        CriterioPlantilla c = CriterioPlantilla.builder()
            .seccion(s)
            .orden(req.orden() == null ? (short) s.getCriterios().size() : req.orden())
            .codigo(req.codigo())
            .descripcion(req.descripcion().trim())
            .peso(req.peso())
            .placeholder(req.placeholder())
            .tipo(req.tipo() == null ? TipoCampo.NUMBER : req.tipo())
            .opciones(req.opciones())
            .build();
        return toCriterioResponse(criterioRepo.save(c));
    }

    public void reordenarSecciones(Long plantillaId, java.util.List<Long> ids) {
        PlantillaFormulario p = obtenerEntidad(plantillaId);
        if (Boolean.TRUE.equals(p.getVigente())) {
            throw new BusinessException("Plantilla vigente: crea nueva versión para reordenar.");
        }
        java.util.Map<Long, SeccionPlantilla> indice = new java.util.HashMap<>();
        for (SeccionPlantilla s : p.getSecciones()) indice.put(s.getId(), s);
        short orden = 0;
        for (Long sid : ids) {
            SeccionPlantilla s = indice.get(sid);
            if (s != null) s.setOrden(orden++);
        }
    }

    public void reordenarCriterios(Long seccionId, java.util.List<Long> ids) {
        SeccionPlantilla s = seccionRepo.findById(seccionId)
            .orElseThrow(() -> new ResourceNotFoundException("Sección", seccionId));
        if (Boolean.TRUE.equals(s.getPlantilla().getVigente())) {
            throw new BusinessException("Plantilla vigente: crea nueva versión para reordenar.");
        }
        java.util.Map<Long, CriterioPlantilla> indice = new java.util.HashMap<>();
        for (CriterioPlantilla c : s.getCriterios()) indice.put(c.getId(), c);
        short orden = 0;
        for (Long cid : ids) {
            CriterioPlantilla c = indice.get(cid);
            if (c != null) c.setOrden(orden++);
        }
    }

    public CriterioResponse actualizarCriterio(Long criterioId, CriterioRequest req) {
        CriterioPlantilla c = criterioRepo.findById(criterioId)
            .orElseThrow(() -> new ResourceNotFoundException("Criterio", criterioId));
        if (Boolean.TRUE.equals(c.getSeccion().getPlantilla().getVigente())) {
            throw new BusinessException("Plantilla vigente: crea nueva versión para modificar criterios.");
        }
        if (req.orden() != null) c.setOrden(req.orden());
        c.setCodigo(req.codigo());
        c.setDescripcion(req.descripcion().trim());
        c.setPeso(req.peso());
        c.setPlaceholder(req.placeholder());
        if (req.tipo() != null) c.setTipo(req.tipo());
        c.setOpciones(req.opciones());
        return toCriterioResponse(c);
    }

    public void eliminarCriterio(Long criterioId) {
        CriterioPlantilla c = criterioRepo.findById(criterioId)
            .orElseThrow(() -> new ResourceNotFoundException("Criterio", criterioId));
        if (Boolean.TRUE.equals(c.getSeccion().getPlantilla().getVigente())) {
            throw new BusinessException("Plantilla vigente: crea nueva versión para borrar criterios.");
        }
        criterioRepo.delete(c);
    }

    PlantillaResponse toResponse(PlantillaFormulario p) {
        return new PlantillaResponse(
            p.getId(), p.getCodigo(), p.getVersion(), p.getTipo(), p.getNombre(),
            p.getDescripcion(), Boolean.TRUE.equals(p.getVigente()),
            p.getFechaVigencia(), p.getCreadoPorNombre(),
            p.getSecciones().stream().map(this::toSeccionResponse).toList(),
            p.getCreatedAt(), p.getUpdatedAt());
    }

    SeccionResponse toSeccionResponse(SeccionPlantilla s) {
        return new SeccionResponse(s.getId(), s.getOrden(), s.getCodigo(), s.getTitulo(),
            s.getDescripcion(), s.getPeso(),
            s.getCriterios().stream().map(this::toCriterioResponse).toList());
    }

    CriterioResponse toCriterioResponse(CriterioPlantilla c) {
        return new CriterioResponse(c.getId(), c.getOrden(), c.getCodigo(),
            c.getDescripcion(), c.getPeso(), c.getPlaceholder(),
            c.getTipo(), c.getOpciones());
    }
}
