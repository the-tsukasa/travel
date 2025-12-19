package com.example.travel.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;

/**
 * 数据源配置
 * 处理 Render 提供的 PostgreSQL URL 格式转换
 * Render 格式: postgresql://user:password@host:port/dbname
 * Spring Boot 需要: jdbc:postgresql://host:port/dbname
 */
@Configuration
@Profile("production")
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        DataSourceProperties properties = new DataSourceProperties();
        
        // 如果 DATABASE_URL 为空，使用默认配置
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            return properties;
        }

        // 处理 Render 的 PostgreSQL URL 格式
        if (databaseUrl.startsWith("postgresql://")) {
            try {
                // 解析 postgresql://user:password@host:port/dbname
                URI uri = new URI(databaseUrl.replace("postgresql://", "http://"));
                
                String userInfo = uri.getUserInfo();
                if (userInfo != null && userInfo.contains(":")) {
                    String[] credentials = userInfo.split(":", 2);
                    properties.setUsername(credentials[0]);
                    properties.setPassword(credentials[1]);
                }
                
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                if (path.startsWith("/")) {
                    path = path.substring(1);
                }
                
                // 转换为 JDBC URL 格式
                String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, path);
                properties.setUrl(jdbcUrl);
                properties.setDriverClassName("org.postgresql.Driver");
            } catch (Exception e) {
                // 如果解析失败，尝试直接转换
                String jdbcUrl = databaseUrl.replace("postgresql://", "jdbc:postgresql://");
                properties.setUrl(jdbcUrl);
                properties.setDriverClassName("org.postgresql.Driver");
            }
        } else if (databaseUrl.startsWith("jdbc:postgresql://")) {
            // 已经是 JDBC 格式
            properties.setUrl(databaseUrl);
            properties.setDriverClassName("org.postgresql.Driver");
        } else {
            // 其他格式，直接使用
            properties.setUrl(databaseUrl);
        }
        
        return properties;
    }

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}

