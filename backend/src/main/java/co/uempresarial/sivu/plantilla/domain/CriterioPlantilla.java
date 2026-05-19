package co.uempresarial.sivu.plantilla.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "criterio_plantilla")
public class CriterioPlantilla extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seccion_id", nullable = false)
    private SeccionPlantilla seccion;

    @Column(nullable = false)
    @Builder.Default
    private Short orden = 0;

    @Column(length = 60)
    private String codigo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    /** Peso del criterio dentro de su sección (subponderación). null = sección no se subdivide. */
    @Column(precision = 5, scale = 4)
    private BigDecimal peso;

    @Column(columnDefinition = "TEXT")
    private String placeholder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TipoCampo tipo = TipoCampo.NUMBER;

    /** Para tipo=SELECT, CSV de opciones (p. ej. "INICIAL,SEGUIMIENTO,FINAL"). */
    @Column(columnDefinition = "TEXT")
    private String opciones;
}
