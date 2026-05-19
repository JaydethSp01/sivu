package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plan_actividades_mes", uniqueConstraints = @UniqueConstraint(
    name = "uq_pa_mes", columnNames = {"plan_actividades_id", "mes"}))
public class PlanActividadesMes extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_actividades_id", nullable = false)
    private PlanActividades planActividades;

    @Column(nullable = false)
    @NotNull @Min(1) @Max(12)
    private Short mes;

    @Column(name = "area_rotacion", length = 180)
    private String areaRotacion;

    @Column(columnDefinition = "TEXT")
    private String actividades;

    @Column(name = "tutor_nombre", length = 160)
    private String tutorNombre;
}
