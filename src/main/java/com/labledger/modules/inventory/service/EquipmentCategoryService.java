package com.labledger.modules.inventory.service;

import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.inventory.dto.CreateCategoryRequest;
import com.labledger.modules.inventory.dto.EquipmentCategoryResponse;
import com.labledger.modules.inventory.model.EquipmentCategory;
import com.labledger.modules.inventory.repository.EquipmentCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EquipmentCategoryService {

    private final EquipmentCategoryRepository categoryRepository;

    public List<EquipmentCategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public EquipmentCategoryResponse getCategoryById(UUID id) {
        EquipmentCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment category with identifier '" + id + "' was not found"));
        return toResponse(category);
    }

    @Transactional
    public EquipmentCategoryResponse createCategory(CreateCategoryRequest request) {
        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();

        if (categoryRepository.existsByCode(code)) {
            throw new ConflictException("Equipment category with code '" + code + "' already exists");
        }
        if (categoryRepository.existsByName(name)) {
            throw new ConflictException("Equipment category with name '" + name + "' already exists");
        }

        EquipmentCategory category = EquipmentCategory.builder()
                .code(code)
                .name(name)
                .description(request.description())
                .build();

        EquipmentCategory saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    public EquipmentCategoryResponse toResponse(EquipmentCategory category) {
        return new EquipmentCategoryResponse(
                category.getId(),
                category.getCode(),
                category.getName(),
                category.getDescription(),
                category.getCreatedAt()
        );
    }
}
