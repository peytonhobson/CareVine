import React, { useState } from 'react';

import { Menu, MenuContent, MenuItem, MenuLabel } from '../../components';
import classNames from 'classnames';

import css from './FilterByMenu.module.css';

const optionLabel = (options, key) => {
  const option = options.find(o => o.key === key);
  return option ? option.label : key;
};

const FilterByMenu = props => {
  const {
    initialValue,
    options,
    label,
    contentPlacementOffset,
    onSelect,
    className,
    rootClassName,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(initialValue);

  const selectOption = value => {
    setIsOpen(false);
    setSelectedValue(value);
    onSelect(value);
  };

  const menuLabel = initialValue ? optionLabel(options, selectedValue) : label;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <Menu
      useArrow={false}
      contentPlacementOffset={contentPlacementOffset}
      onToggleActive={isOpen => setIsOpen(isOpen)}
      isOpen={isOpen}
      className={classes}
    >
      <MenuLabel className={css.menuLabel}>
        {/* TODO: Insert Icon */}
        Filter By: {menuLabel}
      </MenuLabel>
      <MenuContent className={css.menuContent}>
        <MenuItem key="filter-by">
          <h4 className={css.menuHeading}>{label}</h4>
        </MenuItem>
        {options.map(option => {
          // check if this option is selected
          const selected = selectedValue === option.key;
          // menu item border class
          const menuItemBorderClass = selected ? css.menuItemBorderSelected : css.menuItemBorder;

          return (
            <MenuItem key={option.key}>
              <button
                className={css.menuItem}
                disabled={option.disabled}
                onClick={() => (selected ? null : selectOption(option.key))}
              >
                <span className={menuItemBorderClass} />
                {option.label}
              </button>
            </MenuItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
};

export default FilterByMenu;
