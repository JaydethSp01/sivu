package co.uempresarial.sivu.tutor.domain;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tutores")
public class Tutor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @NotNull
    private TipoTutor tipo;

    @Column(nullable = false, length = 120)
    @NotBlank
    private String nombres;

    @Column(nullable = false, length = 120)
    @NotBlank
    private String apellidos;

    @Column(nullable = false, unique = true, length = 180)
    @Email @NotBlank
    private String email;

    @Column(length = 30)
    private String telefono;

    @Column(length = 120)
    private String cargo;

    @Column(length = 160)
    private String dependencia;

    /** Solo aplica si tipo = EMPRESARIAL. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoTutor estado = EstadoTutor.ACTIVO;
}
