package com.labledger.modules.audit.service;

import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;
import com.labledger.modules.auth.event.UserStatusChangedEvent;
import com.labledger.modules.inventory.event.*;
import com.labledger.modules.maintenance.event.*;
import com.labledger.modules.reservation.event.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuditEventListener {

    private final AuditService auditService;

    @EventListener
    public void onEquipmentCreated(EquipmentCreatedEvent event) {
        auditService.recordAudit(
                event.actorId(),
                event.actorName(),
                null,
                AuditAction.EQUIPMENT_CREATED,
                AuditEntityType.EQUIPMENT,
                event.equipmentId(),
                event.assetTag(),
                String.format("New instrument %s (%s) registered into %s", event.name(), event.assetTag(), event.laboratoryName()),
                String.format("{\"name\":\"%s\",\"assetTag\":\"%s\",\"laboratory\":\"%s\"}",
                        escape(event.name()), escape(event.assetTag()), escape(event.laboratoryName())),
                null
        );
    }

    @EventListener
    public void onEquipmentUpdated(EquipmentUpdatedEvent event) {
        auditService.recordAudit(
                event.actorId(),
                event.actorName(),
                null,
                AuditAction.EQUIPMENT_UPDATED,
                AuditEntityType.EQUIPMENT,
                event.equipmentId(),
                event.assetTag(),
                String.format("Specifications updated for instrument %s (%s)", event.name(), event.assetTag()),
                event.changesSummary(),
                null
        );
    }

    @EventListener
    public void onEquipmentStatusChanged(EquipmentStatusChangedEvent event) {
        auditService.recordAudit(
                event.actorId(),
                event.actorName(),
                null,
                AuditAction.EQUIPMENT_STATUS_CHANGED,
                AuditEntityType.EQUIPMENT,
                event.equipmentId(),
                event.assetTag(),
                String.format("Instrument %s status transitioned from %s to %s. Reason: %s",
                        event.name(), event.previousStatus(), event.newStatus(), event.reason()),
                String.format("{\"previousStatus\":\"%s\",\"newStatus\":\"%s\",\"reason\":\"%s\"}",
                        event.previousStatus(), event.newStatus(), escape(event.reason())),
                null
        );
    }

    @EventListener
    public void onEquipmentArchived(EquipmentArchivedEvent event) {
        auditService.recordAudit(
                event.actorId(),
                event.actorName(),
                null,
                AuditAction.EQUIPMENT_ARCHIVED,
                AuditEntityType.EQUIPMENT,
                event.equipmentId(),
                event.assetTag(),
                String.format("Instrument %s (%s) decommissioned and archived. Reason: %s",
                        event.name(), event.assetTag(), event.reason()),
                String.format("{\"reason\":\"%s\"}", escape(event.reason())),
                null
        );
    }

    @EventListener
    public void onReservationCreated(ReservationCreatedEvent event) {
        auditService.recordAudit(
                event.userId(),
                event.userFullName(),
                event.userEmail(),
                AuditAction.RESERVATION_CREATED,
                AuditEntityType.RESERVATION,
                event.reservationId(),
                event.equipmentAssetTag(),
                String.format("Reservation created on %s [Status: %s]", event.equipmentName(), event.status()),
                String.format("{\"equipment\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\",\"purpose\":\"%s\"}",
                        escape(event.equipmentName()), event.startTime(), event.endTime(), escape(event.purpose())),
                null
        );
    }

    @EventListener
    public void onReservationApproved(ReservationApprovedEvent event) {
        auditService.recordAudit(
                event.decisionById(),
                event.decisionByName(),
                null,
                AuditAction.RESERVATION_APPROVED,
                AuditEntityType.RESERVATION,
                event.reservationId(),
                event.equipmentAssetTag(),
                String.format("Reservation on %s approved by %s for user %s",
                        event.equipmentName(), event.decisionByName(), event.userFullName()),
                String.format("{\"approvedBy\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\"}",
                        escape(event.decisionByName()), event.startTime(), event.endTime()),
                null
        );
    }

    @EventListener
    public void onReservationRejected(ReservationRejectedEvent event) {
        auditService.recordAudit(
                event.decisionById(),
                event.decisionByName(),
                null,
                AuditAction.RESERVATION_REJECTED,
                AuditEntityType.RESERVATION,
                event.reservationId(),
                event.equipmentAssetTag(),
                String.format("Reservation on %s rejected by %s for user %s. Justification: %s",
                        event.equipmentName(), event.decisionByName(), event.userFullName(), event.rejectionReason()),
                String.format("{\"rejectedBy\":\"%s\",\"reason\":\"%s\"}",
                        escape(event.decisionByName()), escape(event.rejectionReason())),
                null
        );
    }

    @EventListener
    public void onReservationCancelled(ReservationCancelledEvent event) {
        auditService.recordAudit(
                event.cancelledById(),
                event.cancelledByName(),
                null,
                AuditAction.RESERVATION_CANCELLED,
                AuditEntityType.RESERVATION,
                event.reservationId(),
                event.equipmentAssetTag(),
                String.format("Reservation on %s cancelled by %s. Justification: %s",
                        event.equipmentName(), event.cancelledByName(), event.cancellationReason()),
                String.format("{\"cancelledBy\":\"%s\",\"reason\":\"%s\"}",
                        escape(event.cancelledByName()), escape(event.cancellationReason())),
                null
        );
    }

    @EventListener
    public void onFaultReportCreated(FaultReportCreatedEvent event) {
        auditService.recordAudit(
                event.reportedById(),
                "Defect Reporter",
                null,
                AuditAction.FAULT_REPORTED,
                AuditEntityType.FAULT_REPORT,
                event.faultReportId(),
                event.faultNumber(),
                String.format("[%s DEFECT] %s (%s)", event.severity(), event.title(), event.faultNumber()),
                String.format("{\"severity\":\"%s\",\"title\":\"%s\"}",
                        event.severity(), escape(event.title())),
                null
        );
    }

    @EventListener
    public void onMaintenanceRestrictedEquipment(MaintenanceRestrictedEquipmentEvent event) {
        auditService.recordAudit(
                null,
                "System Automation",
                null,
                AuditAction.EQUIPMENT_STATUS_CHANGED,
                AuditEntityType.EQUIPMENT,
                event.equipmentId(),
                null,
                String.format("Instrument %s locked down under maintenance: %s", event.equipmentId(), event.reason()),
                String.format("{\"action\":\"LOCKDOWN\",\"reason\":\"%s\"}", escape(event.reason())),
                null
        );
    }

    @EventListener
    public void onWorkOrderAssigned(WorkOrderAssignedEvent event) {
        auditService.recordAudit(
                null,
                "System Automation",
                null,
                AuditAction.WORK_ORDER_ASSIGNED,
                AuditEntityType.WORK_ORDER,
                event.workOrderId(),
                event.workOrderNumber(),
                String.format("Work order %s assigned: %s",
                        event.workOrderNumber(), event.title()),
                String.format("{\"title\":\"%s\"}", escape(event.title())),
                null
        );
    }

    @EventListener
    public void onWorkOrderCompleted(WorkOrderCompletedEvent event) {
        auditService.recordAudit(
                event.completedByTechnicianId(),
                "Technician",
                null,
                AuditAction.WORK_ORDER_COMPLETED,
                AuditEntityType.WORK_ORDER,
                event.workOrderId(),
                event.workOrderNumber(),
                String.format("Work order %s completed: %s",
                        event.workOrderNumber(), event.resolutionSummary()),
                String.format("{\"summary\":\"%s\"}", escape(event.resolutionSummary())),
                null
        );
    }

    @EventListener
    public void onEquipmentReturnedToService(EquipmentReturnedToServiceEvent event) {
        auditService.recordAudit(
                event.inspectedById(),
                "Inspector",
                null,
                AuditAction.EQUIPMENT_RETURNED_TO_SERVICE,
                AuditEntityType.WORK_ORDER,
                event.workOrderId(),
                null,
                String.format("Return-to-service certification for work order %s: %s",
                        event.workOrderId(), event.inspectionNotes()),
                String.format("{\"notes\":\"%s\"}", escape(event.inspectionNotes())),
                null
        );
    }

    @EventListener
    public void onUserStatusChanged(UserStatusChangedEvent event) {
        auditService.recordAudit(
                event.actorId(),
                event.actorName(),
                null,
                AuditAction.USER_STATUS_UPDATED,
                AuditEntityType.USER,
                event.userId(),
                event.email(),
                String.format("User %s (%s) status changed from %s to %s by %s",
                        event.fullName(), event.email(), event.previousStatus(), event.newStatus(), event.actorName()),
                String.format("{\"previousStatus\":\"%s\",\"newStatus\":\"%s\"}",
                        event.previousStatus(), event.newStatus()),
                null
        );
    }

    private String escape(String input) {
        if (input == null) return "";
        return input.replace("\"", "\\\"").replace("\n", " ").replace("\r", "");
    }
}
