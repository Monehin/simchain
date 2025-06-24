#!/bin/bash

# SIMChain Deployment Script
# This script helps deploy the SIMChain program to different networks

set -e

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists anchor; then
        print_error "Anchor CLI not found. Please install it first:"
        echo "npm install -g @coral-xyz/anchor-cli"
        exit 1
    fi
    
    if ! command_exists solana; then
        print_error "Solana CLI not found. Please install it first:"
        echo "sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js not found. Please install it first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to build the program
build_program() {
    print_status "Building SIMChain program..."
    
    if anchor build; then
        print_success "Program built successfully"
    else
        print_error "Failed to build program"
        exit 1
    fi
}

# Function to deploy to localnet
deploy_localnet() {
    print_status "Deploying to localnet..."
    
    # Check if local validator is running
    if ! pgrep -f "solana-test-validator" > /dev/null; then
        print_warning "Local validator not running. Starting it..."
        solana-test-validator &
        sleep 5
    fi
    
    # Set cluster to localnet
    solana config set --url localhost
    
    # Deploy
    if anchor deploy --provider.cluster localnet; then
        print_success "Deployed to localnet successfully"
        
        # Get program ID
        PROGRAM_ID=$(solana address -k target/deploy/simchain_wallet-keypair.json)
        print_status "Program ID: $PROGRAM_ID"
        
        # Update Anchor.toml
        sed -i.bak "s/simchain_wallet = \".*\"/simchain_wallet = \"$PROGRAM_ID\"/" Anchor.toml
        
        # Update lib.rs
        sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/simchain_wallet/src/lib.rs
        
        print_success "Updated program ID in configuration files"
    else
        print_error "Failed to deploy to localnet"
        exit 1
    fi
}

# Function to deploy to devnet
deploy_devnet() {
    print_status "Deploying to devnet..."
    
    # Set cluster to devnet
    solana config set --url devnet
    
    # Check balance
    BALANCE=$(solana balance)
    print_status "Current balance: $BALANCE"
    
    if [[ $(echo "$BALANCE" | sed 's/ SOL//') -lt 2 ]]; then
        print_warning "Low balance. Requesting airdrop..."
        solana airdrop 2
    fi
    
    # Deploy
    if anchor deploy --provider.cluster devnet; then
        print_success "Deployed to devnet successfully"
        
        # Get program ID
        PROGRAM_ID=$(solana address -k target/deploy/simchain_wallet-keypair.json)
        print_status "Program ID: $PROGRAM_ID"
        
        # Update Anchor.toml
        sed -i.bak "s/simchain_wallet = \".*\"/simchain_wallet = \"$PROGRAM_ID\"/" Anchor.toml
        
        # Update lib.rs
        sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/simchain_wallet/src/lib.rs
        
        print_success "Updated program ID in configuration files"
    else
        print_error "Failed to deploy to devnet"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if anchor test --provider.cluster devnet; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "SIMChain Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     Install dependencies"
    echo "  build       Build the program"
    echo "  localnet    Deploy to localnet"
    echo "  devnet      Deploy to devnet"
    echo "  test        Run tests on devnet"
    echo "  all         Install, build, deploy to devnet, and test"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 build"
    echo "  $0 devnet"
    echo "  $0 all"
}

# Main script logic
main() {
    case "${1:-help}" in
        install)
            check_prerequisites
            install_dependencies
            ;;
        build)
            check_prerequisites
            build_program
            ;;
        localnet)
            check_prerequisites
            build_program
            deploy_localnet
            ;;
        devnet)
            check_prerequisites
            build_program
            deploy_devnet
            ;;
        test)
            check_prerequisites
            run_tests
            ;;
        all)
            check_prerequisites
            install_dependencies
            build_program
            deploy_devnet
            run_tests
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 