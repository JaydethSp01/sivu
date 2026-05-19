package co.uempresarial.sivu.hojavida.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hoja_vida_experiencia_laboral")
public class HojaVidaExperienciaLaboral extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hoja_vida_id", nullable = false)
    private HojaVida hojaVida;

    @Column(nullable = false, length = 180)
    @NotBlank
    private String empresa;

    @Column(nullable = false, length = 160)
    @NotBlank
    private String cargo;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "en_curso", nullable = false)
    @Builder.Default
    private Boolean enCurso = false;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Short orden = 0;
}
