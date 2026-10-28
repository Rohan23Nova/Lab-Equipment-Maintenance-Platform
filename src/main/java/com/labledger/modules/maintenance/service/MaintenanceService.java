package com.labledger.modules.maintenance.service;

import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.dto.PageResponse;
import com.labledger.modules.inventory.model.Equipment;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.repository.EquipmentRepository;
import com.labledger.modules.inventory.service.EquipmentService;
import com.labledger.modules.maintenance.dto.*;
import com.labledger.modules.maintenance.event.*;
import com.labledger.modules.maintenance.model.*;
import com.labledger.modules.maintenance.repository.*;
import com.labledger.modules.reservation.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Year;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaintenanceService {

    private final FaultReportRepository faultReportRepository;
    private final MaintenanceWorkOrderRepository workOrderRepository;
    private final WorkOrderNoteRepository workOrderNoteRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentService equipmentService;
    private final ReservationService reservationService;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    // =========================================================================
    // FAULT REPORTS
    // =========================================================================

    @Transactional
    public FaultReportResponse reportFault(CreateFaultReportRequest request, Authentication authentication) {
        User reporter = resolveUser(authentication);
        Equipment equipment = equipmentRepository.findById(request.equipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment with ID '" + request.equipmentId() + "' not found"));

        if (equipment.getStatus() == EquipmentStatus.ARCHIVED) {
            throw new BusinessRuleException("Fault reports cannot be filed against decommissioned or archived instruments");
        }

        long count = faultReportRepository.countTotalReports();
        String faultNumber = String.format("FLT-%d-%04d", Year.now().getValue(), count + 1);

        FaultReport report = FaultReport.builder()
                .faultNumber(faultNumber)
                .equipment(equipment)
                .reportedBy(reporter)
                .title(request.title().trim())
                .description(request.description().trim())
                .severity(request.severity())
                .status(FaultStatus.OPEN)
                .reportedAt(Instant.now())
                .build();

        // Critical fault policy: automatic lockdown of equipment and interval protection
        if (request.severity() == FaultSeverity.CRITICAL) {
            log.warn("CRITICAL fault [{}] reported on equipment [{} ({})]. Executing immediate service lockdown.",
                    faultNumber, equipment.getName(), equipment.getAssetTag());

            equipmentService.transitionStatusDirect(
                    equipment.getId(),
                    EquipmentStatus.UNDER_MAINTENANCE,
                    "CRITICAL_FAULT_REPORTED",
                    "Immediate lockdown triggered by critical fault report: " + report.getTitle(),
                    reporter
            );

            List<UUID> cancelledReservationIds = reservationService.cancelFutureReservationsForMaintenance(
                    equipment.getId(),
                    "Cancelled due to critical instrument fault report [" + faultNumber + "]: " + report.getTitle(),
                    reporter
            );

            eventPublisher.publishEvent(new MaintenanceRestrictedEquipmentEvent(
                    equipment.getId(),
                    "Critical fault reported: " + report.getTitle(),
                    cancelledReservationIds
            ));
        }

        FaultReport saved = faultReportRepository.save(report);
        eventPublisher.publishEvent(new FaultReportCreatedEvent(
                saved.getId(),
                saved.getFaultNumber(),
                equipment.getId(),
                reporter.getId(),
                saved.getSeverity(),
                saved.getTitle()
        ));

        return toFaultResponse(saved);
    }

    @Transactional
    public FaultReportResponse triageFault(UUID id, TriageFaultReportRequest request, Authentication authentication) {
        User triager = resolveUser(authentication);
        FaultReport report = faultReportRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fault report with ID '" + id + "' not found"));

        if (report.getStatus() == FaultStatus.CLOSED || report.getStatus() == FaultStatus.RESOLVED) {
            throw new BusinessRuleException("Cannot triage a fault report that is already in '" + report.getStatus() + "' state");
        }

        report.setStatus(request.status());
        report.setTriagedBy(triager);
        report.setTriagedAt(Instant.now());
        if (request.triageNotes() != null) {
            report.setTriageNotes(request.triageNotes().trim());
        }

        // Triage decision to place equipment under maintenance
        if (Boolean.TRUE.equals(request.placeUnderMaintenance())) {
            Equipment equipment = report.getEquipment();
            if (equipment.getStatus() != EquipmentStatus.UNDER_MAINTENANCE && equipment.getStatus() != EquipmentStatus.ARCHIVED) {
                equipmentService.transitionStatusDirect(
                        equipment.getId(),
                        EquipmentStatus.UNDER_MAINTENANCE,
                        "FAULT_TRIAGE_DECISION",
                        "Equipment moved to maintenance during triage of " + report.getFaultNumber(),
                        triager
                );

                List<UUID> cancelledReservationIds = reservationService.cancelFutureReservationsForMaintenance(
                        equipment.getId(),
                        "Cancelled due to equipment maintenance scheduled from fault report [" + report.getFaultNumber() + "]",
                        triager
                );

                eventPublisher.publishEvent(new MaintenanceRestrictedEquipmentEvent(
                        equipment.getId(),
                        "Triage decision: " + report.getFaultNumber(),
                        cancelledReservationIds
                ));
            }
        }

        FaultReport updated = faultReportRepository.save(report);
        return toFaultResponse(updated);
    }

    @Transactional
    public FaultReportResponse resolveFault(UUID id, ResolveFaultReportRequest request, Authentication authentication) {
        User resolver = resolveUser(authentication);
        FaultReport report = faultReportRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fault report with ID '" + id + "' not found"));

        if (report.getStatus() == FaultStatus.CLOSED) {
            throw new BusinessRuleException("Fault report is already closed");
        }

        report.setStatus(FaultStatus.RESOLVED);
        report.setResolvedBy(resolver);
        report.setResolvedAt(Instant.now());
        report.setResolutionDetails(request.resolutionDetails().trim());

        return toFaultResponse(faultReportRepository.save(report));
    }

    @Transactional
    public FaultReportResponse closeFault(UUID id, Authentication authentication) {
        User closer = resolveUser(authentication);
        FaultReport report = faultReportRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fault report with ID '" + id + "' not found"));

        if (report.getStatus() != FaultStatus.RESOLVED) {
            throw new BusinessRuleException("Only resolved fault reports can be closed");
        }

        report.setStatus(FaultStatus.CLOSED);
        report.setClosedBy(closer);
        report.setClosedAt(Instant.now());

        return toFaultResponse(faultReportRepository.save(report));
    }

    public PageResponse<FaultReportSummaryResponse> findFaults(FaultReportSearchCriteria criteria, Pageable pageable) {
        Specification<FaultReport> spec = FaultReportSpecifications.withCriteria(criteria);
        Page<FaultReport> page = faultReportRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::toFaultSummary));
    }

    public FaultReportResponse getFaultById(UUID id) {
        FaultReport report = faultReportRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fault report with ID '" + id + "' not found"));
        return toFaultResponse(report);
    }

    // =========================================================================
    // MAINTENANCE WORK ORDERS
    // =========================================================================

    @Transactional
    public MaintenanceWorkOrderResponse createWorkOrder(CreateWorkOrderRequest request, Authentication authentication) {
        User creator = resolveUser(authentication);
        Equipment equipment = equipmentRepository.findById(request.equipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment with ID '" + request.equipmentId() + "' not found"));

        if (equipment.getStatus() == EquipmentStatus.ARCHIVED) {
            throw new BusinessRuleException("Cannot issue maintenance work orders for decommissioned equipment");
        }

        FaultReport faultReport = null;
        if (request.faultReportId() != null) {
            faultReport = faultReportRepository.findById(request.faultReportId())
                    .orElseThrow(() -> new ResourceNotFoundException("Fault report with ID '" + request.faultReportId() + "' not found"));

            // Advance fault report status to IN_REPAIR if OPEN or TRIAGED
            if (faultReport.getStatus() == FaultStatus.OPEN || faultReport.getStatus() == FaultStatus.TRIAGED) {
                faultReport.setStatus(FaultStatus.IN_REPAIR);
                faultReportRepository.save(faultReport);
            }
        }

        User technician = null;
        WorkOrderStatus initialStatus = WorkOrderStatus.CREATED;
        if (request.assignedTechnicianId() != null) {
            technician = userRepository.findById(request.assignedTechnicianId())
                    .orElseThrow(() -> new ResourceNotFoundException("Technician user with ID '" + request.assignedTechnicianId() + "' not found"));
            initialStatus = WorkOrderStatus.ASSIGNED;
        }

        long count = workOrderRepository.countTotalWorkOrders();
        String workOrderNumber = String.format("WO-%d-%04d", Year.now().getValue(), count + 1);

        MaintenanceWorkOrder workOrder = MaintenanceWorkOrder.builder()
                .workOrderNumber(workOrderNumber)
                .faultReport(faultReport)
                .equipment(equipment)
                .assignedTechnician(technician)
                .createdBy(creator)
                .title(request.title().trim())
                .description(request.description().trim())
                .priority(request.priority())
                .status(initialStatus)
                .plannedStartDate(request.plannedStartDate())
                .plannedCompletionDate(request.plannedCompletionDate())
                .laborHours(BigDecimal.ZERO)
                .partsCost(BigDecimal.ZERO)
                .passedInspection(false)
                .build();

        // Place equipment under maintenance if it isn't already
        if (equipment.getStatus() != EquipmentStatus.UNDER_MAINTENANCE) {
            equipmentService.transitionStatusDirect(
                    equipment.getId(),
                    EquipmentStatus.UNDER_MAINTENANCE,
                    "WORK_ORDER_ISSUED",
                    "Placed in maintenance for work order " + workOrderNumber,
                    creator
            );

            List<UUID> cancelledIds = reservationService.cancelFutureReservationsForMaintenance(
                    equipment.getId(),
                    "Cancelled due to work order [" + workOrderNumber + "]: " + workOrder.getTitle(),
                    creator
            );

            eventPublisher.publishEvent(new MaintenanceRestrictedEquipmentEvent(
                    equipment.getId(),
                    "Work order issued: " + workOrderNumber,
                    cancelledIds
            ));
        }

        MaintenanceWorkOrder saved = workOrderRepository.save(workOrder);

        if (technician != null) {
            eventPublisher.publishEvent(new WorkOrderAssignedEvent(
                    saved.getId(),
                    saved.getWorkOrderNumber(),
                    equipment.getId(),
                    technician.getId(),
                    saved.getTitle()
            ));
        }

        return toWorkOrderResponse(saved);
    }

    @Transactional
    public MaintenanceWorkOrderResponse assignTechnician(UUID workOrderId, AssignWorkOrderRequest request, Authentication authentication) {
        User actor = resolveUser(authentication);
        MaintenanceWorkOrder workOrder = workOrderRepository.findByIdWithDetails(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + workOrderId + "' not found"));

        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED || workOrder.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot reassign a work order in '" + workOrder.getStatus() + "' state");
        }

        User technician = userRepository.findById(request.technicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Technician user with ID '" + request.technicianId() + "' not found"));

        workOrder.setAssignedTechnician(technician);
        if (workOrder.getStatus() == WorkOrderStatus.CREATED) {
            workOrder.setStatus(WorkOrderStatus.ASSIGNED);
        }

        WorkOrderNote note = WorkOrderNote.builder()
                .author(actor)
                .noteType(NoteType.PROGRESS_UPDATE)
                .notes("Work order assigned to technician " + technician.getFirstName() + " " + technician.getLastName())
                .build();
        workOrder.addNote(note);

        MaintenanceWorkOrder saved = workOrderRepository.save(workOrder);
        eventPublisher.publishEvent(new WorkOrderAssignedEvent(
                saved.getId(),
                saved.getWorkOrderNumber(),
                saved.getEquipment().getId(),
                technician.getId(),
                saved.getTitle()
        ));

        return toWorkOrderResponse(saved);
    }

    @Transactional
    public MaintenanceWorkOrderResponse startWorkOrder(UUID workOrderId, Authentication authentication) {
        User actor = resolveUser(authentication);
        MaintenanceWorkOrder workOrder = workOrderRepository.findByIdWithDetails(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + workOrderId + "' not found"));

        if (workOrder.getStatus() == WorkOrderStatus.IN_PROGRESS) {
            return toWorkOrderResponse(workOrder);
        }

        if (workOrder.getStatus() != WorkOrderStatus.ASSIGNED && workOrder.getStatus() != WorkOrderStatus.CREATED) {
            throw new BusinessRuleException("Cannot start work on a work order in '" + workOrder.getStatus() + "' state");
        }

        workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
        if (workOrder.getActualStartTime() == null) {
            workOrder.setActualStartTime(Instant.now());
        }

        WorkOrderNote note = WorkOrderNote.builder()
                .author(actor)
                .noteType(NoteType.PROGRESS_UPDATE)
                .notes("Technician commenced active repair and diagnosis operations.")
                .build();
        workOrder.addNote(note);

        return toWorkOrderResponse(workOrderRepository.save(workOrder));
    }

    @Transactional
    public MaintenanceWorkOrderResponse updateWorkOrderProgress(
            UUID workOrderId,
            UpdateWorkOrderProgressRequest request,
            Authentication authentication
    ) {
        User actor = resolveUser(authentication);
        MaintenanceWorkOrder workOrder = workOrderRepository.findByIdWithDetails(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + workOrderId + "' not found"));

        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED || workOrder.getStatus() == WorkOrderStatus.CANCELLED) {
            throw new BusinessRuleException("Cannot modify work order progress in '" + workOrder.getStatus() + "' state");
        }

        // Blocker verification
        if (request.status() == WorkOrderStatus.BLOCKED) {
            if (request.blockedReason() == null || request.blockedReason().isBlank()) {
                throw new BusinessRuleException("An explicit blocker reason is required when placing a work order on hold");
            }
            workOrder.setBlockedReason(request.blockedReason().trim());
        } else if (workOrder.getStatus() == WorkOrderStatus.BLOCKED && request.status() != WorkOrderStatus.BLOCKED) {
            workOrder.setBlockedReason(null);
        }

        workOrder.setStatus(request.status());

        if (request.laborHours() != null) {
            workOrder.setLaborHours(request.laborHours());
        }
        if (request.partsCost() != null) {
            workOrder.setPartsCost(request.partsCost());
        }
        if (request.resolutionSummary() != null) {
            workOrder.setResolutionSummary(request.resolutionSummary().trim());
        }

        if (request.progressNote() != null && !request.progressNote().isBlank()) {
            NoteType noteType = (request.status() == WorkOrderStatus.BLOCKED)
                    ? NoteType.BLOCKER_FLAG
                    : NoteType.PROGRESS_UPDATE;

            WorkOrderNote note = WorkOrderNote.builder()
                    .author(actor)
                    .noteType(noteType)
                    .notes(request.progressNote().trim())
                    .build();
            workOrder.addNote(note);
        }

        return toWorkOrderResponse(workOrderRepository.save(workOrder));
    }

    @Transactional
    public WorkOrderNoteResponse addWorkOrderNote(UUID workOrderId, AddWorkOrderNoteRequest request, Authentication authentication) {
        User actor = resolveUser(authentication);
        MaintenanceWorkOrder workOrder = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + workOrderId + "' not found"));

        WorkOrderNote note = WorkOrderNote.builder()
                .workOrder(workOrder)
                .author(actor)
                .noteType(request.noteType())
                .notes(request.notes().trim())
                .build();

        WorkOrderNote saved = workOrderNoteRepository.save(note);
        return new WorkOrderNoteResponse(
                saved.getId(),
                workOrder.getId(),
                actor.getId(),
                actor.getFirstName() + " " + actor.getLastName(),
                saved.getNoteType(),
                saved.getNotes(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public MaintenanceWorkOrderResponse completeWorkOrder(
            UUID workOrderId,
            CompleteWorkOrderRequest request,
            Authentication authentication
    ) {
        User actor = resolveUser(authentication);
        MaintenanceWorkOrder workOrder = workOrderRepository.findByIdWithDetails(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + workOrderId + "' not found"));

        if (workOrder.getStatus() == WorkOrderStatus.COMPLETED) {
            throw new BusinessRuleException("Work order is already completed");
        }

        workOrder.setStatus(WorkOrderStatus.COMPLETED);
        workOrder.setActualCompletionTime(Instant.now());
        workOrder.setResolutionSummary(request.resolutionSummary().trim());
        if (request.laborHours() != null) {
            workOrder.setLaborHours(request.laborHours());
        }
        if (request.partsCost() != null) {
            workOrder.setPartsCost(request.partsCost());
        }

        // Advance linked fault report to RESOLVED
        FaultReport linkedFault = workOrder.getFaultReport();
        if (linkedFault != null && linkedFault.getStatus() != FaultStatus.CLOSED) {
            linkedFault.setStatus(FaultStatus.RESOLVED);
            linkedFault.setResolvedBy(actor);
            linkedFault.setResolvedAt(Instant.now());
            linkedFault.setResolutionDetails(request.resolutionSummary().trim());
            faultReportRepository.save(linkedFault);
        }

        // Log completion note
        WorkOrderNote note = WorkOrderNote.builder()
                .author(actor)
                .noteType(NoteType.PROGRESS_UPDATE)
                .notes("Work order marked COMPLETED by technician. Summary: " + request.resolutionSummary().trim() +
                       ". Awaiting authorized return-to-service inspection.")
                .build();
        workOrder.addNote(note);

        // INVARIANT CHECK: Equipment is NOT automatically returned to service!
        // It stays in UNDER_MAINTENANCE until returnToService step passes.
        log.info("Work order [{}] completed. Equipment [{}] remains UNDER_MAINTENANCE pending inspection.",
                workOrder.getWorkOrderNumber(), workOrder.getEquipment().getAssetTag());

        MaintenanceWorkOrder saved = workOrderRepository.save(workOrder);
        eventPublisher.publishEvent(new WorkOrderCompletedEvent(
                saved.getId(),
                saved.getWorkOrderNumber(),
                saved.getEquipment().getId(),
                actor.getId(),
                saved.getResolutionSummary()
        ));

        return toWorkOrderResponse(saved);
    }

    @Transactional
    public MaintenanceWorkOrderResponse returnToService(
            UUID workOrderId,
            ReturnToServiceRequest request,
            Authentication authentication
    ) {
        User inspector = resolveUser(authentication);
        MaintenanceWorkOrder workOrder = workOrderRepository.findByIdWithDetails(workOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + workOrderId + "' not found"));

        if (workOrder.getStatus() != WorkOrderStatus.COMPLETED) {
            throw new BusinessRuleException("Return-to-service inspection requires the work order to be in 'COMPLETED' state first");
        }

        workOrder.setPassedInspection(Boolean.TRUE.equals(request.passedInspection()));
        workOrder.setInspectedBy(inspector);
        workOrder.setInspectedAt(Instant.now());
        workOrder.setInspectionNotes(request.inspectionNotes().trim());

        Equipment equipment = workOrder.getEquipment();

        if (Boolean.TRUE.equals(request.passedInspection())) {
            // Inspection Passed: Return equipment to AVAILABLE
            equipmentService.transitionStatusDirect(
                    equipment.getId(),
                    EquipmentStatus.AVAILABLE,
                    "PASSED_INSPECTION_RETURN_TO_SERVICE",
                    "Post-maintenance verification certified by " + inspector.getFirstName() + " " + inspector.getLastName() +
                    ": " + request.inspectionNotes().trim(),
                    inspector
            );

            // Close linked fault report
            FaultReport linkedFault = workOrder.getFaultReport();
            if (linkedFault != null) {
                linkedFault.setStatus(FaultStatus.CLOSED);
                linkedFault.setClosedBy(inspector);
                linkedFault.setClosedAt(Instant.now());
                faultReportRepository.save(linkedFault);
            }

            WorkOrderNote note = WorkOrderNote.builder()
                    .author(inspector)
                    .noteType(NoteType.INSPECTION_NOTE)
                    .notes("PASSED RETURN-TO-SERVICE INSPECTION. Instrument returned to active service: " +
                           request.inspectionNotes().trim())
                    .build();
            workOrder.addNote(note);

            eventPublisher.publishEvent(new EquipmentReturnedToServiceEvent(
                    equipment.getId(),
                    workOrder.getId(),
                    inspector.getId(),
                    request.inspectionNotes().trim()
            ));
        } else {
            // Inspection Failed: Keep equipment in UNDER_MAINTENANCE and reopen work order
            workOrder.setStatus(WorkOrderStatus.IN_PROGRESS);
            WorkOrderNote note = WorkOrderNote.builder()
                    .author(inspector)
                    .noteType(NoteType.INSPECTION_NOTE)
                    .notes("FAILED RETURN-TO-SERVICE INSPECTION. Instrument retained in UNDER_MAINTENANCE: " +
                           request.inspectionNotes().trim())
                    .build();
            workOrder.addNote(note);
        }

        return toWorkOrderResponse(workOrderRepository.save(workOrder));
    }

    public PageResponse<MaintenanceWorkOrderSummaryResponse> findWorkOrders(WorkOrderSearchCriteria criteria, Pageable pageable) {
        Specification<MaintenanceWorkOrder> spec = MaintenanceWorkOrderSpecifications.withCriteria(criteria);
        Page<MaintenanceWorkOrder> page = workOrderRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::toWorkOrderSummary));
    }

    public PageResponse<MaintenanceWorkOrderSummaryResponse> getTechnicianWorkOrders(Pageable pageable, Authentication authentication) {
        User technician = resolveUser(authentication);
        List<WorkOrderStatus> activeStatuses = List.of(
                WorkOrderStatus.ASSIGNED,
                WorkOrderStatus.IN_PROGRESS,
                WorkOrderStatus.BLOCKED,
                WorkOrderStatus.COMPLETED
        );

        Page<MaintenanceWorkOrder> page = workOrderRepository.findByAssignedTechnicianIdAndStatusIn(
                technician.getId(),
                activeStatuses,
                pageable
        );
        return PageResponse.from(page.map(this::toWorkOrderSummary));
    }

    public MaintenanceWorkOrderResponse getWorkOrderById(UUID id) {
        MaintenanceWorkOrder workOrder = workOrderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Work order with ID '" + id + "' not found"));
        return toWorkOrderResponse(workOrder);
    }

    public List<MaintenanceWorkOrderSummaryResponse> getEquipmentMaintenanceHistory(UUID equipmentId) {
        return workOrderRepository.findByEquipmentIdOrderByCreatedAtDesc(equipmentId)
                .stream()
                .map(this::toWorkOrderSummary)
                .toList();
    }

    // =========================================================================
    // MAPPERS & HELPERS
    // =========================================================================

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("User is not authenticated");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user could not be found"));
    }

    public FaultReportResponse toFaultResponse(FaultReport f) {
        return new FaultReportResponse(
                f.getId(),
                f.getFaultNumber(),
                f.getEquipment().getId(),
                f.getEquipment().getName(),
                f.getEquipment().getAssetTag(),
                f.getEquipment().getLaboratory().getName(),
                f.getReportedBy().getId(),
                f.getReportedBy().getFirstName() + " " + f.getReportedBy().getLastName(),
                f.getReportedBy().getEmail(),
                f.getTitle(),
                f.getDescription(),
                f.getSeverity(),
                f.getStatus(),
                f.getReportedAt(),
                f.getTriagedBy() != null ? f.getTriagedBy().getId() : null,
                f.getTriagedBy() != null ? f.getTriagedBy().getFirstName() + " " + f.getTriagedBy().getLastName() : null,
                f.getTriagedAt(),
                f.getTriageNotes(),
                f.getResolvedBy() != null ? f.getResolvedBy().getId() : null,
                f.getResolvedBy() != null ? f.getResolvedBy().getFirstName() + " " + f.getResolvedBy().getLastName() : null,
                f.getResolvedAt(),
                f.getResolutionDetails(),
                f.getClosedBy() != null ? f.getClosedBy().getId() : null,
                f.getClosedBy() != null ? f.getClosedBy().getFirstName() + " " + f.getClosedBy().getLastName() : null,
                f.getClosedAt(),
                f.getCreatedAt(),
                f.getUpdatedAt()
        );
    }

    public FaultReportSummaryResponse toFaultSummary(FaultReport f) {
        return new FaultReportSummaryResponse(
                f.getId(),
                f.getFaultNumber(),
                f.getEquipment().getId(),
                f.getEquipment().getName(),
                f.getEquipment().getAssetTag(),
                f.getEquipment().getLaboratory().getName(),
                f.getReportedBy().getId(),
                f.getReportedBy().getFirstName() + " " + f.getReportedBy().getLastName(),
                f.getTitle(),
                f.getSeverity(),
                f.getStatus(),
                f.getReportedAt(),
                f.getCreatedAt()
        );
    }

    public MaintenanceWorkOrderResponse toWorkOrderResponse(MaintenanceWorkOrder w) {
        List<WorkOrderNoteResponse> notes = w.getNotes() != null
                ? w.getNotes().stream()
                        .map(n -> new WorkOrderNoteResponse(
                                n.getId(),
                                w.getId(),
                                n.getAuthor().getId(),
                                n.getAuthor().getFirstName() + " " + n.getAuthor().getLastName(),
                                n.getNoteType(),
                                n.getNotes(),
                                n.getCreatedAt()
                        ))
                        .toList()
                : Collections.emptyList();

        return new MaintenanceWorkOrderResponse(
                w.getId(),
                w.getWorkOrderNumber(),
                w.getFaultReport() != null ? w.getFaultReport().getId() : null,
                w.getFaultReport() != null ? w.getFaultReport().getFaultNumber() : null,
                w.getFaultReport() != null ? w.getFaultReport().getTitle() : null,
                w.getEquipment().getId(),
                w.getEquipment().getName(),
                w.getEquipment().getAssetTag(),
                w.getEquipment().getLaboratory().getName(),
                w.getAssignedTechnician() != null ? w.getAssignedTechnician().getId() : null,
                w.getAssignedTechnician() != null ? w.getAssignedTechnician().getFirstName() + " " + w.getAssignedTechnician().getLastName() : null,
                w.getAssignedTechnician() != null ? w.getAssignedTechnician().getEmail() : null,
                w.getCreatedBy().getId(),
                w.getCreatedBy().getFirstName() + " " + w.getCreatedBy().getLastName(),
                w.getTitle(),
                w.getDescription(),
                w.getPriority(),
                w.getStatus(),
                w.getBlockedReason(),
                w.getPlannedStartDate(),
                w.getPlannedCompletionDate(),
                w.getActualStartTime(),
                w.getActualCompletionTime(),
                w.getLaborHours(),
                w.getPartsCost(),
                w.getResolutionSummary(),
                w.isPassedInspection(),
                w.getInspectedBy() != null ? w.getInspectedBy().getId() : null,
                w.getInspectedBy() != null ? w.getInspectedBy().getFirstName() + " " + w.getInspectedBy().getLastName() : null,
                w.getInspectedAt(),
                w.getInspectionNotes(),
                notes,
                w.getCreatedAt(),
                w.getUpdatedAt()
        );
    }

    public MaintenanceWorkOrderSummaryResponse toWorkOrderSummary(MaintenanceWorkOrder w) {
        return new MaintenanceWorkOrderSummaryResponse(
                w.getId(),
                w.getWorkOrderNumber(),
                w.getFaultReport() != null ? w.getFaultReport().getId() : null,
                w.getFaultReport() != null ? w.getFaultReport().getFaultNumber() : null,
                w.getEquipment().getId(),
                w.getEquipment().getName(),
                w.getEquipment().getAssetTag(),
                w.getEquipment().getLaboratory().getName(),
                w.getAssignedTechnician() != null ? w.getAssignedTechnician().getId() : null,
                w.getAssignedTechnician() != null ? w.getAssignedTechnician().getFirstName() + " " + w.getAssignedTechnician().getLastName() : null,
                w.getTitle(),
                w.getPriority(),
                w.getStatus(),
                w.getPlannedCompletionDate(),
                w.isPassedInspection(),
                w.getCreatedAt()
        );
    }
}
