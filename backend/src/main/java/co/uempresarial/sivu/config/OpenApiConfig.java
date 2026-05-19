package co.uempresarial.sivu.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI sivuOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("SIVU — Sistema de Vinculación Universitaria")
                .description("API REST para automatizar el proceso de vinculación de estudiantes a prácticas profesionales de la Universidad Empresarial.")
                .version("v1.0.0")
                .contact(new Contact()
                    .name("Equipo SIVU")
                    .email("sivu@uempresarial.edu.co"))
                .license(new License().name("Academic Use").url("https://uempresarial.edu.co")))
            .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
            .components(new Components().addSecuritySchemes(SECURITY_SCHEME_NAME,
                new SecurityScheme()
                    .name(SECURITY_SCHEME_NAME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Token JWT obtenido en /api/v1/auth/login")));
    }
}
