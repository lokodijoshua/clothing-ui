/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

const GALLERY_IMAGES = [
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104530_521b2f85-c0f3-4d0e-9704-b578315b4cb9.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103711_76ccdb8b-5043-4f47-9c54-4379713393ea.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103728_394f6a1b-85e2-4386-a4f6-408472a0a5b7.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103739_86743e0e-16a7-4bee-bf38-dd67985344dc.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103748_b2215dc8-a3a7-470d-b19a-5b87fa7d0c37.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103758_e919ce72-5c9d-4b87-9be6-d7647b34825c.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103808_013583d0-3386-4547-9832-37c7d8edb3ac.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103937_a0c49d0a-33eb-4ead-aea6-c1baf241acbc.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_103956_d18ed8fd-7b6f-4b86-91f9-20010fe38670.png&w=1920&q=85",
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260629_104034_ba5a9963-87ff-4008-a545-6bd686c088b5.png&w=1920&q=85"
];

// Asymmetric gallery layout generator
function buildLayout(count: number, cols: number): number[][] {
  const rows: number[][] = [];
  let imgIdx = 0;
  let r = 0;
  while (imgIdx < count) {
    const rowCells = Array(cols).fill(-1);
    const a = (r * 2 + (r % 2)) % cols;
    rowCells[a] = imgIdx;
    imgIdx++;

    if (r % 3 === 0 && imgIdx < count) {
      let b = (a + 2) % cols;
      if (b === a) {
        b = (a + 1) % cols;
      }
      rowCells[b] = imgIdx;
      imgIdx++;
    }
    rows.push(rowCells);
    r++;
  }
  return rows;
}

export default function App() {
  const [cols, setCols] = useState(4);
  const [isTouch, setIsTouch] = useState(false);
  const [leftLoaded, setLeftLoaded] = useState(false);
  const [rightLoaded, setRightLoaded] = useState(false);

  // Refs for elements manipulated directly inside RAF for extreme scroll performance
  const scrollSpacerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const leftVideoRef = useRef<HTMLVideoElement>(null);
  const rightVideoRef = useRef<HTMLVideoElement>(null);
  const blackPanelRef = useRef<HTMLDivElement>(null);
  const innerWrapperRef = useRef<HTMLDivElement>(null);
  const outroOverlayRef = useRef<HTMLDivElement>(null);
  const outroInfoRef = useRef<HTMLDivElement>(null);
  const outroBuyRef = useRef<HTMLDivElement>(null);
  const outroFooterRef = useRef<HTMLDivElement>(null);
  const customCursorRef = useRef<HTMLDivElement>(null);

  // Interaction / Tracking refs
  const lastScrollYRef = useRef(0);
  const lastSymbolTimeRef = useRef(0);
  const cursorPositionRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 500
  });
  const cursorVisibleRef = useRef(true);
  const activeSideRef = useRef<"left" | "right">("right");

  // Track layout cols on viewport changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCols(2);
      } else if (width < 1024) {
        setCols(3);
      } else {
        setCols(4);
      }
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set up mouse and pointer tracking for cursor & gaze scrubbing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorPositionRef.current = { x: e.clientX, y: e.clientY };
      cursorVisibleRef.current = true;
    };
    const handleMouseEnter = () => {
      cursorVisibleRef.current = true;
    };
    const handleMouseLeave = () => {
      cursorVisibleRef.current = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        cursorPositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Videos must never autoplay - keep strictly in paused state and reset to frame 0
  useEffect(() => {
    const leftVideo = leftVideoRef.current;
    const rightVideo = rightVideoRef.current;

    if (leftVideo) {
      leftVideo.pause();
      if (!leftVideo.seeking) leftVideo.currentTime = 0;
    }
    if (rightVideo) {
      rightVideo.pause();
      if (!rightVideo.seeking) rightVideo.currentTime = 0;
    }
  }, [leftLoaded, rightLoaded]);

  // Set up Spacer Height via ResizeObserver to dynamically adapt to gallery content
  useEffect(() => {
    const calculateHeight = () => {
      if (innerWrapperRef.current && scrollSpacerRef.current) {
        const vh = window.innerHeight;
        const wrapHeight = innerWrapperRef.current.scrollHeight;
        const maxScroll = Math.max(0, wrapHeight - vh);
        const spacerHeight = vh + maxScroll + 2 * vh;
        scrollSpacerRef.current.style.height = `${spacerHeight}px`;
      }
    };

    calculateHeight();

    const resizeObserver = new ResizeObserver(() => {
      calculateHeight();
    });

    if (innerWrapperRef.current) {
      resizeObserver.observe(innerWrapperRef.current);
    }

    window.addEventListener("resize", calculateHeight);
    window.addEventListener("load", calculateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateHeight);
      window.removeEventListener("load", calculateHeight);
    };
  }, [cols]);

  // Unified RequestAnimationFrame Frame Tick Loop
  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (innerWrapperRef.current && blackPanelRef.current) {
        const wrapHeight = innerWrapperRef.current.scrollHeight;
        const maxScroll = Math.max(0, wrapHeight - vh);

        // --- PHASE 1 & 2 SCROLL ENGINE ---
        if (scrollY <= vh) {
          // Phase 1 (First 100vh): Slide black panel up from the bottom
          const panelY = vh - scrollY;
          blackPanelRef.current.style.transform = `translateY(${panelY}px)`;
          innerWrapperRef.current.style.transform = "translateY(0px)";
        } else {
          // Phase 2 (Gallery scroll): Lock black panel and translate inner content up
          blackPanelRef.current.style.transform = "translateY(0px)";
          const pastVh = Math.min(maxScroll, scrollY - vh);
          innerWrapperRef.current.style.transform = `translateY(${-pastVh}px)`;
        }

        // --- VIDEO CPU/GPU USAGE OPTIMIZATION ---
        if (mainCanvasRef.current) {
          if (scrollY >= vh) {
            mainCanvasRef.current.style.visibility = "hidden";
          } else {
            mainCanvasRef.current.style.visibility = "visible";
          }
        }

        // --- GALLERY CARDS SCALING (Viewport Enter/Exit calculations) ---
        const cards = document.querySelectorAll(".bp-card");
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const cardTop = rect.top;
          const cardBottom = rect.bottom;

          if (cardBottom <= 0 || cardTop >= vh) {
            (card as HTMLElement).style.transform = "scale(0)";
          } else {
            const enter = Math.max(0, Math.min(1, (vh - cardTop) / (vh * 0.6)));
            const exit = Math.max(0, Math.min(1, cardBottom / (vh * 0.4)));
            const finalScale = Math.min(enter, exit);
            (card as HTMLElement).style.transform = `scale(${finalScale})`;
          }
        });

        // --- OUTRO OVERLAY & CONTROLS SCROLL PROGRESSION ---
        if (scrollY > vh + maxScroll) {
          const outroScroll = scrollY - (vh + maxScroll);
          const progress = Math.max(0, Math.min(1, outroScroll / (vh - 100)));

          // White background overlay opacity
          if (outroOverlayRef.current) {
            outroOverlayRef.current.style.opacity = progress.toString();
          }

          // Product details slides up
          if (outroInfoRef.current) {
            const isDesktop = window.innerWidth >= 1024;
            const outroOffset = isDesktop ? 166 : 132;
            outroInfoRef.current.style.transform = `translateY(${-(progress * outroOffset)}px)`;
          }

          // View CTA scale & active mouse capture
          if (outroBuyRef.current) {
            outroBuyRef.current.style.transform = `scale(${progress})`;
            outroBuyRef.current.style.pointerEvents = progress > 0.8 ? "auto" : "none";
          }

          // Legal Footer fading
          if (outroFooterRef.current) {
            outroFooterRef.current.style.opacity = progress.toString();
          }
        } else {
          // Reset outro elements gracefully when scrolling backwards
          if (outroOverlayRef.current) {
            outroOverlayRef.current.style.opacity = "0";
          }
          if (outroInfoRef.current) {
            outroInfoRef.current.style.transform = "translateY(0px)";
          }
          if (outroBuyRef.current) {
            outroBuyRef.current.style.transform = "scale(0)";
            outroBuyRef.current.style.pointerEvents = "none";
          }
          if (outroFooterRef.current) {
            outroFooterRef.current.style.opacity = "0";
          }
        }
      }

      // --- RANDOM SYMBOL SCROLL-THROTTLE (80ms) ---
      const currentScrollY = window.scrollY;
      if (currentScrollY !== lastScrollYRef.current) {
        const now = performance.now();
        if (now - lastSymbolTimeRef.current > 80) {
          const symbols = ['8', '$', '^^', '%', '/'];
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
          const symbolEl = document.getElementById("circle-symbol");
          if (symbolEl) {
            symbolEl.innerText = randomSymbol;
          }
          const cursorSymbolEl = document.getElementById("cursor-symbol");
          if (cursorSymbolEl) {
            cursorSymbolEl.innerText = randomSymbol;
          }
          lastSymbolTimeRef.current = now;
        }
        lastScrollYRef.current = currentScrollY;
      }

      // --- CUSTOM CIRCLE CURSOR TRACKING ---
      if (customCursorRef.current && cursorPositionRef.current) {
        customCursorRef.current.style.left = `${cursorPositionRef.current.x}px`;
        customCursorRef.current.style.top = `${cursorPositionRef.current.y}px`;
        customCursorRef.current.style.opacity = cursorVisibleRef.current ? "1" : "0";
      }

      // --- MOUSE-BASED CHARACTER GAZE TRACKING SYSTEM ---
      const leftVideo = leftVideoRef.current;
      const rightVideo = rightVideoRef.current;
      const cursorX = cursorPositionRef.current.x;
      const width = window.innerWidth;
      const centerX = width / 2;
      const deadZone = Math.max(30, width * 0.05);
      const distanceFromCenter = cursorX - centerX;

      if (leftVideo && rightVideo) {
        // Enforce pause state: video is never played autonomously, only interacted with by user
        if (!leftVideo.paused) leftVideo.pause();
        if (!rightVideo.paused) rightVideo.pause();

        if (Math.abs(distanceFromCenter) <= deadZone) {
          // Inside Dead Zone: Character is in the middle looking straight forward
          if (!leftVideo.seeking && leftVideo.currentTime !== 0) leftVideo.currentTime = 0;
          if (!rightVideo.seeking && rightVideo.currentTime !== 0) rightVideo.currentTime = 0;

          if (activeSideRef.current === "left") {
            leftVideo.style.display = "block";
            rightVideo.style.display = "none";
          } else {
            leftVideo.style.display = "none";
            rightVideo.style.display = "block";
          }
        } else if (distanceFromCenter < -deadZone) {
          // Cursor on the LEFT hand side: show leftVideo (character looks left toward the cursor)
          leftVideo.style.display = "block";
          rightVideo.style.display = "none";
          activeSideRef.current = "left";

          const range = centerX - deadZone;
          const dist = (centerX - deadZone) - cursorX;
          const progress = Math.max(0, Math.min(1, dist / range));
          const duration = leftVideo.duration && !isNaN(leftVideo.duration) ? leftVideo.duration : 5.04;
          const targetTime = progress * duration;

          if (!leftVideo.seeking && Math.abs(leftVideo.currentTime - targetTime) > 0.03) {
            leftVideo.currentTime = targetTime;
          }
        } else {
          // Cursor on the RIGHT hand side: show rightVideo (character looks right toward the cursor)
          leftVideo.style.display = "none";
          rightVideo.style.display = "block";
          activeSideRef.current = "right";

          const range = width - (centerX + deadZone);
          const dist = cursorX - (centerX + deadZone);
          const progress = Math.max(0, Math.min(1, dist / range));
          const duration = rightVideo.duration && !isNaN(rightVideo.duration) ? rightVideo.duration : 5.04;
          const targetTime = progress * duration;

          if (!rightVideo.seeking && Math.abs(rightVideo.currentTime - targetTime) > 0.03) {
            rightVideo.currentTime = targetTime;
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [cols, leftLoaded, rightLoaded, isTouch]);

  const layout = buildLayout(GALLERY_IMAGES.length, cols);

  const handleCTAClick = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <div
      id="scroll-spacer"
      ref={scrollSpacerRef}
      className="relative select-none bg-white w-full overflow-x-hidden"
      style={{ height: "500vh" }}
    >
      {/* 1A. Custom Circle Cursor (Matches Archive Collection circle badge) */}
      {!isTouch && (
        <div
          id="custom-cursor"
          ref={customCursorRef}
          className="fixed pointer-events-none z-50 mix-blend-exclusion -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[30px] h-[30px] lg:w-[34px] lg:h-[34px] transition-opacity duration-150"
          style={{
            left: `${cursorPositionRef.current.x}px`,
            top: `${cursorPositionRef.current.y}px`,
            opacity: 1
          }}
        >
          <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full stroke-white fill-none stroke-[2] lg:stroke-[2.5]">
            <circle cx="20" cy="20" r="18.75" />
          </svg>
          <span
            id="cursor-symbol"
            className="font-sans font-medium text-[11px] lg:text-[14px] tracking-[-0.04em] uppercase text-white select-none leading-none pointer-events-none"
          >
            8
          </span>
        </div>
      )}

      {/* 1B. Brand Logo (Top Left Overlay) */}
      <motion.div
        id="prmpt-logo"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0 }}
        className="fixed z-20 pointer-events-none mix-blend-exclusion top-4 left-4 lg:top-8 lg:left-8 w-[124px] sm:w-[266px] lg:w-[355px]"
      >
        <svg viewBox="0 0 355 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-white">
          {/* Letter P */}
          <path d="M30 40 H60 C75 40 85 50 85 65 C85 80 75 90 60 90 H45 V105 H30 V40 Z M45 55 V75 H60 C66 75 70 71 70 65 C70 59 66 55 60 55 H45 Z" fill="currentColor"/>
          {/* Letter R */}
          <path d="M100 40 H130 C145 40 155 50 155 65 C155 75 148 83 138 87 L157 105 H138 L122 88 H115 V105 H100 V40 Z M115 55 V73 H128 C134 73 138 69 138 64 C138 59 134 55 128 55 H115 Z" fill="currentColor"/>
          {/* Letter M */}
          <path d="M170 40 H188 L200 70 L212 40 H230 V105 H215 V65 L203 95 H197 L185 65 V105 H170 V40 Z" fill="currentColor"/>
          {/* Letter P */}
          <path d="M245 40 H275 C290 40 300 50 300 65 C300 80 290 90 275 90 H260 V105 H245 V40 Z M260 55 V75 H275 C281 75 285 71 285 65 C285 59 281 55 275 55 H260 Z" fill="currentColor"/>
          {/* Letter T */}
          <path d="M305 40 H345 V55 H325 V105 H310 V55 H305 V40 Z" fill="currentColor"/>
          {/* Circled R mark ® */}
          <circle cx="345" cy="35" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M343 32 H346 C347.5 32 348 32.5 348 33.5 C348 34.5 347.5 35 346 35 H343 V38 H341 V30 H343 Z M343 31 V33.5 H345.5 C346 33.5 346.5 33 346.5 32.25 C346.5 31.5 346 31 345.5 31 H343 Z" fill="currentColor"/>
        </svg>
      </motion.div>

      {/* 1C. Concept Caption Text (Under Logo) */}
      <motion.p
        id="prmpt-caption"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
        className="fixed z-20 pointer-events-none mix-blend-exclusion text-white font-sans font-medium text-[12px] leading-[140%] tracking-[-0.04em] left-4 lg:left-8 top-[118px] sm:top-[180px] lg:top-[244px] w-[calc(100vw-32px)] sm:w-[calc(50vw-48px)] lg:w-[692px]"
      >
        Interactive mouse-directed gaze. As your cursor moves across the screen, the model tracks your position. Neutral center maintains forward focus.
      </motion.p>

      {/* 1D. Header Navigation Overlay (Top Right) */}
      <motion.div
        id="prmpt-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        className="fixed z-20 pointer-events-none mix-blend-exclusion top-4 right-4 lg:top-8 lg:right-8 w-auto lg:w-[330px] h-[30px] flex items-center justify-between"
      >
        <span className="hidden sm:block font-sans font-medium text-[15px] text-white uppercase tracking-tight">
          ABOUT
        </span>
        <div className="flex items-center gap-5 lg:gap-[50px]">
          {/* Hamburger SVG icon */}
          <svg viewBox="0 0 40 40" className="w-6 h-6 lg:w-[30px] lg:h-[30px] stroke-white stroke-[2.5] fill-none">
            <path d="M0 14H40" />
            <path d="M0 26H40" />
          </svg>
          <span className="font-sans font-medium text-[13px] lg:text-[15px] text-white tracking-tight">
            [ CART ]
          </span>
        </div>
      </motion.div>

      {/* 1G. Dual Video Canvas Background */}
      <div
        id="main-canvas"
        ref={mainCanvasRef}
        className="fixed z-0 overflow-hidden transition-opacity duration-300 pointer-events-none inset-0 w-full h-full"
        style={{ opacity: (leftLoaded || rightLoaded) ? 1 : 0 }}
      >
        <video
          ref={leftVideoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_39ca84eAE1ODL9hbR5VhoEj8tBf/hf_20260625_154433_532a85d3-dabf-4265-b8bd-19ac6af31842.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            setLeftLoaded(true);
            if (leftVideoRef.current) {
              leftVideoRef.current.pause();
              leftVideoRef.current.currentTime = 0;
            }
          }}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ display: "none" }}
        />
        <video
          ref={rightVideoRef}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_39ca84eAE1ODL9hbR5VhoEj8tBf/hf_20260625_154401_a664f076-b971-4557-8728-40ef9ea4c49b.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            setRightLoaded(true);
            if (rightVideoRef.current) {
              rightVideoRef.current.pause();
              rightVideoRef.current.currentTime = 0;
            }
          }}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ display: "block" }}
        />
      </div>

      {/* 1E. Brand Product Details Overlay (Bottom Right) */}
      <motion.div
        id="outro-info"
        ref={outroInfoRef}
        data-outro-offset={isTouch ? 132 : 166}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.45 }}
        className="fixed z-20 pointer-events-none mix-blend-exclusion flex flex-col items-center right-4 bottom-20 lg:right-8 lg:bottom-20 w-[calc(100vw-32px)] sm:w-[330px] lg:w-[330px] max-lg:left-0 max-lg:right-0 max-lg:mx-auto max-lg:bottom-[48px]"
      >
        <div className="flex flex-col items-start w-[252px] lg:w-full mb-3 lg:mb-8">
          {/* Geometric symbol counter */}
          <div className="relative w-5 h-5 lg:w-[30px] lg:h-[30px] flex items-center justify-center mb-1 lg:mb-2">
            <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full stroke-white fill-none stroke-[2] lg:stroke-[2.5]">
              <circle cx="20" cy="20" r="18.75" />
            </svg>
            <span
              id="circle-symbol"
              className="font-sans font-medium text-[10px] lg:text-[15px] tracking-[-0.04em] uppercase text-white"
            >
              8
            </span>
          </div>
          <h2 className="font-sans font-medium text-[20px] lg:text-[30px] leading-[100%] tracking-[-0.04em] uppercase text-white">
            ARCHIVE COLLECTION <br /> "PROMPT"
          </h2>
        </div>
        <div className="font-sans font-medium text-[60px] lg:text-[80px] leading-[100%] tracking-[-0.04em] text-white">
          $97,33
        </div>
      </motion.div>

      {/* SECTION 2: Black Panel Sliding Gallery (Z-INDEX 10) */}
      <div
        id="black-panel"
        ref={blackPanelRef}
        className="fixed inset-0 bg-black z-10 w-full h-full overflow-hidden"
        style={{ transform: "translateY(100vh)" }}
      >
        <div
          id="gallery-inner-wrapper"
          ref={innerWrapperRef}
          className="w-full pt-[40vh] pb-[20vh] transition-transform duration-75 ease-out"
        >
          {/* Scattering Grid Pattern with Columns */}
          <div
            className="grid w-full gap-x-6 md:gap-x-12 gap-y-16 md:gap-y-24 px-6 md:px-12 lg:px-24"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {layout.map((row, rIdx) =>
              row.map((imgIdx, cIdx) => {
                if (imgIdx === -1) {
                  return <div key={`empty-${rIdx}-${cIdx}`} className="aspect-[2/3] w-full" />;
                }

                const imageUrl = GALLERY_IMAGES[imgIdx];
                const isLeftHalf = cIdx < cols / 2;
                const originClass = isLeftHalf ? "origin-bottom-right" : "origin-bottom-left";

                return (
                  <div
                    key={`card-${imgIdx}`}
                    className={`bp-card aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900 transition-transform duration-75 ease-out ${originClass}`}
                    style={{ transform: "scale(0)" }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Archive Fashion model ${imgIdx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 1I. Elegant White Fade Transition Overlay */}
      <div
        id="outro-overlay"
        ref={outroOverlayRef}
        className="fixed inset-0 bg-white pointer-events-none z-12 opacity-0 transition-opacity duration-150"
      />

      {/* 1F. View CTA Action Pill Button */}
      <div
        id="outro-buy"
        ref={outroBuyRef}
        onClick={handleCTAClick}
        className="fixed z-20 pointer-events-none mix-blend-exclusion bg-white rounded-[1335px] flex items-center justify-center origin-bottom-right right-4 bottom-8 lg:right-8 lg:bottom-8 w-[calc(100vw-32px)] lg:w-[330px] h-[100px] lg:h-[174px] cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all duration-150"
        style={{ transform: "scale(0)" }}
      >
        <span className="font-sans font-medium text-[72px] lg:text-[110px] tracking-[-0.04em] text-white mix-blend-exclusion">
          view
        </span>
      </div>

      {/* 1J. Brand Legal Info Footer */}
      <div
        id="outro-footer"
        ref={outroFooterRef}
        className="fixed z-20 pointer-events-none mix-blend-exclusion left-4 bottom-6 lg:left-8 lg:bottom-8 right-4 lg:right-auto flex items-center justify-between lg:justify-start lg:gap-20 opacity-0 transition-opacity duration-300"
      >
        <span className="font-sans font-medium text-[11px] lg:text-[13px] tracking-[-0.02em] uppercase text-white">
          PRMPT ® 2026
        </span>
        <span className="font-sans font-medium text-[11px] lg:text-[13px] tracking-[-0.02em] uppercase text-white select-text cursor-pointer hover:opacity-75">
          PRIVACY POLICY
        </span>
      </div>
    </div>
  );
}
