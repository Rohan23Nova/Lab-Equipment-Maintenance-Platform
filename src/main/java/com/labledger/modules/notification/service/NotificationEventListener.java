package com.labledger.modules.notification.service;

import com.labledger.modules.auth.event.UserStatusChangedEvent;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.maintenance.event.*;
import com.labledger.modules.notification.model.NotificationType;
import com.labledger.modules.reservation.event.*;
import com.labledger.modules.reservation.model.ReservationStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
            .withZone(ZoneOffset.UTC);

    private static final Set<UserRole> STAFF_ROLES = Set.of(UserRole.ROLE_ADMIN, UserRole.ROLE_LAB_ASSISTANT);

    @EventListener
    public void onReservationCreated(ReservationCreatedEvent event) {
        if (event.status() == ReservationStatus.APPROVED) {
            notificationService.sendNotification(
                    event.userId(),
                    NotificationType.RESERVATION_APPROVED,
                    "Reservation Confirmed: " + event.equipmentName(),
                    String.format("Your reservation for %s (%s) from %s to %s has been confirmed.",
                            event.equipmentName(), event.equipmentAssetTag(),
                            TIME_FORMATTER.format(event.startTime()), TIME_FORMATTER.format(event.endTime())),
                    "/app/reservations",
                    null
            );
        } else {
            // Notify user of pending booking
            notificationService.sendNotification(
                    event.userId(),
                    NotificationType.RESERVATION_SUBMITTED,
                    "Reservation Submitted: " + event.equipmentName(),
                    String.format("Your booking request for %s (%s) was submitted and is pending staff approval.",
                            event.equipmentName(), event.equipmentAssetTag()),
                    "/app/reservations",
                    null
            );

            // Notify laboratory staff of new approval requirement
            List<User> staff = userRepository.findActiveUsersByRoles(STAFF_ROLES);
            for (User s : staff) {
                notificationService.sendNotification(
                        s,
                        NotificationType.RESERVATION_SUBMITTED,
                        "Pending Approval: " + event.equipmentName(),
                        String.format("User %s requested a reservation for %s from %s to %s.",
                                event.userFullName(), event.equipmentName(),
                                TIME_FORMATTER.format(event.startTime()), TIME_FORMATTER.format(event.endTime())),
                        "/app/approvals",
                        null
                );
            }
        }
    }

    @EventListener
    public void onReservationApproved(ReservationApprovedEvent event) {
        notificationService.sendNotification(
                event.userId(),
                NotificationType.RESERVATION_APPROVED,
                "Reservation Approved: " + event.equipmentName(),
                String.format("Your reservation for %s (%s) starting %s has been approved by %s.",
                        event.equipmentName(), event.equipmentAssetTag(),
                        TIME_FORMATTER.format(event.startTime()), event.decisionByName()),
                "/app/reservations",
                null
        );
    }

    @EventListener
    public void onReservationRejected(ReservationRejectedEvent event) {
        notificationService.sendNotification(
                event.userId(),
                NotificationType.RESERVATION_REJECTED,
                "Reservation Declined: " + event.equipmentName(),
                String.format("Your booking request for %s (%s) was declined by %s. Justification: %s",
                        event.equipmentName(), event.equipmentAssetTag(),
                        event.decisionByName(), event.rejectionReason()),
                "/app/reservations",
                null
        );
    }

    @EventListener
    public void onReservationCancelled(ReservationCancelledEvent event) {
        // If cancelled by staff or maintenance, notify the user
        if (!event.userId().equals(event.cancelledById())) {
            notificationService.sendNotification(
                    event.userId(),
                    NotificationType.RESERVATION_CANCELLED,
                    "Reservation Cancelled: " + event.equipmentName(),
                    String.format("Your reservation for %s was cancelled by %s. Reason: %s",
                            event.equipmentName(), event.cancelledByName(), event.cancellationReason()),
                    "/app/reservations",
                    null
            );
        } else {
            // Notify staff of user cancellation
            List<User> staff = userRepository.findActiveUsersByRoles(STAFF_ROLES);
            for (User s : staff) {
                notificationService.sendNotification(
                        s,
                        NotificationType.RESERVATION_CANCELLED,
                        "Reservation Cancelled by User: " + event.equipmentName(),
                        String.format("%s cancelled their reservation for %s (%s).",
                                event.userFullName(), event.equipmentName(), event.equipmentAssetTag()),
                        "/app/equipment/" + event.equipmentId(),
                        null
                );
            }
        }
    }

    @EventListener
    public void onFaultReportCreated(FaultReportCreatedEvent event) {
        // Notify staff of defect report
        List<User> staff = userRepository.findActiveUsersByRoles(STAFF_ROLES);
        for (User s : staff) {
            notificationService.sendNotification(
                    s,
                    event.severity().name().equals("CRITICAL") ? NotificationType.CRITICAL_FAULT_LOCKDOWN : NotificationType.FAULT_REPORTED,
                    String.format("[%s DEFECT] %s", event.severity(), event.title()),
                    String.format("Fault report %s (%s severity) was logged: %s",
                            event.faultNumber(), event.severity(), event.title()),
                    "/app/faults/" + event.faultReportId(),
                    null
            );
        }
    }

    @EventListener
    public void onMaintenanceRestrictedEquipment(MaintenanceRestrictedEquipmentEvent event) {
        List<User> staff = userRepository.findActiveUsersByRoles(STAFF_ROLES);
        for (User s : staff) {
            notificationService.sendNotification(
                    s,
                    NotificationType.CRITICAL_FAULT_LOCKDOWN,
                    "Equipment Under Maintenance Lockdown",
                    String.format("Instrument %s was placed in UNDER_MAINTENANCE status: %s",
                            event.equipmentId(), event.reason()),
                    "/app/equipment/" + event.equipmentId(),
                    null
            );
        }
    }

    @EventListener
    public void onWorkOrderAssigned(WorkOrderAssignedEvent event) {
        if (event.technicianId() != null) {
            notificationService.sendNotification(
                    event.technicianId(),
                    NotificationType.WORK_ORDER_ASSIGNED,
                    "Work Order Assigned: " + event.workOrderNumber(),
                    String.format("You have been assigned to work order %s: %s",
                            event.workOrderNumber(), event.title()),
                    "/app/work-orders/" + event.workOrderId(),
                    null
            );
        }
    }

    @EventListener
    public void onWorkOrderCompleted(WorkOrderCompletedEvent event) {
        List<User> staff = userRepository.findActiveUsersByRoles(STAFF_ROLES);
        for (User s : staff) {
            notificationService.sendNotification(
                    s,
                    NotificationType.WORK_ORDER_COMPLETED,
                    "Work Order Completed: " + event.workOrderNumber(),
                    String.format("Work order %s completed and requires return-to-service inspection certification. Resolution: %s",
                            event.workOrderNumber(), event.resolutionSummary()),
                    "/app/work-orders/" + event.workOrderId(),
                    null
            );
        }
    }

    @EventListener
    public void onEquipmentReturnedToService(EquipmentReturnedToServiceEvent event) {
        List<User> staff = userRepository.findActiveUsersByRoles(STAFF_ROLES);
        for (User s : staff) {
            notificationService.sendNotification(
                    s,
                    NotificationType.EQUIPMENT_RETURNED_TO_SERVICE,
                    "Return to Service Inspection Completed",
                    String.format("Inspection completed for work order %s. Verification notes: %s",
                            event.workOrderId(), event.inspectionNotes()),
                    "/app/equipment/" + event.equipmentId(),
                    null
            );
        }
    }

    @EventListener
    public void onUserStatusChanged(UserStatusChangedEvent event) {
        notificationService.sendNotification(
                event.userId(),
                NotificationType.ADMIN_USER_UPDATED,
                "Account Status Updated",
                String.format("Your institutional LabLedger account status has been updated to %s by %s.",
                        event.newStatus(), event.actorName()),
                "/app/profile",
                null
        );
    }
}
