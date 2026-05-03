ALTER TYPE "public"."role" ADD VALUE 'superadmin' BEFORE 'admin';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."bump_user_session_version"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();

  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash
    OR OLD.role IS DISTINCT FROM NEW.role
    OR OLD.is_active IS DISTINCT FROM NEW.is_active
    OR OLD.must_change_password IS DISTINCT FROM NEW.must_change_password THEN
    NEW.session_version = OLD.session_version + 1;
  END IF;

  RETURN NEW;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS "users_session_version_guard" ON "users";--> statement-breakpoint
CREATE TRIGGER "users_session_version_guard"
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE FUNCTION "public"."bump_user_session_version"();
