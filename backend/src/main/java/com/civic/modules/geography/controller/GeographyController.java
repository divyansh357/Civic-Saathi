package com.civic.modules.geography.controller;

import com.civic.modules.geography.entity.City;
import com.civic.modules.geography.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/geography")
public class GeographyController {

    @Autowired
    private CityRepository cityRepository;

    @GetMapping("/cities")
    public ResponseEntity<Map<String, Object>> getCities() {
        List<Map<String, Object>> cities = cityRepository.findAll().stream().map(city -> 
            Map.<String, Object>of(
                "id", city.getId().toString(),
                "name", city.getName(),
                "state", city.getState(),
                "country", city.getCountry()
            )
        ).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "data", cities
        ));
    }
}
