package co.uempresarial.sivu.catalogo.requisito.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "tipo_requisito_documental")
public class TipoRequisitoDocumental extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    @NotBlank @Size(max = 60)
    private String codigo;

    @Column(nullable = false, length = 160)
    @NotBlank @Size(max = 160)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "aplica_a", nullable = false, length = 20)
    @NotNull
    private AplicaA aplicaA;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
