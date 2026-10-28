package com.labledger.modules.inventory.service;

import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.dto.CreateLaboratoryRequest;
import com.labledger.modules.inventory.dto.LaboratoryResponse;
import com.labledger.modules.inventory.dto.UpdateLaboratoryRequest;
import com.labledger.modules.inventory.model.Laboratory;
import com.labledger.modules.inventory.repository.LaboratoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LaboratoryService {

    private final LaboratoryRepository laboratoryRepository;
    private final UserRepository userRepository;

    public List<LaboratoryResponse> getAllLaboratories(boolean activeOnly) {
        List<Laboratory> labs = activeOnly
                ? laboratoryRepository.findByActiveTrueOrderByBuildingAscNameAsc()
                : laboratoryRepository.findAllByOrderByBuildingAscNameAsc();
        return labs.stream().map(this::toResponse).toList();
    }

    public LaboratoryResponse getLaboratoryById(UUID id) {
        Laboratory lab = laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory with identifier '" + id + "' was not found"));
        return toResponse(lab);
    }

    @Transactional
    public LaboratoryResponse createLaboratory(CreateLaboratoryRequest request) {
        String code = request.code().trim().toUpperCase();
        if (laboratoryRepository.existsByCode(code)) {
            throw new ConflictException("Laboratory with code '" + code + "' already exists");
        }

        User manager = null;
        if (request.managerId() != null) {
            manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager user with ID '" + request.managerId() + "' was not found"));
        }

        Laboratory lab = Laboratory.builder()
                .code(code)
                .name(request.name().trim())
                .building(request.building().trim())
                .roomNumber(request.roomNumber().trim())
                .description(request.description())
                .active(true)
                .manager(manager)
                .build();

        Laboratory saved = laboratoryRepository.save(lab);
        return toResponse(saved);
    }

    @Transactional
    public LaboratoryResponse updateLaboratory(UUID id, UpdateLaboratoryRequest request) {
        Laboratory lab = laboratoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory with identifier '" + id + "' was not found"));

        User manager = lab.getManager();
        if (request.managerId() != null) {
            manager = userRepository.findById(request.managerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager user with ID '" + request.managerId() + "' was not found"));
        }

        lab.setName(request.name().trim());
        lab.setBuilding(request.building().trim());
        lab.setRoomNumber(request.roomNumber().trim());
        lab.setDescription(request.description());
        if (request.active() != null) {
            lab.setActive(request.active());
        }
        lab.setManager(manager);

        Laboratory updated = laboratoryRepository.save(lab);
        return toResponse(updated);
    }

    public LaboratoryResponse toResponse(Laboratory lab) {
        UUID managerId = lab.getManager() != null ? lab.getManager().getId() : null;
        String managerName = lab.getManager() != null
                ? lab.getManager().getFirstName() + " " + lab.getManager().getLastName()
                : null;

        return new LaboratoryResponse(
                lab.getId(),
                lab.getCode(),
                lab.getName(),
                lab.getBuilding(),
                lab.getRoomNumber(),
                lab.getDescription(),
                lab.isActive(),
                managerId,
                managerName,
                lab.getCreatedAt(),
                lab.getUpdatedAt()
        );
    }
}
