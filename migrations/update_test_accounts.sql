-- Update test accounts to use Test Organization and make test attorney an org_admin

-- 1. Create Test Organization if it doesn't exist
INSERT INTO organizations (name, display_name, type, contact_email, website, domain_key)
VALUES ('Test Organization', 'Test Organization', 'law_firm', 'info@testorg.com', 'https://testorg.com', 'testorg.com')
ON CONFLICT DO NOTHING;

-- 2. Get the Test Organization ID (we'll use it in updates)
DO $$
DECLARE
    test_org_id UUID;
    test_attorney_id UUID;
BEGIN
    -- Get Test Organization ID
    SELECT id INTO test_org_id FROM organizations WHERE name = 'Test Organization' LIMIT 1;

    -- Update test client to Test Organization
    UPDATE users 
    SET organization_id = test_org_id
    WHERE email = 'testclient@test.com';

    -- Update test attorney to org_admin role and Test Organization
    UPDATE users 
    SET 
        role = 'org_admin',
        name = 'Test Attorney (Org Admin)',
        organization_id = test_org_id
    WHERE email = 'testattorney@test.com'
    RETURNING id INTO test_attorney_id;

    -- Update attorney profile if exists, or create if not
    IF test_attorney_id IS NOT NULL THEN
        INSERT INTO attorney_profiles (user_id, organization_id, bio, specialties, years_of_experience, bar_number, bar_state)
        VALUES (
            test_attorney_id,
            test_org_id,
            'Test attorney with org admin capabilities for testing',
            ARRAY['Immigration Law', 'Visa Applications'],
            5,
            'TEST12345',
            'CA'
        )
        ON CONFLICT (user_id) DO UPDATE SET
            organization_id = test_org_id,
            bio = 'Test attorney with org admin capabilities for testing';
    END IF;

    -- Update test staff to Test Organization
    UPDATE users 
    SET organization_id = test_org_id
    WHERE email = 'teststaff@test.com';

    -- Update test org admin to Test Organization
    UPDATE users 
    SET organization_id = test_org_id
    WHERE email = 'testorgadmin@test.com';

END $$;

-- Verify the changes
SELECT 
    u.email,
    u.name,
    u.role,
    o.name as organization_name
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email IN ('testclient@test.com', 'testattorney@test.com', 'teststaff@test.com', 'testorgadmin@test.com')
ORDER BY u.email;
