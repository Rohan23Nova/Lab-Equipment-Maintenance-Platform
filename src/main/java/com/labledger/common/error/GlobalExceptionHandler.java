package com.labledger.common.error;

import com.labledger.common.exception.AccountDisabledException;
import com.labledger.common.exception.AccountLockedException;
import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        log.warn("Validation error on request [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST,
                "Request validation failed for one or more fields."
        );
        problem.setTitle("Validation Failed");
        problem.setType(URI.create("https://labledger.university.edu/errors/validation-failed"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());

        List<ValidationErrorDetail> invalidParams = ex.getBindingResult().getFieldErrors().stream()
                .map(this::mapFieldError)
                .toList();

        problem.setProperty("invalidParams", invalidParams);
        return problem;
    }

    @ExceptionHandler(AccountLockedException.class)
    public ProblemDetail handleAccountLocked(AccountLockedException ex, HttpServletRequest request) {
        log.warn("Login attempt on locked account [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.LOCKED, ex.getMessage());
        problem.setTitle("Account Locked");
        problem.setType(URI.create("https://labledger.university.edu/errors/account-locked"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(AccountDisabledException.class)
    public ProblemDetail handleAccountDisabled(AccountDisabledException ex, HttpServletRequest request) {
        log.warn("Login attempt on disabled account [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setTitle("Account Disabled");
        problem.setType(URI.create("https://labledger.university.edu/errors/account-disabled"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        log.warn("Failed authentication attempt on [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password. Please check your credentials."
        );
        problem.setTitle("Authentication Failed");
        problem.setType(URI.create("https://labledger.university.edu/errors/bad-credentials"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied on [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.FORBIDDEN,
                "Access denied. You do not possess the required laboratory role to access this resource."
        );
        problem.setTitle("Forbidden");
        problem.setType(URI.create("https://labledger.university.edu/errors/forbidden"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.info("Resource not found [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create("https://labledger.university.edu/errors/not-found"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex, HttpServletRequest request) {
        log.warn("Conflict detected [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Resource Conflict");
        problem.setType(URI.create("https://labledger.university.edu/errors/conflict"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex, HttpServletRequest request) {
        log.warn("Business rule violation [{}]: {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Business Rule Violation");
        problem.setType(URI.create("https://labledger.university.edu/errors/business-rule"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Database constraint violation on [{}]: {}", request.getRequestURI(), ex.getMessage());

        String detail = "The operation could not be completed due to a database integrity constraint conflict.";
        String message = ex.getMessage() != null ? ex.getMessage() : "";
        if (message.contains("exclude_overlapping_reservations")) {
            detail = "Schedule collision: The requested equipment slot has already been reserved or confirmed by another user.";
        } else if (message.contains("chk_reservation_time_interval")) {
            detail = "Reservation interval violation: Start time must precede end time.";
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail);
        problem.setTitle("Schedule Conflict");
        problem.setType(URI.create("https://labledger.university.edu/errors/schedule-conflict"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled server exception on [{}]: ", request.getRequestURI(), ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred. Please contact laboratory support."
        );
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create("https://labledger.university.edu/errors/internal-server-error"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    private ValidationErrorDetail mapFieldError(FieldError fieldError) {
        String rejected = fieldError.getRejectedValue() != null ? fieldError.getRejectedValue().toString() : "null";
        return new ValidationErrorDetail(
                fieldError.getField(),
                rejected,
                fieldError.getDefaultMessage() != null ? fieldError.getDefaultMessage() : "Invalid field value"
        );
    }
}
