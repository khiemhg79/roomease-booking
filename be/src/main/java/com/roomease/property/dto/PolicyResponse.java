package com.roomease.property.dto;

import java.time.LocalTime;

public record PolicyResponse(
    boolean childrenAllowed,
    String petsPolicy,
    String smokingPolicy,
    boolean partiesAllowed,
    LocalTime quietHoursFrom,
    LocalTime quietHoursUntil,
    Integer ageRestriction,
    String extraBedPolicy,
    String importantInformation
) {
}
