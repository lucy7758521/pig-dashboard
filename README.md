# 🐷 国内生猪综合数据看板

面向生猪产业链的实时数据监控平台，覆盖全国猪价、行业新闻、企业动态、供需分析、政策追踪五大模块。

## 功能模块

| 模块 | 说明 | 数据源 |
|------|------|--------|
| 📊 **综合看板** | 全国均价、省份热力图、价格趋势、新闻/企业摘要 | 搜猪网 / AKShare |
| 💰 **价格行情** | 外三元/内三元/土杂猪各省排行、90天趋势、24h涨跌 | 搜猪网 / AKShare |
| 📈 **供需看板** | 供给指数、养殖成本、猪粮比、价格指数、饲料走势 | AKShare |
| 📰 **新闻资讯** | 近30天生猪行业新闻、分类筛选 | 中国养猪网 / 农业农村部 |
| 🏢 **企业动态** | 牧原/温氏/新希望/正邦等头部猪企实时股价与动态 | 新浪财经 |
| 📋 **政策动态** | 全国及各省市生猪政策 | 农业农村部 |

## 技术栈

**前端**: React 18 + TypeScript + Vite 5 + Ant Design 5 + ECharts 5  
**后端**: Python FastAPI + SQLAlchemy + APScheduler  
**数据库**: SQLite（开发）/ PostgreSQL（生产）  
**数据采集**: AKShare + httpx 爬虫  

## 快速启动

### 方式一：Docker Compose（推荐）

```bash
docker-compose up -d
```

### 方式二：手动启动

```bash
# 1. 启动后端
cd backend
pip install -r requirements.txt
python3 main.py

# 2. 启动前端
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 方式三：生产部署

```bash
cd frontend && npm run build
# 将 dist/ 部署到 Nginx，后端用 uvicorn 启动
```

## 项目结构

```
pig-dashboard/
├── frontend/          # React 前端 (Vite + Ant Design + ECharts)
│   └── src/
│       ├── api/       # API 请求层
│       ├── hooks/     # React Query hooks
│       ├── pages/     # 页面组件
│       └── components/# 通用组件
├── backend/           # Python FastAPI 后端
│   ├── api/           # REST 路由
│   ├── collector/     # 数据采集 (AKShare + 爬虫)
│   ├── scheduler/     # 定时任务
│   └── services/      # 业务逻辑
└── docker-compose.yml
```

## 数据来源

- **生猪价格**: 搜猪网 (soozhu.com) via AKShare
- **历史走势**: 中国养猪网 (zhuwang.com.cn) via AKShare
- **供给指数/成本**: AKShare `futures_hog_supply` / `futures_hog_cost`
- **价格指数**: AKShare `index_hog_spot_price`
- **新闻**: 中国养猪网 + 农业农村部畜牧兽医局
- **股价**: 新浪财经 API

## License

MIT
