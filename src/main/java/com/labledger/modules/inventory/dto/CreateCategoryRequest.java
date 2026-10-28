package com.labledger.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "Category code is required")
        @Size(max = 50, message = "Category code must not exceed 50 characters")
        String code,

        @NotBlank(message = "Category name is required")
        @Size(max = 150, message = "Category name must not exceed 150 characters")
        String name,

        String description
) {}
