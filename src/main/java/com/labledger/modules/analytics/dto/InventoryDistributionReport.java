package com.labledger.modules.analytics.dto;

import java.math.BigDecimal;
import java.util.Map;

public record InventoryDistributionReport(
        long totalActive,
        long totalArchived,
        BigDecimal totalPurchaseCost,
        Map<String, Long> byCategory,
        Map<String, Long> byStatus,
        Map<String, Long> byCondition,
        Map<String, Long> byLaboratory
) {
}
