import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// ---------- Lenis smooth scroll ----------
const lenis = new Lenis({
  duration: 1.15,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1.2,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ---------- Progress bar ----------
const progressBar = document.getElementById('progress-bar') as HTMLDivElement | null;
if (progressBar) {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      progressBar.style.width = `${(self.progress * 100).toFixed(2)}%`;
    },
  });
}

// ---------- Chapter counter ----------
const chapterNum = document.getElementById('chapter-num');
const chapterName = document.getElementById('chapter-name');
const setChapter = (num: string, name: string) => {
  if (chapterNum) chapterNum.textContent = num;
  if (chapterName) chapterName.textContent = name;
};

const chapterEls = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));

function updateChapterByScroll() {
  const middle = window.scrollY + window.innerHeight * 0.4;
  let active: HTMLElement | null = null;
  for (const el of chapterEls) {
    const top = el.offsetTop;
    if (top <= middle) active = el;
  }
  if (active) {
    setChapter(active.dataset.chapterNum || '', active.dataset.chapter || '');
  }
}

ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: updateChapterByScroll,
  onRefresh: updateChapterByScroll,
});
updateChapterByScroll();

// ---------- Split lines / words for reveals ----------
function splitTextIntoLines(el: HTMLElement) {
  if (el.dataset.split === '1') return;
  const text = el.textContent || '';
  const words = text.split(/\s+/).filter(Boolean);
  el.innerHTML = words
    .map((w) => `<span class="word-wrap"><span class="word">${w}</span></span>`)
    .join(' ');
  el.dataset.split = '1';
}

document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
  splitTextIntoLines(el);
});

// inject CSS for word-wrap split
const style = document.createElement('style');
style.textContent = `
  .word-wrap { display: inline-block; overflow: hidden; vertical-align: top; padding: 0 0.05em; margin: 0 -0.05em; }
  .word { display: inline-block; transform: translateY(108%); will-change: transform, opacity; opacity: 0; }
`;
document.head.appendChild(style);

// ---------- Word reveal ----------
document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
  const words = el.querySelectorAll('.word');
  gsap.to(words, {
    y: '0%',
    opacity: 1,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.04,
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
      toggleActions: 'play none none reverse',
    },
  });
});

// ---------- Generic reveals ----------
document.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
  const delay = parseFloat(el.dataset.delay || '0');
  gsap.to(el, {
    y: 0,
    opacity: 1,
    duration: 1.2,
    delay,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
  });
});

// ---------- Parallax backgrounds ----------
document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
  const strength = parseFloat(el.dataset.parallax || '0.3');
  gsap.fromTo(
    el,
    { y: `-${strength * 100}%` },
    {
      y: `${strength * 100}%`,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    }
  );
});

// ---------- Image scale-on-scroll ----------
document.querySelectorAll<HTMLElement>('[data-scale-in]').forEach((el) => {
  gsap.fromTo(
    el,
    { scale: 1.18 },
    {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    }
  );
});

// ---------- Pinned sections with stages ----------
document.querySelectorAll<HTMLElement>('[data-pin]').forEach((section) => {
  const stages = section.querySelectorAll<HTMLElement>('[data-stage]');
  if (stages.length === 0) return;

  // Initial state: only first visible
  stages.forEach((s, i) => {
    gsap.set(s, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 40 });
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${(stages.length) * 100}%`,
      pin: true,
      scrub: 0.8,
      anticipatePin: 1,
    },
  });

  stages.forEach((stage, i) => {
    if (i === 0) return;
    const prev = stages[i - 1];
    tl.to(prev, { opacity: 0, y: -40, duration: 0.4 }, i - 1)
      .to(stage, { opacity: 1, y: 0, duration: 0.5 }, i - 1 + 0.1)
      .to({}, { duration: 0.3 });
  });
});

// ---------- Horizontal scroll ----------
document.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((section) => {
  const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
  if (!track) return;
  const panels = track.querySelectorAll<HTMLElement>('[data-hscroll-panel]');
  if (panels.length === 0) return;

  gsap.to(track, {
    x: () => `-${(panels.length - 1) * 100}vw`,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${(panels.length - 1) * 100}%`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
});

// ---------- Counters ----------
document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
  const end = parseFloat(el.dataset.count || '0');
  const target = { val: 0 };
  gsap.to(target, {
    val: end,
    duration: 2,
    ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 80%' },
    onUpdate: () => {
      el.textContent = Math.round(target.val).toString();
    },
  });
});

ScrollTrigger.refresh();
