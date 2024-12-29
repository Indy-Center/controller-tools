CREATE TABLE IF NOT EXISTS "restrictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport" text,
	"terminal" text,
	"route" text,
	"from" text,
	"to" text,
	"restriction" text,
	"notes" text,
	"valid_at" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
