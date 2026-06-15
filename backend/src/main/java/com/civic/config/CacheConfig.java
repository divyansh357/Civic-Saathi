package com.civic.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

import org.springframework.context.annotation.Primary;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    @Primary
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        // Default cache configuration
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(500));
        
        return cacheManager;
    }

    @Bean("staticDataCacheManager")
    public CacheManager staticDataCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("staticData");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(24, TimeUnit.HOURS)
                .maximumSize(1000));
        return cacheManager;
    }

    @Bean("analyticsDataCacheManager")
    public CacheManager analyticsDataCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("analyticsData");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(100));
        return cacheManager;
    }

    @Bean("userDataCacheManager")
    public CacheManager userDataCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("userData");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(30, TimeUnit.MINUTES)
                .maximumSize(1000));
        return cacheManager;
    }

    @Bean("complaintDataCacheManager")
    public CacheManager complaintDataCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("complaintData");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(2000));
        return cacheManager;
    }
}
