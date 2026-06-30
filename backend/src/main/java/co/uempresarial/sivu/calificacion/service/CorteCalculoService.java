package co.uempresarial.sivu.calificacion.service;

import co.uempresarial.sivu.calificacion.domain.CalificacionConsolidada;
import co.uempresarial.sivu.calificacion.persistence.CalificacionConsolidadaRepository;
import co.uempresarial.sivu.calificacion.persistence.NotaEvaluacionProfesorRepository;
import co.uempresarial.sivu.calificacion.persistence.NotaEvaluacionTutorRepository;
import co.uempresarial.sivu.calificacion.persistence.NotaInformeFinalRepository;
import co.uempresarial.sivu.calificacion.web.dto.CalificacionDesgloseResponse;
import co.uempresarial.sivu.calificacion.web.dto.CalificacionDesgloseResponse.ComponenteNota;
import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.persistence.ConvenioRepository;
import co.uempresarial.sivu.security.service.CurrentUserService;
import co.uempresarial.sivu.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

/**
 * BI-10 / RNF-03 — Cálculo automático y trazable de la nota final del proceso de Coformación.
 *
 * <p>Lee (sin modificar) las notas de las evaluaciones e informe origen de un convenio y
 * aplica la ponderación institucional de los tres cortes del trimestre:</p>
 * <ul>
 *   <li><b>Corte 1</b> = nota ponderada de la Evaluación Docente (GAC-FM-1) corte 1 — 25%.</li>
 *   <li><b>Corte 2</b> = nota ponderada de la Evaluación Docente (GAC-FM-1) corte 2 — 25%.</li>
 *   <li><b>Corte 3</b> = promedio(nota Evaluación Tutor GAC-FM-9, nota promedio Informe Final GTC-FM-16) — 50%.</li>
 * </ul>
 * <p>{@code notaFinal = corte1*0.25 + corte2*0.25 + corte3*0.50}. Si falta algún insumo el
 * resultado es parcial: los cortes disponibles se devuelven y {@code notaFinal} queda en null.
 * El consolidado se persiste vía upsert (no es editable por ningún endpoint de escritura manual).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CorteCalculoService {

    static final BigDecimal PESO_CORTE1 = new BigDecimal("0.25");
    static final BigDecimal PESO_CORTE2 = new BigDecimal("0.25");
    static final BigDecimal PESO_CORTE3 = new BigDecimal("0.50");

    private final ConvenioRepository convenioRepository;
    private final NotaEvaluacionProfesorRepository notaProfesorRepository;
    private final NotaEvaluacionTutorRepository notaTutorRepository;
    private final NotaInformeFinalRepository notaInformeRepository;
    private final CalificacionConsolidadaRepository consolidadaRepository;
    private final CurrentUserService currentUser;

    /**
     * Recalcula al vuelo la nota final del convenio, persiste el consolidado (si no está
     * bloqueado) y devuelve el desglose trazable. Aplica auto-scope por dueño cuando lo pide
     * el controlador (estudiante/empresa solo ven la suya).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public CalificacionDesgloseResponse calcularYConsolidar(Long convenioId, boolean enforceOwnership) {
        Convenio convenio = convenioRepository.findById(convenioId)
            .orElseThrow(() -> new ResourceNotFoundException("Convenio", convenioId));

        if (enforceOwnership) {
            verificarPropiedad(convenio);
        }

        // --- Lectura de las notas origen (último trimestre con dato disponible) ---
        BigDecimal notaCorte1 = primera(notaProfesorRepository.findNotasCorte1(convenioId)); // GAC-FM-1 c1
        BigDecimal notaCorte2 = primera(notaProfesorRepository.findNotasCorte2(convenioId)); // GAC-FM-1 c2
        BigDecimal notaTutor  = primera(notaTutorRepository.findNotasTutor(convenioId));      // GAC-FM-9
        BigDecimal notaInforme = primera(notaInformeRepository.findNotasPromedio(convenioId)); // GTC-FM-16

        // --- Corte 3 = promedio(tutor, informe). Requiere ambas notas. ---
        BigDecimal notaCorte3 = (notaTutor != null && notaInforme != null)
            ? escala(notaTutor.add(notaInforme).divide(new BigDecimal("2"), 4, RoundingMode.HALF_UP))
            : null;

        // --- Nota final = corte1*0.25 + corte2*0.25 + corte3*0.50. Requiere los tres cortes. ---
        BigDecimal notaFinal = null;
        if (notaCorte1 != null && notaCorte2 != null && notaCorte3 != null) {
            notaFinal = escala(
                notaCorte1.multiply(PESO_CORTE1)
                    .add(notaCorte2.multiply(PESO_CORTE2))
                    .add(notaCorte3.multiply(PESO_CORTE3)));
        }

        BigDecimal c1 = escala(notaCorte1);
        BigDecimal c2 = escala(notaCorte2);

        // --- Upsert del consolidado (no se sobrescribe si el proceso está bloqueado) ---
        CalificacionConsolidada consolidada = consolidadaRepository.findByConvenioId(convenioId)
            .orElseGet(() -> CalificacionConsolidada.builder().convenioId(convenioId).bloqueada(false).build());

        boolean bloqueada = Boolean.TRUE.equals(consolidada.getBloqueada());
        if (!bloqueada) {
            consolidada.setNotaCorte1(c1);
            consolidada.setNotaCorte2(c2);
            consolidada.setNotaCorte3(notaCorte3);
            consolidada.setNotaFinal(notaFinal);
            consolidada.setCalculadaEn(OffsetDateTime.now());
            consolidada = consolidadaRepository.save(consolidada);
        }

        // --- Desglose trazable (de qué formulario salió cada nota) ---
        List<ComponenteNota> componentes = List.of(
            new ComponenteNota("CORTE_1", "GAC-FM-1", "Evaluación Docente — corte 1",
                PESO_CORTE1, escala(notaCorte1), notaCorte1 != null),
            new ComponenteNota("CORTE_2", "GAC-FM-1", "Evaluación Docente — corte 2",
                PESO_CORTE2, escala(notaCorte2), notaCorte2 != null),
            new ComponenteNota("CORTE_3", "GAC-FM-9", "Evaluación del Tutor",
                PESO_CORTE3, escala(notaTutor), notaTutor != null),
            new ComponenteNota("CORTE_3", "GTC-FM-16", "Informe Final del Plan de Mejora (nota promedio)",
                PESO_CORTE3, escala(notaInforme), notaInforme != null)
        );

        return new CalificacionDesgloseResponse(
            convenioId,
            consolidada.getNotaCorte1(),
            consolidada.getNotaCorte2(),
            consolidada.getNotaCorte3(),
            consolidada.getNotaFinal(),
            consolidada.getNotaFinal() != null,
            bloqueada,
            consolidada.getCalculadaEn(),
            componentes
        );
    }

    private void verificarPropiedad(Convenio convenio) {
        if (currentUser.esEstudiantePuro()) {
            Long propio = currentUser.currentEstudianteId().orElse(null);
            if (convenio.getEstudiante() == null || !Objects.equals(propio, convenio.getEstudiante().getId())) {
                throw new AccessDeniedException("No puede consultar la calificación de otro estudiante");
            }
        } else if (currentUser.esEmpresaPura()) {
            Long propia = currentUser.currentEmpresaId().orElse(null);
            if (convenio.getEmpresa() == null || !Objects.equals(propia, convenio.getEmpresa().getId())) {
                throw new AccessDeniedException("No puede consultar la calificación de otra empresa");
            }
        }
    }

    private static BigDecimal primera(List<BigDecimal> notas) {
        return (notas == null || notas.isEmpty()) ? null : notas.get(0);
    }

    private static BigDecimal escala(BigDecimal valor) {
        return valor == null ? null : valor.setScale(2, RoundingMode.HALF_UP);
    }
}
