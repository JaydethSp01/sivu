package co.uempresarial.sivu.postulacion.domain;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import co.uempresarial.sivu.vacante.domain.Vacante;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "postulaciones", uniqueConstraints = @UniqueConstraint(name = "uq_postulaciones_est_vac",
    columnNames = {"estudiante_id", "vacante_id"}))
public class Postulacion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vacante_id", nullable = false)
    private Vacante vacante;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoPostulacion estado = EstadoPostulacion.POSTULADA;

    @Column(name = "score_matching", nullable = false, precision = 5, scale = 2)
    @DecimalMin("0.00") @DecimalMax("100.00")
    @Builder.Default
    private BigDecimal scoreMatching = new BigDecimal("0.00");

    @Column(name = "justificacion_matching", columnDefinition = "TEXT")
    private String justificacionMatching;

    @Column(name = "mensaje_estudiante", columnDefinition = "TEXT")
    private String mensajeEstudiante;

    @Column(name = "observaciones_empresa", columnDefinition = "TEXT")
    private String observacionesEmpresa;

    @Column(name = "fecha_postulacion", nullable = false)
    @Builder.Default
    private OffsetDateTime fechaPostulacion = OffsetDateTime.now();

    @Column(name = "fecha_decision")
    private OffsetDateTime fechaDecision;
}
