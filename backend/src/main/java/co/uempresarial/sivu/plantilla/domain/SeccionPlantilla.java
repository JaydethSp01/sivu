package co.uempresarial.sivu.plantilla.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "seccion_plantilla")
public class SeccionPlantilla extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plantilla_id", nullable = false)
    private PlantillaFormulario plantilla;

    @Column(nullable = false)
    @Builder.Default
    private Short orden = 0;

    @Column(length = 60)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    /** Peso de la sección dentro del total (0.0–1.0). null = no aporta a la nota. */
    @Column(precision = 5, scale = 4)
    private BigDecimal peso;

    @OneToMany(mappedBy = "seccion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC, id ASC")
    @Builder.Default
    private List<CriterioPlantilla> criterios = new ArrayList<>();
}
