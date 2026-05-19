package co.uempresarial.sivu.empresa.domain;

import co.uempresarial.sivu.estudiante.domain.Estudiante;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "empresas")
public class Empresa extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    @NotBlank
    private String nit;

    @Column(name = "razon_social", nullable = false, length = 180)
    @NotBlank
    private String razonSocial;

    @Column(name = "nombre_comercial", length = 180)
    private String nombreComercial;

    @Column(nullable = false, length = 80)
    @NotBlank
    private String sector;

    @Column(nullable = false, length = 80)
    @NotBlank
    private String ciudad;

    @Column(length = 200)
    private String direccion;

    @Column(name = "email_contacto", nullable = false, length = 180)
    @Email @NotBlank
    private String emailContacto;

    @Column(name = "telefono_contacto", length = 30)
    private String telefonoContacto;

    @Column(name = "contacto_nombre", nullable = false, length = 160)
    @NotBlank
    private String contactoNombre;

    @Column(name = "contacto_cargo", length = 120)
    private String contactoCargo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoEmpresa estado = EstadoEmpresa.EN_REVISION;

    /**
     * Estudiante que propuso la empresa para alianza (flujo "empresa nueva").
     * Null = empresa creada por admin/coord (catálogo CCB o similar).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "propuesta_por_estudiante_id")
    private Estudiante propuestaPorEstudiante;

    @Column(name = "fecha_aprobacion")
    private OffsetDateTime fechaAprobacion;

    @Column(name = "motivo_rechazo", columnDefinition = "TEXT")
    private String motivoRechazo;
}
