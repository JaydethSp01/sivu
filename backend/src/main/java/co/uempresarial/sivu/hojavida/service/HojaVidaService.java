package co.uempresarial.sivu.hojavida.service;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.estudiante.persistence.EstudianteRepository;
import co.uempresarial.sivu.hojavida.domain.*;
import co.uempresarial.sivu.hojavida.persistence.HojaVidaRepository;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaRequest;
import co.uempresarial.sivu.hojavida.web.dto.HojaVidaResponse;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class HojaVidaService {

    private final HojaVidaRepository repository;
    private final EstudianteRepository estudianteRepository;

    @Transactional(readOnly = true)
    public HojaVidaResponse obtener(Long estudianteId) {
        HojaVida hv = repository.findByEstudianteId(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "El estudiante " + estudianteId + " aún no tiene Hoja de Vida creada"));
        return toResponse(hv);
    }

    @Transactional(readOnly = true)
    public Optional<HojaVidaResponse> obtenerOpcional(Long estudianteId) {
        return repository.findByEstudianteId(estudianteId).map(this::toResponse);
    }

    /**
     * Crear o actualizar de manera idempotente. Si no existe, la crea; si existe,
     * reemplaza todas las sub-listas (estrategia "full replace").
     */
    public HojaVidaResponse guardar(Long estudianteId, HojaVidaRequest request) {
        Estudiante estudiante = estudianteRepository.findById(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException("Estudiante", estudianteId));

        HojaVida hv = repository.findByEstudianteId(estudianteId)
            .orElseGet(() -> HojaVida.builder().estudiante(estudiante).build());

        hv.setDireccion(request.direccion());
        hv.setTelefonoContacto(request.telefonoContacto());
        hv.setCiudad(request.ciudad());
        hv.setFotoPath(request.fotoPath());
        hv.setPerfilSaber(request.perfilSaber());
        hv.setPerfilHacer(request.perfilHacer());
        hv.setPerfilSer(request.perfilSer());
        hv.setUltimaActualizacion(OffsetDateTime.now());

        // Replace-all en sub-listas
        hv.getHabilidades().clear();
        if (request.habilidades() != null) {
            int i = 0;
            for (var h : request.habilidades()) {
                hv.getHabilidades().add(HojaVidaHabilidad.builder()
                    .hojaVida(hv)
                    .categoria(h.categoria())
                    .descripcion(h.descripcion())
                    .orden(h.orden() != null ? h.orden() : (short) i++)
                    .build());
            }
        }

        hv.getIdiomas().clear();
        if (request.idiomas() != null) {
            int i = 0;
            for (var d : request.idiomas()) {
                hv.getIdiomas().add(HojaVidaIdioma.builder()
                    .hojaVida(hv)
                    .idioma(d.idioma())
                    .nivel(d.nivel())
                    .orden(d.orden() != null ? d.orden() : (short) i++)
                    .build());
            }
        }

        hv.getEducacion().clear();
        if (request.educacion() != null) {
            int i = 0;
            for (var e : request.educacion()) {
                hv.getEducacion().add(HojaVidaEducacion.builder()
                    .hojaVida(hv)
                    .programa(e.programa())
                    .institucion(e.institucion())
                    .fechaInicio(e.fechaInicio())
                    .fechaFin(e.fechaFin())
                    .enCurso(Boolean.TRUE.equals(e.enCurso()))
                    .observaciones(e.observaciones())
                    .orden(e.orden() != null ? e.orden() : (short) i++)
                    .build());
            }
        }

        hv.getExperienciaFase().clear();
        if (request.experienciaFase() != null) {
            int i = 0;
            for (var x : request.experienciaFase()) {
                hv.getExperienciaFase().add(HojaVidaExperienciaFase.builder()
                    .hojaVida(hv)
                    .empresa(x.empresa())
                    .cargo(x.cargo())
                    .fechaInicio(x.fechaInicio())
                    .fechaFin(x.fechaFin())
                    .enCurso(Boolean.TRUE.equals(x.enCurso()))
                    .descripcion(x.descripcion())
                    .orden(x.orden() != null ? x.orden() : (short) i++)
                    .build());
            }
        }

        hv.getExperienciaLaboral().clear();
        if (request.experienciaLaboral() != null) {
            int i = 0;
            for (var x : request.experienciaLaboral()) {
                hv.getExperienciaLaboral().add(HojaVidaExperienciaLaboral.builder()
                    .hojaVida(hv)
                    .empresa(x.empresa())
                    .cargo(x.cargo())
                    .fechaInicio(x.fechaInicio())
                    .fechaFin(x.fechaFin())
                    .enCurso(Boolean.TRUE.equals(x.enCurso()))
                    .descripcion(x.descripcion())
                    .orden(x.orden() != null ? x.orden() : (short) i++)
                    .build());
            }
        }

        HojaVida saved = repository.save(hv);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public HojaVida obtenerEntidad(Long estudianteId) {
        return repository.findByEstudianteId(estudianteId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "El estudiante " + estudianteId + " aún no tiene Hoja de Vida creada"));
    }

    private HojaVidaResponse toResponse(HojaVida hv) {
        Estudiante e = hv.getEstudiante();
        String nombreCompleto = (e.getNombres() + " " + e.getApellidos()).trim();
        List<HojaVidaResponse.HabilidadResponse> hab = new ArrayList<>();
        hv.getHabilidades().forEach(h -> hab.add(new HojaVidaResponse.HabilidadResponse(
            h.getId(), h.getCategoria(), h.getDescripcion(), h.getOrden())));
        List<HojaVidaResponse.IdiomaResponse> idi = new ArrayList<>();
        hv.getIdiomas().forEach(i -> idi.add(new HojaVidaResponse.IdiomaResponse(
            i.getId(), i.getIdioma(), i.getNivel(), i.getOrden())));
        List<HojaVidaResponse.EducacionResponse> edu = new ArrayList<>();
        hv.getEducacion().forEach(x -> edu.add(new HojaVidaResponse.EducacionResponse(
            x.getId(), x.getPrograma(), x.getInstitucion(), x.getFechaInicio(), x.getFechaFin(),
            x.getEnCurso(), x.getObservaciones(), x.getOrden())));
        List<HojaVidaResponse.ExperienciaFaseResponse> exF = new ArrayList<>();
        hv.getExperienciaFase().forEach(x -> exF.add(new HojaVidaResponse.ExperienciaFaseResponse(
            x.getId(), x.getEmpresa(), x.getCargo(), x.getFechaInicio(), x.getFechaFin(),
            x.getEnCurso(), x.getDescripcion(), x.getOrden())));
        List<HojaVidaResponse.ExperienciaLaboralResponse> exL = new ArrayList<>();
        hv.getExperienciaLaboral().forEach(x -> exL.add(new HojaVidaResponse.ExperienciaLaboralResponse(
            x.getId(), x.getEmpresa(), x.getCargo(), x.getFechaInicio(), x.getFechaFin(),
            x.getEnCurso(), x.getDescripcion(), x.getOrden())));

        return new HojaVidaResponse(
            hv.getId(), e.getId(), nombreCompleto, e.getEmail(),
            e.getProgramaAcademico(), e.getSemestre(),
            hv.getDireccion(), hv.getTelefonoContacto(), hv.getCiudad(), hv.getFotoPath(),
            hv.getPerfilSaber(), hv.getPerfilHacer(), hv.getPerfilSer(),
            hv.estaCompleta(),
            hv.getUltimaActualizacion(),
            hv.getCreatedAt(), hv.getUpdatedAt(),
            hab, idi, edu, exF, exL);
    }
}
