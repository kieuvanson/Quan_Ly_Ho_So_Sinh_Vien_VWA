package vn.vwa.edurecords.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessTokenTtlMs;
    private final long refreshTokenTtlMs;
    private final String issuer;

    public JwtService(
            @Value("${app.security.jwt.secret}") String secret,
            @Value("${app.security.jwt.access-token-ttl:PT1H}") String accessTokenTtl,
            @Value("${app.security.jwt.refresh-token-ttl:P7D}") String refreshTokenTtl,
            @Value("${app.security.jwt.issuer:vwa-edurecords}") String issuer) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtlMs = parseDuration(accessTokenTtl);
        this.refreshTokenTtlMs = parseDuration(refreshTokenTtl);
        this.issuer = issuer;
    }

    private long parseDuration(String duration) {
        if (duration.startsWith("PT")) {
            long ms = 0;
            if (duration.contains("H")) {
                ms += Long.parseLong(duration.split("H")[0].replace("PT", "")) * 3600000L;
            }
            if (duration.contains("M")) {
                String minPart = duration.replaceAll(".*?(\\d+)M.*", "$1");
                ms += Long.parseLong(minPart) * 60000L;
            }
            if (duration.contains("S")) {
                String secPart = duration.replaceAll(".*?(\\d+)S", "$1");
                ms += Long.parseLong(secPart) * 1000L;
            }
            return ms;
        }
        return 3600000L;
    }

    public String generateAccessToken(String username, String role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenTtlMs);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("type", "access")
                .id(jti)
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenTtlMs);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .subject(username)
                .claim("type", "refresh")
                .id(jti)
                .issuer(issuer)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public String extractJti(String token) {
        return extractClaims(token).getId();
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = extractClaims(token);
            return !claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        try {
            Claims claims = extractClaims(token);
            return "access".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims claims = extractClaims(token);
            return "refresh".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessTokenTtlMs() {
        return accessTokenTtlMs;
    }
}
