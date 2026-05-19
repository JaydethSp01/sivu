package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "trimestre", uniqueConstraints = @UniqueConstraint(
    name = "uq_trimestre_convenio_numero", columnNames = {"convenio_id", "numero"}))
public class Trimestre extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "convenio_id", nullable = false)
    private Convenio convenio;

    @Column(nullable = false)
    @NotNull @Min(1) @Max(3)
    private Short numero;

    @Column(name = "materia_nucleo", nullable = false, length = 180)
    @NotBlank
    private String materiaNucleo;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoTrimestre estado = EstadoTrimestre.ABIERTO;
}
