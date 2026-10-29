package com.labledger.modules.inventory.service;

import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.inventory.dto.EquipmentSummaryResponse;
import com.labledger.modules.inventory.dto.ExperimentDetailResponse;
import com.labledger.modules.inventory.dto.ExperimentSummaryResponse;
import com.labledger.modules.inventory.model.TeachingExperiment;
import com.labledger.modules.inventory.repository.TeachingExperimentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeachingExperimentService {

    private final TeachingExperimentRepository experimentRepository;
    private final EquipmentService equipmentService;

    public List<ExperimentSummaryResponse> getAllExperiments(String subject, UUID laboratoryId) {
        List<TeachingExperiment> experiments;
        if (laboratoryId != null) {
            experiments = experimentRepository.findByLaboratoryIdOrderByCodeAsc(laboratoryId);
        } else if (subject != null && !subject.isBlank()) {
            experiments = experimentRepository.findBySubjectOrderByCodeAsc(subject.trim());
        } else {
            experiments = experimentRepository.findAllByOrderBySubjectAscCodeAsc();
        }

        return experiments.stream()
                .map(ExperimentSummaryResponse::fromEntity)
                .toList();
    }

    public ExperimentDetailResponse getExperimentById(UUID id) {
        TeachingExperiment experiment = experimentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teaching experiment with identifier '" + id + "' was not found"));

        List<EquipmentSummaryResponse> equipmentSummaries = experiment.getRequiredEquipment().stream()
                .map(equipmentService::toSummaryResponse)
                .toList();

        return ExperimentDetailResponse.fromEntity(experiment, equipmentSummaries);
    }

    public List<ExperimentSummaryResponse> getExperimentsByEquipmentId(UUID equipmentId) {
        return experimentRepository.findByEquipmentId(equipmentId).stream()
                .map(ExperimentSummaryResponse::fromEntity)
                .toList();
    }

    public List<ExperimentSummaryResponse> getExperimentsByLaboratoryId(UUID laboratoryId) {
        return experimentRepository.findByLaboratoryIdOrderByCodeAsc(laboratoryId).stream()
                .map(ExperimentSummaryResponse::fromEntity)
                .toList();
    }
}
