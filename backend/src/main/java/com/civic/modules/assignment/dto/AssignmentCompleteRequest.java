package com.civic.modules.assignment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class AssignmentCompleteRequest {
    
    @NotEmpty(message = "At least one completion image is required")
    @JsonProperty("images")
    private List<String> images;

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }
}
