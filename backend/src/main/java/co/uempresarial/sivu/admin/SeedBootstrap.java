package co.uempresarial.sivu.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Ejecuta el seed automáticamente al arrancar SOLO en perfiles no productivos.
 * Esto resuelve el huevo-gallina del usuario ADMIN inicial sin necesidad de
 * exponer un endpoint público que cualquiera pueda invocar para crear admins.
 *
 * SeedService es idempotente (chequea count() antes de insertar), por lo que
 * múltiples arranques no duplican datos.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class SeedBootstrap {

    @Bean
    @Profile({"dev", "docker", "test"})
    public ApplicationRunner sivuSeedRunner(SeedService seed) {
        return args -> {
            log.info("Ejecutando seed automático (perfil dev/docker/test)…");
            seed.seed();
        };
    }
}
