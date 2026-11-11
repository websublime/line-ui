// The ./catalog subpath: the descriptor API, the descriptors of the agent-exposed components (§6.G.1), the `line`
// catalog emitters and the `basic` implementation map (§6.G.2), and the frontend-tool emitter (§6.G.3).
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
import { alertDescriptor } from './descriptors/alert.js';
import { badgeDescriptor } from './descriptors/badge.js';
import { buttonDescriptor } from './descriptors/button.js';
import { buttonGroupDescriptor } from './descriptors/button-group.js';
import { chipDescriptor } from './descriptors/chip.js';
import { iconDescriptor } from './descriptors/icon.js';
import { iconButtonDescriptor } from './descriptors/icon-button.js';
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
import {
  type FrontendTool,
  frontendTools,
  TOOL_PROVIDERS,
  type ToolParameters,
  type ToolProperty,
  type ToolProvider,
  type ToolValueType,
} from './tools.js';

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
  TextBinding,
  UrlBinding,
  UrlBindingUse,
} from './descriptor.js';
export type {
  BasicImplementation,
  BasicImplementationMap,
  BasicTarget,
  BasicTextVariant,
  BasicTypeName,
  CatalogJson,
  FrontendTool,
  InlineCatalog,
  LineCapabilities,
  LineCapabilitiesOptions,
  TargetAttributes,
  ToolParameters,
  ToolProperty,
  ToolProvider,
  ToolValueType,
  VersionCapabilities,
};
export {
  ADVERTISED_VERSIONS,
  alertDescriptor,
  BASIC_CATALOG_ID,
  badgeDescriptor,
  basicImplementations,
  buttonDescriptor,
  buttonGroupDescriptor,
  chipDescriptor,
  commonProp,
  componentSchema,
  defineDescriptor,
  frontendTools,
  iconButtonDescriptor,
  iconDescriptor,
  inlineCatalog,
  LINE_CATALOG_ID,
  lineCapabilities,
  lineCatalog,
  lineCatalogDocument,
  separatorDescriptor,
  stackDescriptor,
  TOOL_PROVIDERS,
};

/** Every component descriptor, in catalog-name order. */
export const descriptors: readonly LineDescriptor[] = [
  alertDescriptor,
  badgeDescriptor,
  buttonDescriptor,
  buttonGroupDescriptor,
  chipDescriptor,
  iconDescriptor,
  iconButtonDescriptor,
  separatorDescriptor,
  stackDescriptor,
];
