// Public re-exports — single import surface for component authors.
// Four of the five values @zag-js/vanilla exports; toStyleString is left out (Phase 00 spec AM-073):
export { type Attrs, mergeProps, normalizeProps, spreadProps, VanillaMachine } from '@zag-js/vanilla';
export { LineMachineController, type LineMachineControllerOptions } from './line-machine-controller.js';
