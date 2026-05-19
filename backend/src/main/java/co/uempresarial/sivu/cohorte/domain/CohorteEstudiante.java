package co.uempresarial.sivu.cohorte.domain;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "cohorte_estudiante", uniqueConstraints = @UniqueConstraint(
    name = "uq_cohorte_estudiante", columnNames = {"cohorte_id", "estudiante_id"}))
public class CohorteEstudiante extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cohorte_id", nullable = false)
    private Cohorte cohorte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull
    @Builder.Default
    private EstadoCohorteEstudiante estado = EstadoCohorteEstudiante.ELEGIBLE;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_inscripcion")
    private OffsetDateTime fechaInscripcion;
}
