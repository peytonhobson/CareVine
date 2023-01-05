import React, { useState, useEffect } from 'react';

import classNames from 'classnames';
import { Button } from '../';

import css from './ButtonGroup.module.css';

const ButtonGroup = props => {
  const [selected, setSelected] = useState(props.selected);

  const {
    rootClassName,
    className,
    selectedClassName,
    options,
    initialSelect,
    onChange,
    disabled,
  } = props;

  const rootClass = rootClassName || css.root;

  useEffect(() => {
    setSelected(initialSelect);
    onChange(initialSelect);
  }, [initialSelect]);

  const handleOnChange = key => {
    if (!disabled) {
      setSelected(key);
      onChange(key);
    }
  };

  return (
    <div className={rootClass}>
      {Array.isArray(options) &&
        options.map(option => {
          const isSelected = selected === option.key;
          const buttonClass = classNames({
            [className || css.button]: !isSelected,
            [selectedClassName || css.selected]: isSelected,
          });
          return (
            <Button
              key={option.key}
              className={buttonClass}
              onClick={() => handleOnChange(option.key)}
              type="button"
            >
              {option.label}
            </Button>
          );
        })}
    </div>
  );
};

export default ButtonGroup;
