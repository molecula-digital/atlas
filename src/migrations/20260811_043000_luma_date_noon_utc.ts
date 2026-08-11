import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Luma dayOnly dates were stored at UTC midnight (`T00:00:00.000Z`). In
 * America/Mazatlan that displays as the previous calendar day in Payload admin.
 * Normalize to noon UTC so the civil date stays stable across timezones.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "payload"."events"
    SET "date" = (
      date_trunc('day', "date" AT TIME ZONE 'UTC') + interval '12 hours'
    ) AT TIME ZONE 'UTC'
    WHERE "external_source" = 'luma'
      AND "date" IS NOT NULL
      AND EXTRACT(HOUR FROM ("date" AT TIME ZONE 'UTC')) = 0
      AND EXTRACT(MINUTE FROM ("date" AT TIME ZONE 'UTC')) = 0
      AND EXTRACT(SECOND FROM ("date" AT TIME ZONE 'UTC')) = 0;

    UPDATE "payload"."_events_v"
    SET "version_date" = (
      date_trunc('day', "version_date" AT TIME ZONE 'UTC') + interval '12 hours'
    ) AT TIME ZONE 'UTC'
    WHERE "version_external_source" = 'luma'
      AND "version_date" IS NOT NULL
      AND EXTRACT(HOUR FROM ("version_date" AT TIME ZONE 'UTC')) = 0
      AND EXTRACT(MINUTE FROM ("version_date" AT TIME ZONE 'UTC')) = 0
      AND EXTRACT(SECOND FROM ("version_date" AT TIME ZONE 'UTC')) = 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "payload"."events"
    SET "date" = (
      date_trunc('day', "date" AT TIME ZONE 'UTC')
    ) AT TIME ZONE 'UTC'
    WHERE "external_source" = 'luma'
      AND "date" IS NOT NULL
      AND EXTRACT(HOUR FROM ("date" AT TIME ZONE 'UTC')) = 12
      AND EXTRACT(MINUTE FROM ("date" AT TIME ZONE 'UTC')) = 0
      AND EXTRACT(SECOND FROM ("date" AT TIME ZONE 'UTC')) = 0;

    UPDATE "payload"."_events_v"
    SET "version_date" = (
      date_trunc('day', "version_date" AT TIME ZONE 'UTC')
    ) AT TIME ZONE 'UTC'
    WHERE "version_external_source" = 'luma'
      AND "version_date" IS NOT NULL
      AND EXTRACT(HOUR FROM ("version_date" AT TIME ZONE 'UTC')) = 12
      AND EXTRACT(MINUTE FROM ("version_date" AT TIME ZONE 'UTC')) = 0
      AND EXTRACT(SECOND FROM ("version_date" AT TIME ZONE 'UTC')) = 0;
  `)
}
