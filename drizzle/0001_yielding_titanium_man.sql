CREATE TABLE IF NOT EXISTS "airspace_static_element_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text,
	"color" text,
	"geojson" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "airspace_static_element_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"icon" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "airspace_static_element_components" ADD CONSTRAINT "airspace_static_element_components_group_id_airspace_static_element_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."airspace_static_element_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
