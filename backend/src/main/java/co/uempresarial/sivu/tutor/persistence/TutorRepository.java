package co.uempresarial.sivu.tutor.persistence;

import co.uempresarial.sivu.tutor.domain.EstadoTutor;
import co.uempresarial.sivu.tutor.domain.TipoTutor;
import co.uempresarial.sivu.tutor.domain.Tutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {

    Optional<Tutor> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("""
        SELECT t FROM Tutor t
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(t.nombres) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(t.apellidos) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(t.email) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:tipo IS NULL OR t.tipo = :tipo)
          AND (:estado IS NULL OR t.estado = :estado)
          AND (:empresaId IS NULL OR t.empresa.id = :empresaId)
        """)
    Page<Tutor> buscar(@Param("q") String q,
                       @Param("tipo") TipoTutor tipo,
                       @Param("estado") EstadoTutor estado,
                       @Param("empresaId") Long empresaId,
                       Pageable pageable);
}
