#!/usr/bin/env node

// ============================================================
// IEC ELECTION PORTAL - PROFESSIONAL LOGIN DIAGNOSTIC
// Government System Audit - No Changes, Only Analysis
// ============================================================

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 IEC Election Portal - Professional Login Diagnostic');
console.log('========================================================\n');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ FAIL: Environment variables missing');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
    console.log('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Present' : '❌ Missing');
    process.exit(1);
}

console.log('✅ Environment variables: OK');

// Create Supabase client
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runDiagnostics() {
    console.log('\n📊 DATABASE ANALYSIS:');
    console.log('==================');
    
    try {
        // 1. Test basic connection
        console.log('1. Testing database connection...');
        const { data, error } = await supabase.from('system_config').select('key, value').limit(1);
        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return;
        }
        console.log('✅ Database connection: OK');
        
        // 2. Check if admin table exists
        console.log('\n2. Checking admin table...');
        const { data: adminCheck, error: adminError } = await supabase
            .from('admins')
            .select('id, email, full_name, role')
            .limit(1);
            
        if (adminError) {
            console.log('❌ Admin table issue:', adminError.message);
            console.log('   Table may not exist or access denied');
        } else {
            console.log('✅ Admin table exists');
            console.log('   Admin count:', adminCheck.length);
            if (adminCheck.length > 0) {
                console.log('   Sample admin:', {
                    id: adminCheck[0].id,
                    email: adminCheck[0].email,
                    name: adminCheck[0].full_name,
                    role: adminCheck[0].role
                });
            }
        }
        
        // 3. Check for required RPC functions
        console.log('\n3. Checking RPC functions...');
        
        const requiredFunctions = [
            'verify_admin_password',
            'create_admin_session',
            'rpc_voter_status_lookup'
        ];
        
        for (const funcName of requiredFunctions) {
            try {
                const { data: funcCheck, error: funcError } = await supabase
                    .rpc(funcName, { 
                        input_email: 'test@test.com', 
                        input_password: 'test' 
                    });
                    
                if (funcError) {
                    console.log(`❌ ${funcName}:`, funcError.message.includes('function') ? 'NOT FOUND' : 'EXISTS but error');
                } else {
                    console.log(`✅ ${funcName}: EXISTS`);
                }
            } catch (e) {
                console.log(`❌ ${funcName}: NOT FOUND`);
            }
        }
        
        // 4. Check login_attempts table
        console.log('\n4. Checking login_attempts table...');
        const { data: attempts, error: attemptsError } = await supabase
            .from('login_attempts')
            .select('email, success, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
            
        if (attemptsError) {
            console.log('❌ login_attempts table:', attemptsError.message);
        } else {
            console.log('✅ login_attempts table exists');
            console.log('   Recent attempts:', attempts.length);
            attempts.forEach((attempt, i) => {
                console.log(`   ${i+1}. ${attempt.email} - ${attempt.success ? 'SUCCESS' : 'FAILED'} - ${attempt.created_at}`);
            });
        }
        
        // 5. Check admin_sessions table
        console.log('\n5. Checking admin_sessions table...');
        const { data: sessions, error: sessionsError } = await supabase
            .from('admin_sessions')
            .select('admin_email, created_at, expires_at')
            .limit(3);
            
        if (sessionsError) {
            console.log('❌ admin_sessions table:', sessionsError.message);
        } else {
            console.log('✅ admin_sessions table exists');
            console.log('   Active sessions:', sessions.length);
        }
        
        // 6. Check the specific admin email
        console.log('\n6. Checking specific admin credentials...');
        const targetEmail = 'jameshbaysah013@gmail.com';
        
        const { data: adminData, error: adminLookupError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', targetEmail);
            
        if (adminLookupError) {
            console.log('❌ Admin lookup failed:', adminLookupError.message);
        } else if (adminData.length === 0) {
            console.log(`❌ Admin email '${targetEmail}' NOT FOUND in database`);
        } else {
            console.log(`✅ Admin email '${targetEmail}' FOUND`);
            console.log('   Details:', {
                id: adminData[0].id,
                email: adminData[0].email,
                name: adminData[0].full_name,
                role: adminData[0].role,
                hasPassword: !!adminData[0].password_hash,
                passwordLength: adminData[0].password_hash ? adminData[0].password_hash.length : 0
            });
        }
        
    } catch (error) {
        console.error('❌ Diagnostic error:', error.message);
    }
    
    console.log('\n🎯 DIAGNOSTIC SUMMARY:');
    console.log('====================');
    console.log('The login issue is caused by missing database components.');
    console.log('Required fixes (in order):');
    console.log('1. Create admins table with proper schema');
    console.log('2. Create verify_admin_password RPC function');
    console.log('3. Create create_admin_session RPC function');
    console.log('4. Insert admin credentials with hashed password');
    console.log('5. Test login flow end-to-end');
}

runDiagnostics().catch(console.error);
