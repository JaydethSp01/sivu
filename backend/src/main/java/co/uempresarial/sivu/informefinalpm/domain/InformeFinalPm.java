package co.uempresarial.sivu.informefinalpm.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import co.uempresarial.sivu.trimestre.domain.PlanMejora;
import jakarta.persistence.*;
import lombok.*;

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
}
