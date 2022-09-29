import * as types from "./collectionTypes";

export function collections_loaded(payload) {
  return {
    type: types.COLLECTIONS_LOADED,
    payload: payload,
  };
}
export function collections_add_tokens(payload) {
  return {
    type: types.COLLECTIONS_ADD_TOKENS,
    payload: payload,
  };
}
export function collections_loading(payload) {
  return {
    type: types.COLLECTIONS_LOADING,
    payload: payload,
  };
}

export function collections_top_projects(payload) {
  return {
    type: types.COLLECTIONS_TOP_PROJECTS,
    payload: payload,
  };
}

export function collections_add_assets(payload) {
  return {
    type: types.COLLECTIONS_ADD_ASSETS,
    payload: payload,
  };
}

export function set_showAsset(payload) {
  console.log("[dream log] api_setshowasset payload:", payload);
  return {
    type: types.SET_SHOWASSET,
    payload: payload,
  };
}