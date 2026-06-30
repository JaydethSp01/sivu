package co.uempresarial.sivu.ia.service;

import co.uempresarial.sivu.ia.web.dto.IADtos.CoherenciaPlanResponse;
import co.uempresarial.sivu.ia.web.dto.IADtos.FeedbackInformeResponse;
import co.uempresarial.sivu.ia.web.dto.IADtos.HallazgoIA;
import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.informefinalpm.persistence.InformeFinalPmRepository;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import co.uempresarial.sivu.trimestre.domain.PlanActividades;
import co.uempresarial.sivu.trimestre.domain.PlanActividadesMes;
import co.uempresarial.sivu.trimestre.domain.PlanActividadesObjetivo;
import co.uempresarial.sivu.trimestre.persistence.PlanActividadesRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Asistencia automatizada al estudiante sobre su Informe Final del PM
 * (§6.4 del doc Coformación).
 *
 * El análisis SE EJECUTA LOCAL EN EL SERVIDOR — no se llama a ninguna API
 * externa con API key. Para análisis profundo con Claude, la profe / el
 * estudiante conecta su Claude Desktop o Claude Code al MCP server que vive
 * en {@code mcp-server/} de este repo; ese MCP expone las herramientas para
 * que Claude consulte SIVU directamente (lectura del informe, comentarios,
 * etc.) y genere feedback en su propia sesión.
 *
 * Lo que devuelve este servicio es un análisis heurístico determinista:
 * detecta secciones vacías o demasiado cortas, valida nivel/título de la
 * carátula, controla la cota de páginas y emite recomendaciones de mejora.
 * Útil como pre-flight antes de pedir revisión externa o entregar formal.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class InformeIAService {

    private static final int MIN_PALABRAS_SECCION = 60;
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final HttpClient HTTP = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5)).build();

    private final InformeFinalPmRepository repository;
    private final PlanActividadesRepository planActividadesRepository;

    /**
     * URL del IA sidecar (Node + claude-agent-sdk con el plan Claude Code).
     * Si está vacío, o si el sidecar falla, se usa el revisor heurístico local.
     * Ej: http://localhost:8090
     */
    @Value("${app.ia.sidecar-url:}")
    private String sidecarUrl;

    public FeedbackInformeResponse revisar(Long informeId) {
        InformeFinalPm informe = repository.findById(informeId)
            .orElseThrow(() -> new ResourceNotFoundException("InformeFinalPm", informeId));

        // 1) Intentar el sidecar de IA (Claude Code plan) si está configurado.
        if (sidecarUrl != null && !sidecarUrl.isBlank()) {
            try {
                return revisarConSidecar(informe);
            } catch (Exception ex) {
                log.warn("[IA] sidecar no disponible ({}), uso heurístico local", ex.getMessage());
            }
        }
        // 2) Fallback determinista local (sin red).
        return revisarHeuristico(informe);
    }

    private FeedbackInformeResponse revisarConSidecar(InformeFinalPm i) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("tituloInforme", i.getTituloInforme());
        payload.put("nivel", i.getNivel());
        payload.put("numeroPaginas", i.getNumeroPaginas());
        payload.put("resumenEjecutivo", i.getResumenEjecutivo());
        payload.put("contextualizacion", i.getContextualizacion());
        payload.put("planteamientoProblema", i.getPlanteamientoProblema());
        payload.put("marcoTeorico", i.getMarcoTeorico());
        payload.put("objetivoGeneral", i.getObjetivoGeneral());
        payload.put("objetivosEspecificos", i.getObjetivosEspecificos());
        payload.put("diagnostico", i.getDiagnostico());
        payload.put("metodologia", i.getMetodologia());
        payload.put("propuestaSolucion", i.getPropuestaSolucion());
        payload.put("factibilidad", i.getFactibilidad());
        payload.put("conclusiones", i.getConclusiones());

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(sidecarUrl.replaceAll("/+$", "") + "/review"))
            .timeout(Duration.ofSeconds(120))
            .header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(payload)))
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() / 100 != 2) {
            throw new RuntimeException("sidecar HTTP " + resp.statusCode());
        }
        JsonNode json = MAPPER.readTree(resp.body());
        String md = json.path("reporteMarkdown").asText("");
        if (md.isBlank()) throw new RuntimeException("sidecar devolvió vacío");
        // Hallazgos estructurados extraídos del markdown (best-effort).
        List<HallazgoIA> hallazgos = new ArrayList<>();
        boolean en = false;
        for (String l : md.split("\\r?\\n")) {
            String t = l.trim();
            if (t.toLowerCase().startsWith("## hallazgos")) { en = true; continue; }
            if (t.startsWith("## ") && en) break;
            if (en && t.startsWith("- ")) hallazgos.add(new HallazgoIA("MEDIO", "—", t.substring(2)));
        }
        return new FeedbackInformeResponse("claude-code", md, hallazgos,
            "Revisión generada con el plan de Claude Code (sin API key) vía el IA sidecar.");
    }

    private FeedbackInformeResponse revisarHeuristico(InformeFinalPm i) {
        List<HallazgoIA> hallazgos = new ArrayList<>();
        StringBuilder md = new StringBuilder();
        md.append("## Resumen ejecutivo\n");

        int seccionesVacias = 0, seccionesPobres = 0;
        record S(String nombre, String texto) {}
        List<S> secciones = List.of(
            new S("Resumen Ejecutivo", i.getResumenEjecutivo()),
            new S("Contextualización", i.getContextualizacion()),
            new S("Planteamiento del Problema", i.getPlanteamientoProblema()),
            new S("Marco Teórico", i.getMarcoTeorico()),
            new S("Objetivo General", i.getObjetivoGeneral()),
            new S("Objetivos Específicos", i.getObjetivosEspecificos()),
            new S("Diagnóstico", i.getDiagnostico()),
            new S("Metodología", i.getMetodologia()),
            new S("Propuesta de Solución", i.getPropuestaSolucion()),
            new S("Factibilidad", i.getFactibilidad()),
            new S("Conclusiones", i.getConclusiones())
        );
        for (S s : secciones) {
            int palabras = palabras(s.texto());
            if (palabras == 0) {
                seccionesVacias++;
                hallazgos.add(new HallazgoIA("ALTO", s.nombre(),
                    "Sección vacía: el formato GTC-FM-16 la requiere."));
            } else if (palabras < MIN_PALABRAS_SECCION) {
                seccionesPobres++;
                hallazgos.add(new HallazgoIA("MEDIO", s.nombre(),
                    "Solo " + palabras + " palabras. Mínimo sugerido: " + MIN_PALABRAS_SECCION + "."));
            }
        }

        if (i.getNivel() == null) {
            hallazgos.add(new HallazgoIA("BAJO", "Nivel del informe",
                "No has indicado nivel (1/2/3). El formato real lo requiere en cabecera."));
        }
        if (i.getTituloInforme() == null || i.getTituloInforme().isBlank()) {
            hallazgos.add(new HallazgoIA("MEDIO", "Carátula",
                "Falta título del informe — aparecerá vacío en la carátula del PDF."));
        }
        if (i.getNumeroPaginas() != null && i.getNumeroPaginas() > 15) {
            hallazgos.add(new HallazgoIA("ALTO", "Extensión",
                "Reportaste " + i.getNumeroPaginas() + " páginas; el máximo institucional es 15."));
        }

        String veredicto;
        if (seccionesVacias > 0) {
            md.append("Tu informe tiene **").append(seccionesVacias).append(" sección(es) vacías**. ");
            veredicto = "NO";
        } else if (seccionesPobres > 0) {
            md.append("Tu informe tiene **").append(seccionesPobres).append(" sección(es) muy cortas**. ");
            veredicto = "CASI";
        } else {
            md.append("Tu informe tiene contenido en todas las secciones. ");
            veredicto = "SI";
        }
        md.append("Revisa los hallazgos a continuación.\n\n");

        md.append("## Hallazgos\n");
        if (hallazgos.isEmpty()) {
            md.append("- Sin hallazgos automáticos. Excelente avance.\n");
        } else {
            for (HallazgoIA h : hallazgos) {
                md.append("- **[").append(h.severidad()).append("] ").append(h.seccion()).append("**: ")
                    .append(h.detalle()).append("\n");
            }
        }
        md.append("\n## Recomendaciones\n");
        if (seccionesVacias > 0) md.append("- Completa las secciones vacías antes de entregar.\n");
        if (seccionesPobres > 0) md.append("- Amplía las secciones cortas con datos concretos, fuentes y ejemplos.\n");
        md.append("- Revisa que cada objetivo específico se aborde explícitamente en la metodología.\n");
        md.append("- Verifica que las conclusiones respondan al objetivo general planteado.\n");
        md.append("- Para una revisión más profunda con un LLM, conecta tu Claude Desktop o Claude Code al MCP server `sivu-mcp-server` que vive en `mcp-server/` y pídele que revise el informe.\n\n");
        md.append("## ¿Listo para entregar?\n").append(veredicto).append(" — ");
        md.append(veredicto.equals("SI") ? "Estás en buen estado para entregar."
            : veredicto.equals("CASI") ? "Ajustes menores y queda listo."
            : "Faltan secciones críticas, no entregues aún.");

        String aviso = "Análisis local (sin llamadas externas a APIs LLM). " +
            "Para feedback profundo con Claude, usa el MCP server del repo (Claude Desktop / Claude Code).";

        return new FeedbackInformeResponse("local", md.toString(), hallazgos, aviso);
    }

    // =====================================================================
    //  Coherencia del Plan de Actividades (GAC-FM-10) — asistencia de IA.
    //  Mismo patrón: intenta el sidecar (plan Claude Code, sin API key) y,
    //  si no está configurado o falla, cae al chequeo heurístico local.
    //  NUNCA bloquea: solo devuelve advertencias/sugerencias informativas.
    // =====================================================================

    public CoherenciaPlanResponse coherenciaPlan(Long trimestreId) {
        PlanActividades plan = planActividadesRepository.findByTrimestreId(trimestreId)
            .orElseThrow(() -> new ResourceNotFoundException("PlanActividades (trimestre)", trimestreId));

        if (sidecarUrl != null && !sidecarUrl.isBlank()) {
            try {
                return coherenciaConSidecar(plan);
            } catch (Exception ex) {
                log.warn("[IA] sidecar coherencia no disponible ({}), uso heurístico local", ex.getMessage());
            }
        }
        return coherenciaHeuristica(plan);
    }

    private CoherenciaPlanResponse coherenciaConSidecar(PlanActividades plan) throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("escenarioCoformacion", plan.getEscenarioCoformacion());
        payload.put("pemObjetivoGeneral", plan.getPemObjetivoGeneral());
        payload.put("pemDescripcionEscenario", plan.getPemDescripcionEscenario());

        List<Map<String, Object>> objetivos = new ArrayList<>();
        for (PlanActividadesObjetivo o : plan.getObjetivos()) {
            if (o.getSeleccionado() == null || !o.getSeleccionado()) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("escenario", o.getEscenario());
            m.put("descripcion", o.getDescripcion());
            objetivos.add(m);
        }
        payload.put("objetivos", objetivos);

        List<Map<String, Object>> meses = new ArrayList<>();
        for (PlanActividadesMes mes : plan.getMeses()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("mes", mes.getMes());
            m.put("areaRotacion", mes.getAreaRotacion());
            m.put("actividades", mes.getActividades());
            meses.add(m);
        }
        payload.put("meses", meses);

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create(sidecarUrl.replaceAll("/+$", "") + "/coherencia"))
            .timeout(Duration.ofSeconds(120))
            .header("content-type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(MAPPER.writeValueAsString(payload)))
            .build();
        HttpResponse<String> resp = HTTP.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() / 100 != 2) {
            throw new RuntimeException("sidecar HTTP " + resp.statusCode());
        }
        JsonNode json = MAPPER.readTree(resp.body());
        String md = json.path("reporteMarkdown").asText("");
        if (md.isBlank()) throw new RuntimeException("sidecar devolvió vacío");

        List<HallazgoIA> advertencias = new ArrayList<>();
        boolean en = false;
        for (String l : md.split("\\r?\\n")) {
            String t = l.trim();
            if (t.toLowerCase().startsWith("## advertencias") || t.toLowerCase().startsWith("## hallazgos")) {
                en = true; continue;
            }
            if (t.startsWith("## ") && en) break;
            if (en && t.startsWith("- ")) advertencias.add(new HallazgoIA("MEDIO", "—", t.substring(2)));
        }
        return new CoherenciaPlanResponse("claude-code", md, advertencias,
            "Coherencia evaluada con el plan de Claude Code (sin API key) vía el IA sidecar. No bloquea la entrega.");
    }

    private CoherenciaPlanResponse coherenciaHeuristica(PlanActividades plan) {
        List<HallazgoIA> advertencias = new ArrayList<>();

        List<PlanActividadesObjetivo> objetivos = plan.getObjetivos().stream()
            .filter(o -> o.getSeleccionado() == null || o.getSeleccionado())
            .toList();
        List<PlanActividadesMes> meses = plan.getMeses();

        // 1) Objetivo general / escenario de coformación.
        if (palabras(plan.getPemObjetivoGeneral()) == 0) {
            advertencias.add(new HallazgoIA("ALTO", "Objetivo general (PEM)",
                "No has definido el objetivo general del PEM; sin él no se puede juzgar la coherencia del plan."));
        }
        if (plan.getEscenarioCoformacion() == null || plan.getEscenarioCoformacion().isBlank()) {
            advertencias.add(new HallazgoIA("BAJO", "Escenario de coformación",
                "Falta el escenario de coformación en la cabecera del plan."));
        }

        // 2) Objetivos específicos.
        if (objetivos.isEmpty()) {
            advertencias.add(new HallazgoIA("ALTO", "Objetivos específicos",
                "No hay objetivos seleccionados. Define al menos un objetivo a desarrollar en el trimestre."));
        } else {
            int idx = 0;
            for (PlanActividadesObjetivo o : objetivos) {
                idx++;
                if (palabras(o.getDescripcion()) < 4) {
                    advertencias.add(new HallazgoIA("MEDIO", "Objetivo " + idx,
                        "Objetivo demasiado escueto; redáctalo como un logro medible (verbo + resultado esperado)."));
                }
            }
        }

        // 3) Cronograma por mes.
        if (meses.isEmpty()) {
            advertencias.add(new HallazgoIA("ALTO", "Cronograma",
                "El plan no tiene meses cargados. El trimestre debe desglosarse mes a mes."));
        } else {
            for (PlanActividadesMes mes : meses) {
                String etiqueta = "Mes " + (mes.getMes() != null ? mes.getMes() : "?");
                if (palabras(mes.getActividades()) == 0) {
                    advertencias.add(new HallazgoIA("ALTO", etiqueta,
                        "Sin actividades definidas. Cada mes del trimestre debe listar las actividades a realizar."));
                } else if (palabras(mes.getActividades()) < 6) {
                    advertencias.add(new HallazgoIA("MEDIO", etiqueta,
                        "Actividades muy genéricas; detalla tareas concretas para poder verificar el avance."));
                }
                if (mes.getAreaRotacion() == null || mes.getAreaRotacion().isBlank()) {
                    advertencias.add(new HallazgoIA("BAJO", etiqueta,
                        "Falta el área de rotación; ayuda a contextualizar las actividades del mes."));
                }
            }
        }

        // 4) Cobertura objetivos <-> actividades (heurística por palabras clave).
        if (!objetivos.isEmpty() && !meses.isEmpty()) {
            String corpusActividades = meses.stream()
                .map(m -> m.getActividades() == null ? "" : m.getActividades())
                .reduce("", (a, b) -> a + " " + b)
                .toLowerCase();
            int idx = 0;
            for (PlanActividadesObjetivo o : objetivos) {
                idx++;
                if (!cubreObjetivo(o.getDescripcion(), corpusActividades)) {
                    advertencias.add(new HallazgoIA("MEDIO", "Objetivo " + idx,
                        "No se observan actividades en el cronograma que aborden este objetivo; "
                        + "agrega tareas mensuales que lo desarrollen."));
                }
            }
        }

        long altos = advertencias.stream().filter(h -> "ALTO".equals(h.severidad())).count();
        String veredicto = altos > 0 ? "INCOHERENTE" : (advertencias.isEmpty() ? "COHERENTE" : "MEJORABLE");

        StringBuilder md = new StringBuilder();
        md.append("## Resumen ejecutivo\n");
        md.append(switch (veredicto) {
            case "COHERENTE" -> "El plan de actividades luce coherente: objetivos definidos y un cronograma con actividades en cada mes.";
            case "MEJORABLE" -> "El plan es viable pero tiene puntos por afinar para que objetivos y cronograma encajen mejor.";
            default -> "El plan tiene vacíos importantes que conviene resolver antes de firmar; revisa las advertencias de severidad ALTA.";
        });
        md.append("\n\n## Advertencias\n");
        if (advertencias.isEmpty()) {
            md.append("- Sin advertencias automáticas. Buen nivel de detalle.\n");
        } else {
            for (HallazgoIA h : advertencias) {
                md.append("- **[").append(h.severidad()).append("] ").append(h.seccion()).append("**: ")
                    .append(h.detalle()).append("\n");
            }
        }
        md.append("\n## Recomendaciones\n");
        md.append("- Asegúrate de que cada objetivo específico tenga al menos una actividad mensual que lo desarrolle.\n");
        md.append("- Detalla las actividades con verbos de acción y entregables verificables.\n");
        md.append("- Alinea las áreas de rotación con los objetivos del PEM.\n\n");
        md.append("## Veredicto de coherencia\n").append(veredicto).append(" — ");
        md.append(switch (veredicto) {
            case "COHERENTE" -> "Listo para revisión y firma.";
            case "MEJORABLE" -> "Ajustes menores recomendados (no obligatorios).";
            default -> "Completa la información faltante para que el plan sea evaluable.";
        });

        String aviso = "Análisis local de coherencia (sin llamadas externas a APIs LLM). "
            + "Es informativo y NO bloquea la firma del plan. "
            + "Para una revisión profunda con Claude, configura `app.ia.sidecar-url` o usa el MCP server del repo.";

        return new CoherenciaPlanResponse("local", md.toString(), advertencias, aviso);
    }

    /** Heurística simple: ¿alguna palabra significativa del objetivo aparece en las actividades? */
    private static boolean cubreObjetivo(String objetivo, String corpusActividades) {
        if (objetivo == null || objetivo.isBlank() || corpusActividades.isBlank()) return true; // no penalizar sin datos
        for (String w : objetivo.toLowerCase().split("[^\\p{L}]+")) {
            if (w.length() >= 5 && corpusActividades.contains(w)) return true;
        }
        return false;
    }

    private static int palabras(String s) {
        if (s == null) return 0;
        String t = s.trim();
        if (t.isEmpty()) return 0;
        return t.split("\\s+").length;
    }
}
