import * as types from "./chainTypes";

export function chainTypeChangeAction(payload) {
  console.log("chainTypeChanged:payload", payload);
  return {
    type: types.CHAINTYPE_CHANGED,
    payload: payload
  };
}
