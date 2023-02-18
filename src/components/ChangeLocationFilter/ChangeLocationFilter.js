import React, { Component } from 'react';
import { array, arrayOf, func, node, number, object, string } from 'prop-types';
import classNames from 'classnames';
import { injectIntl, intlShape } from '../../util/reactIntl';
import { parseSelectFilterOptions } from '../../util/search';
import { FieldCheckbox } from '..';
import { LocationAutocompleteInputField } from '..';
import {
  composeValidators,
  autocompletePlaceSelected,
  autocompleteSearchRequired,
} from '../../util/validators';

import { FilterPopup, FilterPlain } from '..';
import css from './ChangeLocationFilter.module.css';

const identity = v => v;

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

// Format URI component's query param: { pub_key: 'has_all:a,b,c' }
const format = (selectedOptions, queryParamName, searchMode) => {
  const hasOptionsSelected = selectedOptions && selectedOptions.length > 0;
  const mode = searchMode ? `${searchMode}:` : '';
  const value = hasOptionsSelected ? `${mode}${selectedOptions.join(',')}` : null;
  return { [queryParamName]: value };
};

class ChangeLocationFilter extends Component {
  constructor(props) {
    super(props);

    this.filter = null;
    this.filterContent = null;

    this.positionStyleForContent = this.positionStyleForContent.bind(this);
  }

  positionStyleForContent() {
    if (this.filter && this.filterContent) {
      // Render the filter content to the right from the menu
      // unless there's no space in which case it is rendered
      // to the left
      const distanceToRight = window.innerWidth - this.filter.getBoundingClientRect().right;
      const labelWidth = this.filter.offsetWidth;
      const contentWidth = this.filterContent.offsetWidth;
      const contentWidthBiggerThanLabel = contentWidth - labelWidth;
      const renderToRight = distanceToRight > contentWidthBiggerThanLabel;
      const contentPlacementOffset = this.props.contentPlacementOffset;

      const offset = renderToRight
        ? { left: contentPlacementOffset }
        : { right: contentPlacementOffset };
      // set a min-width if the content is narrower than the label
      const minWidth = contentWidth < labelWidth ? { minWidth: labelWidth } : null;

      return { ...offset, ...minWidth };
    }
    return {};
  }

  render() {
    const {
      rootClassName,
      className,
      id,
      name,
      label,
      options,
      initialValues,
      contentPlacementOffset,
      onSubmit,
      queryParamNames,
      searchMode,
      intl,
      showAsPopup,
      ...rest
    } = this.props;

    const classes = classNames(rootClassName || css.root, className);

    // Address Text Field
    const addressTitleRequiredMessage = intl.formatMessage({
      id: 'ChangeLocationFilter.addressLabel',
    });
    const addressPlaceholderMessage = intl.formatMessage({
      id: 'EditListingLocationForm.addressPlaceholder',
    });
    const addressRequiredMessage = intl.formatMessage({
      id: 'EditListingLocationForm.addressRequired',
    });
    const addressNotRecognizedMessage = intl.formatMessage({
      id: 'EditListingLocationForm.addressNotRecognized',
    });

    const queryParamName = 'location';
    const hasInitialValues = !!initialValues && !!initialValues[queryParamName];
    // Parse options from param strings like "has_all:a,b,c" or "a,b,c"

    const labelForPopup = hasInitialValues
      ? intl.formatMessage({ id: 'ChangeLocationFilter.labelSelected' })
      : 'Change Location';

    const labelForPlain = hasInitialValues
      ? intl.formatMessage({ id: 'ChangeLocationFilterPlainForm.labelSelected' })
      : 'Change Location';

    const contentStyle = this.positionStyleForContent();

    const initialValue = initialValues[queryParamName]
      ? {
          search: JSON.parse(initialValues[queryParamName])?.address,
          selectedPlace: {
            address: JSON.parse(initialValues[queryParamName]).address,
            origin: JSON.parse(initialValues[queryParamName]).origin,
          },
        }
      : null;

    // pass the initial values with the name key so that
    // they can be passed to the correct field
    const namedInitialValues = {
      [name]: initialValue,
    };

    const handleSubmit = values => {
      const usedValue = values ? values[name] : values;
      onSubmit({ ['location']: JSON.stringify(usedValue?.selectedPlace) });
    };

    return showAsPopup ? (
      <FilterPopup
        className={classes}
        rootClassName={rootClassName}
        popupClassName={css.popup}
        name={name}
        label={labelForPopup}
        isSelected={hasInitialValues}
        id={`${id}.popup`}
        showAsPopup
        contentPlacementOffset={contentPlacementOffset}
        onSubmit={handleSubmit}
        initialValues={namedInitialValues}
        keepDirtyOnReinitialize
        {...rest}
      >
        <LocationAutocompleteInputField
          className={css.locationAddress}
          inputClassName={css.locationAutocompleteInput}
          predictionsClassName={css.predictionsRoot}
          validClassName={css.validLocation}
          name="location"
          label={addressTitleRequiredMessage}
          placeholder={addressPlaceholderMessage}
          useDefaultPredictions={false}
          useCurrentLocation={true}
          format={identity}
          validate={composeValidators(
            autocompleteSearchRequired(addressRequiredMessage),
            autocompletePlaceSelected(addressNotRecognizedMessage)
          )}
          searchType={['address']}
          usePostalCode={true}
          required
        />
      </FilterPopup>
    ) : (
      <FilterPlain
        className={className}
        rootClassName={rootClassName}
        label={labelForPlain}
        isSelected={hasInitialValues}
        id={`${id}.plain`}
        liveEdit
        contentPlacementOffset={contentStyle}
        onSubmit={handleSubmit}
        initialValues={namedInitialValues}
        {...rest}
      >
        <LocationAutocompleteInputField
          className={css.locationAddress}
          inputClassName={css.locationAutocompleteInput}
          predictionsClassName={css.predictionsRoot}
          validClassName={css.validLocation}
          name="location"
          label={addressTitleRequiredMessage}
          placeholder={addressPlaceholderMessage}
          useDefaultPredictions={false}
          useCurrentLocation={true}
          format={identity}
          valueFromForm={initialValues[queryParamName]}
          validate={composeValidators(
            autocompleteSearchRequired(addressRequiredMessage),
            autocompletePlaceSelected(addressNotRecognizedMessage)
          )}
          searchType={['address']}
          usePostalCode={true}
          required
        />
      </FilterPlain>
    );
  }
}

ChangeLocationFilter.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  contentPlacementOffset: 0,
};

ChangeLocationFilter.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  name: string.isRequired,
  queryParamNames: arrayOf(string).isRequired,
  label: node.isRequired,
  onSubmit: func.isRequired,
  options: array.isRequired,
  initialValues: object,
  contentPlacementOffset: number,

  // form injectIntl
  intl: intlShape.isRequired,
};

export default injectIntl(ChangeLocationFilter);
