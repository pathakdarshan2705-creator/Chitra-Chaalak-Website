// src/utils/draggableHelper.ts
// Shared loader and utilities for GSAP Draggable across Chitra Chaalak interactions

export interface GsapDraggableBundle {
  gsap: any;
  Draggable: any;
}

let cachedBundle: Promise<GsapDraggableBundle> | null = null;

export function getGsapDraggable(): Promise<GsapDraggableBundle> {
  if (cachedBundle) return cachedBundle;

  cachedBundle = (async () => {
    const [gsapMod, draggableMod] = await Promise.all([
      import('gsap'),
      import('gsap/Draggable.js')
    ]);

    const gsap = gsapMod.gsap || gsapMod.default || gsapMod;
    const Draggable = draggableMod.Draggable || draggableMod.default || draggableMod;

    gsap.registerPlugin(Draggable);
    return { gsap, Draggable };
  })();

  return cachedBundle;
}

export function isReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function springBack(gsap: any, target: HTMLElement, onComplete?: () => void) {
  return gsap.to(target, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 0.38,
    ease: 'back.out(1.4)',
    onComplete
  });
}
