package co.uempresarial.sivu.entrevista.domain;

import co.uempresarial.sivu.postulacion.domain.Postulacion;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "entrevista")
public class Entrevista extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulacion_id", nullable = false)
    private Postulacion postulacion;

    @Column(name = "fecha_programada", nullable = false)
    @NotNull
    private OffsetDateTime fechaProgramada;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ModalidadEntrevista modalidad = ModalidadEntrevista.PRESENCIAL;

    @Column(length = 200)
    private String lugar;

    @Column(name = "enlace_virtual", length = 300)
    private String enlaceVirtual;

    @Column(name = "entrevistador_nombre", length = 160)
    private String entrevistadorNombre;

    @Column(name = "entrevistador_cargo", length = 120)
    private String entrevistadorCargo;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ResultadoEntrevista resultado = ResultadoEntrevista.PENDIENTE;

    @Column(name = "fecha_resultado")
    private OffsetDateTime fechaResultado;
}
