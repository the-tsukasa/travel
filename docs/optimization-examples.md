# 优化示例代码

## 1. 自定义异常类示例

### ResourceNotFoundException.java
```java
package com.example.travel.exception;

public class ResourceNotFoundException extends RuntimeException {
    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public ResourceNotFoundException(String message) {
        super(message);
        this.resourceName = null;
        this.fieldName = null;
        this.fieldValue = null;
    }
}
```

### BusinessException.java
```java
package com.example.travel.exception;

public class BusinessException extends RuntimeException {
    private final String errorCode;

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
```

### GlobalExceptionHandler.java
```java
package com.example.travel.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            "NOT_FOUND",
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(BusinessException ex) {
        ErrorResponse error = new ErrorResponse(
            ex.getErrorCode(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    // 内部类
    public static class ErrorResponse {
        private String errorCode;
        private String message;
        private LocalDateTime timestamp;

        public ErrorResponse(String errorCode, String message, LocalDateTime timestamp) {
            this.errorCode = errorCode;
            this.message = message;
            this.timestamp = timestamp;
        }

        // Getters
        public String getErrorCode() { return errorCode; }
        public String getMessage() { return message; }
        public LocalDateTime getTimestamp() { return timestamp; }
    }
}
```

## 2. SecurityUtils工具类示例

### SecurityUtils.java
```java
package com.example.travel.util;

import com.example.travel.entity.User;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final UserRepository userRepository;

    public SecurityUtils(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 从Authentication中获取当前用户
     * @param authentication Spring Security的Authentication对象
     * @return 当前登录的用户，如果未认证则返回null
     */
    public User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    /**
     * 获取当前用户（必须已认证）
     * @param authentication Spring Security的Authentication对象
     * @return 当前登录的用户
     * @throws ResourceNotFoundException 如果用户未认证或不存在
     */
    public User getCurrentUserOrThrow(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User not authenticated");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }
}
```

### 使用示例（优化后的Controller）
```java
@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;
    private final SecurityUtils securityUtils;

    @GetMapping("/my")
    public ResponseEntity<List<NotesDTO>> getUserNotes(Authentication authentication) {
        User user = securityUtils.getCurrentUserOrThrow(authentication);
        List<NotesDTO> notes = notesService.getUserNotes(user);
        return ResponseEntity.ok(notes);
    }
}
```

## 3. JWT配置优化示例

### JwtProperties.java
```java
package com.example.travel.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {
    private String secret;
    private long expiration = 604800000; // 默认7天
}
```

### 优化后的JwtUtil.java
```java
package com.example.travel.util;

import com.example.travel.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiration;

    public JwtUtil(JwtProperties jwtProperties) {
        byte[] secretBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expiration = jwtProperties.getExpiration();
        
        log.info("JWT配置初始化完成 - 过期时间: {}ms", expiration);
    }

    public String generateToken(String username, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public boolean isTokenExpired(String token) {
        return getClaims(token).getExpiration().before(new Date());
    }
}
```

### application.yml配置
```yaml
jwt:
  secret: ${JWT_SECRET:pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx}
  expiration: ${JWT_EXPIRATION:604800000}
```

## 4. 优化后的Service示例

### 优化后的UserServiceImpl.java
```java
package com.example.travel.service.impl;

import com.example.travel.dto.LoginRequest;
import com.example.travel.dto.RegisterRequest;
import com.example.travel.entity.User;
import com.example.travel.exception.BusinessException;
import com.example.travel.exception.ResourceNotFoundException;
import com.example.travel.repository.UserRepository;
import com.example.travel.service.UserService;
import com.example.travel.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;  // 使用注入的Bean
    private final JwtUtil jwtUtil;

    @Override
    public void register(RegisterRequest request) {
        // 检查用户名是否存在
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("USERNAME_EXISTS", "用户名已存在");
        }

        // 检查邮箱是否存在
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("EMAIL_EXISTS", "邮箱已被注册");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole("USER");
        user.setCreatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    @Override
    public String login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", request.getUsername()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("INVALID_PASSWORD", "密码错误");
        }

        return jwtUtil.generateToken(user.getUsername(), user.getRole());
    }
}
```

## 5. 统一响应格式示例

### ApiResponse.java
```java
package com.example.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "操作成功", data, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, LocalDateTime.now());
    }
}
```

### 使用示例
```java
@PostMapping
public ResponseEntity<ApiResponse<NotesDTO>> createNotes(
        @Valid @RequestBody CreateNotesRequest request,
        Authentication authentication) {
    User user = securityUtils.getCurrentUserOrThrow(authentication);
    NotesDTO notes = notesService.createNotes(request, user);
    return ResponseEntity.ok(ApiResponse.success("笔记创建成功", notes));
}
```

