package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "evaluacion_profesor_trimestre")
public class EvaluacionProfesorTrimestre extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trimestre_id", nullable = false, unique = true)
    private Trimestre trimestre;

    @Column(precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal capacidades;

    @Column(precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal actitudes;

    @Column(name = "aplicacion_desempeno", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal aplicacionDesempeno;

    @Column(name = "aplicacion_elaboracion_pem", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal aplicacionElaboracionPem;

    @Column(name = "aplicacion_sustentacion_pem", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal aplicacionSustentacionPem;

    @Column(name = "nota_ponderada", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal notaPonderada;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_elaboracion")
    private LocalDate fechaElaboracion;

    @Column(name = "firmado_profesor", nullable = false)
    @Builder.Default
    private Boolean firmadoProfesor = false;

    @Column(name = "firmado_estudiante", nullable = false)
    @Builder.Default
    private Boolean firmadoEstudiante = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;
}
