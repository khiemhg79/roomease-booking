package com.roomease.admin;

import com.roomease.admin.dto.*;
import com.roomease.booking.Booking;
import com.roomease.booking.BookingStatus;
import com.roomease.booking.PaymentStatus;
import com.roomease.booking.repo.BookingRepository;
import com.roomease.common.dto.PageResponse;
import com.roomease.common.exception.BadRequestException;
import com.roomease.common.exception.ForbiddenException;
import com.roomease.common.exception.NotFoundException;
import com.roomease.property.Property;
import com.roomease.property.PropertyStatus;
import com.roomease.property.repo.PropertyRepository;
import com.roomease.property.repo.RoomTypeRepository;
import com.roomease.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard(String email) {
        requireAdmin(email);
        List<AdminDashboardResponse.RecentUser> users = userRepository.findTop5ByOrderByCreatedAtDesc().stream()
            .map(u -> new AdminDashboardResponse.RecentUser(
                u.getId(), u.getFullName(), u.getEmail(), u.getRole().name(), u.getStatus().name(), u.getCreatedAt()
            )).toList();
        List<AdminDashboardResponse.RecentProperty> properties = propertyRepository.findTop5ByOrderByCreatedAtDesc().stream()
            .map(p -> new AdminDashboardResponse.RecentProperty(
                p.getId(), p.getName(), p.getCity(), p.getStatus().name(),
                p.getOwner() == null ? null : p.getOwner().getEmail(), p.getCreatedAt()
            )).toList();
        List<AdminDashboardResponse.RecentBooking> bookings = bookingRepository.findTop5ByOrderByCreatedAtDesc().stream()
            .map(b -> new AdminDashboardResponse.RecentBooking(
                b.getBookingCode(), b.getProperty().getName(), b.getGuestFullName(), b.getCheckIn(),
                b.getStatus().name(), b.getTotalAmount(), b.getCreatedAt()
            )).toList();
        BigDecimal revenue = bookingRepository.sumRevenueByPaymentStatus(PaymentStatus.PAID);
        return new AdminDashboardResponse(
            userRepository.count(),
            userRepository.countByRole(Role.CUSTOMER),
            userRepository.countByRole(Role.HOTEL_MANAGER),
            userRepository.countByStatus(UserStatus.BLOCKED),
            propertyRepository.count(),
            propertyRepository.countByStatus(PropertyStatus.ACTIVE),
            propertyRepository.countByStatus(PropertyStatus.DRAFT),
            bookingRepository.count(),
            bookingRepository.countByStatus(BookingStatus.PENDING),
            bookingRepository.countByCheckIn(LocalDate.now()),
            revenue == null ? BigDecimal.ZERO : revenue,
            "VND",
            users,
            properties,
            bookings
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> users(
        String email, String role, String status, String keyword, int page, int size
    ) {
        requireAdmin(email);
        Role parsedRole = parseRole(role);
        UserStatus parsedStatus = parseUserStatus(status);
        String normalizedKeyword = blankToNull(keyword);
        Page<AdminUserResponse> result = userRepository.searchForAdmin(
            parsedRole, parsedStatus, normalizedKeyword, PageRequest.of(page, size)
        ).map(this::toUserResponse);
        return PageResponse.from(result);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(String adminEmail, UUID userId, UpdateUserStatusRequest request) {
        User admin = requireAdmin(adminEmail);
        User target = findUser(userId);
        UserStatus next = UserStatus.valueOf(request.status().toUpperCase(Locale.ROOT));
        if (admin.getId().equals(target.getId()) && next != UserStatus.ACTIVE) {
            throw new ForbiddenException("Không thể khóa chính tài khoản quản trị đang đăng nhập");
        }
        target.setStatus(next);
        return toUserResponse(userRepository.save(target));
    }

    @Transactional
    public AdminUserResponse updateUserRole(String adminEmail, UUID userId, UpdateUserRoleRequest request) {
        User admin = requireAdmin(adminEmail);
        User target = findUser(userId);
        Role next = Role.valueOf(request.role().toUpperCase(Locale.ROOT));
        if (admin.getId().equals(target.getId()) && next != Role.ADMIN) {
            throw new ForbiddenException("Không thể hạ quyền chính tài khoản quản trị đang đăng nhập");
        }
        if (target.getRole() == Role.HOTEL_MANAGER && next != Role.HOTEL_MANAGER
            && propertyRepository.countByOwner_Id(target.getId()) > 0) {
            throw new BadRequestException("Hãy chuyển chủ sở hữu các chỗ nghỉ trước khi đổi quyền quản lý");
        }
        target.setRole(next);
        return toUserResponse(userRepository.save(target));
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminPropertyResponse> properties(
        String email, String status, String keyword, int page, int size
    ) {
        requireAdmin(email);
        PropertyStatus parsedStatus = parsePropertyStatus(status);
        Page<AdminPropertyResponse> result = propertyRepository.searchForAdmin(
            parsedStatus, blankToNull(keyword), PageRequest.of(page, size)
        ).map(this::toPropertyResponse);
        return PageResponse.from(result);
    }

    @Transactional
    public AdminPropertyResponse moderateProperty(
        String email, UUID propertyId, ModeratePropertyRequest request
    ) {
        requireAdmin(email);
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy chỗ nghỉ"));
        if (request.status() != null && !request.status().isBlank()) {
            property.setStatus(PropertyStatus.valueOf(request.status().toUpperCase(Locale.ROOT)));
        }
        if (request.featured() != null) property.setFeatured(request.featured());
        if (request.clearOwner()) {
            property.setOwner(null);
        } else if (request.ownerId() != null) {
            User owner = findUser(request.ownerId());
            if (owner.getRole() != Role.HOTEL_MANAGER) {
                throw new BadRequestException("Chủ sở hữu phải có quyền HOTEL_MANAGER");
            }
            if (owner.getStatus() != UserStatus.ACTIVE) {
                throw new BadRequestException("Tài khoản quản lý phải đang hoạt động");
            }
            property.setOwner(owner);
        }
        return toPropertyResponse(propertyRepository.save(property));
    }

    private AdminUserResponse toUserResponse(User user) {
        return new AdminUserResponse(
            user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getAvatarUrl(),
            user.isEmailVerified(), user.getRole().name(), user.getStatus().name(),
            propertyRepository.countByOwner_Id(user.getId()), user.getCreatedAt(), user.getUpdatedAt()
        );
    }

    private AdminPropertyResponse toPropertyResponse(Property property) {
        return new AdminPropertyResponse(
            property.getId(), property.getName(), property.getSlug(), property.getPropertyType().name(),
            property.getCity(), property.getCountry(), property.getStarRating(), property.getReviewScore(),
            property.getReviewCount(), property.getStatus().name(), property.isFeatured(),
            property.getOwner() == null ? null : property.getOwner().getId(),
            property.getOwner() == null ? null : property.getOwner().getFullName(),
            property.getOwner() == null ? null : property.getOwner().getEmail(),
            roomTypeRepository.countByPropertyId(property.getId()),
            bookingRepository.countByPropertyId(property.getId()),
            property.getCreatedAt(), property.getUpdatedAt()
        );
    }

    private User requireAdmin(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
        if (user.getRole() != Role.ADMIN) throw new ForbiddenException("Chỉ ADMIN được sử dụng chức năng này");
        return user;
    }

    private User findUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
    }

    private Role parseRole(String value) {
        if (value == null || value.isBlank()) return null;
        try { return Role.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException ex) { throw new BadRequestException("Role không hợp lệ"); }
    }

    private UserStatus parseUserStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try { return UserStatus.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException ex) { throw new BadRequestException("Trạng thái tài khoản không hợp lệ"); }
    }

    private PropertyStatus parsePropertyStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try { return PropertyStatus.valueOf(value.trim().toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException ex) { throw new BadRequestException("Trạng thái chỗ nghỉ không hợp lệ"); }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
