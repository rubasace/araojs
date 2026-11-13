<template lang="pug">
Deck(duration="20m")
  template(#footer="{ number, total }")
    span VigoJUG · 2026
    span {{ number }} / {{ total }}

  Slide(layout="cover")
    .bar
    h1 Building a framework
    p.muted Jane Doe · VigoJUG 2026
    Notes
      p Hello! Ask who has copied a config between two services this month.

  Slide
    h2 What we wanted
    ul
      li #[Icon.done(name="lucide:circle-check")] Same defaults in every service
      li(v-step="2") #[Icon.done(name="lucide:circle-check")] Logging and metrics for free
      li(v-step="3") #[Icon.done(name="lucide:circle-check")] Upgrades in one place
    Notes
      p Start with the story of the twelve logging setups.
      p(v-step="2") Metrics: nobody asked for them, everybody used them.
      p(v-step="3") Upgrades: one version to bump, once.

  Slide(title="A debug filter")
    h2 A debug filter
    Snippet(file="DebugFilter.java" :highlights='{ "1": 2, "6-8:isDebug+++MDC.put": 3 }')
    Notes
      p Read the class name aloud, then let the highlights lead.

  Slide
    h2 Five pillars
    Grid(ratio="2:1" gap="sm")
      Center.card(v-for="p in pillars" :key="p.icon")
        Icon(:name="p.icon" size="88")
        p {{ p.name }}
    Notes
      p One sentence per pillar; details in the Q&A.

  Slide(layout="section")
    h1 Thanks!
</template>

<script setup>
const pillars = [
  { icon: 'lucide:scroll-text', name: 'Logging' },
  { icon: 'lucide:gauge', name: 'Metrics' },
  { icon: 'lucide:waypoints', name: 'Tracing' },
  { icon: 'lucide:plug', name: 'Clients' },
  { icon: 'lucide:shield-check', name: 'Security' },
]
</script>

<style scoped>
.done, .card .ar-icon { color: var(--ar-accent); }
.card { background: color-mix(in srgb, var(--ar-fg) 6%, var(--ar-bg)); border-radius: var(--ar-radius); }
</style>
