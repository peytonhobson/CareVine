import { storableError } from '../../util/errors';
import * as log from '../../util/log';

// ================ Action types ================ //

// ================ Reducer ================ //

const initialState = {};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    default:
      return state;
  }
}

// ================ Action creators ================ //

// ================ Thunk ================ //
