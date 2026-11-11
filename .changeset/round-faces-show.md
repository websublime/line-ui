---
"@websublime/line-components": patch
"@websublime/line-genui": minor
---

Add `<line-avatar>` at `@websublime/line-components/avatar`, a picture, logo or initials that stand for a person or an organisation: `src` draws the picture once it loads, the `fallback` slot or the initials of `name` show while it loads, fails or is missing, custom media such as a `<picture>` goes in the default slot, and a `status` slot places a presence marker that is read after the avatar's name. It reflects `data-loading` and `data-error`, is an image named by `name` or the host `aria-label` and is decorative without one, and reads every `--line-avatar-*` token with a fallback so a container sizes and rings it by inheritance. The `line` A2UI catalog, `catalog.json` and the frontend tools of `@websublime/line-genui/catalog` gain `Avatar`; a descriptor binds a URL prop through the new URL binding (`{ kind: 'url', use, name }`), which the surface runs through its URL policy; and a basic catalog `Image` with `variant: "avatar"` renders `<line-avatar>`, with `url` as `src` behind the same policy and `description` as `name`.
