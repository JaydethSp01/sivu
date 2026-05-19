package co.uempresarial.sivu.hojavida.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hoja_vida_idioma", uniqueConstraints = @UniqueConstraint(
    name = "uq_hv_idioma", columnNames = {"hoja_vida_id", "idioma"}))
public class HojaVidaIdioma extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hoja_vida_id", nullable = false)
    private HojaVida hojaVida;

    @Column(nullable = false, length = 40)
    @NotBlank
    private String idioma;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @NotNull
    private NivelIdioma nivel;

    @Column(nullable = false)
    @Builder.Default
    private Short orden = 0;
}
