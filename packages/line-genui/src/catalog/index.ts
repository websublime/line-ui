// The ./catalog subpath: the descriptor API, the descriptors of the agent-exposed components (§6.G.1), the `line`
// catalog emitters and the `basic` implementation map (§6.G.2).
import {
  BASIC_CATALOG_ID,
  type BasicImplementation,
  type BasicImplementationMap,
  type BasicTarget,
  type BasicTextVariant,
  type BasicTypeName,
  basicImplementations,
  type TargetAttributes,
} from './basic.js';
import { commonProp, componentSchema, defineDescriptor, type LineDescriptor } from './descriptor.js';
import { buttonDescriptor } from './descriptors/button.js';
import { iconDescriptor } from './descriptors/icon.js';
import { separatorDescriptor } from './descriptors/separator.js';
import { stackDescriptor } from './descriptors/stack.js';
import {
  ADVERTISED_VERSIONS,
  type CatalogJson,
  type InlineCatalog,
  inlineCatalog,
  LINE_CATALOG_ID,
  type LineCapabilities,
  type LineCapabilitiesOptions,
  lineCapabilities,
  lineCatalog,
  lineCatalogDocument,
  type VersionCapabilities,
} from './line.js';

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
export type {
  BasicImplementation,
  BasicImplementationMap,
  BasicTarget,
  BasicTextVariant,
  BasicTypeName,
  CatalogJson,
  InlineCatalog,
  LineCapabilities,
  LineCapabilitiesOptions,
  TargetAttributes,
  VersionCapabilities,
};
export {
  ADVERTISED_VERSIONS,
  BASIC_CATALOG_ID,
  basicImplementations,
  buttonDescriptor,
  commonProp,
  componentSchema,
  defineDescriptor,
  iconDescriptor,
  inlineCatalog,
  LINE_CATALOG_ID,
  lineCapabilities,
  lineCatalog,
  lineCatalogDocument,
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
