
import {
  chainTypeChangeAction
} from "./chainActions";

export const setChainState = (chainType, callback) => async (dispatch) => {
  console.log("api_setChainState:chainType", chainType);
  dispatch(chainTypeChangeAction(chainType));
}
