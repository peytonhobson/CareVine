import React, { useEffect, useState } from 'react';

export const useCheckMobileScreen = () => {
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

export const isMobileSafari = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  // https://stackoverflow.com/a/29696509
  const ua = window?.navigator?.userAgent;
  const iOS = !!ua?.match(/iPad/i) || !!ua?.match(/iPhone/i);
  const webkit = !!ua?.match(/WebKit/i);

  // If iOS Chrome needs to be separated, use `!ua.match(/CriOS/i)` as
  // an extra condition.
  return iOS && webkit;
};

export const isIOS = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    (/iPad|iPhone|iPod/.test(window?.navigator?.platform) ||
      (window?.navigator?.platform === 'MacIntel' && window?.navigator?.maxTouchPoints > 1)) &&
    !window?.MSStream
  );
};
