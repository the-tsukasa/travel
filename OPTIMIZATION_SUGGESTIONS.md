# 代码优化建议

## 1. 异常处理优化 ⚠️ 高优先级

### 问题
- 大量使用 `RuntimeException`，缺少统一的异常处理机制
- 异常信息不够结构化，前端难以处理

### 建议
1. **创建自定义异常类**
```java
// exception/ResourceNotFoundException.java
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

// exception/BusinessException.java
public class BusinessException extends RuntimeException {
    private final String errorCode;
    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
```

2. **创建全局异常处理器**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(404)
            .body(new ErrorResponse("NOT_FOUND", e.getMessage()));
    }
    
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        return ResponseEntity.status(400)
            .body(new ErrorResponse(e.getErrorCode(), e.getMessage()));
    }
}
```

**收益**：
- 统一异常格式
- 更好的错误信息展示
- 减少代码重复

---

## 2. Controller层代码重复 ⚠️ 高优先级

### 问题
- 多个Controller中重复获取用户的逻辑
- 代码重复，维护困难

### 建议
1. **创建工具方法或AOP切面**
```java
// 方式1：工具方法
@Component
public class SecurityUtils {
    
    public static User getCurrentUser(Authentication authentication, UserRepository userRepository) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}

// 方式2：使用@AuthenticationPrincipal（推荐）
@GetMapping("/my")
public ResponseEntity<List<NotesDTO>> getUserNotes(
    @AuthenticationPrincipal UserPrincipal userPrincipal) {
    // 直接使用 userPrincipal，无需查询数据库
}
```

2. **创建自定义UserDetails实现**
```java
public class UserPrincipal implements UserDetails {
    private final User user;
    // 包含完整的User对象，避免重复查询
}
```

**收益**：
- 减少代码重复
- 提高性能（减少数据库查询）
- 更易维护

---

## 3. 安全性优化 🔒 高优先级

### 问题
1. JWT密钥硬编码在代码中
2. 密码在代码中可见

### 建议
1. **将JWT密钥移到配置文件和环境变量**
```java
// JwtUtil.java
@Value("${jwt.secret}")
private String secret;

// application.yml
jwt:
  secret: ${JWT_SECRET:pV4E@9f!jL#8rXu2Yz*QmN3hS0w^Rk7VbG&cJ5zMdT$PqH6Lx}
  expiration: ${JWT_EXPIRATION:604800000} # 7天
```

2. **使用Spring Configuration Properties**
```java
@ConfigurationProperties(prefix = "jwt")
@Data
public class JwtProperties {
    private String secret;
    private long expiration;
}
```

**收益**：
- 提高安全性
- 便于不同环境配置
- 符合12-Factor App原则

---

## 4. 性能优化 ⚡ 中优先级

### 问题
1. 每次点赞/收藏操作都重新计算计数（N+1查询问题）
2. 日志级别在生产环境可能影响性能
3. 重复的数据库查询

### 建议
1. **使用数据库触发器或乐观锁更新计数**
```java
// 使用@Query注解直接更新
@Modifying
@Query("UPDATE Notes n SET n.likesCount = (SELECT COUNT(l) FROM Likes l WHERE l.notes = n) WHERE n = :notes")
void updateLikesCount(@Param("notes") Notes notes);
```

2. **调整日志级别**
```yaml
# application.yml (生产环境)
logging:
  level:
    com.example.travel: INFO
    org.springframework.security: WARN  # 降低安全日志级别
```

3. **使用@Cacheable缓存频繁查询的数据**
```java
@Cacheable(value = "notes", key = "#id")
public NotesDTO getNotesById(Long id, User currentUser) {
    // ...
}
```

**收益**：
- 减少数据库查询
- 提高响应速度
- 降低服务器负载

---

## 5. 依赖注入优化 🔧 中优先级

### 问题
`UserServiceImpl` 中手动创建 `BCryptPasswordEncoder` 实例

### 建议
```java
// 修改前
private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

// 修改后
private final PasswordEncoder passwordEncoder;  // 使用配置的Bean
```

**收益**：
- 统一管理依赖
- 便于测试
- 符合Spring最佳实践

---

## 6. 代码结构优化 📁 中优先级

### 问题
- Service层中有重复的 `convertToDTO` 方法
- DTO转换逻辑分散

### 建议
1. **创建Mapper类集中管理转换逻辑**
```java
@Component
public class NotesMapper {
    public NotesDTO toDTO(Notes notes, User currentUser, 
                         LikesRepository likesRepo, 
                         FavoritesRepository favoritesRepo) {
        NotesDTO dto = new NotesDTO();
        // 转换逻辑
        return dto;
    }
}
```

2. **使用MapStruct（推荐）**
```java
@Mapper(componentModel = "spring")
public interface NotesMapper {
    @Mapping(target = "isLiked", expression = "java(checkLiked(notes, currentUser))")
    NotesDTO toDTO(Notes notes, @Context User currentUser);
}
```

**收益**：
- 消除重复代码
- 提高可维护性
- 类型安全

---

## 7. 日志优化 📝 低优先级

### 问题
- JwtAuthenticationFilter 中日志过多（INFO级别）
- 生产环境可能产生大量日志

### 建议
```java
// 将详细日志改为DEBUG级别
log.debug("JWT Filter - Token 解析成功: username={}, role={}", username, role);

// 只在关键错误时使用ERROR
if (!isPublicPath) {
    log.error("JWT Token 解析失败", e);  // 移除详细日志
}
```

**收益**：
- 减少日志文件大小
- 提高性能
- 更清晰的日志

---

## 8. 验证和校验优化 ✅ 中优先级

### 问题
- 缺少输入验证
- 错误信息不够友好

### 建议
1. **增强DTO验证**
```java
@NotNull(message = "用户名不能为空")
@Size(min = 3, max = 20, message = "用户名长度必须在3-20之间")
private String username;
```

2. **创建验证组**
```java
public interface CreateGroup {}
public interface UpdateGroup {}
```

**收益**：
- 更好的数据验证
- 更友好的错误提示
- 减少无效数据

---

## 9. API响应格式优化 📊 低优先级

### 问题
- 响应格式不统一
- 缺少统一的响应包装

### 建议
```java
// 创建统一响应类
@Data
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private long timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "success", data, System.currentTimeMillis());
    }
}
```

**收益**：
- 统一的API格式
- 更好的前端对接
- 便于API文档生成

---

## 10. 测试覆盖 🧪 中优先级

### 问题
- 缺少单元测试
- 缺少集成测试

### 建议
1. **为Service层添加单元测试**
2. **使用MockMvc进行Controller测试**
3. **添加JWT相关的测试**

**收益**：
- 提高代码质量
- 减少回归bug
- 便于重构

---

## 实施优先级总结

### 🔴 高优先级（立即实施）
1. 异常处理优化
2. Controller代码重复问题
3. 安全性优化（JWT密钥）

### 🟡 中优先级（近期实施）
4. 性能优化
5. 依赖注入优化
6. 代码结构优化（DTO转换）
7. 验证和校验优化
8. 测试覆盖

### 🟢 低优先级（长期优化）
9. 日志优化
10. API响应格式优化

---

## 快速开始

建议按以下顺序实施：
1. 先创建自定义异常类和全局异常处理器
2. 优化Controller层的用户获取逻辑
3. 将JWT配置移到配置文件
4. 逐步优化性能问题
5. 添加测试覆盖

