package com.civic.modules.worker.mapper;

import com.civic.modules.worker.dto.WorkerResponse;
import com.civic.modules.worker.entity.Worker;
import com.civic.modules.geography.entity.Zone;
import org.springframework.stereotype.Component;
import java.util.stream.Collectors;

/**
 * Mapper for Worker entity and DTOs.
 */
@Component
public class WorkerMapper {
    public WorkerResponse toResponse(Worker worker) {
        WorkerResponse response = new WorkerResponse();
        response.setId(worker.getId());
        response.setUserId(worker.getUserId());
        response.setDepartmentId(worker.getDepartmentId());
        
        // Map from User entity
        if (worker.getUser() != null) {
            response.setName(worker.getUser().getName());
            response.setEmail(worker.getUser().getEmail());
        }
        
        // Map from Department entity
        if (worker.getDepartment() != null) {
            response.setDepartmentName(worker.getDepartment().getName());
        }

        response.setDesignation(worker.getDesignation());
        response.setStatus(worker.getStatus());
        response.setComplaintsAssigned(worker.getComplaintsAssigned());
        response.setComplaintsResolved(worker.getComplaintsResolved());
        response.setAadharNo(worker.getAadharNo());
        response.setIsAadharVerified(worker.getIsAadharVerified());
        response.setAddress(worker.getAddress());
        response.setProfileImageUrl(worker.getProfileImageUrl());
        response.setPreviousWorks(worker.getPreviousWorks());
        response.setWorkerCode(worker.getWorkerCode());

        if (worker.getPreferredZones() != null) {
            response.setPreferredZoneIds(worker.getPreferredZones().stream().map(Zone::getId).collect(Collectors.toList()));
        }
        return response;
    }
}
