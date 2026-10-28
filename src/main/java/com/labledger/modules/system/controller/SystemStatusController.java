package com.labledger.modules.system.controller;

import com.labledger.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
@Tag(name = "System", description = "System diagnostic, health status, and environment inspection endpoints")
public class SystemStatusController {

    private final DataSource dataSource;
    private final Environment environment;

    @GetMapping("/status")
    @Operation(summary = "Check full system and database connectivity status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("application", "LabLedger Platform");
        status.put("version", "0.1.0-SNAPSHOT");
        status.put("status", "UP");
        status.put("serverTimeUtc", Instant.now().toString());
        status.put("activeProfiles", Arrays.asList(environment.getActiveProfiles()));

        Map<String, Object> database = new HashMap<>();
        try (Connection connection = dataSource.getConnection()) {
            boolean valid = connection.isValid(3);
            DatabaseMetaData metaData = connection.getMetaData();
            database.put("connected", valid);
            database.put("product", metaData.getDatabaseProductName());
            database.put("version", metaData.getDatabaseProductVersion());
        } catch (Exception e) {
            database.put("connected", false);
            database.put("error", e.getMessage());
        }
        status.put("database", database);

        return ResponseEntity.ok(ApiResponse.ok(status, "LabLedger system status verified"));
    }
}
