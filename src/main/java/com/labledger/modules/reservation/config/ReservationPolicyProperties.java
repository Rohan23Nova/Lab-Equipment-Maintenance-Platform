package com.labledger.modules.reservation.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "labledger.reservation.policy")
@Getter
@Setter
public class ReservationPolicyProperties {

    /**
     * Maximum continuous duration for a single reservation slot (in hours).
     */
    private int maxDurationHours = 8;

    /**
     * Minimum duration for a reservation slot (in minutes).
     */
    private int minDurationMinutes = 15;

    /**
     * Maximum advance booking horizon (in days from current time).
     */
    private int maxAdvanceDays = 30;

    /**
     * Minimum advance notice required before start time (in minutes).
     */
    private int minAdvanceMinutes = 0;

    /**
     * Whether student reservations require explicit approval by staff by default.
     */
    private boolean requiresApprovalDefault = true;
}
