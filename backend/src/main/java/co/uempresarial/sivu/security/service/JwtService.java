package co.uempresarial.sivu.security.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpirationMinutes;
    private final long refreshExpirationDays;

    public JwtService(
        @Value("${app.security.jwt.secret}") String secret,
        @Value("${app.security.jwt.access-token-expiration-minutes}") long accessExpirationMinutes,
        @Value("${app.security.jwt.refresh-token-expiration-days}") long refreshExpirationDays
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 64) {
            throw new IllegalStateException("app.security.jwt.secret debe tener al menos 64 bytes (caracteres ASCII).");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpirationMinutes = accessExpirationMinutes;
        this.refreshExpirationDays = refreshExpirationDays;
    }

    public String generateAccessToken(String subjectEmail, List<String> roles, String usuarioId) {
        Instant now = Instant.now();
        Instant exp = now.plus(accessExpirationMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
            .subject(subjectEmail)
            .issuer("sivu-backend")
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .claims(Map.of(
                "roles", roles,
                "uid", usuarioId,
                "type", "access"))
            .signWith(signingKey, Jwts.SIG.HS512)
            .compact();
    }

    public String generateRefreshToken(String subjectEmail, String usuarioId) {
        Instant now = Instant.now();
        Instant exp = now.plus(refreshExpirationDays, ChronoUnit.DAYS);
        return Jwts.builder()
            .subject(subjectEmail)
            .issuer("sivu-backend")
            .issuedAt(Date.from(now))
            .expiration(Date.from(exp))
            .claims(Map.of("uid", usuarioId, "type", "refresh"))
            .signWith(signingKey, Jwts.SIG.HS512)
            .compact();
    }

    public String extractSubject(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, String expectedSubject) {
        try {
            String subject = extractSubject(token);
            return expectedSubject.equalsIgnoreCase(subject) && !isExpired(token);
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    public long getAccessExpirationSeconds() {
        return accessExpirationMinutes * 60L;
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Object raw = extractAllClaims(token).get("roles");
        if (raw instanceof List<?> list) {
            return (List<String>) list;
        }
        return List.of();
    }

    public String extractType(String token) {
        return (String) extractAllClaims(token).get("type");
    }

    public String extractUsuarioId(String token) {
        return (String) extractAllClaims(token).get("uid");
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
