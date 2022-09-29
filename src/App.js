import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./Components/Home/Home";
import Header from "./Components/Header/Header";
import Footer from "./Components/Footer/Footer";
import Aggregator from "./Components/Aggregator/Aggregator";
import NFTGenerator from "./Components/NftGenerator/NftGenerator";
import UploadNft from "./Components/UploadNft/UploadNft";
import Generate from "./Components/UploadNft/Generate";
import Preview from "./Components/UploadNft/Preview";
import NftDetails from "./Components/UploadNft/NftDetails";
import CollectionStats from "./Components/Collection/Stats/Stats";
import Explore from "./pages/Explore/Explore";
import WhiteList from "./Components/Collection/WhiteList/WhiteList";
import Activity from "./Components/Collection/Activity/Activity";
import MyWallet from "./Components/MyWallet/MyWallet";
import Asset from "pages/Asset/Asset";
import { useDispatch, useSelector } from "react-redux";
import React, { useEffect, useMemo } from "react";

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

import { MainLayout } from "layouts";

import { load_collection } from "./store/collection/api";

function App() {
  const dispatch = useDispatch();
  const state_collection = useSelector((state) => state.collection);
  const state_error = useSelector((state) => state.error);

  const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            /**
             * Select the wallets you wish to support, by instantiating wallet adapters here.
             *
             * Common adapters can be found in the npm package `@solana/wallet-adapter-wallets`.
             * That package supports tree shaking and lazy loading -- only the wallets you import
             * will be compiled into your application, and only the dependencies of wallets that
             * your users connect to will be loaded.
             */
            new PhantomWalletAdapter(),
        ],
        []
    );

  useEffect(() => {
    if (!state_collection.loaded && !state_collection.loading) {
      dispatch(load_collection((res) => { }));
    }
  }, [state_collection.loaded, state_collection.loading]);

  return (
    <>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>

            <Header />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
            <div className="header-margin">
              <Routes>
                <Route exact path="/" element={<Home />} />
                <Route exact path="/aggregator" element={<Aggregator />} />
                <Route exact path="/nftgenerator" element={<NFTGenerator />} />
                <Route exact path="/uploadnft" element={<UploadNft />} />
                <Route exact path="/general" element={<Generate />} />
                <Route exact path="/preview" element={<Preview />} />
                <Route exact path="/nftdetails" element={<NftDetails />} />
                <Route exact path="/collection_stats" element={<CollectionStats />} />
                <Route exact path="/explore" element={<Explore />} />
                <Route exact path="/whitelist" element={<WhiteList />} />
                <Route exact path="/activity" element={<Activity />} />
                <Route exact path="/mywallet" element={<MyWallet />} />
                <Route exact path="/assets/:policy_id/:asset_id" element={
                  <MainLayout>
                    <Asset />
                  </MainLayout>}
                />
              </Routes>
            </div>
            <Footer />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}

export default App;
