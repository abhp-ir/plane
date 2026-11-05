# Frimousse 0.3.0

The patch adds `fa` to the runtime locale allowlist and public TypeScript unions. The picker uses its existing loading, caching, search and skin-tone behavior with the local Persian data. Other locales retain their defaults.

Keyboard handling attaches to the picker root so it works inside Plane's popover without leaking shortcuts to the rest of the app. Horizontal movement follows the root's actual direction; emoji values and vertical movement are unchanged. Remove these patches when upstream supports the same behavior.

On a locale change, the data handler clears stale rendered data before paint until matching data arrives. This prevents old accessible names from surviving memoized rows, while preserving the root's search and skin-tone state.
Locale changes notify subscribers synchronously from the existing layout effect; ordinary search, pointer and skin-tone updates retain frame batching.

The matching `public/emojibase/fa` data in web, admin and Space preserves the identifiers, groups and skin variants of `emojibase-data@18.0.0`. Persian names and search keywords come from Unicode CLDR 49, commit `96e54b273d2da4ec6fbad350ba19ff23fa24a588`. English search aliases remain available. Variant keywords are also searchable through their base emoji.

Keep the three public copies synchronized. Their complete MIT and Unicode notices are included beside the data. Data and messages must be updated together so subgroup orders continue to match.
