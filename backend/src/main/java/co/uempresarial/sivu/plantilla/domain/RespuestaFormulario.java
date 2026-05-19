package co.uempresarial.sivu.plantilla.domain;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import co.uempresarial.sivu.trimestre.domain.Trimestre;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "respuesta_formulario")
public class RespuestaFormulario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plantilla_id", nullable = false)
    private PlantillaFormulario plantilla;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convenio_id")
    private Convenio convenio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trimestre_id")
    private Trimestre trimestre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudiante_id")
    private Estudiante estudiante;

    @Column(name = "asignado_a_mongo_id", length = 36)
    private String asignadoAMongoId;

    @Column(name = "asignado_a_nombre", length = 160)
    private String asignadoANombre;

    @Column(name = "asignado_a_rol", length = 20)
    private String asignadoARol;

    @Column(name = "asignado_por_nombre", length = 160)
    private String asignadoPorNombre;

    @Column(name = "fecha_asignacion", nullable = false)
    @Builder.Default
    private OffsetDateTime fechaAsignacion = OffsetDateTime.now();

    @Column(name = "fecha_limite")
    private LocalDate fechaLimite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoRespuesta estado = EstadoRespuesta.PENDIENTE;

    @Column(name = "nota_calculada", precision = 3, scale = 2)
    private BigDecimal notaCalculada;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "fecha_entrega")
    private OffsetDateTime fechaEntrega;

    @Column(name = "fecha_firma")
    private OffsetDateTime fechaFirma;

    @Column(name = "firmado_por_mongo_id", length = 36)
    private String firmadoPorMongoId;

    @Column(name = "firmado_por_nombre", length = 160)
    private String firmadoPorNombre;

    @OneToMany(mappedBy = "respuesta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<RespuestaCriterio> respuestas = new ArrayList<>();
}
