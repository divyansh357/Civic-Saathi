package com.civic.modules.worker.mapper;

import com.civic.modules.worker.dto.WorkerResponse;
import com.civic.modules.worker.entity.Worker;
import org.springframework.stereotype.Component;

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
        response.setDesignation(worker.getDesignation());
        response.setStatus(worker.getStatus());
        response.setComplaintsAssigned(worker.getComplaintsAssigned());
        response.setComplaintsResolved(worker.getComplaintsResolved());
        return response;
    }
}
