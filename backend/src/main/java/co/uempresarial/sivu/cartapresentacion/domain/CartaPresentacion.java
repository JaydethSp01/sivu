package co.uempresarial.sivu.cartapresentacion.domain;

import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "carta_presentacion")
public class CartaPresentacion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulacion_id", nullable = false, unique = true)
    private Postulacion postulacion;

    @Column(name = "ruta_pdf", length = 500)
    private String rutaPdf;

    @Column(name = "contenido_extra", columnDefinition = "TEXT")
    private String contenidoExtra;

    @Column(name = "generada_at", nullable = false)
    @Builder.Default
    private OffsetDateTime generadaAt = OffsetDateTime.now();

    @Column(name = "firmada_por_coord_mongo_id", length = 36)
    private String firmadaPorCoordMongoId;

    @Column(name = "firmada_por_coord_nombre", length = 160)
    private String firmadaPorCoordNombre;
}
