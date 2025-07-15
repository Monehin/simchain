#!/bin/bash

echo "🚀 SIMChain Restart Script"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Kill all running instances
print_status "Killing all running Node.js/Next.js processes..."
pkill -f "next\|node\|npm\|yarn" 2>/dev/null || true
sleep 2
print_success "All processes killed"

# Step 2: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the simchain-relayer directory."
    exit 1
fi

# Step 3: Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Check environment variables
print_status "Checking environment variables..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    print_warning "No .env or .env.local file found. Please ensure your environment variables are set."
else
    print_success "Environment files found"
fi

# Step 5: Regenerate Prisma client
print_status "Regenerating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 6: Push schema to database (optional)
read -p "Do you want to push schema to database? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Pushing schema to database..."
    npx prisma db push
    if [ $? -eq 0 ]; then
        print_success "Schema pushed to database"
    else
        print_error "Failed to push schema"
        exit 1
    fi
fi

# Step 7: Start the development server
print_status "Starting development server..."
print_warning "Server will start in the background. Check the logs for any errors."
npm run dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 5

# Step 8: Test the API endpoints
print_status "Testing API endpoints..."

# Test connection
print_status "Testing connection..."
CONNECTION_RESPONSE=$(curl -s -X GET http://localhost:3000/api/test-connection 2>/dev/null)
if [[ $CONNECTION_RESPONSE == *"success"* ]]; then
    print_success "Connection test passed"
else
    print_error "Connection test failed: $CONNECTION_RESPONSE"
fi

# Test database
print_status "Testing database..."
DATABASE_RESPONSE=$(curl -s -X GET http://localhost:3000/api/test-database 2>/dev/null)
if [[ $DATABASE_RESPONSE == *"success"* ]]; then
    print_success "Database test passed"
else
    print_error "Database test failed: $DATABASE_RESPONSE"
fi

# Step 9: Final status
echo
echo "=========================="
print_success "SIMChain restart completed!"
echo
echo "📋 Next Steps:"
echo "1. Check the server logs for any errors"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Test the admin page at http://localhost:3000/admin"
echo "4. Begin creating wallets and testing functionality"
echo
echo "🔧 Useful Commands:"
echo "- View logs: tail -f .next/server.log"
echo "- Stop server: pkill -f 'next'"
echo "- Test API: curl http://localhost:3000/api/test-connection"
echo
print_status "Server PID: $SERVER_PID"
print_status "Happy coding! 🚀" 