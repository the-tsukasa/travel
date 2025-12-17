# 后端优化代码示例

## 🔧 优化 1：统一异常处理

### 问题
`FavoritesController` 使用 `RuntimeException`，应该使用自定义异常

### 优化代码

```java
// FavoritesController.java - 优化前
User user = userRepository.findByUsername(username)
    .orElseThrow(() -> new RuntimeException("User not found: " + username));

// 优化后
User user = userRepository.findByUsername(username)
    .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
```

## 🔧 优化 2：优化点赞/收藏响应

### 问题
当前返回空响应，前端无法获取更新后的计数

### 优化方案

#### 2.1 修改 Service 接口，返回操作结果

```java
// LikesService.java - 添加新方法
public interface LikesService {
    // 原有方法保持不变...
    
    // 新增：点赞并返回结果
    ActionResult likeNotesWithResult(Long notesId, User user);
    
    // 新增：取消点赞并返回结果
    ActionResult unlikeNotesWithResult(Long notesId, User user);
}
```

#### 2.2 创建 ActionResult DTO

```java
// ActionResult.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionResult {
    private boolean success;
    private String message;
    private Integer likesCount;
    private Integer favoritesCount;
    private Boolean isLiked;
    private Boolean isFavorited;
}
```

#### 2.3 优化 Controller

```java
// LikesController.java - 优化后
@PostMapping("/{notesId}")
public ResponseEntity<ActionResponse> likeNotes(@PathVariable Long notesId, 
                                            Authentication authentication) {
    String username = authentication.getName();
    User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    
    likesService.likeNotes(notesId, user);
    
    // 获取更新后的笔记信息
    Notes notes = notesRepository.findById(notesId)
            .orElseThrow(() -> new ResourceNotFoundException("Notes", "id", notesId));
    
    ActionResponse response = ActionResponse.likeResponse(
        true,
        "いいねしました",
        notes.getLikesCount() != null ? notes.getLikesCount() : 0,
        true
    );
    
    return ResponseEntity.ok(response);
}
```

## 🔧 优化 3：统一文件上传响应

### 优化代码

```java
// FileUploadController.java - 使用 FileUploadResponse DTO
@PostMapping("/avatar")
public ResponseEntity<FileUploadResponse> uploadAvatar(@RequestParam("file") MultipartFile file) {
    // ... 验证和处理逻辑 ...
    
    // 优化后返回
    return ResponseEntity.ok(
        FileUploadResponse.avatarSuccess(
            "アバターが正常にアップロードされました",
            "/uploads/" + filename
        )
    );
}
```

## 📝 完整优化代码

让我为你创建完整的优化代码文件。
