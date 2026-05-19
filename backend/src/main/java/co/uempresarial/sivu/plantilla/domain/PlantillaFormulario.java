package co.uempresarial.sivu.plantilla.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "plantilla_formulario", uniqueConstraints = @UniqueConstraint(
    name = "uq_plantilla_codigo_version", columnNames = {"codigo", "version"}))
public class PlantillaFormulario extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String codigo;

    @Column(nullable = false, length = 10)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TipoPlantilla tipo;

    @Column(nullable = false, length = 180)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false)
    @Builder.Default
    private Boolean vigente = false;

    @Column(name = "fecha_vigencia")
    private LocalDate fechaVigencia;

    @Column(name = "creado_por_nombre", length = 160)
    private String creadoPorNombre;

    @OneToMany(mappedBy = "plantilla", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC, id ASC")
    @Builder.Default
    private List<SeccionPlantilla> secciones = new ArrayList<>();
}
