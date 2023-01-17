/*
 * Renders a group of checkboxes that can be used to select
 * multiple values from a set of options.
 *
 * The corresponding component when rendering the selected
 * values is PropertyGroup.
 *
 */

import React, { useState, useEffect } from 'react';
import { arrayOf, bool, node, shape, string } from 'prop-types';
import classNames from 'classnames';
import { FieldArray } from 'react-final-form-arrays';
import { FieldRadioButton, ValidationError } from '..';

import css from './FieldRadioButtonGroup.module.css';

const FieldRadioButtonRenderer = props => {
  const { className, rootClassName, label, id, fields, options, required, meta, ...rest } = props;

  const { initialSelect, inline } = props;

  const classes = classNames(rootClassName, inline ? css.inlineRoot : css.root);
  const listClasses = className || (inline ? css.inlineList : css.list);
  const itemClasses = inline ? css.inlineItem : css.item;

  return (
    <fieldset className={classes}>
      {label ? (
        <legend>
          {label}
          {required ? <span className={css.requiredStar}>*</span> : null}
        </legend>
      ) : null}
      <ul className={listClasses}>
        {options.map((option, index) => {
          const fieldId = `${id}.${option.key}`;
          return (
            <li key={fieldId} className={itemClasses}>
              <FieldRadioButton
                id={fieldId.concat(index)}
                name={fields.name}
                label={option.label}
                value={option.key}
                showAsRequired={false}
              />
            </li>
          );
        })}
      </ul>
      <ValidationError fieldMeta={{ ...meta }} />
    </fieldset>
  );
};

FieldRadioButtonRenderer.defaultProps = {
  rootClassName: null,
  className: null,
  label: null,
};

FieldRadioButtonRenderer.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  label: node,
  options: arrayOf(
    shape({
      key: string.isRequired,
      label: node.isRequired,
    })
  ).isRequired,
};

const FieldRadioButtonGroup = props => (
  <FieldArray component={FieldRadioButtonRenderer} {...props} />
);

// Name and component are required fields for FieldArray.
// Component-prop we define in this file, name needs to be passed in
FieldRadioButtonGroup.propTypes = {
  name: string.isRequired,
};

export default FieldRadioButtonGroup;
