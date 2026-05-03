"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import { cn } from "@shared/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps {
  texts: string[];
  transition?: MotionProps["transition"];
  initial?: MotionProps["initial"];
  animate?: MotionProps["animate"];
  exit?: MotionProps["exit"];
  animatePresenceMode?: "wait" | "sync" | "popLayout";
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: "characters" | "words" | "lines" | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Splits text into segments using Intl.Segmenter for correct Unicode handling. */
function splitIntoCharacters(text: string): string[] {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/** Splits text into units depending on the splitBy mode. */
function splitText(
  text: string,
  splitBy: RotatingTextProps["splitBy"],
): string[] {
  if (splitBy === "characters") return splitIntoCharacters(text);
  if (splitBy === "words") return text.split(/(\s+)/);
  if (splitBy === "lines") return text.split("\n");
  // Custom separator
  return text.split(splitBy ?? "");
}

/** Computes stagger delay for each element based on direction. */
function getStaggerDelay(
  index: number,
  total: number,
  staggerFrom: RotatingTextProps["staggerFrom"],
  staggerDuration: number,
): number {
  if (staggerFrom === "first") return index * staggerDuration;
  if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
  if (staggerFrom === "center") {
    const center = Math.floor(total / 2);
    return Math.abs(center - index) * staggerDuration;
  }
  if (staggerFrom === "random") return Math.random() * (total * staggerDuration);
  if (typeof staggerFrom === "number") {
    return Math.abs(staggerFrom - index) * staggerDuration;
  }
  return index * staggerDuration;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Cycles through an array of text strings with per-character stagger animation.
 * Exposes next/previous/jumpTo/reset via ref.
 */
export const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: "spring", damping: 25, stiffness: 300 },
      initial = { y: "100%", opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: "-120%", opacity: 0 },
      animatePresenceMode = "wait",
      animatePresenceInitial = false,
      rotationInterval = 2000,
      staggerDuration = 0.025,
      staggerFrom = "last",
      loop = true,
      auto = true,
      splitBy = "characters",
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
    },
    ref,
  ) => {
    const [index, setIndex] = useState(0);

    const next = useCallback(() => {
      setIndex((i) => {
        const next = loop ? (i + 1) % texts.length : Math.min(i + 1, texts.length - 1);
        onNext?.(next);
        return next;
      });
    }, [loop, texts.length, onNext]);

    const previous = useCallback(() => {
      setIndex((i) =>
        loop ? (i - 1 + texts.length) % texts.length : Math.max(i - 1, 0),
      );
    }, [loop, texts.length]);

    const jumpTo = useCallback((idx: number) => {
      setIndex(Math.max(0, Math.min(idx, texts.length - 1)));
    }, [texts.length]);

    const reset = useCallback(() => setIndex(0), []);

    useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }));

    useEffect(() => {
      if (!auto) return;
      const id = setInterval(next, rotationInterval);
      return () => clearInterval(id);
    }, [auto, next, rotationInterval]);

    const elements = splitText(texts[index], splitBy);
    const total = elements.length;

    return (
      <span className={cn("relative inline-flex overflow-hidden", mainClassName)}>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.span
            key={index}
            className={cn("inline-flex", splitLevelClassName)}
            aria-label={texts[index]}
            aria-live="polite"
          >
            {elements.map((char, i) => (
              <motion.span
                key={`${i}-${char}`}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={{
                  ...transition,
                  delay: getStaggerDelay(i, total, staggerFrom, staggerDuration),
                }}
                className={cn("inline-block", elementLevelClassName)}
                style={{ whiteSpace: char === " " ? "pre" : undefined }}
              >
                {char}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  },
);

RotatingText.displayName = "RotatingText";
