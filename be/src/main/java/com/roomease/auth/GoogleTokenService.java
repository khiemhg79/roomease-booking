package com.roomease.auth;

import com.roomease.common.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

@Service
public class GoogleTokenService {
    private final JwtDecoder googleJwtDecoder;

    public GoogleTokenService(@Qualifier("googleJwtDecoder") JwtDecoder googleJwtDecoder) {
        this.googleJwtDecoder = googleJwtDecoder;
    }

    public GoogleIdentity verify(String credential) {
        try {
            Jwt jwt = googleJwtDecoder.decode(credential);
            String subject = jwt.getSubject();
            String email = jwt.getClaimAsString("email");
            Boolean verified = jwt.getClaim("email_verified");
            String name = jwt.getClaimAsString("name");
            String picture = jwt.getClaimAsString("picture");

            if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
                throw new UnauthorizedException("Google token thiếu thông tin tài khoản");
            }
            if (!Boolean.TRUE.equals(verified)) {
                throw new UnauthorizedException("Email Google chưa được xác minh");
            }
            return new GoogleIdentity(subject, email, true, name, picture);
        } catch (JwtException exception) {
            throw new UnauthorizedException("Google token không hợp lệ hoặc đã hết hạn", exception);
        }
    }
}
