package com.labledger.modules.inventory.service;

import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.dto.*;
import com.labledger.modules.inventory.model.*;
import com.labledger.modules.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final EquipmentCategoryRepository categoryRepository;
    private final EquipmentStatusHistoryRepository statusHistoryRepository;
    private final EquipmentDocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final LaboratoryService laboratoryService;
    private final EquipmentCategoryService categoryService;

    public PageResponse<EquipmentSummaryResponse> findEquipment(EquipmentSearchCriteria criteria, Pageable pageable) {
        Specification<Equipment> spec = EquipmentSpecifications.withCriteria(criteria);
        Page<Equipment> page = equipmentRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::toSummaryResponse));
    }

    public EquipmentResponse getEquipmentById(UUID id) {
        Equipment equipment = equipmentRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment instrument with identifier '" + id + "' was not found"));

        List<EquipmentStatusHistoryResponse> history = statusHistoryRepository
                .findByEquipmentIdOrderByCreatedAtDesc(id)
                .stream()
                .map(this::toHistoryResponse)
                .toList();

        List<EquipmentDocumentResponse> documents = documentRepository
                .findByEquipmentIdOrderByCreatedAtDesc(id)
                .stream()
                .map(this::toDocumentResponse)
                .toList();

        return toDetailedResponse(equipment, history, documents);
    }

    @Transactional
    public EquipmentResponse createEquipment(CreateEquipmentRequest request, Authentication authentication) {
        String assetTag = request.assetTag().trim().toUpperCase();
        if (equipmentRepository.existsByAssetTag(assetTag)) {
            throw new ConflictException("Equipment with asset tag '" + assetTag + "' already exists in inventory");
        }

        EquipmentCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment category with ID '" + request.categoryId() + "' was not found"));

        Laboratory lab = laboratoryRepository.findById(request.laboratoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory facility with ID '" + request.laboratoryId() + "' was not found"));

        User actor = resolveUser(authentication);
        EquipmentStatus initialStatus = request.status() != null ? request.status() : EquipmentStatus.AVAILABLE;

        Equipment equipment = Equipment.builder()
                .assetTag(assetTag)
                .name(request.name().trim())
                .category(category)
                .laboratory(lab)
                .manufacturer(request.manufacturer().trim())
                .model(request.model().trim())
                .serialNumber(request.serialNumber() != null ? request.serialNumber().trim() : null)
                .condition(request.condition())
                .status(initialStatus)
                .purchaseDate(request.purchaseDate())
                .purchaseCost(request.purchaseCost())
                .warrantyExpiration(request.warrantyExpiration())
                .description(request.description())
                .specifications(request.specifications())
                .build();

        Equipment saved = equipmentRepository.save(equipment);

        // Record initial status in audit trail
        EquipmentStatusHistory history = EquipmentStatusHistory.builder()
                .equipment(saved)
                .previousStatus(null)
                .newStatus(initialStatus)
                .changedByUser(actor)
                .reason("INITIAL_REGISTRATION")
                .notes("Initial commissioning and registration into university inventory ledger.")
                .build();
        statusHistoryRepository.save(history);

        return getEquipmentById(saved.getId());
    }

    @Transactional
    public EquipmentResponse updateEquipment(UUID id, UpdateEquipmentRequest request, Authentication authentication) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment instrument with identifier '" + id + "' was not found"));

        String newAssetTag = request.assetTag().trim().toUpperCase();
        if (!equipment.getAssetTag().equalsIgnoreCase(newAssetTag) && equipmentRepository.existsByAssetTag(newAssetTag)) {
            throw new ConflictException("Equipment with asset tag '" + newAssetTag + "' already exists in inventory");
        }

        EquipmentCategory category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Equipment category with ID '" + request.categoryId() + "' was not found"));

        Laboratory lab = laboratoryRepository.findById(request.laboratoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory facility with ID '" + request.laboratoryId() + "' was not found"));

        equipment.setAssetTag(newAssetTag);
        equipment.setName(request.name().trim());
        equipment.setCategory(category);
        equipment.setLaboratory(lab);
        equipment.setManufacturer(request.manufacturer().trim());
        equipment.setModel(request.model().trim());
        equipment.setSerialNumber(request.serialNumber() != null ? request.serialNumber().trim() : null);
        equipment.setCondition(request.condition());
        equipment.setPurchaseDate(request.purchaseDate());
        equipment.setPurchaseCost(request.purchaseCost());
        equipment.setWarrantyExpiration(request.warrantyExpiration());
        equipment.setDescription(request.description());
        equipment.setSpecifications(request.specifications());

        equipmentRepository.save(equipment);
        return getEquipmentById(id);
    }

    @Transactional
    public EquipmentResponse updateEquipmentStatus(UUID id, EquipmentStatusUpdateRequest request, Authentication authentication) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment instrument with identifier '" + id + "' was not found"));

        EquipmentStatus previousStatus = equipment.getStatus();
        equipment.setStatus(request.status());
        equipmentRepository.save(equipment);

        User actor = resolveUser(authentication);
        EquipmentStatusHistory history = EquipmentStatusHistory.builder()
                .equipment(equipment)
                .previousStatus(previousStatus)
                .newStatus(request.status())
                .changedByUser(actor)
                .reason(request.reason() != null ? request.reason().trim() : "STATUS_UPDATE")
                .notes(request.notes())
                .build();
        statusHistoryRepository.save(history);

        return getEquipmentById(id);
    }

    @Transactional
    public EquipmentResponse archiveEquipment(UUID id, String reason, Authentication authentication) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment instrument with identifier '" + id + "' was not found"));

        EquipmentStatus previousStatus = equipment.getStatus();
        equipment.setStatus(EquipmentStatus.ARCHIVED);
        equipmentRepository.save(equipment);

        User actor = resolveUser(authentication);
        EquipmentStatusHistory history = EquipmentStatusHistory.builder()
                .equipment(equipment)
                .previousStatus(previousStatus)
                .newStatus(EquipmentStatus.ARCHIVED)
                .changedByUser(actor)
                .reason("DECOMMISSION_ARCHIVE")
                .notes(reason != null ? reason.trim() : "Equipment archived and retired from active university scheduling.")
                .build();
        statusHistoryRepository.save(history);

        return getEquipmentById(id);
    }

    public List<EquipmentStatusHistoryResponse> getEquipmentHistory(UUID id) {
        if (!equipmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Equipment instrument with identifier '" + id + "' was not found");
        }
        return statusHistoryRepository.findByEquipmentIdOrderByCreatedAtDesc(id)
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    @Transactional
    public EquipmentDocumentResponse addDocument(UUID id, CreateDocumentRequest request, Authentication authentication) {
        Equipment equipment = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment instrument with identifier '" + id + "' was not found"));

        User actor = resolveUser(authentication);
        EquipmentDocument doc = EquipmentDocument.builder()
                .equipment(equipment)
                .title(request.title().trim())
                .documentType(request.documentType())
                .fileName(request.fileName().trim())
                .fileType(request.fileType().trim())
                .fileSize(request.fileSize())
                .fileUrl(request.fileUrl().trim())
                .uploadedByUser(actor)
                .build();

        EquipmentDocument saved = documentRepository.save(doc);
        return toDocumentResponse(saved);
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
    }

    public EquipmentSummaryResponse toSummaryResponse(Equipment e) {
        return new EquipmentSummaryResponse(
                e.getId(),
                e.getAssetTag(),
                e.getName(),
                e.getCategory().getName(),
                e.getCategory().getId(),
                e.getLaboratory().getName(),
                e.getLaboratory().getCode(),
                e.getLaboratory().getId(),
                e.getManufacturer(),
                e.getModel(),
                e.getCondition(),
                e.getStatus(),
                e.getUpdatedAt()
        );
    }

    public EquipmentResponse toDetailedResponse(
            Equipment e,
            List<EquipmentStatusHistoryResponse> history,
            List<EquipmentDocumentResponse> documents
    ) {
        return new EquipmentResponse(
                e.getId(),
                e.getAssetTag(),
                e.getName(),
                categoryService.toResponse(e.getCategory()),
                laboratoryService.toResponse(e.getLaboratory()),
                e.getManufacturer(),
                e.getModel(),
                e.getSerialNumber(),
                e.getCondition(),
                e.getStatus(),
                e.getPurchaseDate(),
                e.getPurchaseCost(),
                e.getWarrantyExpiration(),
                e.getDescription(),
                e.getSpecifications(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                history,
                documents
        );
    }

    public EquipmentStatusHistoryResponse toHistoryResponse(EquipmentStatusHistory h) {
        String actorName = h.getChangedByUser() != null
                ? h.getChangedByUser().getFirstName() + " " + h.getChangedByUser().getLastName()
                : "System Automation";
        String actorEmail = h.getChangedByUser() != null ? h.getChangedByUser().getEmail() : null;

        return new EquipmentStatusHistoryResponse(
                h.getId(),
                h.getPreviousStatus(),
                h.getNewStatus(),
                actorName,
                actorEmail,
                h.getReason(),
                h.getNotes(),
                h.getCreatedAt()
        );
    }

    public EquipmentDocumentResponse toDocumentResponse(EquipmentDocument d) {
        String uploaderName = d.getUploadedByUser() != null
                ? d.getUploadedByUser().getFirstName() + " " + d.getUploadedByUser().getLastName()
                : "System";

        return new EquipmentDocumentResponse(
                d.getId(),
                d.getTitle(),
                d.getDocumentType(),
                d.getFileName(),
                d.getFileType(),
                d.getFileSize(),
                d.getFileUrl(),
                uploaderName,
                d.getCreatedAt()
        );
    }
}
