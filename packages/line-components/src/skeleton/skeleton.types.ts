/** The shape of each `<line-skeleton>` item: `rect` a block, `circle` an avatar or an icon, `text` a line of text. */
export type SkeletonShape = 'rect' | 'circle' | 'text';

/** The motion of `<line-skeleton>`: `pulse` fades in and out, `wave` sweeps a band across, `none` stays still. */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';
