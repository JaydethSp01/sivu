package co.uempresarial.sivu.evaluacion.domain;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "evaluaciones", uniqueConstraints = @UniqueConstraint(
    name = "uq_evaluacion_unica", columnNames = {"convenio_id", "tipo", "evaluador_tipo"}))
public class Evaluacion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "convenio_id", nullable = false)
    private Convenio convenio;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull
    private TipoEvaluacion tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluador_tipo", nullable = false, length = 20)
    @NotNull
    private TipoTutor evaluadorTipo;

    @Column(name = "fecha_evaluacion", nullable = false)
    @Builder.Default
    private LocalDate fechaEvaluacion = LocalDate.now();

    @Column(nullable = false, precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal calificacion;

    @Column(name = "competencias_tecnicas", nullable = false, precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal competenciasTecnicas;

    @Column(name = "competencias_blandas", nullable = false, precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal competenciasBlandas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @NotNull
    private Recomendacion recomendacion;

    @Column(columnDefinition = "TEXT")
    private String observaciones;
}
