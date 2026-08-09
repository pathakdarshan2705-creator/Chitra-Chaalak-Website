---
title: "The Morphing Modal"
date: 2026-08-10
location: "Home Studio"
excerpt: "Getting the transition right from a small card to a full screen canvas."
---
# The Magic Trick

The most challenging part of this new design is the transition. When you click a card, it shouldn't just disappear and a new window pops up. 

It needs to **morph**.

I am looking into using the FLIP (First, Last, Invert, Play) technique for the animation.

> **Note:** The key is to grab the bounding client rect of the card when it's clicked, and then animate the modal from those coordinates to the center of the screen.

Wish me luck!
