# migrations/001_initial_tables.py
from sqlalchemy import text

def upgrade(engine):
    """Create all initial tables"""
    with engine.connect() as conn:
        
        # 1. Create users table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR UNIQUE,
                username VARCHAR UNIQUE,
                hashed_password VARCHAR,
                user_type VARCHAR,
                roles JSON DEFAULT '[]'::json
            );
        """))
        
        # Create indexes for users
        conn.execute(text("CREATE INDEX ix_users_id ON users (id);"))
        conn.execute(text("CREATE INDEX ix_users_email ON users (email);"))
        conn.execute(text("CREATE INDEX ix_users_username ON users (username);"))
        
        # 2. Create response_reports table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS response_reports (
                id SERIAL PRIMARY KEY,
                date_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                report_type VARCHAR(255) NOT NULL,
                status VARCHAR(50) NOT NULL
            );
        """))
        
        # Create index for response_reports
        conn.execute(text("CREATE INDEX ix_response_reports_id ON response_reports (id);"))
        
        # 3. Create organizations table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS organizations (
                "organizationId" SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                phone_number VARCHAR(50),
                email VARCHAR(255),
                address VARCHAR(255),
                date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            );
        """))
        
        # Create indexes for organizations
        conn.execute(text('CREATE INDEX "ix_organizations_organizationId" ON organizations ("organizationId");'))
        conn.execute(text("CREATE INDEX ix_organizations_name ON organizations (name);"))
        
        # 4. Create funding_proposals table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS funding_proposals (
                "proposalId" SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description VARCHAR NOT NULL,
                progress INTEGER DEFAULT 0 NOT NULL,
                "budgetRequired" INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                status VARCHAR(50) NOT NULL,
                image VARCHAR
            );
        """))
        
        # Create index for funding_proposals
        conn.execute(text('CREATE INDEX "ix_funding_proposals_proposalId" ON funding_proposals ("proposalId");'))
        
        # 5. Create donation type and status enums
        conn.execute(text("""
            CREATE TYPE donationtype AS ENUM ('one-time', 'recurring');
        """))
        
        conn.execute(text("""
            CREATE TYPE donationstatus AS ENUM ('pending', 'completed', 'failed', 'cancelled');
        """))
        
        # 6. Create donors table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS donors (
                "donorId" SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                organization_id INTEGER REFERENCES organizations("organizationId"),
                name VARCHAR(255),
                donor_type VARCHAR(20) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE NOT NULL,
                date_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                
                CONSTRAINT ck_donor_type_and_fk CHECK (
                    (donor_type = 'Individual' AND user_id IS NOT NULL AND organization_id IS NULL) OR 
                    (donor_type = 'Organization' AND user_id IS NULL AND organization_id IS NOT NULL)
                )
            );
        """))
        
        # 7. Create donation_records table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS donation_records (
                "donationRecordId" SERIAL PRIMARY KEY,
                donor_id INTEGER NOT NULL REFERENCES donors("donorId"),
                donation_type donationtype NOT NULL,
                amount NUMERIC(10, 2),
                description TEXT,
                date_received DATE NOT NULL,
                status donationstatus DEFAULT 'pending' NOT NULL,
                proposal_id INTEGER REFERENCES funding_proposals("proposalId"),
                donation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
                donation_kind VARCHAR(20) DEFAULT 'cash' NOT NULL,
                item_description VARCHAR,
                estimated_value NUMERIC(10, 2),
                quantity VARCHAR(50),
                recurring_frequency VARCHAR(20),
                next_donation_date TIMESTAMP WITH TIME ZONE,
                recurring_end_date TIMESTAMP WITH TIME ZONE,
                is_active_recurring BOOLEAN DEFAULT TRUE,
                payment_method VARCHAR(50),
                notes VARCHAR,
                
                CONSTRAINT ck_donation_type_consistency CHECK (
                    (donation_type = 'one-time' AND recurring_frequency IS NULL AND next_donation_date IS NULL) OR 
                    (donation_type = 'recurring' AND recurring_frequency IS NOT NULL)
                ),
                CONSTRAINT ck_donation_kind_consistency CHECK (
                    (donation_kind = 'cash' AND amount IS NOT NULL AND item_description IS NULL) OR 
                    (donation_kind = 'inkind' AND item_description IS NOT NULL)
                )
            );
        """))
        
        # Create index for donation_records
        conn.execute(text('CREATE INDEX "ix_donation_records_donationRecordId" ON donation_records ("donationRecordId");'))
        
        # Create trigger function for updating timestamps
        conn.execute(text("""
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        """))
        
        # Create triggers for auto-updating timestamps
        conn.execute(text("""
            CREATE TRIGGER update_funding_proposals_updated_at 
            BEFORE UPDATE ON funding_proposals 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """))
        
        conn.execute(text("""
            CREATE TRIGGER update_organizations_last_updated 
            BEFORE UPDATE ON organizations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """))
        
        conn.execute(text("""
            CREATE TRIGGER update_donors_last_updated 
            BEFORE UPDATE ON donors 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """))
        
        conn.commit()
        print("✅ All tables created successfully!")

        
def downgrade(engine):
    """Drop all tables in reverse order"""
    with engine.connect() as conn:
        # Drop tables in reverse order (to handle foreign key constraints)
        conn.execute(text("DROP TABLE IF EXISTS donation_records CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS donors CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS funding_proposals CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS organizations CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS response_reports CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE;"))
        
        # Drop custom types
        conn.execute(text("DROP TYPE IF EXISTS donationtype CASCADE;"))
        conn.execute(text("DROP TYPE IF EXISTS donationstatus CASCADE;"))
        
        # Drop trigger function
        conn.execute(text("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;"))
        
        conn.commit()
        print("✅ All tables dropped successfully!")