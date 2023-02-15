import React from 'react';
import { string, bool } from 'prop-types';
import { intlShape, injectIntl } from '../../util/reactIntl';

import config from '../../config';

import SortByPlain from './SortByPlain';
import SortByPopup from './SortByPopup';
import { CAREGIVER } from '../../util/constants';

const caregiverSortBy = ['relevant', 'createdAt', '-createdAt', '-pub_minPrice', 'pub_maxPrice'];
const employersSortBy = ['relevant', 'createdAt', '-createdAt', '-pub_maxPrice', 'pub_minPrice'];

const SortBy = props => {
  const { sort, showAsPopup, isConflictingFilterActive, intl, currentUserType, ...rest } = props;

  const { relevanceKey, queryParamName } = config.custom.sortConfig;

  const sortArray = currentUserType === CAREGIVER ? caregiverSortBy : employersSortBy;

  const options = config.custom.sortConfig.options
    .filter(option => sortArray.includes(option.key))
    .map(option => {
      const isRelevance = option.key === relevanceKey;
      return {
        ...option,
        disabled:
          (isRelevance && !isConflictingFilterActive) ||
          (!isRelevance && isConflictingFilterActive),
      };
    });
  const defaultValue = 'createdAt';
  const componentProps = {
    urlParam: queryParamName,
    label: intl.formatMessage({ id: 'SortBy.heading' }),
    options,
    initialValue: isConflictingFilterActive ? relevanceKey : sort || defaultValue,
    ...rest,
  };
  return showAsPopup ? <SortByPopup {...componentProps} /> : <SortByPlain {...componentProps} />;
};

SortBy.defaultProps = {
  sort: null,
  showAsPopup: false,
};

SortBy.propTypes = {
  sort: string,
  showAsPopup: bool,
  isConflictingFilterActive: bool.isRequired,
  intl: intlShape.isRequired,
};

export default injectIntl(SortBy);
