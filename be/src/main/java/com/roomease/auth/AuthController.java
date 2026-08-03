package com.roomease.auth;

import com.roomease.auth.dto.*;
import com.roomease.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping({"/register", "/customer/register"})
    public ApiResponse<AuthResponse> registerCustomer(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Đăng ký khách hàng thành công", authService.registerCustomer(request));
    }

    @PostMapping({"/login", "/customer/login"})
    public ApiResponse<AuthResponse> loginCustomer(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Đăng nhập khách hàng thành công", authService.loginCustomer(request));
    }

    @PostMapping("/manager/login")
    public ApiResponse<AuthResponse> loginManager(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Đăng nhập quản lý thành công", authService.loginManager(request));
    }

    @PostMapping("/admin/login")
    public ApiResponse<AuthResponse> loginAdmin(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Đăng nhập quản trị thành công", authService.loginAdmin(request));
    }

    @PostMapping({"/google", "/customer/google"})
    public ApiResponse<AuthResponse> googleCustomerLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return ApiResponse.ok("Đăng nhập Google thành công", authService.googleCustomerLogin(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthResponse.UserProfile> me(Authentication authentication) {
        return ApiResponse.ok(authService.me(authentication.getName()));
    }
}
