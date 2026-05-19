package co.uempresarial.sivu.trimestre.web;

import co.uempresarial.sivu.trimestre.domain.*;
import co.uempresarial.sivu.trimestre.web.dto.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TrimestreMapper {

    private final ObjectMapper objectMapper;

    public TrimestreResponse toResponse(Trimestre t,
                                        boolean tienePA,
                                        long totalActas,
                                        long totalPM,
                                        boolean tieneET,
                                        boolean tieneEP) {
        return new TrimestreResponse(
            t.getId(),
            t.getConvenio() != null ? t.getConvenio().getId() : null,
            t.getConvenio() != null ? t.getConvenio().getNumeroConvenio() : null,
            t.getNumero(),
            t.getMateriaNucleo(),
            t.getFechaInicio(),
            t.getFechaFin(),
            t.getEstado(),
            tienePA, totalActas, totalPM, tieneET, tieneEP,
            t.getCreatedAt(), t.getUpdatedAt()
        );
    }

    public PlanActividadesResponse toResponse(PlanActividades pa) {
        List<PlanActividadesResponse.ObjetivoResponse> objs = new ArrayList<>();
        for (PlanActividadesObjetivo o : pa.getObjetivos()) {
            objs.add(new PlanActividadesResponse.ObjetivoResponse(
                o.getId(), o.getEscenario(), o.getDescripcion(),
                Boolean.TRUE.equals(o.getSeleccionado()), o.getOrden()));
        }
        List<PlanActividadesResponse.MesResponse> meses = new ArrayList<>();
        for (PlanActividadesMes m : pa.getMeses()) {
            meses.add(new PlanActividadesResponse.MesResponse(
                m.getId(), m.getMes(), m.getAreaRotacion(), m.getActividades(), m.getTutorNombre()));
        }
        return new PlanActividadesResponse(
            pa.getId(),
            pa.getTrimestre() != null ? pa.getTrimestre().getId() : null,
            pa.getEscenarioCoformacion(),
            pa.getPemDescripcionEscenario(),
            pa.getPemObjetivoGeneral(),
            pa.getEstado(),
            Boolean.TRUE.equals(pa.getFirmadoEstudiante()),
            Boolean.TRUE.equals(pa.getFirmadoTutor()),
            Boolean.TRUE.equals(pa.getFirmadoProfesor()),
            pa.getFechaFirmaEstudiante(),
            pa.getFechaFirmaTutor(),
            pa.getFechaFirmaProfesor(),
            pa.getDocumentoPdf() != null ? pa.getDocumentoPdf().getId() : null,
            objs, meses,
            pa.getCreatedAt(), pa.getUpdatedAt()
        );
    }

    public ActaReunionResponse toResponse(ActaReunion a) {
        List<ActaReunionResponse.Asistente> asistentes = parseAsistentes(a.getAsistentesJson());
        List<ActaReunionResponse.Tema> temas = new ArrayList<>();
        for (ActaTema t : a.getTemas()) {
            temas.add(new ActaReunionResponse.Tema(t.getId(), t.getTema(), t.getObservaciones(), t.getOrden()));
        }
        return new ActaReunionResponse(
            a.getId(),
            a.getTrimestre() != null ? a.getTrimestre().getId() : null,
            a.getNumero(),
            a.getFecha(),
            a.getHora(),
            a.getLugar(),
            a.getAsunto(),
            a.getTipoReunion(),
            asistentes,
            a.getObservaciones(),
            Boolean.TRUE.equals(a.getFirmadoEstudiante()),
            Boolean.TRUE.equals(a.getFirmadoTutor()),
            Boolean.TRUE.equals(a.getFirmadoProfesor()),
            a.getDocumentoPdf() != null ? a.getDocumentoPdf().getId() : null,
            temas,
            a.getCreatedAt(), a.getUpdatedAt()
        );
    }

    public PlanMejoraResponse toResponse(PlanMejora pm) {
        return new PlanMejoraResponse(
            pm.getId(),
            pm.getTrimestre() != null ? pm.getTrimestre().getId() : null,
            pm.getNumero(),
            pm.getTitulo(),
            pm.getProblema(),
            pm.getObjetivo(),
            pm.getActividades(),
            pm.getIndicadores(),
            pm.getEstado(),
            pm.getEsOpcionDeGrado(),
            pm.getNumeroPaginas(),
            pm.getNotaFinal(),
            pm.getDocumentoPdf() != null ? pm.getDocumentoPdf().getId() : null,
            pm.getCreatedAt(), pm.getUpdatedAt()
        );
    }

    public EvaluacionTutorResponse toResponse(EvaluacionTutorTrimestre e) {
        return new EvaluacionTutorResponse(
            e.getId(),
            e.getTrimestre() != null ? e.getTrimestre().getId() : null,
            e.getCapacidades(), e.getActitudes(),
            e.getAplicacionDesempeno(), e.getAplicacionElaboracionPem(), e.getAplicacionSustentacionPem(),
            e.getNotaPonderada(),
            e.getContinuidadConEmpresa(),
            e.getObservaciones(),
            e.getFechaElaboracion(),
            Boolean.TRUE.equals(e.getFirmadoTutor()),
            Boolean.TRUE.equals(e.getFirmadoEstudiante()),
            e.getDocumentoPdf() != null ? e.getDocumentoPdf().getId() : null,
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    public EvaluacionProfesorResponse toResponse(EvaluacionProfesorTrimestre e) {
        return new EvaluacionProfesorResponse(
            e.getId(),
            e.getTrimestre() != null ? e.getTrimestre().getId() : null,
            // Corte 1
            e.getCapacidades(), e.getActitudes(),
            e.getAplicacionDesempeno(), e.getAplicacionElaboracionPem(), e.getAplicacionSustentacionPem(),
            e.getNotaPonderada(),
            e.getObservacionesC1(),
            e.getFechaC1(),
            // Corte 2
            e.getCapacidadesC2(), e.getActitudesC2(),
            e.getAplicacionDesempenoC2(), e.getAplicacionElaboracionPemC2(), e.getAplicacionSustentacionPemC2(),
            e.getNotaPonderadaC2(),
            e.getObservacionesC2(),
            e.getFechaC2(),
            // Legacy combinados
            e.getObservaciones(),
            e.getFechaElaboracion(),
            // Estado
            Boolean.TRUE.equals(e.getFirmadoProfesor()),
            Boolean.TRUE.equals(e.getFirmadoEstudiante()),
            e.getDocumentoPdf() != null ? e.getDocumentoPdf().getId() : null,
            e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    public List<ActaReunionResponse.Asistente> parseAsistentes(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            List<Map<String, Object>> raw = objectMapper.readValue(json, new TypeReference<>() {});
            List<ActaReunionResponse.Asistente> out = new ArrayList<>();
            for (Map<String, Object> m : raw) {
                out.add(new ActaReunionResponse.Asistente(
                    str(m.get("nombre")), str(m.get("rol")), str(m.get("correo"))));
            }
            return out;
        } catch (Exception ex) {
            return List.of();
        }
    }

    public String asistentesToJson(List<ActaReunionRequest.AsistenteRequest> asistentes) {
        if (asistentes == null || asistentes.isEmpty()) return null;
        try {
            List<Map<String, String>> rows = new ArrayList<>();
            for (ActaReunionRequest.AsistenteRequest a : asistentes) {
                Map<String, String> m = new java.util.LinkedHashMap<>();
                m.put("nombre", a.nombre());
                m.put("rol", a.rol());
                m.put("correo", a.correo());
                rows.add(m);
            }
            return objectMapper.writeValueAsString(rows);
        } catch (Exception ex) {
            return null;
        }
    }

    private String str(Object o) { return o == null ? null : o.toString(); }
}
