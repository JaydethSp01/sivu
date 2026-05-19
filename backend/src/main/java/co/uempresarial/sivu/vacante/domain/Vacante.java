package co.uempresarial.sivu.vacante.domain;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "vacantes")
public class Vacante extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 180)
    @NotBlank
    private String titulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    @NotBlank
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "area_practica", nullable = false, length = 40)
    private AreaPractica areaPractica;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Modalidad modalidad;

    @Column(nullable = false, length = 80)
    @NotBlank
    private String ciudad;

    /** Lista de keywords separadas por coma (almacenadas en TEXT). */
    @Column(name = "requisitos_keywords", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String requisitosKeywords = "";

    @Column(name = "creditos_minimos", nullable = false)
    @Min(0)
    @Builder.Default
    private Short creditosMinimos = 0;

    @Column(name = "promedio_minimo", nullable = false, precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    @Builder.Default
    private BigDecimal promedioMinimo = new BigDecimal("0.00");

    @Column(name = "programas_dirigidos", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String programasDirigidos = "";

    @Column(name = "duracion_meses", nullable = false)
    @Min(1)
    @Builder.Default
    private Short duracionMeses = 6;

    @Column(name = "cupos_disponibles", nullable = false)
    @Min(0)
    @Builder.Default
    private Short cuposDisponibles = 1;

    @Column(name = "fecha_inicio", nullable = false)
    @NotNull
    private LocalDate fechaInicio;

    @Column(name = "fecha_cierre_postulaciones", nullable = false)
    @NotNull
    private LocalDate fechaCierrePostulaciones;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoVacante estado = EstadoVacante.BORRADOR;

    /**
     * Modalidad de vinculación de la práctica (CCB, interna U, empresa propuesta, ...).
     * Diferente del campo {@code modalidad} (presencial/híbrido/remoto), que es la
     * modalidad de TRABAJO. Esta determina qué documentos son requeridos para postular.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modalidad_id")
    private ModalidadVinculacion modalidadVinculacion;
}
