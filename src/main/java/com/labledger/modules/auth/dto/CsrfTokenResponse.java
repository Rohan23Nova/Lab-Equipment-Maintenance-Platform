package com.labledger.modules.auth.dto;

public record CsrfTokenResponse(
        String token,
        String headerName,
        String parameterName
) {
}
