package co.uempresarial.sivu.empresa.persistence;

import co.uempresarial.sivu.empresa.domain.Empresa;
import co.uempresarial.sivu.empresa.domain.EstadoEmpresa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    Optional<Empresa> findByNit(String nit);

    boolean existsByNit(String nit);

    @Query("""
        SELECT e FROM Empresa e
        WHERE (:q IS NULL OR :q = ''
               OR LOWER(e.razonSocial) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(e.nombreComercial) LIKE LOWER(CONCAT('%', :q, '%'))
               OR e.nit LIKE CONCAT('%', :q, '%'))
          AND (:estado IS NULL OR e.estado = :estado)
        """)
    Page<Empresa> buscar(@Param("q") String q,
                         @Param("estado") EstadoEmpresa estado,
                         Pageable pageable);
}
