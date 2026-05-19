package co.uempresarial.sivu.catalogo.requisito.persistence;

import co.uempresarial.sivu.catalogo.requisito.domain.AplicaA;
import co.uempresarial.sivu.catalogo.requisito.domain.TipoRequisitoDocumental;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TipoRequisitoDocumentalRepository extends JpaRepository<TipoRequisitoDocumental, Long> {

    Optional<TipoRequisitoDocumental> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    List<TipoRequisitoDocumental> findByActivoTrueOrderByNombreAsc();

    @Query("""
        SELECT t FROM TipoRequisitoDocumental t
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(t.nombre) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(t.codigo) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:aplicaA IS NULL OR t.aplicaA = :aplicaA)
          AND (:activo IS NULL OR t.activo = :activo)
        """)
    Page<TipoRequisitoDocumental> buscar(@Param("q") String q,
                                         @Param("aplicaA") AplicaA aplicaA,
                                         @Param("activo") Boolean activo,
                                         Pageable pageable);
}
