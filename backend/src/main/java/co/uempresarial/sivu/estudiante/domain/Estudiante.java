package co.uempresarial.sivu.estudiante.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "estudiantes")
public class Estudiante extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento", nullable = false, length = 10)
    @NotNull
    private TipoDocumento tipoDocumento;

    @Column(name = "numero_documento", nullable = false, unique = true, length = 30)
    @NotBlank
    private String numeroDocumento;

    @Column(nullable = false, length = 120)
    @NotBlank
    private String nombres;

    @Column(nullable = false, length = 120)
    @NotBlank
    private String apellidos;

    @Column(nullable = false, unique = true, length = 180)
    @Email
    @NotBlank
    private String email;

    @Column(length = 30)
    private String telefono;

    @Column(name = "programa_academico", nullable = false, length = 120)
    @NotBlank
    private String programaAcademico;

    @Column(nullable = false)
    @Min(1) @Max(20)
    private Short semestre;

    @Column(name = "creditos_aprobados", nullable = false)
    @Min(0)
    private Short creditosAprobados;

    @Column(name = "promedio_acumulado", nullable = false, precision = 3, scale = 2)
    @DecimalMin("0.0") @DecimalMax("5.0")
    private BigDecimal promedioAcumulado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoEstudiante estado = EstadoEstudiante.ACTIVO;
}
