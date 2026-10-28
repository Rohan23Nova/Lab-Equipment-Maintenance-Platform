package com.labledger.common.error;

import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("ResourceNotFoundException generates 404 ProblemDetail")
    void handleResourceNotFound_generates404() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/equipment/123");
        ResourceNotFoundException ex = new ResourceNotFoundException("Equipment", "123");

        ProblemDetail problem = handler.handleResourceNotFound(ex, request);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(problem.getTitle()).isEqualTo("Resource Not Found");
        assertThat(problem.getDetail()).contains("Equipment with identifier '123' was not found");
        assertThat(problem.getInstance().getPath()).isEqualTo("/api/v1/equipment/123");
        assertThat(problem.getProperties()).containsKey("timestamp");
    }

    @Test
    @DisplayName("ConflictException generates 409 ProblemDetail")
    void handleConflict_generates409() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/reservations");
        ConflictException ex = new ConflictException("Overlapping time interval detected");

        ProblemDetail problem = handler.handleConflict(ex, request);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getTitle()).isEqualTo("Resource Conflict");
        assertThat(problem.getDetail()).isEqualTo("Overlapping time interval detected");
    }

    @Test
    @DisplayName("BusinessRuleException generates 422 ProblemDetail")
    void handleBusinessRule_generates422() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/reservations");
        BusinessRuleException ex = new BusinessRuleException("User missing required certification");

        ProblemDetail problem = handler.handleBusinessRule(ex, request);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY.value());
        assertThat(problem.getTitle()).isEqualTo("Business Rule Violation");
        assertThat(problem.getDetail()).isEqualTo("User missing required certification");
    }

    @Test
    @DisplayName("Generic Exception generates sanitized 500 ProblemDetail")
    void handleGenericException_generatesSanitized500() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/system/status");
        Exception ex = new RuntimeException("Sensitive database stacktrace details");

        ProblemDetail problem = handler.handleGenericException(ex, request);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(problem.getTitle()).isEqualTo("Internal Server Error");
        assertThat(problem.getDetail()).doesNotContain("Sensitive database stacktrace details");
        assertThat(problem.getDetail()).contains("unexpected internal error");
    }
}
