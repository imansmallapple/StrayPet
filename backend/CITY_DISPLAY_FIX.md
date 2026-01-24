# 宠物卡片城市位置修复说明

## 解决方案

城市信息来自：**宠物所属收容所的地址城市**

数据关系：`Pet → Shelter → Address → City`

### 实施方法：为收容所分配地址

在后端目录运行以下命令：

```bash
python manage.py fix_pet_addresses
```

这个命令会：

- 自动为没有地址的收容所创建地址
- 创建必要的城市和地区数据（波兰主要城市）
- 为每个收容所分配一个城市

### 手动方式（可选）

1. 进入 Django Admin: `http://localhost:8000/admin/`
2. 找到 `Shelter` 模型
3. 为每个收容所分配一个 Address
4. 保存

## 验证

运行后，重新加载前端页面：

- http://localhost:5173/ （如果是 Vite）
- 或通过 API: `http://localhost:8000/api/pets/`

你应该看到每个宠物卡片右下角显示 `📍 城市名称`

## 技术细节

## 技术实现

### 后端 ✅ 已完成

文件: `backend/apps/pet/serializers.py`

```python
class PetListSerializer(serializers.ModelSerializer):
    city = serializers.SerializerMethodField()  # 新增字段

    def get_city(self, obj: Pet) -> str:
        """从宠物关联的收容所获取城市名称"""
        if obj.shelter and obj.shelter.address and obj.shelter.address.city:
            return obj.shelter.address.city.name or ''
        return ''
```

### 前端 ✅ 已完成

文件: `frontend/src/views/adoption/index/index.tsx`

```tsx
{
  pet.city && <div className="city-badge">📍 {pet.city}</div>;
}
```

## 数据关系

```
Pet → Shelter → Address → City → Region → Country
       ↑
    宠物关联的收容所
```

只需确保：

- Shelter 有 address_id（指向 Address）
- Address 有 city_id（指向 City）
- City 有 region_id（指向 Region）

## 实施

运行以下命令为所有收容所创建地址和城市数据：

```bash
python manage.py fix_pet_addresses
```
