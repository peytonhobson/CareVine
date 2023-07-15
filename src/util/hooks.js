import React, { useEffect, useState, useRef } from 'react';

export const useCheckMobileScreen = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  const [width, setWidth] = useState(window.innerWidth);
  const handleWindowSizeChange = () => {
    setWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    };
  }, []);

  return width <= 768;
};

export const usePrevious = value => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useIsScrollable = ref => {
  if (ref && ref.current) {
    return ref.current.scrollHeight > ref.current.clientHeight;
  }
  return false;
};

export const useIsSsr = () => {
  // we always start off in "SSR mode", to ensure our initial browser render
  // matches the SSR render
  const [isSsr, setIsSsr] = useState(true);

  useEffect(() => {
    // `useEffect` never runs on the server, so we must be on the client if
    // we hit this block
    setIsSsr(false);
  }, []);

  return isSsr;
};
