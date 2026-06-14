package com.civic.modules.gamification.service;

import com.civic.modules.complaint.entity.Complaint;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

@Service
public class BadgeService {

    public byte[] generateBadgeForComplaint(Complaint complaint) throws IOException {
        // Load the template image
        ClassPathResource resource = new ClassPathResource("images/badge.png");
        BufferedImage image = ImageIO.read(resource.getInputStream());

        // Get graphics context
        Graphics2D g2d = image.createGraphics();

        // Anti-aliasing for smooth text
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        // Define colors and font
        g2d.setColor(Color.WHITE); 
        
        // Use a smaller thin font
        int fontSize = image.getWidth() / 50;
        g2d.setFont(new Font("SansSerif", Font.PLAIN, fontSize));

        // Format data
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy");
        String achieveDate = complaint.getClosedAt() != null 
                ? complaint.getClosedAt().format(formatter) 
                : (complaint.getUpdatedAt() != null ? complaint.getUpdatedAt().format(formatter) : "N/A");
                
        String resolutionDate = complaint.getResolvedAt() != null 
                ? complaint.getResolvedAt().format(formatter) 
                : achieveDate;
                
        // Deterministic ID (e.g. CS-B-A1B2C3)
        String shortId = "CS-B-" + complaint.getId().toString().substring(0, 6).toUpperCase();

        // Calculate coordinates based on image width/height percentages
        // From the screenshot, the fields are in the bottom 20% of the image.
        // They are horizontally distributed.
        // We will center the text horizontally around the white lines.
        // Y = 0.845 should put the baseline right on top of the white lines.
        int yPos = (int) (image.getHeight() * 0.845);

        // Draw Achievement Date
        drawCenteredString(g2d, achieveDate, (int) (image.getWidth() * 0.30), yPos);
        
        // Draw Resolution Date
        drawCenteredString(g2d, resolutionDate, (int) (image.getWidth() * 0.53), yPos);
        
        // Draw Badge ID
        drawCenteredString(g2d, shortId, (int) (image.getWidth() * 0.76), yPos);

        // Clean up
        g2d.dispose();

        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        return baos.toByteArray();
    }

    private void drawCenteredString(Graphics2D g, String text, int x, int y) {
        FontMetrics metrics = g.getFontMetrics(g.getFont());
        int xPos = x - (metrics.stringWidth(text) / 2);
        g.drawString(text, xPos, y);
    }
}
