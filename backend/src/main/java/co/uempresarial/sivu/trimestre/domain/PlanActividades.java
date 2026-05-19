package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plan_actividades")
public class PlanActividades extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trimestre_id", nullable = false, unique = true)
    private Trimestre trimestre;

    @Column(name = "escenario_coformacion", length = 180)
    private String escenarioCoformacion;

    @Column(name = "pem_descripcion_escenario", columnDefinition = "TEXT")
    private String pemDescripcionEscenario;

    @Column(name = "pem_objetivo_general", columnDefinition = "TEXT")
    private String pemObjetivoGeneral;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoPlanActividades estado = EstadoPlanActividades.BORRADOR;

    @Column(name = "firmado_estudiante", nullable = false)
    @Builder.Default
    private Boolean firmadoEstudiante = false;

    @Column(name = "firmado_tutor", nullable = false)
    @Builder.Default
    private Boolean firmadoTutor = false;

    @Column(name = "firmado_profesor", nullable = false)
    @Builder.Default
    private Boolean firmadoProfesor = false;

    @Column(name = "fecha_firma_estudiante")
    private OffsetDateTime fechaFirmaEstudiante;

    @Column(name = "fecha_firma_tutor")
    private OffsetDateTime fechaFirmaTutor;

    @Column(name = "fecha_firma_profesor")
    private OffsetDateTime fechaFirmaProfesor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;

    @OneToMany(mappedBy = "planActividades", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<PlanActividadesObjetivo> objetivos = new ArrayList<>();

    @OneToMany(mappedBy = "planActividades", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("mes ASC")
    @Builder.Default
    private List<PlanActividadesMes> meses = new ArrayList<>();
}
