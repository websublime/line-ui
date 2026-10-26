// biome-ignore lint/performance/noBarrelFile: the subpath must re-export the root by self-reference, so it shares the root's INTERNALS Symbol (spec §6.C.2, AM-050).
export { FormAssociated, type FormAssociatedMembers } from '@websublime/line-core';
