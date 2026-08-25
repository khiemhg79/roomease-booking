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
import com.roomease.property.RoomType;
import com.roomease.property.repo.PropertyRepository;
import com.roomease.property.repo.RoomTypeRepository;
import com.roomease.review.Review;
import com.roomease.review.ReviewRepository;
import com.roomease.user.Role;
import com.roomease.user.User;
import com.roomease.user.UserRepository;
import com.roomease.user.UserStatus;
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
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard(String email) {
        requireAdmin(email);

        List<AdminDashboardResponse.RecentUser> users =
            userRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(user -> new AdminDashboardResponse.RecentUser(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getStatus().name(),
                    user.getCreatedAt()
                ))
                .toList();

        List<AdminDashboardResponse.RecentProperty> properties =
            propertyRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(property -> new AdminDashboardResponse.RecentProperty(
                    property.getId(),
                    property.getName(),
                    property.getCity(),
                    property.getStatus().name(),
                    property.getOwner() == null
                        ? null
                        : property.getOwner().getEmail(),
                    property.getCreatedAt()
                ))
                .toList();

        List<AdminDashboardResponse.RecentBooking> bookings =
            bookingRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(booking -> new AdminDashboardResponse.RecentBooking(
                    booking.getBookingCode(),
                    booking.getProperty().getName(),
                    booking.getGuestFullName(),
                    booking.getCheckIn(),
                    booking.getStatus().name(),
                    booking.getTotalAmount(),
                    booking.getCreatedAt()
                ))
                .toList();

        BigDecimal revenue =
            bookingRepository.sumRevenueByPaymentStatus(
                PaymentStatus.PAID
            );

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
        String email,
        String role,
        String status,
        String keyword,
        int page,
        int size
    ) {
        requireAdmin(email);

        Page<AdminUserResponse> result =
            userRepository.searchForAdmin(
                parseRole(role),
                parseUserStatus(status),
                normalizeKeyword(keyword),
                PageRequest.of(page, size)
            ).map(this::toUserResponse);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public AdminUserDetailResponse userDetail(
        String email,
        UUID userId
    ) {
        requireAdmin(email);

        User user = findUser(userId);

        Page<Booking> bookingPage =
            bookingRepository.findByUser_IdOrderByCreatedAtDesc(
                user.getId(),
                PageRequest.of(0, 5)
            );

        List<AdminUserDetailResponse.RecentBooking> recentBookings =
            bookingPage.getContent()
                .stream()
                .map(booking -> new AdminUserDetailResponse.RecentBooking(
                    booking.getBookingCode(),
                    booking.getProperty().getName(),
                    booking.getCheckIn(),
                    booking.getCheckOut(),
                    booking.getStatus().name(),
                    booking.getPaymentStatus().name(),
                    booking.getTotalAmount(),
                    booking.getCurrency(),
                    booking.getCreatedAt()
                ))
                .toList();

        BigDecimal recentValue =
            bookingPage.getContent()
                .stream()
                .map(Booking::getTotalAmount)
                .filter(value -> value != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new AdminUserDetailResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getAvatarUrl(),
            user.isEmailVerified(),
            user.getRole().name(),
            user.getStatus().name(),
            propertyRepository.countByOwner_Id(user.getId()),
            bookingPage.getTotalElements(),
            recentValue,
            user.getCreatedAt(),
            user.getUpdatedAt(),
            recentBookings
        );
    }

    @Transactional
    public AdminUserResponse updateUserStatus(
        String adminEmail,
        UUID userId,
        UpdateUserStatusRequest request
    ) {
        User admin = requireAdmin(adminEmail);
        User target = findUser(userId);

        UserStatus next = parseRequiredUserStatus(
            request.status()
        );

        if (
            admin.getId().equals(target.getId())
            && next != UserStatus.ACTIVE
        ) {
            throw new ForbiddenException(
                "Không thể khóa chính tài khoản quản trị đang đăng nhập"
            );
        }

        if (target.getStatus() == next) {
            return toUserResponse(target);
        }

        target.setStatus(next);

        return toUserResponse(
            userRepository.save(target)
        );
    }

    @Transactional
    public AdminUserResponse updateUserRole(
        String adminEmail,
        UUID userId,
        UpdateUserRoleRequest request
    ) {
        User admin = requireAdmin(adminEmail);
        User target = findUser(userId);

        Role next = parseRequiredRole(
            request.role()
        );

        if (
            admin.getId().equals(target.getId())
            && next != Role.ADMIN
        ) {
            throw new ForbiddenException(
                "Không thể hạ quyền chính tài khoản quản trị đang đăng nhập"
            );
        }

        if (
            target.getRole() == Role.HOTEL_MANAGER
            && next != Role.HOTEL_MANAGER
            && propertyRepository.countByOwner_Id(
                target.getId()
            ) > 0
        ) {
            throw new BadRequestException(
                "Hãy chuyển chủ sở hữu các chỗ nghỉ trước khi đổi quyền quản lý"
            );
        }

        if (target.getRole() == next) {
            return toUserResponse(target);
        }

        target.setRole(next);

        return toUserResponse(
            userRepository.save(target)
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminPropertyResponse> properties(
        String email,
        String status,
        String keyword,
        int page,
        int size
    ) {
        requireAdmin(email);

        Page<AdminPropertyResponse> result =
            propertyRepository.searchForAdmin(
                parsePropertyStatus(status),
                normalizeKeyword(keyword),
                PageRequest.of(page, size)
            ).map(this::toPropertyResponse);

        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public AdminPropertyDetailResponse propertyDetail(
        String email,
        UUID propertyId
    ) {
        requireAdmin(email);

        Property property =
            propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException(
                    "Không tìm thấy chỗ nghỉ"
                ));

        List<AdminPropertyDetailResponse.RoomItem> rooms =
            roomTypeRepository.findByPropertyIdOrderByNameAsc(
                property.getId()
            ).stream()
                .map(this::toRoomItem)
                .toList();

        return new AdminPropertyDetailResponse(
            property.getId(),
            property.getName(),
            property.getSlug(),
            property.getPropertyType().name(),
            property.getDescription(),
            property.getAddressLine(),
            property.getWard(),
            property.getDistrict(),
            property.getCity(),
            property.getProvince(),
            property.getCountry(),
            property.getPostalCode(),
            property.getStarRating(),
            property.getReviewScore(),
            property.getReviewCount(),
            property.getCheckInFrom(),
            property.getCheckInUntil(),
            property.getCheckOutFrom(),
            property.getCheckOutUntil(),
            property.getStatus().name(),
            property.isFeatured(),
            property.getOwner() == null
                ? null
                : property.getOwner().getId(),
            property.getOwner() == null
                ? null
                : property.getOwner().getFullName(),
            property.getOwner() == null
                ? null
                : property.getOwner().getEmail(),
            bookingRepository.countByPropertyId(
                property.getId()
            ),
            property.getCreatedAt(),
            property.getUpdatedAt(),
            rooms
        );
    }

    @Transactional
    public AdminPropertyResponse moderateProperty(
        String email,
        UUID propertyId,
        ModeratePropertyRequest request
    ) {
        requireAdmin(email);

        Property property =
            propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException(
                    "Không tìm thấy chỗ nghỉ"
                ));

        if (
            request.status() != null
            && !request.status().isBlank()
        ) {
            property.setStatus(
                parseRequiredPropertyStatus(
                    request.status()
                )
            );
        }

        if (request.featured() != null) {
            property.setFeatured(
                request.featured()
            );
        }

        if (request.clearOwner()) {
            property.setOwner(null);
        } else if (request.ownerId() != null) {
            User owner = findUser(
                request.ownerId()
            );

            if (owner.getRole() != Role.HOTEL_MANAGER) {
                throw new BadRequestException(
                    "Chủ sở hữu phải có quyền HOTEL_MANAGER"
                );
            }

            if (owner.getStatus() != UserStatus.ACTIVE) {
                throw new BadRequestException(
                    "Tài khoản quản lý phải đang hoạt động"
                );
            }

            property.setOwner(owner);
        }

        return toPropertyResponse(
            propertyRepository.save(property)
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReviewResponse> reviews(
        String email,
        String status,
        UUID propertyId,
        String keyword,
        int page,
        int size
    ) {
        requireAdmin(email);

        String reviewStatus =
            status == null || status.isBlank()
                ? ""
                : parseReviewStatus(status);

        Page<AdminReviewResponse> result =
            reviewRepository.searchForAdmin(
                reviewStatus,
                propertyId,
                normalizeKeyword(keyword),
                PageRequest.of(page, size)
            ).map(this::toReviewResponse);

        return PageResponse.from(result);
    }

    @Transactional
    public AdminReviewResponse updateReviewStatus(
        String email,
        UUID reviewId,
        UpdateReviewStatusRequest request
    ) {
        requireAdmin(email);

        Review review =
            reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NotFoundException(
                    "Không tìm thấy đánh giá"
                ));

        review.setStatus(
            parseReviewStatus(
                request.status()
            )
        );

        return toReviewResponse(
            reviewRepository.save(review)
        );
    }

    private AdminUserResponse toUserResponse(
        User user
    ) {
        return new AdminUserResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getAvatarUrl(),
            user.isEmailVerified(),
            user.getRole().name(),
            user.getStatus().name(),
            propertyRepository.countByOwner_Id(
                user.getId()
            ),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }

    private AdminPropertyResponse toPropertyResponse(
        Property property
    ) {
        return new AdminPropertyResponse(
            property.getId(),
            property.getName(),
            property.getSlug(),
            property.getPropertyType().name(),
            property.getCity(),
            property.getCountry(),
            property.getStarRating(),
            property.getReviewScore(),
            property.getReviewCount(),
            property.getStatus().name(),
            property.isFeatured(),
            property.getOwner() == null
                ? null
                : property.getOwner().getId(),
            property.getOwner() == null
                ? null
                : property.getOwner().getFullName(),
            property.getOwner() == null
                ? null
                : property.getOwner().getEmail(),
            roomTypeRepository.countByPropertyId(
                property.getId()
            ),
            bookingRepository.countByPropertyId(
                property.getId()
            ),
            property.getCreatedAt(),
            property.getUpdatedAt()
        );
    }

    private AdminPropertyDetailResponse.RoomItem toRoomItem(
        RoomType room
    ) {
        return new AdminPropertyDetailResponse.RoomItem(
            room.getId(),
            room.getCode(),
            room.getName(),
            room.getDescription(),
            room.getRoomSizeSqm(),
            room.getMaxAdults(),
            room.getMaxChildren(),
            room.getMaxGuests(),
            room.getTotalRooms(),
            room.getBedSummary(),
            room.getBathroomCount(),
            room.getViewName(),
            room.isSmokingAllowed(),
            room.isActive()
        );
    }

    private AdminReviewResponse toReviewResponse(
        Review review
    ) {
        User user =
            userRepository.findById(
                review.getUserId()
            ).orElse(null);

        Property property =
            propertyRepository.findById(
                review.getPropertyId()
            ).orElse(null);

        Booking booking =
            bookingRepository.findById(
                review.getBookingId()
            ).orElse(null);

        return new AdminReviewResponse(
            review.getId(),
            review.getBookingId(),
            booking == null
                ? null
                : booking.getBookingCode(),
            review.getPropertyId(),
            property == null
                ? "Chỗ nghỉ đã xóa"
                : property.getName(),
            review.getUserId(),
            user == null
                ? "Người dùng đã xóa"
                : user.getFullName(),
            user == null
                ? null
                : user.getEmail(),
            review.getScore(),
            review.getTitle(),
            review.getContent(),
            review.getStaffScore(),
            review.getCleanlinessScore(),
            review.getLocationScore(),
            review.getComfortScore(),
            review.getValueScore(),
            review.getStatus(),
            review.getCreatedAt(),
            review.getUpdatedAt()
        );
    }

    private User requireAdmin(
        String email
    ) {
        User user =
            userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(
                    "Không tìm thấy tài khoản"
                ));

        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException(
                "Chỉ ADMIN được sử dụng chức năng này"
            );
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ForbiddenException(
                "Tài khoản ADMIN hiện không hoạt động"
            );
        }

        return user;
    }

    private User findUser(
        UUID id
    ) {
        return userRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(
                "Không tìm thấy tài khoản"
            ));
    }

    private Role parseRole(
        String value
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return parseRequiredRole(value);
    }

    private Role parseRequiredRole(
        String value
    ) {
        try {
            return Role.valueOf(
                value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                "Role không hợp lệ"
            );
        }
    }

    private UserStatus parseUserStatus(
        String value
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return parseRequiredUserStatus(value);
    }

    private UserStatus parseRequiredUserStatus(
        String value
    ) {
        try {
            return UserStatus.valueOf(
                value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                "Trạng thái tài khoản không hợp lệ"
            );
        }
    }

    private PropertyStatus parsePropertyStatus(
        String value
    ) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return parseRequiredPropertyStatus(value);
    }

    private PropertyStatus parseRequiredPropertyStatus(
        String value
    ) {
        try {
            return PropertyStatus.valueOf(
                value.trim().toUpperCase(Locale.ROOT)
            );
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(
                "Trạng thái chỗ nghỉ không hợp lệ"
            );
        }
    }

    private String parseReviewStatus(
        String value
    ) {
        String normalized =
            value == null
                ? ""
                : value.trim().toUpperCase(Locale.ROOT);

        if (
            !"PENDING".equals(normalized)
            && !"PUBLISHED".equals(normalized)
            && !"HIDDEN".equals(normalized)
        ) {
            throw new BadRequestException(
                "Trạng thái đánh giá không hợp lệ"
            );
        }

        return normalized;
    }

    private String normalizeKeyword(
        String value
    ) {
        return value == null
            ? ""
            : value.trim().toLowerCase(Locale.ROOT);
    }
}