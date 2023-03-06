export const isMobileSafari = () => {
  if (!window) {
    return false;
  }

  // https://stackoverflow.com/a/29696509
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);

  // If iOS Chrome needs to be separated, use `!ua.match(/CriOS/i)` as
  // an extra condition.
  return iOS && webkit;
};

export const isIOS = () => {
  return (
    (/iPad|iPhone|iPod/.test(window.navigator.platform) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) &&
    !window.MSStream
  );
};
