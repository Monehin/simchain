#!/bin/bash

# Crosschain Hyperbridge - Stop All Services
# This script stops all components of the crosschain-hyperbridge project

echo "🛑 Stopping Crosschain Hyperbridge Services..."
echo "=============================================="

# Function to stop a service
stop_service() {
    local name=$1
    local dir=$2
    local pid_file="$dir/$name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f "$pid_file"
            echo "✅ $name stopped"
        else
            echo "⚠️  $name process not found"
            rm -f "$pid_file"
        fi
    else
        echo "⚠️  No PID file found for $name"
    fi
}

# Stop services using PID files
stop_service "Ethereum Hardhat Node" "eth-contract"
stop_service "Solana Anchor Localnet" "solana-program"
stop_service "React Frontend" "frontend"

# Additional fallback: Kill React processes by name if PID file doesn't exist
echo "🔄 Checking for React processes..."
if pgrep -f "react-scripts start" > /dev/null; then
    echo "Found React processes, killing them..."
    pkill -f "react-scripts start" || true
    echo "✅ React processes killed"
fi

# Additional check for any remaining React processes
sleep 1
if pgrep -f "react-scripts" > /dev/null; then
    echo "Found remaining React processes, force killing..."
    pkill -9 -f "react-scripts" || true
    echo "✅ Remaining React processes force killed"
fi

# Stop relayer script
if [ -f "relayer-script/relayer.pid" ]; then
    pid=$(cat "relayer-script/relayer.pid")
    if ps -p $pid > /dev/null 2>&1; then
        echo "Stopping Relayer Script (PID: $pid)..."
        kill $pid 2>/dev/null || true
        rm -f "relayer-script/relayer.pid"
        echo "✅ Relayer Script stopped"
    else
        echo "⚠️  Relayer Script process not found"
        rm -f "relayer-script/relayer.pid"
    fi
fi

# Kill any remaining processes by name
echo "🔄 Killing any remaining processes..."
pkill -f "hardhat node" || true
pkill -f "anchor localnet" || true
pkill -f "node index.js" || true
pkill -f "react-scripts start" || true
pkill -f "solana-test-validator" || true
pkill -f "solana logs" || true

echo ""
echo "✅ All services stopped!"
echo "========================"
echo "🧹 You can now safely restart services with: ./start-all.sh"
echo "" 