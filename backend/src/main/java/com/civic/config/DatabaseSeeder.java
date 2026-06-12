package com.civic.config;

import com.civic.modules.department.entity.Department;
import com.civic.modules.department.repository.DepartmentRepository;
import com.civic.modules.geography.entity.City;
import com.civic.modules.geography.entity.Ward;
import com.civic.modules.geography.entity.Zone;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (departmentRepository.count() == 0) {
            System.out.println("Seeding basic geography and departments...");
            
            // Check if any city exists
            List<City> cities = entityManager.createQuery("SELECT c FROM City c", City.class).setMaxResults(1).getResultList();
            City city;
            if (cities.isEmpty()) {
                city = new City();
                city.setName("Indore");
                city.setState("Madhya Pradesh");
                city.setCountry("India");
                city.setCreatedAt(LocalDateTime.now());
                entityManager.persist(city);

                Zone zone = new Zone();
                zone.setName("Zone 1");
                zone.setCity(city);
                zone.setCreatedAt(LocalDateTime.now());
                entityManager.persist(zone);

                Ward ward = new Ward();
                ward.setName("Ward 1");
                ward.setCity(city);
                ward.setCreatedAt(LocalDateTime.now());
                entityManager.persist(ward);
            } else {
                city = cities.get(0);
            }

            String[] categories = {"ROADS", "WATER", "SANITATION", "ELECTRICITY", "PARKS", "GENERAL", "OTHER"};
            
            for (String category : categories) {
                Department dept = new Department();
                dept.setName(category + " Department");
                dept.setCategoryType(category);
                dept.setCity(city);
                dept.setActive(true);
                dept.setCreatedAt(LocalDateTime.now());
                departmentRepository.save(dept);
            }
            
            System.out.println("Seeding completed successfully.");
        }
    }
}
