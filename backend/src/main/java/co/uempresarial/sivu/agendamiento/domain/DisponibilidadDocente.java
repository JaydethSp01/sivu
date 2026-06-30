package co.uempresarial.sivu.agendamiento.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * RF-C01: franja de disponibilidad publicada por un tutor/docente.
 * El estudiante solo puede proponer reuniones dentro de una franja ACTIVA.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "disponibilidad_docente", indexes = {
    @Index(name = "idx_disponibilidad_tutor", columnList = "tutor_id"),
    @Index(name = "idx_disponibilidad_fecha", columnList = "fecha")
})
public class DisponibilidadDocente extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tutor_id", nullable = false)
    @NotNull
    private Long tutorId;

    @Column(nullable = false)
    @NotNull
    private LocalDate fecha;

    @Column(name = "hora_inicio", nullable = false)
    @NotNull
    private LocalTime horaInicio;

    @Column(name = "hora_fin", nullable = false)
    @NotNull
    private LocalTime horaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Modalidad modalidad = Modalidad.PRESENCIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoDisponibilidad estado = EstadoDisponibilidad.ACTIVA;
}
