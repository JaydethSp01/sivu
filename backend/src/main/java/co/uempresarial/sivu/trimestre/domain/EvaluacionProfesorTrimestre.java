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

    // ----- Corte 2 (V11): GAC-FM-1 v3 evalúa al estudiante en dos cortes,
    // cada uno vale 25% del total del proceso. Los campos sin sufijo
    // representan el corte 1 por compatibilidad. -----
    @Column(name = "capacidades_c2", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal capacidadesC2;

    @Column(name = "actitudes_c2", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal actitudesC2;

    @Column(name = "aplicacion_desempeno_c2", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal aplicacionDesempenoC2;

    @Column(name = "aplicacion_elaboracion_pem_c2", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal aplicacionElaboracionPemC2;

    @Column(name = "aplicacion_sustentacion_pem_c2", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal aplicacionSustentacionPemC2;

    @Column(name = "nota_ponderada_c2", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal notaPonderadaC2;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "observaciones_c1", columnDefinition = "TEXT")
    private String observacionesC1;

    @Column(name = "observaciones_c2", columnDefinition = "TEXT")
    private String observacionesC2;

    @Column(name = "fecha_elaboracion")
    private LocalDate fechaElaboracion;

    @Column(name = "fecha_c1")
    private LocalDate fechaC1;

    @Column(name = "fecha_c2")
    private LocalDate fechaC2;

    @Column(name = "firmado_profesor", nullable = false)
    @Builder.Default
    private Boolean firmadoProfesor = false;

    @Column(name = "firmado_estudiante", nullable = false)
    @Builder.Default
    private Boolean firmadoEstudiante = false;

    // Sello de tiempo de firma (V15 · HU-06)
    @Column(name = "fecha_firma_profesor")
    private java.time.OffsetDateTime fechaFirmaProfesor;

    @Column(name = "fecha_firma_estudiante")
    private java.time.OffsetDateTime fechaFirmaEstudiante;

    @Column(name = "firmado_profesor_nombre", length = 160)
    private String firmadoProfesorNombre;

    @Column(name = "firmado_estudiante_nombre", length = 160)
    private String firmadoEstudianteNombre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;
}
