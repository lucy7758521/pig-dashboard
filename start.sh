#!/bin/bash
# 国内生猪综合数据看板 - 一键启动脚本

echo "========================================"
echo "  国内生猪综合数据看板 - 启动中..."
echo "========================================"

# 启动后端
echo "[1/2] 启动后端服务..."
cd backend
python3.11 main.py &
BACKEND_PID=$!
cd ..

sleep 2

# 启动前端
echo "[2/2] 启动前端开发服务器..."
cd frontend
NODE_OPTIONS="" npx vite --host 0.0.0.0 &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  启动完成！"
echo "  后端 API:  http://localhost:8000/docs"
echo "  前端看板:  http://localhost:5173"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待任意进程退出
wait $BACKEND_PID $FRONTEND_PID
