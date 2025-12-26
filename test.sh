#!/bin/bash

echo "Testing order placement..."

# Login first to get token
echo "1. Logging in..."
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"Customer123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo " Login failed!"
    exit 1
fi

echo " Got token: ${TOKEN:0:20}..."

# Try to place order
echo ""
echo "2. Placing order..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {"isbn": "978-0-13-468599-1", "quantity": 2}
    ]
  }')

echo "Response: $RESPONSE"

if [[ $RESPONSE == *"success\":true"* ]]; then
    echo " Order placed!"
else
    echo " Order failed!"
    echo ""
    echo "Checking backend logs..."
    docker-compose logs backend | tail -20
fi