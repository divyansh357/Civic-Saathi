package com.civic.modules.worker.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class LocationUpdateRequest {
    @NotNull(message = "Latitude is required")
    @JsonProperty("latitude")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @JsonProperty("longitude")
    private Double longitude;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
