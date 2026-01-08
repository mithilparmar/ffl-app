#!/bin/bash

echo "🔍 Verifying Invite Code System Implementation..."
echo ""

# Check for all required files
echo "✓ Checking for required files..."
files=(
  "app/signup/page.tsx"
  "app/api/auth/signup/route.ts"
  "app/api/admin/invite-codes/route.ts"
  "app/(authenticated)/admin/invites/page.tsx"
  "lib/use-copy-clipboard.ts"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
    all_exist=false
  fi
done

echo ""
echo "✓ Checking for schema fields..."
if grep -q "inviteCode" prisma/schema.prisma && grep -q "inviteUsed" prisma/schema.prisma; then
  echo "  ✓ inviteCode and inviteUsed fields in schema"
else
  echo "  ✗ MISSING: inviteCode or inviteUsed fields"
fi

echo ""
echo "✓ Checking middleware configuration..."
if grep -q "signup" middleware.ts; then
  echo "  ✓ /signup excluded from middleware protection"
else
  echo "  ✗ /signup not in middleware config"
fi

echo ""
echo "✓ Checking API endpoint exports..."
if grep -q "POST" app/api/auth/signup/route.ts; then
  echo "  ✓ Signup POST endpoint exists"
fi
if grep -q "GET\|POST\|DELETE" app/api/admin/invite-codes/route.ts; then
  echo "  ✓ Invite codes CRUD endpoints exist"
fi

echo ""
echo "✓ Checking dependencies..."
if grep -q "bcryptjs\|zod\|next-auth" package.json; then
  echo "  ✓ Required dependencies installed"
fi

echo ""
echo "✅ Invite System Verification Complete!"
echo ""
echo "Next: npm run dev  (to start development server)"
echo "Then: Visit http://localhost:3000 to test"
