package co.uempresarial.sivu.catalogo.modalidad.persistence;

import co.uempresarial.sivu.catalogo.modalidad.domain.ModalidadVinculacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ModalidadVinculacionRepository extends JpaRepository<ModalidadVinculacion, Long> {

    Optional<ModalidadVinculacion> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    List<ModalidadVinculacion> findByActivoTrueOrderByNombreAsc();

    @Query("""
        SELECT m FROM ModalidadVinculacion m
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(m.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(m.codigo) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:activo IS NULL OR m.activo = :activo)
        """)
    Page<ModalidadVinculacion> buscar(@Param("q") String q,
                                      @Param("activo") Boolean activo,
                                      Pageable pageable);
}
