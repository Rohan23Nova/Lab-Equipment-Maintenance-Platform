package com.labledger.modules.maintenance.model;

import com.labledger.modules.auth.model.User;
import com.labledger.modules.inventory.model.Equipment;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "maintenance_work_orders")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceWorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "work_order_number", nullable = false, unique = true, length = 50)
    private String workOrderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fault_report_id")
    private FaultReport faultReport;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "equipment_id", nullable = false)
    private Equipment equipment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_technician_id")
    private User assignedTechnician;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private WorkOrderPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.CREATED;

    @Column(name = "blocked_reason", columnDefinition = "TEXT")
    private String blockedReason;

    @Column(name = "planned_start_date")
    private LocalDate plannedStartDate;

    @Column(name = "planned_completion_date")
    private LocalDate plannedCompletionDate;

    @Column(name = "actual_start_time")
    private Instant actualStartTime;

    @Column(name = "actual_completion_time")
    private Instant actualCompletionTime;

    @Column(name = "labor_hours", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal laborHours = BigDecimal.ZERO;

    @Column(name = "parts_cost", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal partsCost = BigDecimal.ZERO;

    @Column(name = "resolution_summary", columnDefinition = "TEXT")
    private String resolutionSummary;

    @Column(name = "passed_inspection", nullable = false)
    @Builder.Default
    private boolean passedInspection = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspected_by_id")
    private User inspectedBy;

    @Column(name = "inspected_at")
    private Instant inspectedAt;

    @Column(name = "inspection_notes", columnDefinition = "TEXT")
    private String inspectionNotes;

    @OneToMany(mappedBy = "workOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    @Builder.Default
    private List<WorkOrderNote> notes = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addNote(WorkOrderNote note) {
        notes.add(note);
        note.setWorkOrder(this);
    }
}
