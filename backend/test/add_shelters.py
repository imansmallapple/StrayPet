#!/usr/bin/env python
"""
Script to add sample shelter data to the database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from apps.pet.models import Shelter, Address, City, Region, Country

def add_sample_shelters():
    """Add several sample shelters to the database"""
    
    # Sample shelter data
    shelters_data = [
        {
            "name": "北京动物救助中心",
            "description": "致力于救助和保护流浪动物，提供医疗、饲养和领养服务",
            "email": "info@beijing-animal-rescue.org",
            "phone": "+86 10-1234-5678",
            "website": "https://beijing-animal-rescue.org",
            "capacity": 150,
            "current_animals": 85,
            "founded_year": 2010,
            "is_active": True,
            "is_verified": True,
            "facebook_url": "https://facebook.com/beijingrescue",
            "instagram_url": "https://instagram.com/beijingrescue",
        },
        {
            "name": "上海宠物之家",
            "description": "上海市最大的动物救助和领养平台，专注于流浪猫狗的救助",
            "email": "contact@shanghai-pet-home.com",
            "phone": "+86 21-8888-8888",
            "website": "https://shanghai-pet-home.com",
            "capacity": 200,
            "current_animals": 120,
            "founded_year": 2012,
            "is_active": True,
            "is_verified": True,
            "facebook_url": "https://facebook.com/shanghaiPetHome",
            "instagram_url": "https://instagram.com/shanghaiPetHome",
        },
        {
            "name": "广州爱心宠物救援站",
            "description": "为广州及周边地区的流浪动物提供医疗救助和临时收容",
            "email": "help@gz-pet-rescue.cn",
            "phone": "+86 20-3333-3333",
            "website": "https://gz-pet-rescue.cn",
            "capacity": 120,
            "current_animals": 65,
            "founded_year": 2015,
            "is_active": True,
            "is_verified": False,
            "facebook_url": "",
            "instagram_url": "https://instagram.com/gzPetRescue",
        },
        {
            "name": "深圳温暖家园",
            "description": "深圳最专业的宠物救助机构，拥有完整的医疗和康复设施",
            "email": "admin@shenzhen-warmhome.org",
            "phone": "+86 755-9999-8888",
            "website": "https://shenzhen-warmhome.org",
            "capacity": 180,
            "current_animals": 95,
            "founded_year": 2013,
            "is_active": True,
            "is_verified": True,
            "facebook_url": "https://facebook.com/szwarmhome",
            "instagram_url": "https://instagram.com/szwarmhome",
            "twitter_url": "https://twitter.com/szwarmhome",
        },
        {
            "name": "西安动物保护委员会",
            "description": "西安地区专业的动物保护和救助组织",
            "email": "contact@xian-animal-care.org",
            "phone": "+86 29-6666-6666",
            "website": "https://xian-animal-care.org",
            "capacity": 100,
            "current_animals": 45,
            "founded_year": 2014,
            "is_active": True,
            "is_verified": True,
            "facebook_url": "",
            "instagram_url": "https://instagram.com/xianAnimalCare",
        },
        {
            "name": "杭州友好宠物救助中心",
            "description": "杭州市领先的动物救助中心，致力于为流浪动物找到新家",
            "email": "info@hangzhou-pet-care.com",
            "phone": "+86 571-5555-5555",
            "website": "https://hangzhou-pet-care.com",
            "capacity": 150,
            "current_animals": 78,
            "founded_year": 2011,
            "is_active": True,
            "is_verified": True,
            "facebook_url": "https://facebook.com/hangzhouPetCare",
            "instagram_url": "https://instagram.com/hangzhouPetCare",
        },
    ]
    
    created_count = 0
    skipped_count = 0
    
    for shelter_data in shelters_data:
        try:
            # Check if shelter already exists
            shelter_name = shelter_data["name"]
            if Shelter.objects.filter(name=shelter_name).exists():
                print(f"✓ 收容所 '{shelter_name}' 已存在，跳过")
                skipped_count += 1
                continue
            
            # Create shelter without address for now
            shelter = Shelter.objects.create(
                name=shelter_data["name"],
                description=shelter_data["description"],
                email=shelter_data["email"],
                phone=shelter_data["phone"],
                website=shelter_data["website"],
                capacity=shelter_data["capacity"],
                current_animals=shelter_data["current_animals"],
                founded_year=shelter_data["founded_year"],
                is_active=shelter_data["is_active"],
                is_verified=shelter_data["is_verified"],
                facebook_url=shelter_data["facebook_url"],
                instagram_url=shelter_data["instagram_url"],
                twitter_url=shelter_data.get("twitter_url", ""),
            )
            
            print(f"✓ 成功创建收容所: '{shelter.name}' (ID: {shelter.id})")
            created_count += 1
            
        except Exception as e:
            print(f"✗ 创建收容所 '{shelter_data['name']}' 失败: {str(e)}")
    
    print("\n" + "="*50)
    print(f"总结: 成功添加 {created_count} 个收容所")
    print(f"      跳过已存在的 {skipped_count} 个")
    print("="*50)

if __name__ == "__main__":
    add_sample_shelters()
