import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

import { afterEach } from 'bun:test';
import { fixtureCleanup } from '@open-wc/testing-helpers/pure';

afterEach(fixtureCleanup);
