#!/usr/bin/env python
import requests
import json

# 测试 blog 文章 API
r = requests.get('http://localhost:8000/blog/article/')
print(f'状态码: {r.status_code}')

if r.status_code == 200:
    data = r.json()
    print(f'文章数: {data.get("count", 0)}')
    results = data.get('results', [])
    if results:
        print(f'\n前两篇文章:')
        for article in results[:2]:
            print(f'  - {article.get("title")} (ID: {article.get("id")})')
    else:
        print('没有文章结果')
else:
    print(f'错误: {r.text}')
