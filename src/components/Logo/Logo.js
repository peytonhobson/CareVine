import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import IconLogo from './IconLogo';
import css from './Logo.module.css';
import { useCheckMobileScreen } from '../../util/userAgent';

const Logo = props => {
  const { className, format, ...rest } = props;
  const mobileClasses = classNames(css.logoMobile, className);

  const isMobile = useCheckMobileScreen();

  return (
    <IconLogo
      className={!isMobile ? className : mobileClasses}
      format={format}
      isMobile={isMobile}
      {...rest}
    />
  );
};

const { oneOf, string } = PropTypes;

Logo.defaultProps = {
  className: null,
  format: 'desktop',
};

Logo.propTypes = {
  className: string,
  format: oneOf(['desktop', 'mobile', 'hero']),
};

export default Logo;
