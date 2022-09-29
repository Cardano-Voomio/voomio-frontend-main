import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { compose } from "redux";
import { connect } from "react-redux";
import AssetCard from "../AssetCard/AssetCard";
import { loadAssets } from "store/wallet/api";

import axios from 'axios';

import { Paper, Grid, Typography, Box, Zoom, Container, useMediaQuery, Button, Checkbox } from "@material-ui/core";
import { FormControl, RadioGroup, FormControlLabel, Radio } from "@material-ui/core";

import { getNftMetadataURI, getAllNftData } from "solana/context/utils";

import { useWallet } from "@solana/wallet-adapter-react";

const AllAssets = ({
  chaintype
}) => {
  const dispatch = useDispatch();
  const state_wallet = useSelector((state) => state.wallet);
  const state_collection = useSelector((state) => state.collection);

  const [listings, setListings] = useState([]);
  const [searchText, setSearchText] = useState("");
  const default_list_projects = [{ value: "all", label: "All Projects" }];
  const [listProjectsFilter, setListProjectsFilter] = useState([
    ...default_list_projects,
  ]);

  const poolID = useRef("0");
  const smallerScreen = useMediaQuery("(max-width: 650px)");
  const verySmallScreen = useMediaQuery("(max-width: 379px)");
  const [solanaNFTs, setSolanaNFTs] = useState([]);
  const [filterProject, setFilterProject] = useState("all");
  const filters_assets = [
    { value: "all", label: "Show all assets" },
    { value: "listed", label: "Show listed" },
    { value: "offered", label: "Show has offers" },
  ];
  
  const [filterAsset, setFilterAsset] = useState("all");

  const solanaWallet = useWallet();

  const [myAssets, setMyAssets] = useState([]);

  useEffect(() => {
    switch (chaintype) {
      case "ETH":
        break;
      case "SOL":
        loadSolanaWallet();
        break;
      case "ADA":
        loadCardanoWallet();
        break;
    }
  }, [state_wallet, solanaWallet.connected]);

  const loadSolanaWallet = () => {
    console.log("loadSolanaWallet");
    async function fetchAll() {
      console.log("Fetching...............")
      if (solanaWallet && solanaWallet.publicKey) {
        // console.log('fetchFlag:  TRUE')
        await fetchUnstakedInfo()
      }
    }

    fetchAll();
  };

  const fetchUnstakedInfo = async () => {
    let data = await getNftTokenData();
    if (data) {

      let collection = [];
      let my_listAssets = [];
      for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (item.data.creators) {
          let uri = await axios.get(item.data.uri);
          add_mySolanaAsset(my_listAssets, { mint: item.mint, uri: uri.data });
          collection.push({ mint: item.mint, uri: uri.data });
        }
      }

      console.log('result : ', collection);
      setSolanaNFTs(collection);

      console.log('[dream log] solana fetch nfts my_listAssets', my_listAssets);

      setMyAssets(my_listAssets);
      
    }
  }

  const getNftTokenData = async () => {
    try {
      let nftData = await getAllNftData();
      var data = Object.keys(nftData).map((key) => nftData[key]); let arr = [];
      let n = data.length;
      for (let i = 0; i < n; i++) {
        // // console.log(data[i].data.uri);
        arr.push(data[i]);
      }
      // console.log(`arr`)
      return arr;
    } catch (error) {
      console.log(error);
    }
  };

  const add_mySolanaAsset = (my_listAssets, this_asset) => {
    if (this_asset) {
      let my_asset = {};
      my_asset.name = this_asset.uri.name;
      my_asset.image = this_asset.uri.image;
      my_asset.description = this_asset.uri.description;
      my_asset.id = this_asset.mint;
      my_asset.status = true;
      my_asset.offers = [];
      my_asset.price = 0;
      my_asset.asset = null;
      my_asset.submittedBy = "";
      my_asset.files = [];
      my_asset.events = [];

      console.log("[dream log] add_myAsset_originasset:", this_asset);
      console.log("[dream log] add_myAsset:", my_asset);

      my_listAssets.push(my_asset);

    }
  };
/*
  const add_asset = (list_nfts, dict_projects, this_asset) => {
    if (this_asset) {
      list_nfts.push(this_asset);
      let policy_id = this_asset.details.policyId;
      if (policy_id in state_collection.policies_collections) {
        dict_projects[policy_id] =
          state_collection.policies_collections[policy_id].meta.name;
      } else {
        dict_projects[policy_id] = policy_id;
      }
    }
  };
*/
  const add_myCardanoAsset = (my_listAssets, dict_projects, this_asset) => {
    if (this_asset) {
      let my_asset = {};
      my_asset.name = this_asset.details.onchainMetadata.name;
      my_asset.image = this_asset.details.onchainMetadata.image;
      my_asset.description = this_asset.details.onchainMetadata.description;
      my_asset.id = this_asset.details.policyId;
      my_asset.status = this_asset.status.locked;
      my_asset.offers = this_asset.offers;
      my_asset.price = my_asset.status ? this_asset.status.datum.price : 0;
      my_asset.asset = this_asset.details.asset;
      my_asset.submittedBy = this_asset.status.submittedBy;
      my_asset.files = this_asset.details.onchainMetadata.files;
      my_asset.events = this_asset.events;

      console.log("[dream log] add_myAsset_originasset:", this_asset);
      console.log("[dream log] add_myAsset:", my_asset);

      my_listAssets.push(my_asset);

      let policy_id = this_asset.details.policyId;
      if (policy_id in state_collection.policies_collections) {
        dict_projects[policy_id] =
          state_collection.policies_collections[policy_id].meta.name;
      } else {
        dict_projects[policy_id] = policy_id;
      }
    }
  };

  const loadCardanoWallet = () => {
    if (state_wallet.loaded_assets) {
      let list_nfts = [];
      let list_projects = [...default_list_projects];
      let dict_projects = {};
      let list_nfts_id = []; // for checking duplicates

      let my_listAssets = [];

      for (let i in state_wallet.data.market) {
        let this_asset = state_wallet.data.market[i];
        if (!list_nfts_id.includes(this_asset.details.asset)) {
          // add_asset(list_nfts, dict_projects, this_asset);
          add_myCardanoAsset(my_listAssets, dict_projects, this_asset);
          list_nfts_id.push(this_asset.details.asset);
        }
      }

      for (let i in state_wallet.data.assets) {
        let this_asset = state_wallet.data.assets[i];
        if (!list_nfts_id.includes(this_asset.details.asset)) {
          // add_asset(list_nfts, dict_projects, this_asset);
          add_myCardanoAsset(my_listAssets, dict_projects, this_asset);
          list_nfts_id.push(this_asset.details.asset);
        }
      }

      console.log("[log]_loadCardanoWallet_list_nfts:", list_nfts);
      console.log("[log]_loadCardanoWallet_my_listAssets:", my_listAssets);

      setMyAssets(my_listAssets);
      // setListings(list_nfts);

      for (var policy_id in dict_projects) {
        list_projects.push({
          value: policy_id,
          label: dict_projects[policy_id],
        });
      }
      setListProjectsFilter(list_projects);
    }
  };

  // const searchingFor = (searchText) => {
  //   return (x) => {
  //     let return_this = false;
  //     if (searchText === "") {
  //       return_this = true;
  //     } else if (searchText !== "" && x.details.onchainMetadata) {
  //       if (
  //         x.details.onchainMetadata.name
  //           .toLowerCase()
  //           .includes(searchText.toLowerCase())
  //       ) {
  //         return_this = true;
  //       }
  //     }
  //     return return_this;
  //   };
  // };

  const searchingFor = (searchText) => {
    return (x) => {
      let return_this = false;
      if (searchText === "") {
        return_this = true;
      } else if (searchText !== "" && x.name) {
        if (
          x.name
            .toLowerCase()
            .includes(searchText.toLowerCase())
        ) {
          return_this = true;
        }
      }
      return return_this;
    };
  };

  const NFTItemView = ({ nft_item, index }) => {
    const [checked, setChecked] = useState(false);
    const onSelect = (e) => {
      setChecked(checked => !checked);
      
    }

    return (
      <Grid item lg={3}>
        <div className="pool-card" onClick={e => onSelect(e)}>
          <Grid container className="data-grid" alignContent="center">
            <Grid item lg={9}  >
              <Typography variant="h6" >
                {nft_item.uri.name}
              </Typography>
            </Grid>
            <Grid item lg={3} style={{ display: "flex", justifyContent: "center" }}>
              
            </Grid>
          </Grid>

          <Grid container className="data-grid" alignContent="center">
            <img src={nft_item.uri.image} className="nft-list-item-image" width={"100%"} />
          </Grid>
        </div>
      </Grid>
    )
  }

  // let matchedtokens = listings.filter(searchingFor(searchText));
  let matchedMyTokens = myAssets.filter(searchingFor(searchText));

  // console.log("[log] ::matchedtokens(cardano)=", matchedtokens);
  console.log("[log] ::matchedMyTokens(cardano)=", matchedMyTokens);

  const filtered_listing_solana = matchedMyTokens
    .filter((asset) => {
      return true;
    })
    .map((asset, i) => {
      return (
        <AssetCard
          asset={asset}
          show_offer={true}
          column_className="column is-one-full-mobile is-one-quarter-tablet is-2-desktop is-2-widescreen is-2-fullhd"
          key={i}
        />
      );
    });

  const filtered_listing_cardano = matchedMyTokens//matchedtokens
    .filter((asset) => {
      let allow_project = false;

      if (filterProject === "all") allow_project = true;
      // else allow_project = filterProject === asset.details.policyId;
      else allow_project = filterProject === asset.id;

      if (allow_project) {
        if (filterAsset === "all") {
          return true;
        // } else if (filterAsset === "listed" && asset.status.locked) {
        } else if (filterAsset === "listed" && asset.status) {
          return true;
        } else if (filterAsset === "offered") {
          if (asset.offers) {
            if (Object.keys(asset.offers).length) {
              return true;
            } else {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    })
    .map((asset, i) => {
      return (
        <AssetCard
          asset={asset}
          show_offer={true}
          column_className="column is-one-full-mobile is-one-quarter-tablet is-2-desktop is-2-widescreen is-2-fullhd"
          key={i}
        />
      );
    });

  return (
    <>
      {myAssets.length > 0 ? (
        <div className="block">
          <div className="field is-grouped">
            <div className="control has-icons-left is-expanded">
              <input
                className="input"
                type="text"
                placeholder={"Search"}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <span className="icon is-small is-left">
                <i className="fa fa-search"></i>
              </span>
            </div>

            <div className="control">
              <span className="select">
                <select
                  value={filterProject}
                  onChange={(event) => setFilterProject(event.target.value)}
                >
                  {listProjectsFilter.map((option, i) => {
                    return (
                      <option value={option.value} key={i}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </span>
            </div>

            <div className="control">
              <span className="select">
                <select
                  value={filterAsset}
                  onChange={(event) => setFilterAsset(event.target.value)}
                >
                  {filters_assets.map((option, i) => {
                    return (
                      <option value={option.value} key={i}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </span>
            </div>
          </div>
          {chaintype == "ADA" ? <div className="columns is-multiline">{filtered_listing_cardano}</div> : <></>}
          {chaintype == "SOL" ? <div className="columns is-multiline">{filtered_listing_solana}</div> : <></>}
          

        </div>
      ) : (
        <NoAssetFound state_wallet={state_wallet} />
      )}
      
    </>
  );
};

const NoAssetFound = ({ state_wallet }) => {
  return (
    <section className="hero is-large">
      <div className="hero-body">
        <div className="container has-text-centered">
          {!state_wallet.connected ? (
            <>
              <h1>
                <span
                  className="icon"
                  style={{ fontSize: "100px", marginBottom: "50px" }}
                >
                  <i className="fas fa-plug"></i>
                </span>
              </h1>
              <p className="title">Connect your wallet</p>
            </>
          ) : (
            <></>
          )}
          {state_wallet.connected && state_wallet.loading ? (
            <>
              <h1>
                <span
                  className="icon"
                  style={{ fontSize: "100px", marginBottom: "50px" }}
                >
                  <i className="fas fa-truck-loading"></i>
                </span>
              </h1>
              <p className="title">Fetching your assets</p>
              <p className="subtitle">This may take awhile...</p>
            </>
          ) : (
            <></>
          )}
          {state_wallet.connected &&
            !state_wallet.loading &&
            state_wallet.loaded_assets ? (
            <>
              <h1>
                <span
                  className="icon"
                  style={{ fontSize: "100px", marginBottom: "50px" }}
                >
                  <i className="fas fa-truck-loading"></i>
                </span>
              </h1>
              <p className="title">No assets</p>
              <p className="subtitle">
                Looks like your wallet is empty,{" "}
                <a href="/explore">start browsing</a>!
              </p>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </section>
  );
};

function mapStateToProps(state) {
  return {
    chaintype: state.wallet.chaintype
  };
}

export default compose(connect(mapStateToProps, null))(
  AllAssets
);

