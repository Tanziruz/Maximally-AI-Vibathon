#!/bin/bash

# Quick Start Script for AI Workflow Automation Platform

echo "🚀 AI Workflow Automation Platform - Quick Start"
echo "================================================"
echo ""

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 20+"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Please install Docker Compose"; exit 1; }

echo "✓ All prerequisites found"
echo ""

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY and other credentials"
    echo ""
    read -p "Press enter to continue after you've configured .env..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Start services with Docker
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:3001"
echo "   API Health: http://localhost:3001/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
echo "🎉 Ready to build workflows!"
