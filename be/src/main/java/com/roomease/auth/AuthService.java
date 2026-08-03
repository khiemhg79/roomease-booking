package com.roomease.auth;

import com.roomease.auth.dto.*;
import com.roomease.common.exception.ConflictException;
import com.roomease.common.exception.ForbiddenException;
import com.roomease.common.exception.NotFoundException;
import com.roomease.security.JwtService;
import com.roomease.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final GoogleTokenService googleTokenService;

    @Transactional
    public AuthResponse registerCustomer(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Email đã được sử dụng");
        }
        User user = User.builder()
            .fullName(request.fullName().trim())
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .phone(blankToNull(request.phone()))
            .emailVerified(false)
            .role(Role.CUSTOMER)
            .status(UserStatus.ACTIVE)
            .build();
        return tokenFor(userRepository.save(user));
    }

    public AuthResponse loginCustomer(LoginRequest request) {
        return loginForPortal(request, Role.CUSTOMER, "khách hàng");
    }

    public AuthResponse loginManager(LoginRequest request) {
        return loginForPortal(request, Role.HOTEL_MANAGER, "quản lý khách sạn");
    }

    public AuthResponse loginAdmin(LoginRequest request) {
        return loginForPortal(request, Role.ADMIN, "quản trị viên");
    }

    @Transactional
    public AuthResponse googleCustomerLogin(GoogleLoginRequest request) {
        GoogleIdentity identity = googleTokenService.verify(request.credential());
        String email = normalizeEmail(identity.email());

        User user = userRepository.findByGoogleSubject(identity.subject())
            .or(() -> userRepository.findByEmailIgnoreCase(email))
            .orElseGet(() -> createGoogleCustomer(identity, email));

        if (user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Tài khoản này phải đăng nhập tại cổng " + portalLabel(user.getRole()));
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException("Tài khoản hiện không hoạt động");
        }

        boolean changed = false;
        if (user.getGoogleSubject() == null || user.getGoogleSubject().isBlank()) {
            user.setGoogleSubject(identity.subject());
            changed = true;
        }
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            changed = true;
        }
        if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && identity.avatarUrl() != null) {
            user.setAvatarUrl(identity.avatarUrl());
            changed = true;
        }
        if (changed) userRepository.save(user);
        return tokenFor(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserProfile me(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
        return profile(user);
    }

    private AuthResponse loginForPortal(LoginRequest request, Role requiredRole, String portalName) {
        String email = normalizeEmail(request.email());
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.password())
        );
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
        if (user.getRole() != requiredRole) {
            throw new ForbiddenException("Tài khoản này không thuộc cổng " + portalName);
        }
        return tokenFor(user);
    }

    private User createGoogleCustomer(GoogleIdentity identity, String email) {
        String fullName = blankToNull(identity.fullName());
        if (fullName == null) {
            int at = email.indexOf('@');
            fullName = at > 0 ? email.substring(0, at) : email;
        }
        return userRepository.save(User.builder()
            .fullName(fullName)
            .email(email)
            .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
            .avatarUrl(blankToNull(identity.avatarUrl()))
            .googleSubject(identity.subject())
            .emailVerified(true)
            .role(Role.CUSTOMER)
            .status(UserStatus.ACTIVE)
            .build());
    }

    private AuthResponse tokenFor(User user) {
        UserDetails details = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(details, Map.of(
            "role", user.getRole().name(),
            "uid", user.getId().toString()
        ));
        return new AuthResponse(token, "Bearer", jwtService.expirationMs(), profile(user));
    }

    private AuthResponse.UserProfile profile(User user) {
        return new AuthResponse.UserProfile(
            user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
            user.getAvatarUrl(), user.getRole().name()
        );
    }

    private String portalLabel(Role role) {
        return switch (role) {
            case ADMIN -> "quản trị viên";
            case HOTEL_MANAGER -> "quản lý khách sạn";
            case CUSTOMER -> "khách hàng";
        };
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
