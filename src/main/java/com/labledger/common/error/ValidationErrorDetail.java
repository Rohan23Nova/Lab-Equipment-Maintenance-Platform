package com.labledger.common.error;

public record ValidationErrorDetail(
        String field,
        String rejectedValue,
        String reason
) {
}
