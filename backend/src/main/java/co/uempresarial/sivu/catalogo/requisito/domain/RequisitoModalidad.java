package co.uempresarial.sivu.catalogo.requisito.domain;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "requisito_modalidad", uniqueConstraints = @UniqueConstraint(
    name = "uq_req_mod", columnNames = {"modalidad_id", "tipo_requisito_id"}))
public class RequisitoModalidad extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "modalidad_id", nullable = false)
    private ModalidadVinculacion modalidad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipo_requisito_id", nullable = false)
    private TipoRequisitoDocumental tipoRequisito;

    @Column(nullable = false)
    @NotNull
    @Builder.Default
    private Boolean obligatorio = true;

    @Column(nullable = false)
    @Min(0)
    @Builder.Default
    private Short orden = 0;

    @Column(columnDefinition = "TEXT")
    private String instrucciones;
}
