package com.labledger.modules.inventory.model;

/**
 * Represents the operational lifecycle and reservation availability of an equipment item.
 */
public enum EquipmentStatus {
    AVAILABLE,
    IN_USE,
    UNDER_MAINTENANCE,
    RESERVED,
    ARCHIVED
}
