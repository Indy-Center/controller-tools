ALTER TABLE "airspace_static_element_groups" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "auth_user" ADD COLUMN "created_at" timestamp DEFAULT now();