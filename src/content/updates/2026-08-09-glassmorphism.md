---
title: "Exploring Glassmorphism"
date: 2026-08-09
location: "Coffee Shop, NYC"
excerpt: "Tinkering with CSS backdrop-filter to get that perfect frosted glass look."
---
# Perfecting the Glass

To make the Chronicle Pulse look premium, the cards need to have a tactile feel. I'm experimenting with:

```css
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
```

### The result?
A very sleek, futuristic UI that feels at home with the rest of the CRT aesthetic, but adds a modern twist. I also want to add a subtle 3D tilt effect on hover. That will make it really pop!
