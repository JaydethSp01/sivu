package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plan_actividades_objetivo")
public class PlanActividadesObjetivo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_actividades_id", nullable = false)
    private PlanActividades planActividades;

    @Column(length = 180)
    private String escenario;

    @Column(nullable = false, columnDefinition = "TEXT")
    @NotBlank
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Boolean seleccionado = true;

    @Column(nullable = false)
    @Builder.Default
    private Short orden = 0;
}
