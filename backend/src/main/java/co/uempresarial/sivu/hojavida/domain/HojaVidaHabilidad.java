package co.uempresarial.sivu.hojavida.domain;

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
@Table(name = "hoja_vida_habilidad")
public class HojaVidaHabilidad extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hoja_vida_id", nullable = false)
    private HojaVida hojaVida;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private CategoriaHabilidad categoria = CategoriaHabilidad.TECNICA;

    @Column(nullable = false, length = 160)
    @NotBlank
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Short orden = 0;
}
