package co.uempresarial.sivu.notificacion.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Registro de auditoría de cada notificación emitida por la capa de
 * co-formación (BI-01 / RF-D01-D02). Aditiva: no reemplaza el envío de correo,
 * solo deja trazabilidad de éxito/fallo por destinatario y referencia de dominio.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "notificacion_auditoria")
public class NotificacionAuditoria extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_evento", nullable = false, length = 40)
    private TipoEventoNotificacion tipoEvento;

    @Column(name = "destinatario_email", nullable = false, length = 255)
    private String destinatarioEmail;

    @Column(name = "asunto", nullable = false, length = 255)
    private String asunto;

    @Column(name = "enviado_exitoso", nullable = false)
    private boolean enviadoExitoso;

    @Column(name = "error", length = 1000)
    private String error;

    @Column(name = "referencia_tipo", length = 40)
    private String referenciaTipo;

    @Column(name = "referencia_id")
    private Long referenciaId;
}
