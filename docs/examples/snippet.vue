<!-- shots: 2 3 -->
<template lang="pug">
Deck
  Slide
    h2 A debug filter
    Snippet(file="DebugFilter.java" :highlights='{ "1": 2, "6-8:isDebug+++MDC.put": 3 }')
</template>
