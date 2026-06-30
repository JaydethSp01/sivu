package co.uempresarial.sivu.estudiante.persistence;

import co.uempresarial.sivu.estudiante.domain.EstadoEstudiante;
import co.uempresarial.sivu.estudiante.domain.Estudiante;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {

    Optional<Estudiante> findByNumeroDocumento(String numeroDocumento);

    Optional<Estudiante> findByEmailIgnoreCase(String email);

    boolean existsByNumeroDocumento(String numeroDocumento);

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Listado de estudiantes. Si se pasa {@code empresaId}, solo devuelve estudiantes
     * que tengan una práctica (convenio) en esa empresa (auto-scope para usuarios
     * EMPRESA: solo ven a sus practicantes asignados).
     */
    @Query("""
        SELECT DISTINCT e FROM Estudiante e
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(e.nombres) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(e.email) LIKE LOWER(CONCAT('%', :q, '%'))
               OR e.numeroDocumento LIKE CONCAT('%', :q, '%'))
          AND (:estado IS NULL OR e.estado = :estado)
          AND (:empresaId IS NULL OR e.id IN (
                SELECT c.estudiante.id FROM Convenio c
                WHERE c.empresa.id = :empresaId))
        """)
    Page<Estudiante> buscar(@Param("q") String q,
                            @Param("estado") EstadoEstudiante estado,
                            @Param("empresaId") Long empresaId,
                            Pageable pageable);
}
