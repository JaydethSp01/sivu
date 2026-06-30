package co.uempresarial.sivu.informefinalpm.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Informe Final del Plan Especial de Mejora — formato Uniempresarial GTC-FM-16.
 * Máximo 15 páginas según norma institucional.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "informe_final_pm")
public class InformeFinalPm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_mejora_id", nullable = false, unique = true)
    private PlanMejora planMejora;

    @Column(name = "resumen_ejecutivo", columnDefinition = "TEXT")
    private String resumenEjecutivo;

    @Column(name = "contextualizacion", columnDefinition = "TEXT")
    private String contextualizacion;

    @Column(name = "planteamiento_problema", columnDefinition = "TEXT")
    private String planteamientoProblema;

    @Column(name = "marco_teorico", columnDefinition = "TEXT")
    private String marcoTeorico;

    @Column(name = "objetivo_general", columnDefinition = "TEXT")
    private String objetivoGeneral;

    @Column(name = "objetivos_especificos", columnDefinition = "TEXT")
    private String objetivosEspecificos;

    @Column(columnDefinition = "TEXT")
    private String diagnostico;

    @Column(columnDefinition = "TEXT")
    private String metodologia;

    @Column(name = "propuesta_solucion", columnDefinition = "TEXT")
    private String propuestaSolucion;

    @Column(columnDefinition = "TEXT")
    private String factibilidad;

    @Column(columnDefinition = "TEXT")
    private String conclusiones;

    @Column(columnDefinition = "TEXT")
    private String anexos;

    @Column(name = "numero_paginas")
    private Short numeroPaginas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoInformeFinalPm estado = EstadoInformeFinalPm.BORRADOR;

    @Column(name = "fecha_entrega")
    private OffsetDateTime fechaEntrega;

    @Column(name = "fecha_revision")
    private OffsetDateTime fechaRevision;

    @Column(name = "revisado_por_mongo_id", length = 36)
    private String revisadoPorMongoId;

    @Column(name = "revisado_por_nombre", length = 160)
    private String revisadoPorNombre;

    @Column(name = "observaciones_revisor", columnDefinition = "TEXT")
    private String observacionesRevisor;

    @Column(name = "firmado_estudiante", nullable = false)
    @Builder.Default
    private Boolean firmadoEstudiante = false;

    @Column(name = "firmado_tutor_acad", nullable = false)
    @Builder.Default
    private Boolean firmadoTutorAcad = false;

    @Column(name = "firmado_tutor_emp", nullable = false)
    @Builder.Default
    private Boolean firmadoTutorEmp = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;

    /** Título del informe que va en la carátula (§6.3). */
    @Column(name = "titulo_informe", length = 300)
    private String tituloInforme;

    /** Nivel del informe según matriz Uniempresarial (1, 2 o 3). */
    @Column(name = "nivel")
    private Short nivel;

    /** Cargo del tutor empresarial — aparece en la cabecera del informe. */
    @Column(name = "cargo_tutor_empresarial", length = 160)
    private String cargoTutorEmpresarial;

    // --- BI-07 / RF-A04: calificación final GTC-FM-16 ---

    /** Nota individual del tutor empresarial (0.0 – 5.0). La registra el tutor/empresa. */
    @Column(name = "nota_tutor", precision = 3, scale = 2)
    private BigDecimal notaTutor;

    /** Nota individual del profesor / docente acompañante (0.0 – 5.0). La registra el profesor/coordinación. */
    @Column(name = "nota_profesor", precision = 3, scale = 2)
    private BigDecimal notaProfesor;

    /**
     * Nota promedio final = (notaTutor + notaProfesor) / 2.
     * Calculada automáticamente cuando ambas notas están presentes — no editable manualmente.
     */
    @Column(name = "nota_promedio", precision = 3, scale = 2)
    private BigDecimal notaPromedio;

    /** Marca de "Alto Impacto" del informe. La establece el coordinador/admin. */
    @Column(name = "alto_impacto", nullable = false)
    @Builder.Default
    private Boolean altoImpacto = false;

    // --- GAP 3 / RF-A04 #1: editor estructurado de las 12 secciones del Informe Final ---
    // (resumenEjecutivo, planteamientoProblema, marcoTeorico, diagnostico, metodologia,
    //  factibilidad y conclusiones ya existen arriba; aquí se agregan las 5 restantes.)

    @Column(name = "contextualizacion_empresa", columnDefinition = "TEXT")
    private String contextualizacionEmpresa;

    @Column(columnDefinition = "TEXT")
    private String objetivos;

    @Column(columnDefinition = "TEXT")
    private String justificacion;

    @Column(columnDefinition = "TEXT")
    private String resultados;

    @Column(name = "referencias_apa", columnDefinition = "TEXT")
    private String referenciasApa;
}
