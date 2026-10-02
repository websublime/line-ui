// Icon names are lowercase kebab-case, so a name cannot leave the icon directory.
const ICON_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertIconName(name: string): void {
  if (!ICON_NAME.test(name)) throw new Error(`[line-icons] Invalid icon name "${name}".`);
}
