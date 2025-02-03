CREATE TABLE IF NOT EXISTS "airspace_overlay_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text,
	"color" text,
	"geojson" jsonb,
	"settings" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "airspace_overlay_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airspace_overlay_components" ADD CONSTRAINT "airspace_overlay_components_group_id_airspace_overlay_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."airspace_overlay_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
