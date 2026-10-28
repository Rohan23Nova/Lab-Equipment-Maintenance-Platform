package com.labledger.modules.inventory.model;

/**
 * Represents the physical integrity and operational wear of a laboratory instrument.
 * Kept strictly independent from operational availability (EquipmentStatus).
 */
public enum EquipmentCondition {
    NEW,
    EXCELLENT,
    GOOD,
    FAIR,
    POOR,
    DAMAGED
}
