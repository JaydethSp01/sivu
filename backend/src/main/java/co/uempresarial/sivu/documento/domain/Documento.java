package co.uempresarial.sivu.documento.domain;

import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "documentos")
public class Documento extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id")
    private Estudiante estudiante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postulacion_id")
    private Postulacion postulacion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoDocumentoSoporte tipo;

    @Column(name = "nombre_original", nullable = false, length = 255)
    @NotBlank
    private String nombreOriginal;

    @Column(name = "ruta_almacenamiento", nullable = false, length = 500)
    @NotBlank
    private String rutaAlmacenamiento;

    @Column(name = "mime_type", nullable = false, length = 120)
    @NotBlank
    private String mimeType;

    @Column(name = "tamano_bytes", nullable = false)
    @Min(0)
    private Long tamanoBytes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoDocumento estado = EstadoDocumento.RECIBIDO;

    @Column(name = "observaciones_validacion", columnDefinition = "TEXT")
    private String observacionesValidacion;

    @Column(name = "fecha_validacion")
    private OffsetDateTime fechaValidacion;

    /**
     * Referencia al catálogo configurable de tipos de requisito. Sustituye gradualmente
     * al campo enum {@code tipo}: cuando esté presente, el sistema considera este
     * documento como evidencia del requisito X de la matriz por modalidad.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_requisito_id")
    private TipoRequisitoDocumental tipoRequisito;

    /**
     * Documentos asociados a una empresa (RUT, cámara de comercio, etc.) en el flujo
     * de "empresa propuesta por estudiante". Para docs del estudiante, queda null.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    /** Fecha de inicio de vigencia del documento (opcional). */
    @Column(name = "fecha_vigencia_inicio")
    private LocalDate fechaVigenciaInicio;

    /** Fecha de fin de vigencia del documento (opcional). */
    @Column(name = "fecha_vigencia_fin")
    private LocalDate fechaVigenciaFin;

    /** Estado de vigencia derivado de las fechas. No se persiste. */
    @Transient
    public EstadoVigencia getEstadoVigencia() {
        return EstadoVigencia.calcular(fechaVigenciaInicio, fechaVigenciaFin);
    }
}
