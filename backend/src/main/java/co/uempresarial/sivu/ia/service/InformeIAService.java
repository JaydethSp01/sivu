package co.uempresarial.sivu.ia.service;

import co.uempresarial.sivu.ia.web.dto.IADtos.FeedbackInformeResponse;
import co.uempresarial.sivu.ia.web.dto.IADtos.HallazgoIA;
import co.uempresarial.sivu.informefinalpm.domain.InformeFinalPm;
import co.uempresarial.sivu.informefinalpm.persistence.InformeFinalPmRepository;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
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

    private static int palabras(String s) {
        if (s == null) return 0;
        String t = s.trim();
        if (t.isEmpty()) return 0;
        return t.split("\\s+").length;
    }
}
