# Product

## Register

product

## Users

Broad general public, not just tech-savvy early adopters — critically including parents checking UV risk before letting their kids play outside. Used in real outdoor conditions: bright glare, one-handed, often a quick glance rather than a sit-down session. Also used by anyone deciding whether to reapply sunscreen or seek shade during the day.

## Product Purpose

Give a fast, trustworthy read of current UV risk for the user's location, translated into one concrete action ("apply SPF30", "avoid sun 11-16"), backed by cited scientific sources (WHO/IARC/AAD/Skin Cancer Foundation) for anyone who wants to verify the claim. Success is a parent glancing at their phone and immediately knowing whether it's safe to send the kids outside, without needing to interpret a raw number themselves.

## Brand Personality

Modern, minimal, elegant — explicitly not garish/kitsch ("pacchiano") and not generic/boring ("banale"). Scientific credibility without clinical coldness: precise and evidence-backed, but warm and human, not a lab instrument. Calm urgency — this communicates a real, sometimes serious health risk (UV is an IARC Group-1 carcinogen), so the tone should never be alarmist or gimmicky, but it also shouldn't undersell a genuine "stay inside" reading.

## Anti-references

- Generic weather-app chrome (busy dashboards, hourly scroll strips, ad-like widget clutter)
- Neon/garish "wellness app" aesthetics — oversaturated gradients used decoratively
- Flat corporate SaaS look — cold, interchangeable, no point of view
- Cutesy health-app mascots or playful iconography that undercuts the seriousness of the content

## Design Principles

1. **One primary task per screen.** Read the number, understand the risk, know the action — nothing competes with that on the home screen.
2. **The color-to-risk mapping is the product's core signal, not decoration.** It carries real information (WHO's own UV scale); treat it with the same rigor as a warning label, not as a mood gradient.
3. **Calm urgency, not alarmism.** Communicate genuine risk (including "stay indoors") without sirens, panic red flashes, or infantilizing icons.
4. **Speed and legibility over ornamentation.** Most real usage is a two-second outdoor glance in glare — high contrast and a big legible number are functional requirements, not just an aesthetic choice.
5. **Never rely on hue alone.** Risk level must always be legible from text/position, not just color, both for color-blind users and for the same real-world glare/small-screen conditions that make color hard to judge accurately.

## Accessibility & Inclusion

WCAG AA minimum, non-negotiable given the health-safety nature of the content and the outdoor/glare usage context (high contrast is a practical requirement here, not just compliance). Risk level always paired with a text label, never color-only. Standard `prefers-reduced-motion` support throughout.
