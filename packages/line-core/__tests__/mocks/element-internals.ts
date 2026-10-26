/**
 * Recording fake `ElementInternals` for the line-core unit tier (spec §6.C.2, §6.D.5, AM-032).
 * happy-dom has no `attachInternals`, so `bun-test-preload.ts` installs one that returns this fake.
 * @module __tests__/mocks/element-internals
 */

const METHODS = ['setFormValue', 'setValidity', 'reportValidity', 'checkValidity'] as const;

/** One element's fake internals: every method call lands in `calls` and returns `result`. */
export class FakeInternals {
  calls: Array<{ method: (typeof METHODS)[number]; args: unknown[] }> = [];
  result = true;
  form: HTMLFormElement | null = null;
  validity = { valid: true } as ValidityState; // test fake: only `valid` is read
  validationMessage = '';
  willValidate = true;
  states = new Set<string>();
  constructor(readonly host: HTMLElement) {
    for (const method of METHODS) {
      Object.assign(this, {
        [method]: (...args: unknown[]) => {
          this.calls.push({ method, args });
          return this.result;
        },
      });
    }
  }
}

/**
 * Installs a recording `HTMLElement.prototype.attachInternals` that collects every fake it creates in
 * `created`; `restore()` puts back the `attachInternals` it replaced (the preload fake), so later tests keep one.
 */
export function installElementInternals() {
  const proto: { attachInternals?: () => ElementInternals } = HTMLElement.prototype;
  const previous = proto.attachInternals;
  const created: FakeInternals[] = [];
  proto.attachInternals = function (this: HTMLElement) {
    const fake = new FakeInternals(this);
    created.push(fake);
    return fake as unknown as ElementInternals;
  };
  return {
    created,
    restore: () => {
      if (previous) {
        proto.attachInternals = previous;
      } else {
        delete proto.attachInternals;
      }
    },
  };
}
