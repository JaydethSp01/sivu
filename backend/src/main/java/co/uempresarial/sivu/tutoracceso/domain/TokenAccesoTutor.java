package co.uempresarial.sivu.tutoracceso.domain;

import co.uempresarial.sivu.shared.audit.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.OffsetDateTime;

/**
 * Token de acceso externo para que un tutor empresarial diligencie su evaluación
 * sin contar con una cuenta institucional. El enlace que recibe el tutor contiene
 * el {@link #token}; al validarlo se recupera el contexto (tutor + convenio).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "token_acceso_tutor")
public class TokenAccesoTutor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tutor_id", nullable = false)
    @NotNull
    private Long tutorId;

    /** Convenio asociado a la evaluación (opcional). */
    @Column(name = "convenio_id")
    private Long convenioId;

    @Column(nullable = false, unique = true, length = 80)
    @NotNull
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @NotNull
    private PropositoTokenTutor proposito;

    @Column(name = "expira_en", nullable = false)
    @NotNull
    private OffsetDateTime expiraEn;

    @Column(nullable = false)
    @Builder.Default
    private boolean usado = false;
}
