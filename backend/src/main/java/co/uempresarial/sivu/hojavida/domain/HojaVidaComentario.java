package co.uempresarial.sivu.hojavida.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

/**
 * Mensaje del hilo conversacional asociado a una Hoja de Vida. Sustituye la
 * lógica de "una observación monolítica" del campo observacionesCoformacion
 * por un historial completo entre la Oficina de Coformación y el estudiante.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hoja_vida_comentario")
public class HojaVidaComentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hoja_vida_id", nullable = false)
    private Long hojaVidaId;

    @Column(name = "autor_mongo_id", length = 36)
    private String autorMongoId;

    @Column(name = "autor_nombre", nullable = false, length = 160)
    private String autorNombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "autor_rol", nullable = false, length = 20)
    private AutorRol autorRol;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoComentario tipo;

    @Column(name = "mensaje", nullable = false, columnDefinition = "TEXT")
    private String mensaje;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public enum AutorRol { COORDINADOR, ADMIN, ESTUDIANTE, SISTEMA }
    public enum TipoComentario { FEEDBACK, RESPUESTA, SISTEMA }
}
