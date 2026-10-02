/**
 * Recording fake `ElementInternals` for the FormAssociated unit tier (spec §6.D.5, AM-032).
 * happy-dom 20.10.5 has no `attachInternals`, so the mixin's constructor needs this one.
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

/** Installs a fake `HTMLElement.prototype.attachInternals` (happy-dom has none); `restore()` removes it. */
export function installElementInternals() {
  const proto: { attachInternals?: () => ElementInternals } = HTMLElement.prototype;
  const created: FakeInternals[] = [];
  proto.attachInternals = function (this: HTMLElement) {
    const fake = new FakeInternals(this);
    created.push(fake);
    return fake as unknown as ElementInternals;
  };
  return { created, restore: () => delete proto.attachInternals };
}
