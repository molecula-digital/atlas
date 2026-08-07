import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Luma multi-calendar sync:
 * - luma-calendars collection (multiple public calendars)
 * - events external sync fields + external cover URL
 * - seed Gina, Criptoplebada, and Cursor Culiacán calendars
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "payload"."enum_events_external_source" AS ENUM('luma');
    CREATE TYPE "payload"."enum__events_v_version_external_source" AS ENUM('luma');

    CREATE TABLE "payload"."luma_calendars" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "calendar_id" varchar NOT NULL,
      "enabled" boolean DEFAULT true,
      "sync_past" boolean DEFAULT true,
      "auto_publish" boolean DEFAULT true,
      "last_synced_at" timestamp(3) with time zone,
      "last_sync_status" varchar,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload"."events"
      ADD COLUMN IF NOT EXISTS "external_image_url" varchar,
      ADD COLUMN IF NOT EXISTS "external_source" "payload"."enum_events_external_source",
      ADD COLUMN IF NOT EXISTS "external_id" varchar,
      ADD COLUMN IF NOT EXISTS "external_calendar_id" varchar,
      ADD COLUMN IF NOT EXISTS "last_synced_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "sync_locked" boolean DEFAULT false;

    ALTER TABLE "payload"."_events_v"
      ADD COLUMN IF NOT EXISTS "version_external_image_url" varchar,
      ADD COLUMN IF NOT EXISTS "version_external_source" "payload"."enum__events_v_version_external_source",
      ADD COLUMN IF NOT EXISTS "version_external_id" varchar,
      ADD COLUMN IF NOT EXISTS "version_external_calendar_id" varchar,
      ADD COLUMN IF NOT EXISTS "version_last_synced_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "version_sync_locked" boolean DEFAULT false;

    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "luma_calendars_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "luma_calendars_calendar_id_idx"
      ON "payload"."luma_calendars" USING btree ("calendar_id");
    CREATE INDEX IF NOT EXISTS "luma_calendars_updated_at_idx"
      ON "payload"."luma_calendars" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "luma_calendars_created_at_idx"
      ON "payload"."luma_calendars" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "events_external_id_idx"
      ON "payload"."events" USING btree ("external_id");
    CREATE INDEX IF NOT EXISTS "events_external_calendar_id_idx"
      ON "payload"."events" USING btree ("external_calendar_id");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_external_id_idx"
      ON "payload"."_events_v" USING btree ("version_external_id");
    CREATE INDEX IF NOT EXISTS "_events_v_version_version_external_calendar_id_idx"
      ON "payload"."_events_v" USING btree ("version_external_calendar_id");

    ALTER TABLE "payload"."payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_luma_calendars_fk"
      FOREIGN KEY ("luma_calendars_id")
      REFERENCES "payload"."luma_calendars"("id")
      ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_luma_calendars_id_idx"
      ON "payload"."payload_locked_documents_rels"
      USING btree ("luma_calendars_id");

    -- Seed community calendars linked in the product request.
    INSERT INTO "payload"."luma_calendars" (
      "name",
      "calendar_id",
      "enabled",
      "sync_past",
      "auto_publish",
      "notes"
    )
    VALUES
      (
        'Gina',
        'cal-Pf2My2TlVNz1N89',
        true,
        true,
        true,
        'https://luma.com/calendar/cal-Pf2My2TlVNz1N89'
      ),
      (
        'La Cripto Plebada',
        'cal-JMmiSzKO7KGGF5R',
        true,
        true,
        true,
        'https://luma.com/user/Criptoplebada (personal calendar)'
      ),
      (
        'Cursor Culiacan, Mexico',
        'cal-FxFii0ovO9ZQUJg',
        true,
        true,
        true,
        'https://luma.com/cursor-culiacan-mexico'
      )
    ON CONFLICT ("calendar_id") DO NOTHING;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_luma_calendars_fk";
    DROP INDEX IF EXISTS "payload"."payload_locked_documents_rels_luma_calendars_id_idx";
    ALTER TABLE "payload"."payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "luma_calendars_id";

    DROP INDEX IF EXISTS "payload"."events_external_id_idx";
    DROP INDEX IF EXISTS "payload"."events_external_calendar_id_idx";
    DROP INDEX IF EXISTS "payload"."_events_v_version_version_external_id_idx";
    DROP INDEX IF EXISTS "payload"."_events_v_version_version_external_calendar_id_idx";

    ALTER TABLE "payload"."events"
      DROP COLUMN IF EXISTS "external_image_url",
      DROP COLUMN IF EXISTS "external_source",
      DROP COLUMN IF EXISTS "external_id",
      DROP COLUMN IF EXISTS "external_calendar_id",
      DROP COLUMN IF EXISTS "last_synced_at",
      DROP COLUMN IF EXISTS "sync_locked";

    ALTER TABLE "payload"."_events_v"
      DROP COLUMN IF EXISTS "version_external_image_url",
      DROP COLUMN IF EXISTS "version_external_source",
      DROP COLUMN IF EXISTS "version_external_id",
      DROP COLUMN IF EXISTS "version_external_calendar_id",
      DROP COLUMN IF EXISTS "version_last_synced_at",
      DROP COLUMN IF EXISTS "version_sync_locked";

    DROP TABLE IF EXISTS "payload"."luma_calendars" CASCADE;
    DROP TYPE IF EXISTS "payload"."enum_events_external_source";
    DROP TYPE IF EXISTS "payload"."enum__events_v_version_external_source";
  `)
}
