package co.uempresarial.sivu.trimestre.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Mensaje del hilo del flujo de aprobación tripartito del Plan de Actividades
 * (GAC-FM-10). Replica el patrón de {@code HojaVidaComentario}: registra el
 * historial de feedback y de respuestas de aprobación/rechazo entre estudiante,
 * tutor empresarial y profesor, en vez de perder las observaciones.
 *
 * Tipos:
 *   FEEDBACK             -> comentario/observación sin cambio de estado
 *   RESPUESTA_APROBACION -> el revisor aprueba; avanza el estado de firma
 *   RESPUESTA_RECHAZO    -> el revisor rechaza; el plan vuelve a BORRADOR
 *   SISTEMA              -> evento auto-registrado por el sistema
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plan_actividades_comentario")
public class PlanActividadesComentario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_actividades_id", nullable = false)
    private Long planActividadesId;

    @Column(name = "autor_mongo_id", length = 36)
    private String autorMongoId;

    @Column(name = "autor_nombre", nullable = false, length = 160)
    private String autorNombre;

    @Column(name = "autor_rol", nullable = false, length = 20)
    private String autorRol;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoComentarioPlan tipo;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    public enum TipoComentarioPlan {
        FEEDBACK,
        RESPUESTA_APROBACION,
        RESPUESTA_RECHAZO,
        SISTEMA
    }
}
