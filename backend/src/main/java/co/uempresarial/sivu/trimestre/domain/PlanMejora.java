package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plan_mejora", uniqueConstraints = @UniqueConstraint(
    name = "uq_pm_trimestre_numero", columnNames = {"trimestre_id", "numero"}))
public class PlanMejora extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trimestre_id", nullable = false)
    private Trimestre trimestre;

    @Column(nullable = false)
    @NotNull @Min(1) @Max(2)
    private Short numero;

    @Column(nullable = false, length = 180)
    @NotBlank
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String problema;

    @Column(columnDefinition = "TEXT")
    private String objetivo;

    @Column(columnDefinition = "TEXT")
    private String actividades;

    @Column(columnDefinition = "TEXT")
    private String indicadores;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoPlanMejora estado = EstadoPlanMejora.BORRADOR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;
}
