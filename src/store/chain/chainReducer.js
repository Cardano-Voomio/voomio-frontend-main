
import * as types from "./chainTypes";

export default function chainReducer(state = "", { type, payload }) {
  switch (type) {

    case types.CHAINTYPE_CHANGED:
      console.log("CHAINTYPE_CHANGED", payload);
      return {
        ...state,
        chaintype: payload
      };

    default:
      return state;
  }
}
