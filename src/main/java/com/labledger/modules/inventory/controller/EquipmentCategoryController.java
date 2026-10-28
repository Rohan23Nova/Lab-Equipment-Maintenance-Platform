package com.labledger.modules.inventory.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.CreateCategoryRequest;
import com.labledger.modules.inventory.dto.EquipmentCategoryResponse;
import com.labledger.modules.inventory.service.EquipmentCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/equipment-categories")
@RequiredArgsConstructor
@Tag(name = "Equipment Taxonomy", description = "Endpoints for instrument classification and categorization")
public class EquipmentCategoryController {

    private final EquipmentCategoryService categoryService;

    @GetMapping
    @Operation(summary = "List all equipment categories")
    public ResponseEntity<ApiResponse<List<EquipmentCategoryResponse>>> listCategories() {
        List<EquipmentCategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve equipment category by identifier")
    public ResponseEntity<ApiResponse<EquipmentCategoryResponse>> getCategoryById(@PathVariable UUID id) {
        EquipmentCategoryResponse category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(category));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Register a new equipment category")
    public ResponseEntity<ApiResponse<EquipmentCategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request
    ) {
        EquipmentCategoryResponse created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(created, "Equipment category registered successfully"));
    }
}
