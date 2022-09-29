import { combineReducers } from "redux";

import walletReducer from "./wallet/walletReducer";
import collectionReducer from "./collection/collectionReducer";
import errorReducer from "./error/errorReducer";
import chainReducer from "./chain/chainReducer";

export default combineReducers({
  wallet: walletReducer,
  collection: collectionReducer,
  error: errorReducer,
  chain: chainReducer
});
