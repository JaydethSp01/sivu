package co.uempresarial.sivu.security.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "usuarios")
public class Usuario {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private String nombres;
    private String apellidos;

    @Builder.Default
    private Set<Rol> roles = new HashSet<>();

    // FKs lógicas hacia entidades JPA en Postgres (sin integridad referencial cross-DB).
    private Long estudianteId;
    private Long empresaId;
    /** Entidad Tutor vinculada: ACADEMICO para el docente acompañante, EMPRESARIAL para el tutor.
     *  Habilita el auto-scope estricto del docente (solo sus estudiantes/reuniones/franjas). */
    private Long tutorId;

    @Builder.Default
    private boolean activo = true;

    private Instant ultimoLogin;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
