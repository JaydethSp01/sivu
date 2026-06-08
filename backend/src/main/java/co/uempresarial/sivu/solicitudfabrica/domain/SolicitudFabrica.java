package co.uempresarial.sivu.solicitudfabrica.domain;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Solicitud explícita del estudiante para entrar al Programa Interno
 * (Fábrica de Soluciones) cuando no encuentra cupo en empresa externa.
 *
 * Coordinación aprueba o rechaza con observaciones. Las solicitudes
 * APROBADAS son procesadas por {@code FabricaSolucionesService} junto
 * con los estudiantes elegibles por calendario académico.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "solicitud_fabrica")
public class SolicitudFabrica extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @Column(name = "motivo", nullable = false, columnDefinition = "TEXT")
    private String motivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoSolicitudFabrica estado = EstadoSolicitudFabrica.PENDIENTE;

    @Column(name = "observaciones_coord", columnDefinition = "TEXT")
    private String observacionesCoord;

    @Column(name = "fecha_solicitud", nullable = false)
    @Builder.Default
    private OffsetDateTime fechaSolicitud = OffsetDateTime.now();

    @Column(name = "fecha_resolucion")
    private OffsetDateTime fechaResolucion;

    @Column(name = "resuelto_por_mongo_id", length = 36)
    private String resueltoPorMongoId;

    @Column(name = "resuelto_por_nombre", length = 160)
    private String resueltoPorNombre;

    // Vacante interna que Coformación asignó manualmente (estado ASIGNADA).
    @Column(name = "vacante_asignada_id")
    private Long vacanteAsignadaId;

    // Postulación generada al asignar la vacante. Sirve para rastreo bidireccional.
    @Column(name = "postulacion_creada_id")
    private Long postulacionCreadaId;
}
