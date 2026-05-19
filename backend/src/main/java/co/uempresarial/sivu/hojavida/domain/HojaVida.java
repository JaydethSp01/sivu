package co.uempresarial.sivu.hojavida.domain;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "hoja_vida")
public class HojaVida extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false, unique = true)
    private Estudiante estudiante;

    @Column(length = 200)
    private String direccion;

    @Column(name = "telefono_contacto", length = 30)
    private String telefonoContacto;

    @Column(length = 80)
    private String ciudad;

    @Column(name = "foto_path", length = 500)
    private String fotoPath;

    @Column(name = "perfil_saber", columnDefinition = "TEXT")
    private String perfilSaber;

    @Column(name = "perfil_hacer", columnDefinition = "TEXT")
    private String perfilHacer;

    @Column(name = "perfil_ser", columnDefinition = "TEXT")
    private String perfilSer;

    @Column(name = "ultima_actualizacion", nullable = false)
    @Builder.Default
    private OffsetDateTime ultimaActualizacion = OffsetDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoHojaVida estado = EstadoHojaVida.BORRADOR;

    @Column(name = "observaciones_coformacion", columnDefinition = "TEXT")
    private String observacionesCoformacion;

    @Column(name = "enviada_at")
    private OffsetDateTime enviadaAt;

    @Column(name = "aprobada_at")
    private OffsetDateTime aprobadaAt;

    @Column(name = "aprobada_por_coord_mongo_id", length = 36)
    private String aprobadaPorCoordMongoId;

    @Column(name = "aprobada_por_coord_nombre", length = 160)
    private String aprobadaPorCoordNombre;

    @OneToMany(mappedBy = "hojaVida", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<HojaVidaHabilidad> habilidades = new ArrayList<>();

    @OneToMany(mappedBy = "hojaVida", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<HojaVidaIdioma> idiomas = new ArrayList<>();

    @OneToMany(mappedBy = "hojaVida", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<HojaVidaEducacion> educacion = new ArrayList<>();

    @OneToMany(mappedBy = "hojaVida", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<HojaVidaExperienciaFase> experienciaFase = new ArrayList<>();

    @OneToMany(mappedBy = "hojaVida", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    @Builder.Default
    private List<HojaVidaExperienciaLaboral> experienciaLaboral = new ArrayList<>();

    /**
     * Heurística "HV completa" para que el checklist de requisitos la considere cumplida.
     * Exige: perfil completo (SABER/HACER/SER), al menos 1 habilidad, 1 idioma, 1 educación.
     */
    public boolean estaCompleta() {
        return perfilSaber != null && !perfilSaber.isBlank()
            && perfilHacer != null && !perfilHacer.isBlank()
            && perfilSer != null && !perfilSer.isBlank()
            && habilidades != null && !habilidades.isEmpty()
            && idiomas != null && !idiomas.isEmpty()
            && educacion != null && !educacion.isEmpty();
    }
}
