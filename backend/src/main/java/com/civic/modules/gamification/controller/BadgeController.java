package com.civic.modules.gamification.controller;

import com.civic.modules.complaint.entity.Complaint;
import com.civic.modules.complaint.repository.ComplaintRepository;
import com.civic.modules.gamification.service.BadgeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/complaints")
public class BadgeController {

    @Autowired
    private BadgeService badgeService;

    @Autowired
    private ComplaintRepository complaintRepository;

    @GetMapping("/test-badge")
    public ResponseEntity<byte[]> testBadge() {
        try {
            Complaint c = new Complaint();
            c.setId(UUID.randomUUID());
            c.setClosedAt(java.time.LocalDateTime.now());
            c.setResolvedAt(java.time.LocalDateTime.now());
            byte[] imageBytes = badgeService.generateBadgeForComplaint(c);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}/badge")
    public ResponseEntity<byte[]> getBadgeForComplaint(@PathVariable String id) {
        Optional<Complaint> complaintOpt = complaintRepository.findById(UUID.fromString(id));
        
        if (complaintOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Complaint complaint = complaintOpt.get();
        
        // Only closed complaints get badges
        if (complaint.getStatus() != Complaint.ComplaintStatus.CLOSED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }

        try {
            byte[] imageBytes = badgeService.generateBadgeForComplaint(complaint);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_PNG);
            // Ensure the image isn't aggressively cached while we are testing coordinates
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.setPragma("no-cache");
            headers.setExpires(0L);

            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}
