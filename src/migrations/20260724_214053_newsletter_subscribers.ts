import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_newsletter_subscribers_status" AS ENUM('subscribed', 'unsubscribed');
  CREATE TYPE "payload"."enum_newsletter_subscribers_source" AS ENUM('homepage', 'footer', 'manual');
  CREATE TABLE "payload"."newsletter_subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "payload"."enum_newsletter_subscribers_status" DEFAULT 'subscribed' NOT NULL,
  	"unsubscribe_token" varchar NOT NULL,
  	"source" "payload"."enum_newsletter_subscribers_source" DEFAULT 'manual' NOT NULL,
  	"subscribed_at" timestamp(3) with time zone,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DEFAULT 'editor'::text;
  DROP TYPE "payload"."enum_users_role";
  CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DEFAULT 'editor'::"payload"."enum_users_role";
  UPDATE "payload"."users" SET "role" = 'editor' WHERE "role" NOT IN ('admin', 'editor');
  ALTER TABLE "payload"."users" ALTER COLUMN "role" SET DATA TYPE "payload"."enum_users_role" USING "role"::"payload"."enum_users_role";
  ALTER TABLE "payload"."events" ADD COLUMN "slug" varchar;
  ALTER TABLE "payload"."_events_v" ADD COLUMN "version_slug" varchar;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "newsletter_subscribers_id" integer;
  CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "payload"."newsletter_subscribers" USING btree ("email");
  CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_idx" ON "payload"."newsletter_subscribers" USING btree ("unsubscribe_token");
  CREATE INDEX "newsletter_subscribers_updated_at_idx" ON "payload"."newsletter_subscribers" USING btree ("updated_at");
  CREATE INDEX "newsletter_subscribers_created_at_idx" ON "payload"."newsletter_subscribers" USING btree ("created_at");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_subscribers_fk" FOREIGN KEY ("newsletter_subscribers_id") REFERENCES "payload"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;

  -- Backfill slugs for events that predate the column. Mirrors the beforeValidate
  -- hook in src/collections/Events.ts (slugified title + "-YYYY-MM-DD") so existing
  -- events resolve at /eventos/[slug] without needing to be re-saved. Rows that
  -- would collide get their id appended.
  WITH base AS (
    SELECT
      "id",
      COALESCE(
        NULLIF(
          trim(both '-' from regexp_replace(
            translate(lower(COALESCE("title", '')),
              'áàäâãéèëêíìïîóòöôõúùüûñç',
              'aaaaaeeeeiiiiooooouuuunc'),
            '[^a-z0-9]+', '-', 'g')),
          '')
          || COALESCE('-' || to_char("date" AT TIME ZONE 'UTC', 'YYYY-MM-DD'), ''),
        "id"::text
      ) AS candidate
    FROM "payload"."events"
    WHERE "slug" IS NULL OR "slug" = ''
  ), ranked AS (
    SELECT "id", candidate,
           row_number() OVER (PARTITION BY candidate ORDER BY "id") AS rn
    FROM base
  )
  UPDATE "payload"."events" e
  SET "slug" = CASE WHEN r.rn = 1 THEN r.candidate ELSE r.candidate || '-' || r."id" END
  FROM ranked r
  WHERE e."id" = r."id";

  UPDATE "payload"."_events_v" v
  SET "version_slug" = e."slug"
  FROM "payload"."events" e
  WHERE v."parent_id" = e."id" AND (v."version_slug" IS NULL OR v."version_slug" = '');

  CREATE UNIQUE INDEX "events_slug_idx" ON "payload"."events" USING btree ("slug");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "payload"."_events_v" USING btree ("version_slug");
  CREATE INDEX "payload_locked_documents_rels_newsletter_subscribers_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("newsletter_subscribers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // NOTE: the generated version of this migration dropped the newsletter table
  // with CASCADE and *then* dropped the FK constraint explicitly, which always
  // failed — CASCADE had already removed it. The IF EXISTS guards below make the
  // rollback survive that and any other already-cleaned-up object.
  await db.execute(sql`
   ALTER TYPE "payload"."enum_users_role" ADD VALUE IF NOT EXISTS 'moderator' BEFORE 'editor';
  DROP TABLE IF EXISTS "payload"."newsletter_subscribers" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_newsletter_subscribers_fk";

  DROP INDEX IF EXISTS "payload"."events_slug_idx";
  DROP INDEX IF EXISTS "payload"."_events_v_version_version_slug_idx";
  DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_newsletter_subscribers_id_idx";
  ALTER TABLE "payload"."events" DROP COLUMN IF EXISTS "slug";
  ALTER TABLE "payload"."_events_v" DROP COLUMN IF EXISTS "version_slug";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN IF EXISTS "newsletter_subscribers_id";
  DROP TYPE IF EXISTS "payload"."enum_newsletter_subscribers_status";
  DROP TYPE IF EXISTS "payload"."enum_newsletter_subscribers_source";`)
}
