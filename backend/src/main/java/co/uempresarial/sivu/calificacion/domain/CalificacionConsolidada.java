package co.uempresarial.sivu.calificacion.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * BI-10 / RNF-03 — Nota final consolidada del proceso de Coformación.
 *
 * Resultado persistido (cacheado) del cálculo automático que realiza
 * {@code CorteCalculoService}. Es <b>trazable y no editable manualmente</b>:
 * no existe ningún endpoint de escritura que reciba estas notas; la única
 * forma de modificarlas es recalcular a partir de las evaluaciones e informe
 * origen (GAC-FM-1, GAC-FM-9, GTC-FM-16).
 *
 * Fórmula: notaFinal = corte1*0.25 + corte2*0.25 + corte3*0.50, donde
 * corte3 = promedio(nota Evaluación Tutor, nota promedio Informe Final).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "calificacion_consolidada",
    uniqueConstraints = @UniqueConstraint(name = "uq_calificacion_convenio", columnNames = "convenio_id"))
public class CalificacionConsolidada extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Convenio (proceso de Coformación) al que pertenece esta calificación. Único. */
    @Column(name = "convenio_id", nullable = false, unique = true)
    private Long convenioId;

    /** Corte 1: nota ponderada de la Evaluación Docente (GAC-FM-1) corte 1 — pondera 25%. */
    @Column(name = "nota_corte1", precision = 4, scale = 2)
    private BigDecimal notaCorte1;

    /** Corte 2: nota ponderada de la Evaluación Docente (GAC-FM-1) corte 2 — pondera 25%. */
    @Column(name = "nota_corte2", precision = 4, scale = 2)
    private BigDecimal notaCorte2;

    /** Corte 3: promedio(Evaluación Tutor GAC-FM-9, Informe Final GTC-FM-16) — pondera 50%. */
    @Column(name = "nota_corte3", precision = 4, scale = 2)
    private BigDecimal notaCorte3;

    /** Nota final del proceso = corte1*0.25 + corte2*0.25 + corte3*0.50. Null si falta algún insumo. */
    @Column(name = "nota_final", precision = 4, scale = 2)
    private BigDecimal notaFinal;

    /** Momento del último recálculo. */
    @Column(name = "calculada_en")
    private OffsetDateTime calculadaEn;

    /** Si está bloqueada, el proceso quedó cerrado y no debe recalcularse de nuevo. */
    @Column(name = "bloqueada", nullable = false)
    @Builder.Default
    private Boolean bloqueada = false;
}
