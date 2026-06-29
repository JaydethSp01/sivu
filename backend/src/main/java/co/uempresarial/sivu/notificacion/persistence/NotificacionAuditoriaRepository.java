package co.uempresarial.sivu.notificacion.persistence;

import co.uempresarial.sivu.notificacion.domain.NotificacionAuditoria;
import co.uempresarial.sivu.notificacion.domain.TipoEventoNotificacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificacionAuditoriaRepository extends JpaRepository<NotificacionAuditoria, Long> {

    /**
     * Idempotencia básica: ¿ya se notificó con éxito este mismo evento para la
     * misma referencia de dominio?
     */
    boolean existsByReferenciaTipoAndReferenciaIdAndTipoEventoAndEnviadoExitosoTrue(
        String referenciaTipo, Long referenciaId, TipoEventoNotificacion tipoEvento);

    @Query(
        value = """
            SELECT n FROM NotificacionAuditoria n
            WHERE (:destinatario IS NULL OR LOWER(n.destinatarioEmail) LIKE LOWER(CONCAT('%', :destinatario, '%')))
              AND (:tipoEvento IS NULL OR n.tipoEvento = :tipoEvento)
            ORDER BY n.createdAt DESC
            """,
        countQuery = """
            SELECT COUNT(n) FROM NotificacionAuditoria n
            WHERE (:destinatario IS NULL OR LOWER(n.destinatarioEmail) LIKE LOWER(CONCAT('%', :destinatario, '%')))
              AND (:tipoEvento IS NULL OR n.tipoEvento = :tipoEvento)
            """)
    Page<NotificacionAuditoria> buscar(@Param("destinatario") String destinatario,
                                       @Param("tipoEvento") TipoEventoNotificacion tipoEvento,
                                       Pageable pageable);
}
