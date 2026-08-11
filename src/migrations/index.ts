import * as migration_20260401_005656 from './20260401_005656';
import * as migration_20260402_051032 from './20260402_051032';
import * as migration_20260402_052120 from './20260402_052120';
import * as migration_20260413_201258 from './20260413_201258';
import * as migration_20260724_214053_newsletter_subscribers from './20260724_214053_newsletter_subscribers';
import * as migration_20260807_163000_luma_calendars from './20260807_163000_luma_calendars';
import * as migration_20260811_043000_luma_date_noon_utc from './20260811_043000_luma_date_noon_utc';

export const migrations = [
  {
    up: migration_20260401_005656.up,
    down: migration_20260401_005656.down,
    name: '20260401_005656',
  },
  {
    up: migration_20260402_051032.up,
    down: migration_20260402_051032.down,
    name: '20260402_051032',
  },
  {
    up: migration_20260402_052120.up,
    down: migration_20260402_052120.down,
    name: '20260402_052120',
  },
  {
    up: migration_20260413_201258.up,
    down: migration_20260413_201258.down,
    name: '20260413_201258',
  },
  {
    up: migration_20260724_214053_newsletter_subscribers.up,
    down: migration_20260724_214053_newsletter_subscribers.down,
    name: '20260724_214053_newsletter_subscribers',
  },
  {
    up: migration_20260807_163000_luma_calendars.up,
    down: migration_20260807_163000_luma_calendars.down,
    name: '20260807_163000_luma_calendars',
  },
  {
    up: migration_20260811_043000_luma_date_noon_utc.up,
    down: migration_20260811_043000_luma_date_noon_utc.down,
    name: '20260811_043000_luma_date_noon_utc',
  },
]
