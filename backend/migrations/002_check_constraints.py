# migrations/002_check_constraints.py
from sqlalchemy import text

def upgrade(engine):
    """Add validation functions and triggers for data consistency"""
    with engine.connect() as conn:
        try:
            # Create the update_updated_at_column function (if it doesn't exist)
            # Note: This function should work with both 'updated_at' and 'last_updated' columns
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    -- Handle tables with 'updated_at' column (like funding_proposals)
                    IF TG_TABLE_NAME = 'funding_proposals' THEN
                        NEW.updated_at = CURRENT_TIMESTAMP;
                    -- Handle tables with 'last_updated' column (like organizations, donors)
                    ELSIF TG_TABLE_NAME IN ('organizations', 'donors') THEN
                        NEW.last_updated = CURRENT_TIMESTAMP;
                    END IF;
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
            
            # Create donation type consistency validation function
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION validate_donation_type_consistency()
                RETURNS TRIGGER AS $$
                BEGIN
                    IF NOT (
                        (NEW.donation_type::text = 'one-time' AND 
                         NEW.recurring_frequency IS NULL AND 
                         NEW.next_donation_date IS NULL) 
                        OR
                        (NEW.donation_type::text = 'recurring' AND 
                         NEW.recurring_frequency IS NOT NULL)
                    ) THEN
                        RAISE EXCEPTION 'Invalid donation type configuration: one-time donations must have no recurring_frequency or next_donation_date, recurring donations must have recurring_frequency';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """))
            
            # Create donation kind consistency validation function
            conn.execute(text("""
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
            """))
            
            # Create triggers for donors table
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
            
            # Create triggers for donation_records table
            conn.execute(text("""
                CREATE TRIGGER tr_validate_donation_type_consistency
                BEFORE INSERT OR UPDATE ON donation_records
                FOR EACH ROW
                EXECUTE FUNCTION validate_donation_type_consistency();
            """))
            
            conn.execute(text("""
                CREATE TRIGGER tr_validate_donation_kind_consistency
                BEFORE INSERT OR UPDATE ON donation_records
                FOR EACH ROW
                EXECUTE FUNCTION validate_donation_kind_consistency();
            """))
            
            # Add trigger for donors table to update last_updated
            conn.execute(text("""
                CREATE TRIGGER update_donors_last_updated 
                BEFORE UPDATE ON donors 
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            """))
            
            conn.commit()
            print("✅ All validation functions and triggers created successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error in migration: {e}")
            raise


def downgrade(engine):
    """Remove all validation functions and triggers"""
    with engine.connect() as conn:
        try:
            # Drop triggers first (they depend on functions)
            conn.execute(text("DROP TRIGGER IF EXISTS tr_validate_donor_type_and_fk ON donors;"))
            conn.execute(text("DROP TRIGGER IF EXISTS tr_validate_donor_user_role ON donors;"))
            conn.execute(text("DROP TRIGGER IF EXISTS tr_validate_donation_type_consistency ON donation_records;"))
            conn.execute(text("DROP TRIGGER IF EXISTS tr_validate_donation_kind_consistency ON donation_records;"))
            conn.execute(text("DROP TRIGGER IF EXISTS update_donors_last_updated ON donors;"))
            
            # Drop functions (except update_updated_at_column which was created in migration 001)
            conn.execute(text("DROP FUNCTION IF EXISTS validate_donor_type_and_fk();"))
            conn.execute(text("DROP FUNCTION IF EXISTS validate_donor_user_role();"))
            conn.execute(text("DROP FUNCTION IF EXISTS validate_donation_type_consistency();"))
            conn.execute(text("DROP FUNCTION IF EXISTS validate_donation_kind_consistency();"))
            
            # Restore the original update_updated_at_column function from migration 001
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            """))
            
            conn.commit()
            print("✅ All validation functions and triggers removed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"❌ Error in downgrade: {e}")
            raise