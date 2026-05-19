package co.uempresarial.sivu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;

import java.time.OffsetDateTime;
import java.util.Optional;

/**
 * Provee a Spring Data JPA Auditing un {@link OffsetDateTime} en lugar del
 * {@code LocalDateTime} por defecto. Necesario porque {@code BaseEntity.createdAt}
 * y {@code updatedAt} están tipados como {@code OffsetDateTime}.
 */
@Configuration
public class AuditingDateTimeProvider {

    public static final String BEAN_NAME = "auditingOffsetDateTimeProvider";

    @Bean(name = BEAN_NAME)
    public DateTimeProvider auditingOffsetDateTimeProvider() {
        return () -> Optional.of(OffsetDateTime.now());
    }
}
