CREATE TABLE IF NOT EXISTS "adar_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"adar_id" text NOT NULL,
	"upper_altitude" integer NOT NULL,
	"lower_altitude" integer NOT NULL,
	"order" integer NOT NULL,
	"auto_route_limit" integer NOT NULL,
	"route_string" text,
	"protected_area_overwrite" text,
	"star_id" text,
	"dp_id" text,
	"route_fixes" jsonb NOT NULL,
	"arrival_airports" jsonb NOT NULL,
	"departure_airports" jsonb NOT NULL,
	"user_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "adar_records_adar_id_unique" UNIQUE("adar_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aircraft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"class" text,
	"number_of_engines" integer,
	"engine_type" text,
	"manufacturer" text,
	"model" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "airlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"country" text NOT NULL,
	"telephony" text,
	"code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "area_metadata" (
	"id" text PRIMARY KEY NOT NULL,
	"short" text NOT NULL,
	"long" text NOT NULL,
	"category" text NOT NULL,
	"color" text NOT NULL,
	"tag" text,
	"geojson" jsonb,
	"frequency" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_user" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport" text NOT NULL,
	"route" text,
	"from" text NOT NULL,
	"to" text NOT NULL,
	"restriction" text,
	"notes" text,
	"priority" numeric DEFAULT '0',
	"valid_at" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "split_group_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"area_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "split_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"split_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "split_group_areas" ADD CONSTRAINT "split_group_areas_group_id_split_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."split_groups"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "split_group_areas" ADD CONSTRAINT "split_group_areas_area_id_area_metadata_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."area_metadata"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "split_groups" ADD CONSTRAINT "split_groups_split_id_splits_id_fk" FOREIGN KEY ("split_id") REFERENCES "public"."splits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aircraft_code_index" ON "aircraft" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "airline_code_index" ON "airlines" USING btree ("code");