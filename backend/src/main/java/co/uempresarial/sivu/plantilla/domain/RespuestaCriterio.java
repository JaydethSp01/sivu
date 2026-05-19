package co.uempresarial.sivu.plantilla.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "respuesta_criterio", uniqueConstraints = @UniqueConstraint(
    name = "uq_resp_criterio", columnNames = {"respuesta_id", "criterio_id"}))
public class RespuestaCriterio extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "respuesta_id", nullable = false)
    private RespuestaFormulario respuesta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterio_id", nullable = false)
    private CriterioPlantilla criterio;

    @Column(name = "valor_numero", precision = 5, scale = 2)
    private BigDecimal valorNumero;

    @Column(name = "valor_texto", columnDefinition = "TEXT")
    private String valorTexto;

    @Column(name = "valor_bool")
    private Boolean valorBool;
}
