package co.uempresarial.sivu.postulacion.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "postulacion_eventos")
public class PostulacionEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Column(name = "tipo_evento", nullable = false, length = 40)
    private String tipoEvento;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20)
    private EstadoPostulacion estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 20)
    private EstadoPostulacion estadoNuevo;

    @Column(columnDefinition = "TEXT")
    private String detalle;

    @Column(length = 80)
    private String actor;

    @Column(name = "ocurrido_en", nullable = false)
    @Builder.Default
    private OffsetDateTime ocurridoEn = OffsetDateTime.now();
}
