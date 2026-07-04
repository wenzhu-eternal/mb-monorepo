CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission" varchar(50) NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_pk" PRIMARY KEY("role_id","permission")
);
--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "source" varchar(20) DEFAULT 'backend' NOT NULL;--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "error_type" varchar(50);--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "file" varchar(500);--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "line" integer;--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "column" integer;--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "url" varchar(500);--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "method" varchar(10);--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "status_code" integer;--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "is_resolved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "error_logs" ADD COLUMN "resolved_by" integer;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;