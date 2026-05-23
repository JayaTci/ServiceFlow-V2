CREATE TABLE "security_rate_limits" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "service_requests_requested_by_idx" ON "service_requests" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "service_requests_assignee_idx" ON "service_requests" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "service_requests_deleted_at_idx" ON "service_requests" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "service_requests_created_at_idx" ON "service_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_password_reset_token_idx" ON "users" USING btree ("password_reset_token");