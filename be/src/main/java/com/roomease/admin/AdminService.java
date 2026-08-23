package com.roomease.admin;

import com.roomease.admin.dto.AdminDashboardResponse;
import com.roomease.admin.dto.AdminPropertyResponse;
import com.roomease.admin.dto.AdminUserResponse;
import com.roomease.admin.dto.ModeratePropertyRequest;
import com.roomease.admin.dto.UpdateUserRoleRequest;
import com.roomease.admin.dto.UpdateUserStatusRequest;

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


    /*
     * =========================================================
     * DASHBOARD ADMIN
     * =========================================================
     */

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard(
        String email
    ) {

        requireAdmin(email);


        List<AdminDashboardResponse.RecentUser> users =
            userRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(
                    user ->
                        new AdminDashboardResponse.RecentUser(
                            user.getId(),
                            user.getFullName(),
                            user.getEmail(),
                            user.getRole().name(),
                            user.getStatus().name(),
                            user.getCreatedAt()
                        )
                )
                .toList();


        List<AdminDashboardResponse.RecentProperty>
            properties =
                propertyRepository
                    .findTop5ByOrderByCreatedAtDesc()
                    .stream()
                    .map(
                        property ->
                            new AdminDashboardResponse.RecentProperty(
                                property.getId(),
                                property.getName(),
                                property.getCity(),
                                property.getStatus().name(),

                                property.getOwner() == null
                                    ? null
                                    : property
                                        .getOwner()
                                        .getEmail(),

                                property.getCreatedAt()
                            )
                    )
                    .toList();


        List<AdminDashboardResponse.RecentBooking>
            bookings =
                bookingRepository
                    .findTop5ByOrderByCreatedAtDesc()
                    .stream()
                    .map(
                        booking ->
                            new AdminDashboardResponse.RecentBooking(
                                booking.getBookingCode(),

                                booking
                                    .getProperty()
                                    .getName(),

                                booking.getGuestFullName(),

                                booking.getCheckIn(),

                                booking
                                    .getStatus()
                                    .name(),

                                booking.getTotalAmount(),

                                booking.getCreatedAt()
                            )
                    )
                    .toList();


        BigDecimal revenue =
            bookingRepository
                .sumRevenueByPaymentStatus(
                    PaymentStatus.PAID
                );


        return new AdminDashboardResponse(

            userRepository.count(),

            userRepository.countByRole(
                Role.CUSTOMER
            ),

            userRepository.countByRole(
                Role.HOTEL_MANAGER
            ),

            userRepository.countByStatus(
                UserStatus.BLOCKED
            ),

            propertyRepository.count(),

            propertyRepository.countByStatus(
                PropertyStatus.ACTIVE
            ),

            propertyRepository.countByStatus(
                PropertyStatus.DRAFT
            ),

            bookingRepository.count(),

            bookingRepository.countByStatus(
                BookingStatus.PENDING
            ),

            bookingRepository.countByCheckIn(
                LocalDate.now()
            ),

            revenue == null
                ? BigDecimal.ZERO
                : revenue,

            "VND",

            users,

            properties,

            bookings
        );
    }


    /*
     * =========================================================
     * QUẢN LÝ USER
     * =========================================================
     */

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


        Role parsedRole =
            parseRole(role);


        UserStatus parsedStatus =
            parseUserStatus(status);


        /*
         * QUAN TRỌNG:
         *
         * Không truyền null vào query search.
         *
         * Nếu ô search trống:
         *
         * keyword = ""
         *
         * tránh lỗi Hibernate/PostgreSQL
         * lower(bytea).
         */
        String normalizedKeyword =
            normalizeKeyword(keyword);


        Page<AdminUserResponse> result =
            userRepository
                .searchForAdmin(

                    parsedRole,

                    parsedStatus,

                    normalizedKeyword,

                    PageRequest.of(
                        page,
                        size
                    )
                )
                .map(
                    this::toUserResponse
                );


        return PageResponse.from(result);
    }


    /*
     * =========================================================
     * KHÓA / MỞ USER
     * =========================================================
     */

    @Transactional
    public AdminUserResponse updateUserStatus(
        String adminEmail,
        UUID userId,
        UpdateUserStatusRequest request
    ) {

        User admin =
            requireAdmin(adminEmail);


        User target =
            findUser(userId);


        UserStatus next;

        try {

            next =
                UserStatus.valueOf(
                    request
                        .status()
                        .trim()
                        .toUpperCase(
                            Locale.ROOT
                        )
                );

        } catch (
            IllegalArgumentException exception
        ) {

            throw new BadRequestException(
                "Trạng thái tài khoản không hợp lệ"
            );
        }


        /*
         * Không cho admin tự khóa chính mình.
         */
        if (
            admin
                .getId()
                .equals(
                    target.getId()
                )
            &&
            next != UserStatus.ACTIVE
        ) {

            throw new ForbiddenException(
                "Không thể khóa chính tài khoản quản trị đang đăng nhập"
            );
        }


        /*
         * Không update DB nếu trạng thái giống hiện tại.
         */
        if (
            target.getStatus() == next
        ) {

            return toUserResponse(
                target
            );
        }


        target.setStatus(next);


        return toUserResponse(
            userRepository.save(
                target
            )
        );
    }


    /*
     * =========================================================
     * ĐỔI ROLE USER
     * =========================================================
     */

    @Transactional
    public AdminUserResponse updateUserRole(
        String adminEmail,
        UUID userId,
        UpdateUserRoleRequest request
    ) {

        User admin =
            requireAdmin(adminEmail);


        User target =
            findUser(userId);


        Role next;

        try {

            next =
                Role.valueOf(
                    request
                        .role()
                        .trim()
                        .toUpperCase(
                            Locale.ROOT
                        )
                );

        } catch (
            IllegalArgumentException exception
        ) {

            throw new BadRequestException(
                "Role không hợp lệ"
            );
        }


        /*
         * Không cho admin tự hạ quyền.
         */
        if (
            admin
                .getId()
                .equals(
                    target.getId()
                )
            &&
            next != Role.ADMIN
        ) {

            throw new ForbiddenException(
                "Không thể hạ quyền chính tài khoản quản trị đang đăng nhập"
            );
        }


        /*
         * Manager đang sở hữu khách sạn
         * thì chưa được hạ xuống CUSTOMER.
         *
         * Phải chuyển owner property trước.
         */
        if (
            target.getRole()
                == Role.HOTEL_MANAGER

            &&

            next
                != Role.HOTEL_MANAGER

            &&

            propertyRepository
                .countByOwner_Id(
                    target.getId()
                ) > 0
        ) {

            throw new BadRequestException(
                "Hãy chuyển chủ sở hữu các chỗ nghỉ trước khi đổi quyền quản lý"
            );
        }


        if (
            target.getRole() == next
        ) {

            return toUserResponse(
                target
            );
        }


        target.setRole(next);


        return toUserResponse(
            userRepository.save(
                target
            )
        );
    }


    /*
     * =========================================================
     * DANH SÁCH PROPERTY ADMIN
     * =========================================================
     */

    @Transactional(readOnly = true)
    public PageResponse<AdminPropertyResponse> properties(
        String email,
        String status,
        String keyword,
        int page,
        int size
    ) {

        requireAdmin(email);


        PropertyStatus parsedStatus =
            parsePropertyStatus(
                status
            );


        String normalizedKeyword =
            normalizeKeyword(
                keyword
            );


        Page<AdminPropertyResponse> result =
            propertyRepository
                .searchForAdmin(

                    parsedStatus,

                    normalizedKeyword,

                    PageRequest.of(
                        page,
                        size
                    )
                )
                .map(
                    this::toPropertyResponse
                );


        return PageResponse.from(
            result
        );
    }


    /*
     * =========================================================
     * DUYỆT / KHÓA / GÁN OWNER PROPERTY
     * =========================================================
     */

    @Transactional
    public AdminPropertyResponse moderateProperty(
        String email,
        UUID propertyId,
        ModeratePropertyRequest request
    ) {

        requireAdmin(email);


        Property property =
            propertyRepository
                .findById(
                    propertyId
                )
                .orElseThrow(
                    () ->
                        new NotFoundException(
                            "Không tìm thấy chỗ nghỉ"
                        )
                );


        /*
         * Update trạng thái.
         */
        if (
            request.status() != null
            &&
            !request.status().isBlank()
        ) {

            PropertyStatus nextStatus;

            try {

                nextStatus =
                    PropertyStatus.valueOf(
                        request
                            .status()
                            .trim()
                            .toUpperCase(
                                Locale.ROOT
                            )
                    );

            } catch (
                IllegalArgumentException exception
            ) {

                throw new BadRequestException(
                    "Trạng thái chỗ nghỉ không hợp lệ"
                );
            }


            property.setStatus(
                nextStatus
            );
        }


        /*
         * Bật/tắt featured.
         */
        if (
            request.featured() != null
        ) {

            property.setFeatured(
                request.featured()
            );
        }


        /*
         * Gỡ manager khỏi property.
         */
        if (
            request.clearOwner()
        ) {

            property.setOwner(
                null
            );

        } else if (
            request.ownerId() != null
        ) {

            User owner =
                findUser(
                    request.ownerId()
                );


            /*
             * Chỉ HOTEL_MANAGER được sở hữu property.
             */
            if (
                owner.getRole()
                    != Role.HOTEL_MANAGER
            ) {

                throw new BadRequestException(
                    "Chủ sở hữu phải có quyền HOTEL_MANAGER"
                );
            }


            /*
             * Manager bị khóa thì không được gán property.
             */
            if (
                owner.getStatus()
                    != UserStatus.ACTIVE
            ) {

                throw new BadRequestException(
                    "Tài khoản quản lý phải đang hoạt động"
                );
            }


            property.setOwner(
                owner
            );
        }


        return toPropertyResponse(
            propertyRepository.save(
                property
            )
        );
    }


    /*
     * =========================================================
     * CONVERT USER RESPONSE
     * =========================================================
     */

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

            propertyRepository
                .countByOwner_Id(
                    user.getId()
                ),

            user.getCreatedAt(),

            user.getUpdatedAt()
        );
    }


    /*
     * =========================================================
     * CONVERT PROPERTY RESPONSE
     * =========================================================
     */

    private AdminPropertyResponse toPropertyResponse(
        Property property
    ) {

        return new AdminPropertyResponse(

            property.getId(),

            property.getName(),

            property.getSlug(),

            property
                .getPropertyType()
                .name(),

            property.getCity(),

            property.getCountry(),

            property.getStarRating(),

            property.getReviewScore(),

            property.getReviewCount(),

            property
                .getStatus()
                .name(),

            property.isFeatured(),

            property.getOwner() == null
                ? null
                : property
                    .getOwner()
                    .getId(),

            property.getOwner() == null
                ? null
                : property
                    .getOwner()
                    .getFullName(),

            property.getOwner() == null
                ? null
                : property
                    .getOwner()
                    .getEmail(),

            roomTypeRepository
                .countByPropertyId(
                    property.getId()
                ),

            bookingRepository
                .countByPropertyId(
                    property.getId()
                ),

            property.getCreatedAt(),

            property.getUpdatedAt()
        );
    }


    /*
     * =========================================================
     * CHECK ADMIN
     * =========================================================
     */

    private User requireAdmin(
        String email
    ) {

        User user =
            userRepository
                .findByEmailIgnoreCase(
                    email
                )
                .orElseThrow(
                    () ->
                        new NotFoundException(
                            "Không tìm thấy tài khoản"
                        )
                );


        if (
            user.getRole()
                != Role.ADMIN
        ) {

            throw new ForbiddenException(
                "Chỉ ADMIN được sử dụng chức năng này"
            );
        }


        if (
            user.getStatus()
                != UserStatus.ACTIVE
        ) {

            throw new ForbiddenException(
                "Tài khoản ADMIN hiện không hoạt động"
            );
        }


        return user;
    }


    /*
     * =========================================================
     * FIND USER
     * =========================================================
     */

    private User findUser(
        UUID id
    ) {

        return userRepository
            .findById(
                id
            )
            .orElseThrow(
                () ->
                    new NotFoundException(
                        "Không tìm thấy tài khoản"
                    )
            );
    }


    /*
     * =========================================================
     * PARSE ROLE
     * =========================================================
     */

    private Role parseRole(
        String value
    ) {

        if (
            value == null
            ||
            value.isBlank()
        ) {

            return null;
        }


        try {

            return Role.valueOf(
                value
                    .trim()
                    .toUpperCase(
                        Locale.ROOT
                    )
            );

        } catch (
            IllegalArgumentException exception
        ) {

            throw new BadRequestException(
                "Role không hợp lệ"
            );
        }
    }


    /*
     * =========================================================
     * PARSE USER STATUS
     * =========================================================
     */

    private UserStatus parseUserStatus(
        String value
    ) {

        if (
            value == null
            ||
            value.isBlank()
        ) {

            return null;
        }


        try {

            return UserStatus.valueOf(
                value
                    .trim()
                    .toUpperCase(
                        Locale.ROOT
                    )
            );

        } catch (
            IllegalArgumentException exception
        ) {

            throw new BadRequestException(
                "Trạng thái tài khoản không hợp lệ"
            );
        }
    }


    /*
     * =========================================================
     * PARSE PROPERTY STATUS
     * =========================================================
     */

    private PropertyStatus parsePropertyStatus(
        String value
    ) {

        if (
            value == null
            ||
            value.isBlank()
        ) {

            return null;
        }


        try {

            return PropertyStatus.valueOf(
                value
                    .trim()
                    .toUpperCase(
                        Locale.ROOT
                    )
            );

        } catch (
            IllegalArgumentException exception
        ) {

            throw new BadRequestException(
                "Trạng thái chỗ nghỉ không hợp lệ"
            );
        }
    }


    /*
     * =========================================================
     * NORMALIZE SEARCH KEYWORD
     * =========================================================
     */

    private String normalizeKeyword(
        String value
    ) {

        if (
            value == null
        ) {

            return "";
        }


        return value
            .trim()
            .toLowerCase(
                Locale.ROOT
            );
    }
}