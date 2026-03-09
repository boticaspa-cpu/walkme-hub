

# QA Plan: Operational Testing & Onboarding Validation

## Strategic Approach

**Separation of Concerns**: Split testing into operational validation (using existing accounts) and onboarding flow (new user creation) to isolate potential issues and ensure core business functions work independently of user provisioning.

## BLOCK 1 — OPERATIONAL QA (Primary Focus)

### Pre-Test Database Audit
```sql
-- Identify existing functional accounts
SELECT u.email, p.full_name, p.approval_status, r.role 
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
JOIN public.user_roles r ON u.id = r.user_id
WHERE p.approval_status = 'approved'
ORDER BY r.role, u.created_at;

-- Check available unpaid reservations for testing
SELECT folio, total_mxn, payment_status, created_by
FROM reservations 
WHERE payment_status = 'unpaid'
ORDER BY created_at DESC LIMIT 10;
```

### 1. Authentication & Access Control
**Test**: Login with existing seller account
- ✅ Access: dashboard, reservas, comisiones, pos, calendario
- ❌ Blocked: configuracion, operadores, categorias, destinos, gastos (admin-only)
- **Validation**: Manual navigation + browser network logs for 403 responses

### 2. Cash Session Requirements
**Critical Unknown**: Determine actual cash session requirements
```sql
-- Check current cash session state
SELECT status, business_date, opened_by, register_id
FROM cash_sessions 
WHERE status = 'open'
ORDER BY opened_at DESC LIMIT 1;
```
**Test Scenarios**:
- Card payment with open cash session
- Card payment with closed cash session
- Cash payment with open cash session  
- Cash payment with closed cash session
**Expected**: Document actual behavior, don't assume requirements

### 3. Reservation Checkout - Card Processing
**Test Case**: Process card payment for existing unpaid reservation
**Critical Validations**:
```sql
-- Before payment - record current state
SELECT id, folio, total_mxn, payment_status FROM reservations WHERE folio = '[TEST_FOLIO]';

-- After payment - verify commission creation
SELECT c.amount_mxn, c.card_fee_mxn, c.rate, c.seller_id, s.total_mxn, s.payment_method
FROM commissions c 
JOIN sales s ON c.sale_id = s.id
WHERE c.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY c.created_at DESC LIMIT 1;
```
**Business Logic Tests**:
- Client pays exact reservation total (no fee markup)
- Card fee (3.5%) recorded in `card_fee_mxn`
- Commission = (profit after card fee) × commission rate
- Child pricing lookup uses `pax_type = 'Menor'` not 'Niño'

### 4. Commission RLS Verification
**Cross-role testing**:
```sql
-- Admin view (should see all)
-- Seller view (should see only own)
SELECT seller_id, amount_mxn, created_at, 
       (CASE WHEN seller_id = auth.uid() THEN 'OWN' ELSE 'OTHER' END) as ownership
FROM commissions 
ORDER BY created_at DESC LIMIT 10;
```

### 5. Multi-Tour Reservation Testing
**Create reservation with multiple tours**
**Field persistence validation**:
```sql
SELECT pickup_notes, operator_confirmation_code, hotel_name, pax_email,
       (pickup_notes IS NOT NULL AND pickup_notes != '') as has_pickup,
       (operator_confirmation_code IS NOT NULL AND operator_confirmation_code != '') as has_confirmation,
       (hotel_name IS NOT NULL AND hotel_name != '') as has_hotel,
       (pax_email IS NOT NULL AND pax_email != '') as has_email
FROM reservations 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC LIMIT 5;
```

### 6. Output Generation
**Test voucher, PDF, WhatsApp functionality**
- Voucher HTML renders correctly
- PDF generation works (no 500 errors)
- WhatsApp message formatting is proper
**Validation**: Browser network logs + visual inspection

## BLOCK 2 — ONBOARDING QA

### 1. New User Registration
**Process**: `/login?tab=signup` with test account
**Verification**:
```sql
-- Verify profile + role creation after signup
SELECT u.email, u.created_at, p.full_name, p.approval_status, r.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
LEFT JOIN public.user_roles r ON u.id = r.user_id
WHERE u.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY u.created_at DESC;
```

### 2. Admin Approval Process
**Test**: Admin login → configuracion → approve new user
**Validation**: Status change from 'pending' to 'approved'

### 3. Approved Seller Login
**Test**: New seller can login and access appropriate sections
**Verification**: Same access control tests as Block 1

## Success Criteria & Deliverables

### A. Checklist Format
```
OPERATIONAL QA:
[✅/⚠️/❌] Seller Access Control
[✅/⚠️/❌] Cash Session Logic  
[✅/⚠️/❌] Card Payment Processing
[✅/⚠️/❌] Commission Calculation
[✅/⚠️/❌] Commission RLS
[✅/⚠️/❌] Multi-tour Fields
[✅/⚠️/❌] Output Generation

ONBOARDING QA:
[✅/⚠️/❌] User Registration
[✅/⚠️/❌] Admin Approval
[✅/⚠️/❌] Approved Login
```

### B. Bug Documentation
- Exact error messages
- Browser console logs
- Database state inconsistencies
- Network request failures

### C. Operational Readiness Assessment
**Ready for Production**:
- Features that pass all tests
- Workarounds for minor issues

**Not Ready**:
- Critical failures
- Data integrity issues
- Security problems

### D. SQL Validation Queries
All queries adjusted for actual schema:
- No assumed foreign keys
- Verified column names
- Proper join conditions
- Real data constraints

## Methodology Notes

**No Assumptions**: Each behavior will be empirically tested
**Real Data**: Use existing reservations and accounts where possible  
**Incremental Validation**: Test each step with database queries
**Business Impact Focus**: Prioritize revenue-affecting functionality

