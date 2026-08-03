package com.roomease.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(max = 120) String fullName,
    @NotBlank @Email @Size(max = 180) String email,
    @NotBlank @Size(min = 8, max = 72) String password,
    @Pattern(regexp = "^[0-9+() .-]{8,30}$", message = "Số điện thoại không hợp lệ") String phone
) {
}
