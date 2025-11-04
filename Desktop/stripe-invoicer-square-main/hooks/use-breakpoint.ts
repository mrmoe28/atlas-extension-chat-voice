/**
 * RESPONSIVE: useBreakpoint Hook
 *
 * Provides JavaScript-based responsive behavior using matchMedia
 * Enables component-level breakpoint detection
 *
 * @example
 * const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
 *
 * if (isMobile) {
 *   return <MobileComponent />;
 * }
 */

import { useEffect, useState } from "react";

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface BreakpointState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
}

const breakpoints = {
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => getBreakpointState());

  useEffect(() => {
    const mediaQueries = Object.entries(breakpoints).map(([key, value]) => ({
      key: key as Breakpoint,
      query: window.matchMedia(`(min-width: ${value}px)`),
    }));

    const handleChange = () => {
      setState(getBreakpointState());
    };

    mediaQueries.forEach(({ query }) => {
      query.addEventListener("change", handleChange);
    });

    return () => {
      mediaQueries.forEach(({ query }) => {
        query.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return state;
}

function getBreakpointState(): BreakpointState {
  if (typeof window === "undefined") {
    return {
      breakpoint: "lg",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: true,
      isXl: false,
      is2xl: false,
    };
  }

  const width = window.innerWidth;
  let breakpoint: Breakpoint = "xs";

  if (width >= breakpoints["2xl"]) {
    breakpoint = "2xl";
  } else if (width >= breakpoints.xl) {
    breakpoint = "xl";
  } else if (width >= breakpoints.lg) {
    breakpoint = "lg";
  } else if (width >= breakpoints.md) {
    breakpoint = "md";
  } else if (width >= breakpoints.sm) {
    breakpoint = "sm";
  }

  const isMobile = width < breakpoints.md; // < 768px
  const isTablet = width >= breakpoints.md && width < breakpoints.lg; // 768px - 1023px
  const isDesktop = width >= breakpoints.lg; // >= 1024px

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isXs: breakpoint === "xs",
    isSm: breakpoint === "sm",
    isMd: breakpoint === "md",
    isLg: breakpoint === "lg",
    isXl: breakpoint === "xl",
    is2xl: breakpoint === "2xl",
  };
}
