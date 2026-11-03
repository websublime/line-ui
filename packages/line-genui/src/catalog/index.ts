// The ./catalog subpath: the descriptor API and the descriptors of the agent-exposed components (§6.G.1).
import { commonProp, componentSchema, defineDescriptor, type LineDescriptor } from './descriptor.js';
import { buttonDescriptor } from './descriptors/button.js';
import { iconDescriptor } from './descriptors/icon.js';
import { separatorDescriptor } from './descriptors/separator.js';
import { stackDescriptor } from './descriptors/stack.js';

export type {
  AccessibilityRequirements,
  ActionMap,
  AgentExposure,
  Binding,
  BindingMap,
  CommonTypeName,
  DescriptorFields,
  DescriptorInit,
  DescriptorSchema,
  ElementMember,
  HostNaming,
  LineDescriptor,
  NameSource,
  SlotMap,
  SurfaceLookup,
} from './descriptor.js';
export {
  buttonDescriptor,
  commonProp,
  componentSchema,
  defineDescriptor,
  iconDescriptor,
  separatorDescriptor,
  stackDescriptor,
};

/** Every component descriptor, in catalog-name order. */
export const descriptors: readonly LineDescriptor[] = [
  buttonDescriptor,
  iconDescriptor,
  separatorDescriptor,
  stackDescriptor,
];
