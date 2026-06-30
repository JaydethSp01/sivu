package co.uempresarial.sivu.agendamiento.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * RF-C02/RF-C03: reunión agendada de forma colaborativa entre estudiante y docente.
 * Las FKs a tutores/estudiantes/convenios/disponibilidad/acta se modelan como ids
 * (referencia débil) para mantener el módulo aislado del resto del dominio.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "agendamiento_reunion", indexes = {
    @Index(name = "idx_agendamiento_tutor", columnList = "tutor_id"),
    @Index(name = "idx_agendamiento_estudiante", columnList = "estudiante_id"),
    @Index(name = "idx_agendamiento_convenio", columnList = "convenio_id"),
    @Index(name = "idx_agendamiento_estado", columnList = "estado")
})
public class AgendamientoReunion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "convenio_id", nullable = false)
    @NotNull
    private Long convenioId;

    @Column(name = "estudiante_id", nullable = false)
    @NotNull
    private Long estudianteId;

    @Column(name = "tutor_id", nullable = false)
    @NotNull
    private Long tutorId;

    /** Franja sobre la que se originó la propuesta (nullable: una contraoferta puede salirse de franja). */
    @Column(name = "disponibilidad_id")
    private Long disponibilidadId;

    @Column(name = "fecha_propuesta", nullable = false)
    @NotNull
    private LocalDate fechaPropuesta;

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

    /** Enlace de videollamada; obligatorio cuando la modalidad es VIRTUAL. */
    @Column(length = 300)
    private String enlace;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoAgendamiento estado = EstadoAgendamiento.PROPUESTO;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    /** Acta de reunión generada al confirmar (TODO: enlazar con módulo trimestre). */
    @Column(name = "acta_reunion_id")
    private Long actaReunionId;

    /**
     * BI-11 / RF-D01: marca de idempotencia para el recordatorio automático de
     * reunión próxima (24h antes). Se pone en {@code true} cuando el scheduler ya
     * despachó el recordatorio a estudiante y tutor, evitando reenviar en corridas
     * posteriores del job.
     */
    @Column(name = "recordatorio_enviado", nullable = false)
    @Builder.Default
    private boolean recordatorioEnviado = false;
}
