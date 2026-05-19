package co.uempresarial.sivu.postulacion.persistence;

import co.uempresarial.sivu.postulacion.domain.EstadoPostulacion;
import co.uempresarial.sivu.postulacion.domain.Postulacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long> {

    @EntityGraph(attributePaths = {"estudiante", "vacante", "vacante.empresa"})
    @Override
    Optional<Postulacion> findById(Long id);

    Optional<Postulacion> findByEstudianteIdAndVacanteId(Long estudianteId, Long vacanteId);

    List<Postulacion> findByEstudianteId(Long estudianteId);

    List<Postulacion> findByVacanteId(Long vacanteId);

    long countByEstado(EstadoPostulacion estado);

    /**
     * Listado paginado con EntityGraph para evitar N+1 en el mapper
     * (estudiante.nombres + vacante.titulo + vacante.empresa.razonSocial).
     */
    @EntityGraph(attributePaths = {"estudiante", "vacante", "vacante.empresa"})
    @Query(
        value = """
            SELECT p FROM Postulacion p
            WHERE (:estado IS NULL OR p.estado = :estado)
              AND (:estudianteId IS NULL OR p.estudiante.id = :estudianteId)
              AND (:vacanteId IS NULL OR p.vacante.id = :vacanteId)
              AND (:empresaId IS NULL OR p.vacante.empresa.id = :empresaId)
            ORDER BY p.fechaPostulacion DESC
            """,
        countQuery = """
            SELECT COUNT(p) FROM Postulacion p
            WHERE (:estado IS NULL OR p.estado = :estado)
              AND (:estudianteId IS NULL OR p.estudiante.id = :estudianteId)
              AND (:vacanteId IS NULL OR p.vacante.id = :vacanteId)
              AND (:empresaId IS NULL OR p.vacante.empresa.id = :empresaId)
            """)
    Page<Postulacion> buscar(@Param("estado") EstadoPostulacion estado,
                             @Param("estudianteId") Long estudianteId,
                             @Param("vacanteId") Long vacanteId,
                             @Param("empresaId") Long empresaId,
                             Pageable pageable);
}
