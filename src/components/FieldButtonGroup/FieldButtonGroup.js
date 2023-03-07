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
import { ButtonGroup, ValidationError } from '..';
import { Field } from 'react-final-form';

import css from './FieldButtonGroup.module.css';

const FieldButtonGroup = props => {
  const {
    className,
    rootClassName,
    label,
    initialSelect,
    id,
    fields,
    options,
    required,
    meta,
    selectedClassName,
    buttonRootClassName,
    ...rest
  } = props;

  const classes = classNames(rootClassName, css.root);

  const handleOnChange = (input, event) => {
    const { onChange } = input;

    onChange(event);
  };

  return (
    <fieldset className={classes}>
      {label ? (
        <legend style={{ marginBottom: '2rem' }}>
          {label}
          {required ? <span className={css.requiredStar}>*</span> : null}
        </legend>
      ) : null}
      <Field {...rest}>
        {props => {
          const input = props.input;
          return (
            <ButtonGroup
              id={id}
              className={className}
              selectedClassName={selectedClassName}
              options={options}
              {...input}
              onChange={event => handleOnChange(input, event)}
              initialSelect={initialSelect}
              rootClassName={buttonRootClassName}
            />
          );
        }}
      </Field>
      <ValidationError fieldMeta={{ ...meta }} />
    </fieldset>
  );
};

export default FieldButtonGroup;
