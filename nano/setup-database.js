#!/usr/bin/env node

/**
 * Database Setup Script for Enhanced ICU Chat System
 * 
 * This script helps set up the required database tables in Supabase.
 * Run this after setting up your Supabase project.
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 Enhanced ICU Chat System - Database Setup');
console.log('='.repeat(50));

// Read the migration file
const migrationPath = path.join(__dirname, 'database', 'migration-enhanced-chat.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Database Migration Script Ready');
console.log('');
console.log('📍 Next Steps:');
console.log('1. Open your Supabase project dashboard');
console.log('2. Go to SQL Editor');
console.log('3. Create a new query');
console.log('4. Copy and paste the following SQL:');
console.log('');
console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard');
console.log('');
console.log('=' .repeat(80));
console.log('SQL MIGRATION SCRIPT (Copy this to Supabase SQL Editor):');
console.log('=' .repeat(80));
console.log('');
console.log(migrationSQL);
console.log('');
console.log('=' .repeat(80));
console.log('');
console.log('✅ After running the SQL script in Supabase:');
console.log('   • Chat history will be saved and loaded');
console.log('   • Document upload will work');
console.log('   • All features will be fully functional');
console.log('');
console.log('🧪 Test the system at: http://localhost:3000');
console.log('');

// Check if .env.local exists and has required variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missingVars.forEach(varName => console.log(`   • ${varName}`));
    console.log('');
  } else {
    console.log('✅ Environment variables configured');
  }
} else {
  console.log('⚠️  .env.local file not found');
  console.log('   Make sure to configure your Supabase environment variables');
}

console.log('');
console.log('🚀 Ready to test the Enhanced ICU Chat System!');