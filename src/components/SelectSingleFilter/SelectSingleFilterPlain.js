import React, { Component } from 'react';
import { arrayOf, bool, func, node, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import RadioButton from '../RadioButton/RadioButton';

import css from './SelectSingleFilterPlain.module.css';

const getQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames) ? queryParamNames[0] : queryParamNames;
};

class SelectSingleFilterPlain extends Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: true, selected: null };
    this.selectOption = this.selectOption.bind(this);
    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }

  selectOption(option, e) {
    const { queryParamNames, onSelect } = this.props;
    const queryParamName = getQueryParamName(queryParamNames);
    onSelect({ [queryParamName]: option });
    this.setState({ ...this.state, selected: option });

    // blur event target if event is passed
    if (e && e.currentTarget) {
      e.currentTarget.blur();
    }
  }

  toggleIsOpen() {
    this.setState({ isOpen: !this.state.isOpen });
  }

  render() {
    const {
      rootClassName,
      className,
      label,
      options,
      queryParamNames,
      initialValues,
      twoColumns,
      useBullets,
    } = this.props;

    const queryParamName = getQueryParamName(queryParamNames);
    const initialValue =
      initialValues && initialValues[queryParamName] ? initialValues[queryParamName] : null;
    const labelClass = initialValue ? css.filterLabelSelected : css.filterLabel;

    const hasBullets = useBullets || twoColumns;
    const optionsContainerClass = classNames({
      [css.optionsContainerOpen]: this.state.isOpen,
      [css.optionsContainerClosed]: !this.state.isOpen,
      [css.hasBullets]: hasBullets,
      [css.twoColumns]: twoColumns,
    });

    const classes = classNames(rootClassName || css.root, className);

    return (
      <div className={classes}>
        <div className={labelClass}>
          <button className={css.labelButton} onClick={this.toggleIsOpen}>
            <span className={labelClass}>{label}</span>
          </button>
          <button className={css.clearButton} onClick={e => this.selectOption(null, e)}>
            <FormattedMessage id={'SelectSingleFilter.plainClear'} />
          </button>
        </div>
        <div className={optionsContainerClass}>
          <ul>
            {options.map((option, index) => {
              // check if this option is selected
              const initialSelected = initialValue === option.key;
              return (
                <li key={index} onClick={e => this.selectOption(option.key, e)}>
                  <RadioButton
                    label={option.label}
                    value={option.key}
                    showAsRequired={false}
                    selected={this.state.selected === option.key || initialSelected}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }
}

SelectSingleFilterPlain.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  twoColumns: false,
  useBullets: false,
};

SelectSingleFilterPlain.propTypes = {
  rootClassName: string,
  className: string,
  queryParamNames: arrayOf(string).isRequired,
  label: node.isRequired,
  onSelect: func.isRequired,

  options: arrayOf(
    shape({
      key: string.isRequired,
      label: string.isRequired,
    })
  ).isRequired,
  initialValues: object,
  twoColumns: bool,
  useBullets: bool,
};

export default SelectSingleFilterPlain;
