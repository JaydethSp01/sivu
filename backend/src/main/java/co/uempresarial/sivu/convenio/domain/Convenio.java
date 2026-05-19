package co.uempresarial.sivu.convenio.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import co.uempresarial.sivu.tutor.domain.Tutor;
import co.uempresarial.sivu.vacante.domain.Vacante;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "convenios")
public class Convenio extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulacion_id", nullable = false, unique = true)
    private Postulacion postulacion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vacante_id", nullable = false)
    private Vacante vacante;

    @Column(name = "numero_convenio", nullable = false, unique = true, length = 40)
    @NotBlank
    private String numeroConvenio;

    @Column(name = "fecha_inicio", nullable = false)
    @NotNull
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    @NotNull
    private LocalDate fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private EstadoConvenio estado = EstadoConvenio.BORRADOR;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_academico_id")
    private Tutor tutorAcademico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_empresarial_id")
    private Tutor tutorEmpresarial;

    @Column(name = "calificacion_final", precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal calificacionFinal;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "certificado_pdf_id")
    private Documento certificadoPdf;

    @Column(name = "semestre_academico", length = 10)
    private String semestreAcademico;

    /** Convenio anterior (mismo estudiante) si esta práctica es continuación. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_anterior_id")
    private Convenio convenioAnterior;

    @Column(name = "es_continuidad", nullable = false)
    @Builder.Default
    private Boolean esContinuidad = false;
}
