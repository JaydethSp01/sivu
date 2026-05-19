package co.uempresarial.sivu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing(dateTimeProviderRef = AuditingDateTimeProvider.BEAN_NAME)
public class JpaAuditingConfig {
}
