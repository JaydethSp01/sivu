package co.uempresarial.sivu.convenio.persistence;

import co.uempresarial.sivu.convenio.domain.Convenio;
import co.uempresarial.sivu.convenio.domain.EstadoConvenio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ConvenioRepository extends JpaRepository<Convenio, Long> {

    @EntityGraph(attributePaths = {
        "estudiante", "empresa",
        "documentoPdf", "certificadoPdf", "tutorAcademico", "tutorEmpresarial"
    })
    @Override
    Optional<Convenio> findById(Long id);

    Optional<Convenio> findByNumeroConvenio(String numero);

    boolean existsByNumeroConvenio(String numero);

    /**
     * ¿El estudiante ya tuvo un convenio con esta empresa? Usado por el matching para
     * dar el bonus de continuidad y por el módulo de cohortes para "continuidad
     * automática" entre semestres.
     */
    boolean existsByEstudianteIdAndEmpresaId(Long estudianteId, Long empresaId);

    /**
     * Listado con EntityGraph para evitar N+1: precarga todas las relaciones
     * que el mapper de respuesta necesita.
     */
    @EntityGraph(attributePaths = {
        "estudiante", "empresa",
        "documentoPdf", "certificadoPdf", "tutorAcademico", "tutorEmpresarial"
    })
    @Query(
        value = """
            SELECT c FROM Convenio c
            WHERE (:estado IS NULL OR c.estado = :estado)
              AND (:estudianteId IS NULL OR c.estudiante.id = :estudianteId)
              AND (:empresaId IS NULL OR c.empresa.id = :empresaId)
            """,
        countQuery = """
            SELECT COUNT(c) FROM Convenio c
            WHERE (:estado IS NULL OR c.estado = :estado)
              AND (:estudianteId IS NULL OR c.estudiante.id = :estudianteId)
              AND (:empresaId IS NULL OR c.empresa.id = :empresaId)
            """)
    Page<Convenio> buscar(@Param("estado") EstadoConvenio estado,
                          @Param("estudianteId") Long estudianteId,
                          @Param("empresaId") Long empresaId,
                          Pageable pageable);
}
