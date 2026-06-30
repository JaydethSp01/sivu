package co.uempresarial.sivu.documento.persistence;

import co.uempresarial.sivu.documento.domain.Documento;
import co.uempresarial.sivu.documento.domain.EstadoDocumento;
import co.uempresarial.sivu.documento.domain.TipoDocumentoSoporte;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {

    List<Documento> findByEstudianteIdOrderByCreatedAtDesc(Long estudianteId);

    /**
     * Listado de documentos. Si {@code empresaId} no es null, devuelve solo
     * los documentos directamente asociados a esa empresa (RUT, cámara, etc.).
     *
     * Usa LEFT JOIN explícito en empresa porque es nullable: navegar
     * d.empresa.id con la sintaxis implícita generaría INNER JOIN y filtraría
     * todos los documentos sin empresa asociada.
     */
    @Query("""
        SELECT d FROM Documento d
        LEFT JOIN d.empresa de
        WHERE (:estado IS NULL OR d.estado = :estado)
          AND (:tipo IS NULL OR d.tipo = :tipo)
          AND (:estudianteId IS NULL OR d.estudiante.id = :estudianteId)
          AND (:empresaId IS NULL OR de.id = :empresaId)
        """)
    Page<Documento> buscar(@Param("estado") EstadoDocumento estado,
                           @Param("tipo") TipoDocumentoSoporte tipo,
                           @Param("estudianteId") Long estudianteId,
                           @Param("empresaId") Long empresaId,
                           Pageable pageable);

    /** Documentos asociados directamente a una empresa (RUT, cámara, etc.). */
    List<Documento> findByEmpresaIdOrderByCreatedAtDesc(Long empresaId);

    /**
     * Primer documento de un estudiante de cierto tipo (útil para upsert
     * automático, p. ej. la HV generada por el sistema).
     */
    java.util.Optional<Documento> findFirstByEstudianteIdAndTipoOrderByCreatedAtDesc(
        Long estudianteId, TipoDocumentoSoporte tipo);
}
