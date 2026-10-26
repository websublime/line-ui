/**
 * `LineMachineController` — the Lit `ReactiveController` adapter around
 * `@zag-js/vanilla`'s `VanillaMachine` (D6, spec §6.D.6).
 *
 * Components construct one per host, hand it a Zag machine, and read
 * `state` / `context` / `refs` / `service` from it. Every machine
 * notification calls `host.requestUpdate()`, so the host re-renders on each
 * transition.
 *
 * Host props reach the machine on every host update (Phase 1 plan §5.6 D7,
 * spec §6.C.1). A component declares its machine props as a function of its
 * own properties; the controller passes that function to `VanillaMachine` when
 * it starts the machine and to `updateProps` from `hostUpdate()`, so `watch`
 * trackers re-run and guards read the current values on the next event.
 * Components never call `updateProps` themselves and never send events from
 * `updated()` to carry props. The call sits in `hostUpdate()`, before
 * `update()`, while the host's update is still pending: the
 * `host.requestUpdate()` that `updateProps` triggers through the subscription
 * folds into the running update instead of scheduling another one.
 *
 * Each `updateProps` call wraps the previous props source in one more closure,
 * so a `prop()` read costs more with every host update over an instance's
 * lifetime. The update-rate harness in `__tests__/harness/update-rate.ts`
 * measures that cost against the C21 budget (spec §10 SD18).
 *
 * Failure mode (Manifesto Law 9): if constructing, subscribing, or starting the
 * machine throws, the controller flips `fallback = true`, logs to
 * `console.error`, and requests an update so the template can render a static
 * degraded state. No error reaches the consumer unless
 * `staticFallbackOnFailure` is explicitly `false`.
 *
 * @module machine/line-machine-controller
 */

import type { MachineSchema } from '@zag-js/core';
import { VanillaMachine } from '@zag-js/vanilla';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface LineMachineControllerOptions<T extends MachineSchema> {
  /** Machine config built by the component (e.g. from createMachine(...) or a pre-built Zag machine). */
  machine: ConstructorParameters<typeof VanillaMachine<T>>[0];
  /**
   * Machine props as a function of the host's own properties, e.g.
   * `() => ({ disabled: this.disabled })`. The controller passes it to
   * `VanillaMachine` when the machine starts and to `updateProps` on every
   * host update, so the machine always reads the current host values.
   */
  props?: () => Partial<T['props']>;
  /** When true, swallow start() errors and flip into fallback mode (Manifesto Law 9). Default: true. */
  staticFallbackOnFailure?: boolean;
}

export class LineMachineController<T extends MachineSchema> implements ReactiveController {
  #host: ReactiveControllerHost;
  #vanilla: VanillaMachine<T> | null = null;
  #unsubscribe: VoidFunction | null = null;
  #fallback = false;
  #options: LineMachineControllerOptions<T>;

  constructor(host: ReactiveControllerHost, options: LineMachineControllerOptions<T>) {
    this.#host = host;
    this.#options = options;
    host.addController(this);
  }

  get state() {
    return this.#vanilla?.state;
  }
  get context() {
    return this.#vanilla?.context;
  }
  get refs() {
    return this.#vanilla?.refs;
  }
  get service() {
    return this.#vanilla?.service;
  }
  get fallback() {
    return this.#fallback;
  }

  send(event: Parameters<VanillaMachine<T>['send']>[0]) {
    if (this.#fallback || !this.#vanilla) return;
    this.#vanilla.send(event);
  }

  hostConnected(): void {
    try {
      this.#vanilla = new VanillaMachine(this.#options.machine, this.#options.props);
      this.#unsubscribe = this.#vanilla.subscribe(() => this.#host.requestUpdate());
      this.#vanilla.start();
    } catch (err) {
      if (this.#options.staticFallbackOnFailure !== false) {
        this.#fallback = true;
        // Surface to the inspector / console without throwing at the consumer
        console.error('[line://ui] Machine failed to start — rendering static fallback.', err);
        this.#host.requestUpdate();
      } else {
        throw err;
      }
    }
  }

  /** Pushes the host's current props into the machine before every render (D7). */
  hostUpdate(): void {
    const props = this.#options.props;
    if (this.#fallback || !this.#vanilla || !props) return;
    this.#vanilla.updateProps(props);
  }

  hostDisconnected(): void {
    try {
      this.#unsubscribe?.();
    } finally {
      this.#unsubscribe = null;
    }
    try {
      this.#vanilla?.stop();
    } finally {
      this.#vanilla = null;
    }
  }
}
