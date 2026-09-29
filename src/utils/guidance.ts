// src/utils/guidance.ts
// Shared guidance system: idle detection, wiggle, ghost-hand demo, and pulse cues.

import { getGsapDraggable, isReducedMotion } from './draggableHelper';

export interface GuidanceOptions {
  targetEl: HTMLElement | null;
  pulseEl?: HTMLElement | null;
  ghostHandEl?: HTMLElement | null;
  dragTargetEl?: HTMLElement | null;
  wiggleType?: 'rotation' | 'translateY' | 'translateX' | 'press' | 'cursorBlink' | 'glint';
  ghostHandType?: 'arc' | 'drag' | 'press' | 'type';
  keypadButtons?: NodeListOf<HTMLElement> | HTMLElement[];
  idleDelayMs?: number;
}

export interface GuidanceController {
  start: () => void;
  stop: () => void;
  destroy: () => void;
  resetTimer: () => void;
}

export function initGuidance(options: GuidanceOptions): GuidanceController {
  const {
    targetEl,
    pulseEl,
    ghostHandEl,
    dragTargetEl,
    wiggleType = 'translateY',
    ghostHandType = 'drag',
    keypadButtons,
    idleDelayMs = 3500,
  } = options;

  let idleTimer: any = null;
  let wiggleTween: any = null;
  let ghostTimeline: any = null;
  let isDestroyed = false;
  let ghostHandShown = false;
  let gsapInstance: any = null;

  // Reduced motion abort
  if (isReducedMotion()) {
    return {
      start: () => {},
      stop: () => {},
      destroy: () => {},
      resetTimer: () => {},
    };
  }

  // Load GSAP instance asynchronously
  getGsapDraggable().then(({ gsap }) => {
    if (isDestroyed) return;
    gsapInstance = gsap;
    resetTimer();
  });

  function start() {
    if (isDestroyed || !gsapInstance || !targetEl) return;

    // 1. Pulse cue
    if (pulseEl) {
      pulseEl.classList.add('cc-guidance-pulsing');
    }

    // 2. Target Wiggle
    if (!wiggleTween) {
      if (wiggleType === 'rotation') {
        wiggleTween = gsapInstance.to(targetEl, {
          rotation: 16,
          duration: 0.3,
          yoyo: true,
          repeat: 3,
          ease: 'power1.inOut',
          onComplete: () => {
            gsapInstance.to(targetEl, { rotation: 0, duration: 0.2 });
            wiggleTween = null;
          }
        });
      } else if (wiggleType === 'translateX') {
        wiggleTween = gsapInstance.to(targetEl, {
          x: 14,
          duration: 0.28,
          yoyo: true,
          repeat: 3,
          ease: 'power1.inOut',
          onComplete: () => {
            gsapInstance.to(targetEl, { x: 0, duration: 0.2 });
            wiggleTween = null;
          }
        });
      } else if (wiggleType === 'translateY') {
        wiggleTween = gsapInstance.to(targetEl, {
          y: -14,
          duration: 0.3,
          yoyo: true,
          repeat: 3,
          ease: 'power1.inOut',
          onComplete: () => {
            gsapInstance.to(targetEl, { y: 0, duration: 0.2 });
            wiggleTween = null;
          }
        });
      } else if (wiggleType === 'press') {
        wiggleTween = gsapInstance.to(targetEl, {
          rotation: 10,
          scale: 0.95,
          duration: 0.22,
          yoyo: true,
          repeat: 2,
          ease: 'power1.inOut',
          onComplete: () => {
            gsapInstance.to(targetEl, { rotation: 0, scale: 1, duration: 0.2 });
            wiggleTween = null;
          }
        });
      } else if (wiggleType === 'cursorBlink') {
        targetEl.classList.add('cc-cursor-rapid-blink');
        setTimeout(() => {
          targetEl?.classList.remove('cc-cursor-rapid-blink');
          wiggleTween = null;
        }, 1800);
      } else if (wiggleType === 'glint') {
        const glintEl = targetEl.querySelector('.cc-loupe-glint') || targetEl;
        wiggleTween = gsapInstance.to(glintEl, {
          opacity: 0.9,
          scale: 1.15,
          duration: 0.35,
          yoyo: true,
          repeat: 3,
          ease: 'power1.inOut',
          onComplete: () => {
            gsapInstance.set(glintEl, { clearProps: 'opacity,scale' });
            wiggleTween = null;
          }
        });
      }
    }

    // 3. Ghost Hand animation
    if (!ghostHandShown && ghostHandEl && gsapInstance) {
      ghostHandShown = true;
      if (ghostTimeline) ghostTimeline.kill();

      ghostTimeline = gsapInstance.timeline();

      if (ghostHandType === 'arc') {
        // Arc trace for rotation knob
        ghostTimeline
          .set(ghostHandEl, { opacity: 0, x: -20, y: -20, rotation: -20 })
          .to(ghostHandEl, { opacity: 0.9, duration: 0.3 })
          .to(ghostHandEl, {
            x: 20,
            y: 20,
            rotation: 40,
            duration: 1.2,
            ease: 'power2.inOut'
          })
          .to(ghostHandEl, { opacity: 0, duration: 0.35 }, '+=0.2');

      } else if (ghostHandType === 'drag' && dragTargetEl) {
        // Linear drag to target dropzone
        const tRect = targetEl.getBoundingClientRect();
        const dRect = dragTargetEl.getBoundingClientRect();
        const deltaX = (dRect.left + dRect.width / 2) - (tRect.left + tRect.width / 2);
        const deltaY = (dRect.top + dRect.height / 2) - (tRect.top + tRect.height / 2);

        ghostTimeline
          .set(ghostHandEl, { opacity: 0, x: 0, y: 0 })
          .to(ghostHandEl, { opacity: 0.9, duration: 0.3 })
          .to(ghostHandEl, {
            x: deltaX * 0.75,
            y: deltaY * 0.75,
            duration: 1.2,
            ease: 'power2.inOut'
          })
          .to(ghostHandEl, { opacity: 0, duration: 0.35 }, '+=0.2');

      } else if (ghostHandType === 'press') {
        // Tap/press gesture
        ghostTimeline
          .set(ghostHandEl, { opacity: 0, y: -10, scale: 1 })
          .to(ghostHandEl, { opacity: 0.9, y: 0, duration: 0.3 })
          .to(ghostHandEl, { scale: 0.85, duration: 0.2, yoyo: true, repeat: 1 })
          .to(ghostHandEl, { opacity: 0, duration: 0.3 }, '+=0.3');

      } else if (ghostHandType === 'type' && keypadButtons && keypadButtons.length) {
        // Typing demo (taps 1, 0, 1)
        ghostTimeline
          .set(ghostHandEl, { opacity: 0 })
          .to(ghostHandEl, { opacity: 0.9, duration: 0.3 })
          .to(ghostHandEl, { x: 0, y: 0, duration: 0.3 })
          .to(ghostHandEl, { scale: 0.8, duration: 0.15, yoyo: true, repeat: 1 })
          .to(ghostHandEl, { opacity: 0, duration: 0.3 }, '+=0.2');
      }
    }
  }

  function stop() {
    if (pulseEl) pulseEl.classList.remove('cc-guidance-pulsing');
    if (targetEl) targetEl.classList.remove('cc-cursor-rapid-blink');

    if (wiggleTween) {
      wiggleTween.kill();
      wiggleTween = null;
      if (gsapInstance && targetEl) {
        gsapInstance.set(targetEl, { clearProps: 'transform' });
      }
    }

    if (ghostTimeline) {
      ghostTimeline.kill();
      ghostTimeline = null;
      if (gsapInstance && ghostHandEl) {
        gsapInstance.set(ghostHandEl, { opacity: 0, x: 0, y: 0 });
      }
    }
  }

  function resetTimer() {
    stop();
    if (idleTimer) clearTimeout(idleTimer);
    if (isDestroyed) return;

    idleTimer = setTimeout(() => {
      start();
    }, idleDelayMs);
  }

  // Interactivity resets timer
  const events = ['mousedown', 'touchstart', 'keydown'];
  const onUserActivity = () => { resetTimer(); };
  events.forEach((evt) => window.addEventListener(evt, onUserActivity, { passive: true }));

  // Cleanup on cc:channel-jump
  const onJump = () => { destroy(); };
  document.addEventListener('cc:channel-jump', onJump);

  function destroy() {
    isDestroyed = true;
    if (idleTimer) clearTimeout(idleTimer);
    stop();
    events.forEach((evt) => window.removeEventListener(evt, onUserActivity));
    document.removeEventListener('cc:channel-jump', onJump);
  }

  return {
    start,
    stop,
    destroy,
    resetTimer,
  };
}
