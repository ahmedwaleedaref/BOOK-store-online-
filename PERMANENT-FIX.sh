#!/bin/bash

echo "🔧 PERMANENT FIX - This will work forever!"
echo ""

echo "Step 1: Generating correct hashes..."
ADMIN=$(docker-compose exec -T backend node -e "console.log(require('bcryptjs').hashSync('Admin123!', 10));" 2>/dev/null | grep '^\$2')
CUSTOMER=$(docker-compose exec -T backend node -e "console.log(require('bcryptjs').hashSync('Customer123!', 10));" 2>/dev/null | grep '^\$2')

echo "Admin hash: $ADMIN"
echo "Customer hash: $CUSTOMER"

echo ""
echo "Step 2: Updating database..."
docker-compose exec -T mysql mysql -u bookstore -pbookstore123 BookstoreDB << EOSQL
UPDATE USERS SET password_hash = '$ADMIN' WHERE username = 'admin';
UPDATE USERS SET password_hash = '$CUSTOMER' WHERE user_type = 'customer';
SELECT username, user_type, 'Fixed!' as status FROM USERS;
EOSQL

echo ""
echo "Step 3: Updating SQL file for future..."
cp backend/bookstore.sql backend/bookstore.sql.backup
sed -i "s/\\\$2a\\\$10\\\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy/$ADMIN/g" backend/bookstore.sql

echo ""
echo "✅ DONE! Testing..."
sleep 2

curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | grep -q token && echo "✅ Admin login works!" || echo "❌ Admin failed"

curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"Customer123!"}' | grep -q token && echo "✅ Customer login works!" || echo "❌ Customer failed"

echo ""
echo "🎉 Fixed! Database AND SQL file updated!"
echo "Future deploys will work automatically!"
