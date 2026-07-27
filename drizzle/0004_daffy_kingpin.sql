ALTER TABLE "app"."profiles" ADD COLUMN "slug" text;--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_slug_uidx" ON "app"."profiles" USING btree ("slug");