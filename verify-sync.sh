#!/bin/bash
# Synchronization Verification Script
# Run this to verify both fillingdartgame and fillgame are properly synchronized

echo "================================================"
echo "fillingdartgame ↔ fillgame Synchronization Check"
echo "================================================"
echo ""

# Check fillingdartgame
echo "1. Checking fillingdartgame..."
echo "   - Build status:"
cd fillingdartgame 2>/dev/null
if npm run build > /dev/null 2>&1; then
  echo "     ✅ Build successful"
else
  echo "     ❌ Build failed - check for errors"
  exit 1
fi

# Check for readable ID references
echo "   - Scanning for readable ID code:"
if grep -r "readableId\|numericToReadableMatchId\|matchIdUtils\|matchIdMapping" src --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
  echo "     ❌ Found readable ID references - synchronization may be incomplete"
  exit 1
else
  echo "     ✅ No readable ID code found"
fi

echo ""
echo "2. Checking fillgame..."
cd ../fillgame 2>/dev/null
if [ ! -d "lib" ]; then
  echo "   ❌ Could not find fillgame directory"
  exit 1
fi

echo "   - Scanning for readable ID code:"
if grep -r "readableId\|numericToReadableMatchId" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next > /dev/null 2>&1; then
  echo "     ❌ Found readable ID references - synchronization incomplete"
  exit 1
else
  echo "     ✅ No readable ID code found"
fi

echo "   - Checking Supabase configuration:"
if [ -f ".env.local" ] || [ -f ".env" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE" .env* 2>/dev/null; then
    echo "     ✅ Supabase credentials configured"
  else
    echo "     ⚠️  Supabase credentials not found in .env files"
  fi
else
  echo "     ⚠️  No .env file found"
fi

echo ""
echo "================================================"
echo "✅ Synchronization Complete!"
echo "================================================"
echo ""
echo "Both repositories are now using numeric-only match IDs."
echo "The readable ID feature has been successfully removed."
echo ""
echo "Next steps:"
echo "1. Deploy both apps to your servers"
echo "2. Verify Supabase credentials in production"
echo "3. Test match creation and synchronization"
echo ""
