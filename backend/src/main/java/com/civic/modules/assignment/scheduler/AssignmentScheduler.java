package com.civic.modules.assignment.scheduler;

import com.civic.modules.assignment.service.AssignmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler for assignment-related tasks.
 */
@Component
public class AssignmentScheduler {

    private static final Logger logger = LoggerFactory.getLogger(AssignmentScheduler.class);

    @Autowired
    private AssignmentService assignmentService;

    /**
     * Automatically escalate overdue assignments every hour.
     */
    @Scheduled(cron = "0 0 * * * *") // Run every hour at minute 0
    public void escalateOverdueAssignments() {
        logger.info("Starting scheduled escalation of overdue assignments");
        try {
            assignmentService.escalateOverdueAssignments();
            logger.info("Completed scheduled escalation of overdue assignments");
        } catch (Exception e) {
            logger.error("Error during scheduled escalation: {}", e.getMessage(), e);
        }
    }
}
