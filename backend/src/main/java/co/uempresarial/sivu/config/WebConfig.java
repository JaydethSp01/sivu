package co.uempresarial.sivu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Orígenes permitidos extra (frontend desplegado). Se configura por env
     * APP_CORS_ORIGINS (lista separada por comas), p.ej. el dominio de Vercel.
     * Local siempre permitido.
     */
    @Value("${app.cors.allowed-origins:}")
    private String[] extraOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] base = {
            "http://localhost:*", "http://127.0.0.1:*",
            "https://*.vercel.app"
        };
        String[] all = base;
        if (extraOrigins != null && extraOrigins.length > 0 && !extraOrigins[0].isBlank()) {
            all = new String[base.length + extraOrigins.length];
            System.arraycopy(base, 0, all, 0, base.length);
            System.arraycopy(extraOrigins, 0, all, base.length, extraOrigins.length);
        }
        registry.addMapping("/api/**")
            .allowedOriginPatterns(all)
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("Authorization", "Content-Disposition")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
