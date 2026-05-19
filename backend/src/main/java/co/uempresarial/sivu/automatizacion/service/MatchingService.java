package co.uempresarial.sivu.automatizacion.service;

import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.vacante.domain.Vacante;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Calcula el score de compatibilidad (0–100) entre un estudiante y una vacante.
 *
 * <p>Componentes y pesos:
 * <ul>
 *   <li>Programa académico afín:         25 pts</li>
 *   <li>Créditos mínimos cumplidos:      20 pts</li>
 *   <li>Promedio mínimo cumplido:        15 pts</li>
 *   <li>Match de keywords (TF):          30 pts (proporcional al % de keywords presentes)</li>
 *   <li>Bonus continuidad con la empresa:10 pts (si el estudiante ya hizo práctica con
 *                                                la misma empresa de la vacante)</li>
 * </ul>
 *
 * <p>Los pesos están afinados para premiar fuertemente la afinidad de programa académico
 * (criterio del proceso real de la Uniempresarial) y dar un empujón a la continuidad
 * que tantas veces decide la rotación entre semestres.
 */
@Service
@Slf4j
public class MatchingService {

    static final int PESO_PROGRAMA = 25;
    static final int PESO_CREDITOS = 20;
    static final int PESO_PROMEDIO = 15;
    static final int PESO_KEYWORDS = 30;
    static final int PESO_CONTINUIDAD = 10;

    private final int umbralRecomendacion;
    private final ConvenioRepository convenioRepository;

    public MatchingService(
        @Value("${app.matching.score-minimo-recomendacion:70}") int umbralRecomendacion,
        ConvenioRepository convenioRepository
    ) {
        this.umbralRecomendacion = umbralRecomendacion;
        this.convenioRepository = convenioRepository;
    }

    /** Score acumulado + justificación legible + flag recomendado + desglose estructurado. */
    public record ResultadoMatching(
        BigDecimal score,
        String justificacion,
        boolean recomendado,
        List<DesgloseCriterio> desglose
    ) {}

    /** Un criterio del score, con peso, obtenido y mensaje listo para UI. */
    public record DesgloseCriterio(
        String codigo,        // PROGRAMA, CREDITOS, PROMEDIO, KEYWORDS, CONTINUIDAD
        String nombre,        // "Programa académico afín"
        int pesoMaximo,       // 25, 20, ...
        BigDecimal obtenido,  // 0.0 .. peso
        boolean cumple,       // true si obtenido > 0
        String detalle,       // "Ingeniería de Sistemas coincide con la lista dirigida"
        String sugerencia     // "Si tu programa no aparece, valida con coordinación"
    ) {}

    public ResultadoMatching calcular(Estudiante estudiante, Vacante vacante) {
        List<DesgloseCriterio> desglose = new ArrayList<>(5);

        // 1) Programa académico
        Set<String> programasDirigidos = parseCsv(vacante.getProgramasDirigidos());
        String programaEst = normalizar(estudiante.getProgramaAcademico());
        boolean programaCoincide = programasDirigidos.isEmpty()
            || programasDirigidos.stream().map(this::normalizar).anyMatch(p -> p.equals(programaEst));
        desglose.add(new DesgloseCriterio(
            "PROGRAMA", "Programa académico afín",
            PESO_PROGRAMA,
            programaCoincide ? bd(PESO_PROGRAMA) : bd(0),
            programaCoincide,
            programaCoincide
                ? "Tu programa (" + safe(estudiante.getProgramaAcademico())
                    + ") está dentro de los dirigidos por la vacante."
                : "Tu programa (" + safe(estudiante.getProgramaAcademico())
                    + ") NO está entre los dirigidos: " + (programasDirigidos.isEmpty()
                        ? "(sin lista definida)" : programasDirigidos),
            programaCoincide ? null
                : "Habla con coordinación si crees que tu programa debería aplicar a esta vacante."
        ));

        // 2) Créditos
        boolean cumpleCreditos = estudiante.getCreditosAprobados() != null
            && vacante.getCreditosMinimos() != null
            && estudiante.getCreditosAprobados() >= vacante.getCreditosMinimos();
        desglose.add(new DesgloseCriterio(
            "CREDITOS", "Créditos mínimos",
            PESO_CREDITOS,
            cumpleCreditos ? bd(PESO_CREDITOS) : bd(0),
            cumpleCreditos,
            cumpleCreditos
                ? "Tienes " + estudiante.getCreditosAprobados()
                    + " créditos (requiere ≥ " + vacante.getCreditosMinimos() + ")."
                : "Tienes " + estudiante.getCreditosAprobados()
                    + " créditos pero la vacante exige ≥ " + vacante.getCreditosMinimos() + ".",
            cumpleCreditos ? null
                : "Te faltan "
                    + Math.max(0, (vacante.getCreditosMinimos() == null ? 0 : vacante.getCreditosMinimos())
                        - (estudiante.getCreditosAprobados() == null ? 0 : estudiante.getCreditosAprobados()))
                    + " créditos para alcanzar el mínimo."
        ));

        // 3) Promedio
        boolean cumplePromedio = estudiante.getPromedioAcumulado() != null
            && vacante.getPromedioMinimo() != null
            && estudiante.getPromedioAcumulado().compareTo(vacante.getPromedioMinimo()) >= 0;
        desglose.add(new DesgloseCriterio(
            "PROMEDIO", "Promedio acumulado",
            PESO_PROMEDIO,
            cumplePromedio ? bd(PESO_PROMEDIO) : bd(0),
            cumplePromedio,
            cumplePromedio
                ? "Tu promedio (" + estudiante.getPromedioAcumulado() + ") cumple el mínimo de "
                    + vacante.getPromedioMinimo() + "."
                : "Tu promedio (" + estudiante.getPromedioAcumulado()
                    + ") está por debajo del mínimo " + vacante.getPromedioMinimo() + ".",
            cumplePromedio ? null
                : "Apunta a subir tu promedio antes de aplicar a vacantes con este perfil."
        ));

        // 4) Keywords
        Set<String> keywords = parseCsv(vacante.getRequisitosKeywords()).stream()
            .map(this::normalizar)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toSet());
        String perfilTexto = normalizar(String.join(" ",
            safe(estudiante.getProgramaAcademico()),
            safe(estudiante.getNombres()),
            safe(estudiante.getApellidos()),
            safe(estudiante.getEmail())));

        BigDecimal ptsKeywords;
        String detalleKeywords;
        String sugerenciaKeywords = null;
        if (keywords.isEmpty()) {
            // Si la vacante no define keywords, no podemos penalizar al estudiante.
            ptsKeywords = bd(PESO_KEYWORDS / 2);
            detalleKeywords = "La vacante no definió keywords; se asigna puntaje base.";
        } else {
            long matches = keywords.stream().filter(perfilTexto::contains).count();
            double ratio = (double) matches / keywords.size();
            ptsKeywords = BigDecimal.valueOf(ratio * PESO_KEYWORDS).setScale(2, RoundingMode.HALF_UP);
            detalleKeywords = "Tu perfil coincide con " + matches + " de " + keywords.size()
                + " keywords (" + String.format("%.0f%%", ratio * 100) + ").";
            if (matches < keywords.size()) {
                List<String> faltantes = keywords.stream()
                    .filter(k -> !perfilTexto.contains(k))
                    .limit(3)
                    .toList();
                sugerenciaKeywords = "Considera reforzar en tu perfil: " + String.join(", ", faltantes) + ".";
            }
        }
        desglose.add(new DesgloseCriterio(
            "KEYWORDS", "Afinidad de competencias (keywords)",
            PESO_KEYWORDS,
            ptsKeywords,
            ptsKeywords.compareTo(bd(0)) > 0,
            detalleKeywords,
            sugerenciaKeywords
        ));

        // 5) Bonus continuidad
        boolean tieneContinuidad = vacante.getEmpresa() != null
            && convenioRepository.existsByEstudianteIdAndEmpresaId(
                estudiante.getId(), vacante.getEmpresa().getId());
        desglose.add(new DesgloseCriterio(
            "CONTINUIDAD", "Continuidad con la empresa",
            PESO_CONTINUIDAD,
            tieneContinuidad ? bd(PESO_CONTINUIDAD) : bd(0),
            tieneContinuidad,
            tieneContinuidad
                ? "Ya tienes historial de práctica con "
                    + vacante.getEmpresa().getRazonSocial() + "."
                : "Sin historial previo con la empresa (este es un bonus opcional).",
            null
        ));

        BigDecimal score = desglose.stream()
            .map(DesgloseCriterio::obtenido)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        boolean recomendado = score.intValue() >= umbralRecomendacion;
        String justificacion = desglose.stream()
            .map(d -> "- " + d.nombre() + ": +" + d.obtenido() + "/" + d.pesoMaximo() + " — " + d.detalle())
            .collect(Collectors.joining("\n"))
            + "\nScore final: " + score + " (umbral recomendación: " + umbralRecomendacion + ")";

        log.debug("Matching estudiante={} vacante={} score={} recomendado={}",
            estudiante.getId(), vacante.getId(), score, recomendado);

        return new ResultadoMatching(score, justificacion, recomendado, desglose);
    }

    private BigDecimal bd(int v) { return BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP); }

    private Set<String> parseCsv(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return Arrays.stream(csv.split("[,;]"))
            .map(String::trim)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toSet());
    }

    private String normalizar(String s) {
        if (s == null) return "";
        String sinAcentos = Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return sinAcentos.toLowerCase();
    }

    private String safe(String s) { return s == null ? "" : s; }

    public List<String> describirAlgoritmo() {
        return List.of(
            "Programa académico: " + PESO_PROGRAMA + " pts",
            "Créditos cumplidos: " + PESO_CREDITOS + " pts",
            "Promedio cumplido: " + PESO_PROMEDIO + " pts",
            "Keywords / competencias: " + PESO_KEYWORDS + " pts proporcional",
            "Continuidad con la empresa: bonus de " + PESO_CONTINUIDAD + " pts");
    }
}
