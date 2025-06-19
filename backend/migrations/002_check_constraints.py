from sqlalchemy import text

def upgrade():
    conn = op.get_bind()
    
    # Create the update_updated_at_column function (if it doesn't exist)
    conn.execute(text("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.last_updated = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    
    # Create the donor type validation function
    conn.execute(text("""
        CREATE OR REPLACE FUNCTION validate_donor_type_and_fk()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NOT (
                (NEW.donor_type = 'Individual' AND NEW.user_id IS NOT NULL AND NEW.organization_id IS NULL) OR
                (NEW.donor_type = 'Organization' AND NEW.user_id IS NULL AND NEW.organization_id IS NOT NULL)
            ) THEN
                RAISE EXCEPTION 'Invalid donor type configuration: Individual donors must have user_id and no organization_id, Organization donors must have organization_id and no user_id';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    
    # Create the user role validation function
    conn.execute(text("""
        CREATE OR REPLACE FUNCTION validate_donor_user_role()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NEW.user_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM users 
                    WHERE id = NEW.user_id 
                    AND roles::jsonb ? 'donor'
                ) THEN
                    RAISE EXCEPTION 'User must have donor role to be associated with a donor record';
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    
    # Create triggers
    conn.execute(text("""
        CREATE TRIGGER update_donors_last_updated 
        BEFORE UPDATE ON donors 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    """))
    
    conn.execute(text("""
        CREATE TRIGGER tr_validate_donor_type_and_fk
        BEFORE INSERT OR UPDATE ON donors
        FOR EACH ROW
        EXECUTE FUNCTION validate_donor_type_and_fk();
    """))
    
    conn.execute(text("""
        CREATE TRIGGER tr_validate_donor_user_role
        BEFORE INSERT OR UPDATE ON donors
        FOR EACH ROW
        EXECUTE FUNCTION validate_donor_user_role();
    """))
    
    conn.execute("""
        CREATE OR REPLACE FUNCTION validate_donation_type_consistency()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NOT (
                (NEW.donation_type::text = 'one-time' AND NEW.recurring_frequency IS NULL AND NEW.next_donation_date IS NULL) OR
                (NEW.donation_type::text = 'recurring' AND NEW.recurring_frequency IS NOT NULL)
            ) THEN
                RAISE EXCEPTION 'Invalid donation type configuration: one-time donations must have no recurring_frequency or next_donation_date, recurring donations must have recurring_frequency';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create function for donation kind consistency validation
    conn.execute("""
        CREATE OR REPLACE FUNCTION validate_donation_kind_consistency()
        RETURNS TRIGGER AS $$
        BEGIN
            IF NOT (
                (NEW.donation_kind = 'cash' AND NEW.amount IS NOT NULL AND NEW.item_description IS NULL) OR
                (NEW.donation_kind = 'inkind' AND NEW.item_description IS NOT NULL)
            ) THEN
                RAISE EXCEPTION 'Invalid donation kind configuration: cash donations must have amount and no item_description, in-kind donations must have item_description';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    # Create triggers
    conn.execute("""
        CREATE TRIGGER tr_validate_donation_type_consistency
        BEFORE INSERT OR UPDATE ON donations
        FOR EACH ROW
        EXECUTE FUNCTION validate_donation_type_consistency();
    """)
    
    conn.execute("""
        CREATE TRIGGER tr_validate_donation_kind_consistency
        BEFORE INSERT OR UPDATE ON donations
        FOR EACH ROW
        EXECUTE FUNCTION validate_donation_kind_consistency();
    """)

def downgrade():
    conn = op.get_bind()
    
    # Drop triggers
    conn.execute(text("DROP TRIGGER IF EXISTS update_donors_last_updated ON donors;"))
    conn.execute(text("DROP TRIGGER IF EXISTS tr_validate_donor_type_and_fk ON donors;"))
    conn.execute(text("DROP TRIGGER IF EXISTS tr_validate_donor_user_role ON donors;"))
    conn.execute("DROP TRIGGER IF EXISTS tr_validate_donation_type_consistency ON donations;")
    conn.execute("DROP TRIGGER IF EXISTS tr_validate_donation_kind_consistency ON donations;")
    
    # Drop functions
    # Drop functions
    conn.execute(text("DROP FUNCTION IF EXISTS validate_donor_type_and_fk();"))
    conn.execute(text("DROP FUNCTION IF EXISTS validate_donor_user_role();"))
    conn.execute("DROP FUNCTION IF EXISTS validate_donation_type_consistency();")
    conn.execute("DROP FUNCTION IF EXISTS validate_donation_kind_consistency();")
