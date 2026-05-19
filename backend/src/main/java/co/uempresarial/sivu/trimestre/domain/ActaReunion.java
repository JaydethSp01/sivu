package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "acta_reunion", uniqueConstraints = @UniqueConstraint(
    name = "uq_acta_trimestre_numero", columnNames = {"trimestre_id", "numero"}))
public class ActaReunion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trimestre_id", nullable = false)
    private Trimestre trimestre;

    @Column(nullable = false)
    @NotNull
    private Short numero;

    @Column(nullable = false)
    @NotNull
    private LocalDate fecha;

    @Column(length = 20)
    private String hora;

    @Column(length = 120)
    private String lugar;

    @Column(length = 180)
    private String asunto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_reunion", nullable = false, length = 60)
    @Builder.Default
    private TipoReunion tipoReunion = TipoReunion.SEGUIMIENTO;

    @Column(name = "asistentes_json", columnDefinition = "TEXT")
    private String asistentesJson;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "firmado_estudiante", nullable = false)
    @Builder.Default
    private Boolean firmadoEstudiante = false;

    @Column(name = "firmado_tutor", nullable = false)
    @Builder.Default
    private Boolean firmadoTutor = false;

    @Column(name = "firmado_profesor", nullable = false)
    @Builder.Default
    private Boolean firmadoProfesor = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "documento_pdf_id")
    private Documento documentoPdf;

    @OneToMany(mappedBy = "acta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<ActaTema> temas = new ArrayList<>();
}
