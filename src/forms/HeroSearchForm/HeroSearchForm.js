import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';
import { intlShape, injectIntl } from '../../util/reactIntl';
import { Form, LocationAutocompleteInput } from '../../components';

import css from './HeroSearchForm.module.css';

const identity = v => v;

class HeroSearchFormComponent extends Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.searchInput = null;
  }

  onChange(location) {
    if (location.selectedPlace) {
      // Note that we use `onSubmit` instead of the conventional
      // `handleSubmit` prop for submitting. We want to autosubmit
      // when a place is selected, and don't require any extra
      // validations for the form.
      this.props.onSubmit({ location });
      // blur search input to hide software keyboard
      if (this.searchInput) {
        this.searchInput.blur();
      }
    }
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={formRenderProps => {
          const { rootClassName, className, desktopInputRoot, intl, isMobile } = formRenderProps;

          const classes = classNames(rootClassName, className);
          const desktopInputRootClass = desktopInputRoot || css.desktopInputRoot;

          const currentUserType = this.props.currentUserType;

          // Allow form submit only when the place has changed
          const preventFormSubmit = e => e.preventDefault();

          return (
            <Form
              className={classes}
              onSubmit={preventFormSubmit}
              enforcePagePreloadFor="SearchPage"
            >
              <Field
                name="location"
                format={identity}
                render={({ input, meta }) => {
                  const { onChange, ...restInput } = input;

                  // Merge the standard onChange function with custom behaviour. A better solution would
                  // be to use the FormSpy component from Final Form and pass this.onChange to the
                  // onChange prop but that breaks due to insufficient subscription handling.
                  // See: https://github.com/final-form/react-final-form/issues/159
                  const searchOnChange = value => {
                    onChange(value);
                    this.onChange(value);
                  };

                  const searchInput = { ...restInput, onChange: searchOnChange };
                  return (
                    <LocationAutocompleteInput
                      className={isMobile ? css.mobileInputRoot : desktopInputRootClass}
                      iconClassName={isMobile ? css.mobileIcon : css.desktopIcon}
                      inputClassName={isMobile ? css.mobileInput : css.desktopInput}
                      rootClassName={isMobile ? css.mobileRoot : css.desktopRoot}
                      predictionsClassName={
                        isMobile ? css.mobilePredictions : css.desktopPredictions
                      }
                      predictionsAttributionClassName={
                        isMobile
                          ? css.mobilePredictionsAttribution
                          : css.desktopPredictionsAttribution
                      }
                      placeholder="Where are you located?"
                      closeOnBlur
                      inputRef={node => {
                        this.searchInput = node;
                      }}
                      input={searchInput}
                      meta={meta}
                      searchType={['place', 'address']}
                    />
                  );
                }}
              />
            </Form>
          );
        }}
      />
    );
  }
}

const { func, string, bool } = PropTypes;

HeroSearchFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  desktopInputRoot: null,
  isMobile: false,
};

HeroSearchFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  currentUserType: string,
  desktopInputRoot: string,
  onSubmit: func.isRequired,
  isMobile: bool,

  // from injectIntl
  intl: intlShape.isRequired,
};

const HeroSearchForm = injectIntl(HeroSearchFormComponent);

export default HeroSearchForm;
