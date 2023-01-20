import React, { useEffect } from 'react';

import { Field } from 'react-final-form';

import { FieldCheckbox, InlineTextButton, FieldTextInput, IconClose, ValidationError } from '..';

import css from './FieldOpenCheckboxGroup.module.css';

const OpenCheckboxGroup = props => {
  const { label, options, placeholder, twoColumns, buttonLabel, required, input, meta } = props;

  const additionalValues = input.value && input.value.additional;
  const providedValues = input.value && input.value.provided;

  useEffect(() => {
    input.onChange({ additional: [], provided: [] });
  }, []);

  const handleAddOption = () => {
    const additional = additionalValues ? additionalValues : [];
    additional.push(undefined);
    const provided = providedValues ? providedValues : [];
    input.onChange({ additional, provided });
  };

  const handleDeleteOption = index => {
    const additional = additionalValues ? additionalValues : [];
    additional.splice(index, 1);
    const provided = providedValues ? providedValues : [];
    input.onChange({ additional, provided });
  };

  const showAddButton =
    additionalValues && additionalValues.length !== 0
      ? additionalValues.length < 3 &&
        additionalValues.filter(option => option !== undefined).length !== 0
      : true;

  let error = null;
  if (typeof meta.error === 'string' || meta.error instanceof String) {
    error = {
      touched: meta.touched,
      error: meta.error,
    };
  } else {
    let errorMessage = '';
    for (const key in meta.error) {
      if (meta.error[key]) {
        errorMessage += meta.error[key];
      }
    }
    error = {
      touched: meta.touched,
      error: errorMessage,
    };
  }

  return (
    <fieldset className={css.root}>
      {label ? (
        <legend>
          {label}
          {required ? <span className={css.requiredStar}>*</span> : null}
        </legend>
      ) : null}
      <ul className={css.list}>
        {options.map((option, index) => {
          const fieldId = `${input.name}.${option.key}`;
          return (
            <li key={fieldId} className={css.item}>
              <FieldCheckbox
                id={fieldId}
                name={`${input.name}.provided`}
                label={option.label}
                value={option.key}
                onBlur={() => input.onBlur()}
              />
            </li>
          );
        })}
      </ul>
      <div>
        {additionalValues &&
          additionalValues.map((item, index) => {
            return (
              <div className={css.textInputContainer} key={index}>
                <button
                  className={css.removeExceptionButton}
                  onClick={() => handleDeleteOption(index)}
                  type="button"
                >
                  <IconClose size="normal" className={css.removeIcon} />
                </button>
                <FieldTextInput
                  id={`${input.name}.addiitonal.${index}`}
                  name={`${input.name}.additional.${index}`}
                  className={css.textInput}
                  rootClassName={css.textInputRoot}
                  type="text"
                  placeholder={placeholder}
                  onBlur={() => input.onBlur()}
                />
              </div>
            );
          })}

        {showAddButton && (
          <InlineTextButton rootClassName={css.addOption} onClick={handleAddOption} type="button">
            {buttonLabel}
          </InlineTextButton>
        )}
      </div>
      <ValidationError fieldMeta={{ ...error }} />
    </fieldset>
  );
};

const FieldOpenCheckboxGroup = props => {
  return <Field component={OpenCheckboxGroup} {...props} />;
};

export default FieldOpenCheckboxGroup;
