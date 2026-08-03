package com.roomease.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.util.Set;

@Configuration
public class GoogleJwtConfig {
    private static final Set<String> GOOGLE_ISSUERS = Set.of(
        "https://accounts.google.com",
        "accounts.google.com"
    );

    @Bean
    @Qualifier("googleJwtDecoder")
    public JwtDecoder googleJwtDecoder(@Value("${app.google.client-id:}") String clientId) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
            .build();

        OAuth2TokenValidator<Jwt> claimsValidator = token -> {
            if (clientId == null || clientId.isBlank()) {
                return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("google_client_id_missing", "GOOGLE_CLIENT_ID chưa được cấu hình", null)
                );
            }
            if (token.getAudience() == null || !token.getAudience().contains(clientId)) {
                return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_audience", "Google token không dành cho RoomEase", null)
                );
            }
            if (!GOOGLE_ISSUERS.contains(token.getIssuer() == null ? "" : token.getIssuer().toString())) {
                return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_issuer", "Nguồn phát hành Google token không hợp lệ", null)
                );
            }
            return OAuth2TokenValidatorResult.success();
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            new JwtTimestampValidator(),
            claimsValidator
        ));
        return decoder;
    }
}
