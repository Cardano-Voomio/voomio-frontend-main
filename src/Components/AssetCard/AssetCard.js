import React from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import "./AssetCard.css";
import AssetImageFigure from "../AssetImageFigure/AssetImageFigure";
import { fromLovelace } from "../../utils/converter";

import { setStateShowAsset } from "../../store/collection/api"

const AssetCard = ({ chaintype, state_collection, asset, column_className, show_offer, setStateShowAsset }) => {

  let collection = false;
  if (asset) {
    collection = state_collection.policies_collections[asset.id]
  }

  const setShowAsset = () => {
    setStateShowAsset(asset);
  };

  return (
    <>
      <>
        {console.log("AssetCard!!!!!!!!!!!!!")}</>
      {
        asset ? (
          <>
            {
              asset.image ? (
                <div className={column_className ? column_className : "column is-one-full-mobile is-half-tablet one-quarter-desktop is-one-quarter-widescreen is-one-quarter-fullhd"}>
                  <Link to={`/assets/${asset.id}/${asset.asset}`} onClick={setShowAsset}>
                    <div className="card asset_card">
                      <div className="card-image">
                        <AssetImageFigure asset={asset} />
                      </div>
                      <div className="card-content">
                        <div className="media is-clipped">
                          <div className="media-content clipped">
                            <p className="title is-size-5 clipped">
                              {asset.name}
                            </p>
                            <p className="subtitle is-size-7 clipped">
                              {asset.id}

                              <span className="icon" data-tooltip="Voomio Verified">
                                <i
                                  className="fas fa-check-circle"
                                  style={{ color: "gold" }}
                                ></i>
                              </span>

                            </p>
                            <div className="title is-size-5 tag-price">
                              {
                                asset.status ?
                                  <p>{fromLovelace(asset.price)}{chaintype == "ADA" ? <span className="ada_symbol">&nbsp;₳</span> : <span className="ada_symbol">&nbsp;SOL</span>}</p>
                                  : <p><span className="ada_symbol">Not Listed</span></p>
                              }
                            </div>
                            {
                              show_offer ? asset.offers ? Object.keys(asset.offers).length ? (
                                <span className="tag is-warning is-medium is-rounded price_tag" style={{ top: "50px" }}>
                                  <p className="" data-tooltip={`Highest offer`}>
                                    {chaintype == "ADA" ? <span className="ada_symbol">&nbsp;₳</span> : <span className="ada_symbol">&nbsp;SOL</span>}
                                    {
                                      Math.max.apply(Math, Object.keys(asset.offers).map(function (key) {
                                        return asset.offers[key];
                                      }).map(function (o) { return o.p; }))
                                    }
                                  </p>
                                </span>
                              ) : <></> : <></> : <></>
                            }

                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ) : <></>
            }
          </>
        ) : <></>
      }
    </>
  )
};

function mapStateToProps(state, props) {
  return {
    state_collection: state.collection,
    chaintype: state.wallet.chaintype,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    setStateShowAsset: (asset, callback) => dispatch(setStateShowAsset(asset, callback)),
  };
}

export default compose(connect(mapStateToProps, mapDispatchToProps))(AssetCard);
