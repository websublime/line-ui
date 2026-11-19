import { buttonDescriptor, descriptors, type LineDescriptor } from '@websublime/line-genui/catalog';

// Every line-components component has one descriptor. The catalogs and the tools read only the agent-exposed ones.
export const exposed: readonly LineDescriptor[] = descriptors.filter((descriptor) => descriptor.agentExposed);

// A hidden descriptor carries the reason it stays out of the catalogs and the tools.
export const hidden: readonly { name: string; reason: string }[] = descriptors.flatMap((descriptor) =>
  descriptor.agentExposed ? [] : [{ name: descriptor.name, reason: descriptor.agentHiddenReason }],
);

// The fields of one descriptor: catalog name, tag, prop schema, maps and accessibility requirements.
export const { name, tag, schema, slots, bindings, actions, accessibility } = buttonDescriptor;

// `load()` imports the component subpath, which defines the element. Nothing loads until it runs.
export async function define(descriptor: LineDescriptor): Promise<CustomElementConstructor | undefined> {
  await descriptor.load();
  return customElements.get(descriptor.tag);
}
