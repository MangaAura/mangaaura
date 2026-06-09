# Product

## Register

brand

## Users

**Manga readers and creators** in the Spanish-speaking world, aged 16–35, who:

- Read manga regularly on mobile and desktop
- Want a legal, ad-free alternative with a generous free tier
- Enjoy gamification mechanics (XP, levels, achievements, rankings)
- Want community features — clans, comments, shared reading experiences
- May also create and publish their own manga chapters

Their context: leisure reading sessions at home or on the go. They want immersion (great reader experience), motivation (gamification), and belonging (clans, ranks, events).

## Product Purpose

MangaAura makes manga reading feel like a game. It combines a premium reading experience with an RPG-like progression system — XP for reading, level-ups, Aura currency, achievements, leaderboards, and community competitions — all while providing a platform for creators to publish and monetize their work.

Success looks like: readers who keep coming back because the platform rewards their passion, and creators who build an audience through the community engine.

## Brand Personality

**Playful, dynamic, vibrant** — like a mobile game fused with a premium manga anthology.

- Energetic but not childish. Bright indigo + violet accents carry the energy; clean typography anchors it.
- Generous with micro-interactions and motion — each tap, hover, and scroll should feel responsive and rewarding.
- Approachable and warm, not corporate or cold. The tone is enthusiastic but not juvenile.
- The gamification systems (XP bars, level badges, streaks, leaderboards) are part of the brand voice, not an afterthought.

## Anti-references

- **Generic AI-generated design**: glassmorphism as default, gradient text (`background-clip: text`), identical card grids with icon + heading + text repeated endlessly, numbered section markers (`01 · About / 02 · Process`), tiny uppercase tracked eyebrow (`ABOUT` / `PRICING`) above every section, side-stripe borders, `repeating-linear-gradient` stripe backgrounds, hand-drawn sketchy SVG illustrations
- **Corporate SaaS aesthetic**: muted gray everything, beige/cream backgrounds, soft wide shadows, "empower" / "leverage" / "streamline" marketing copy
- **Over-designed**: no excessive noise, no decorative elements that don't serve a purpose

## Design Principles

1. **Content first, chrome second.** Manga pages are the star. The UI gets out of the way during reading and adds value around it (discovery, library, progression).

2. **Gamification that feels earned.** XP, levels, and Aura should motivate without feeling manipulative. Progress bars, animations, and badge reveals should reward genuine engagement.

3. **Premium without pretension.** Clean editorial typography (Inter Variable), generous whitespace, intentional color — but never stuffy. Approachable quality, not luxury.

4. **Motion with meaning.** Every animation serves a purpose: confirming an action, revealing progress, guiding attention. Reduce-motion is a first-class concern, not an afterthought.

5. **Accessibility is non-negotiable.** WCAG AAA target. Body text contrast ≥7:1, everything navigable by keyboard, screen-reader friendly, no information conveyed by color alone.

## Accessibility & Inclusion

- **Target**: WCAG AAA
- **Contrast**: body text ≥7:1 (even "secondary" text), focused/hover states clear
- **Reduced motion**: every animation has a `prefers-reduced-motion` alternative
- **Keyboard**: all interactive elements reachable and operable by keyboard
- **Screen readers**: semantic HTML, ARIA labels where needed, meaningful link text
- **Color**: never the sole differentiator; patterns, icons, and text accompany color cues
