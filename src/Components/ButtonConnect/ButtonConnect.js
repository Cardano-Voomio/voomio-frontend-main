import React, { useEffect, useRef, useState, useMemo } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWallet } from '@solana/wallet-adapter-react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

import { useWalletModal } from '@solana/wallet-adapter-react-ui';

import {
    availableWallets,
    connectCardanoWallet,
    connectSolanaWallet,
    disconnectCardanoWallet,
    disconnectSolanaWallet,
    loadAssets,
} from "../../store/wallet/api";
import { WALLET_STATE } from "../../store/wallet/walletTypes";

import "./ButtonConnect.css";

const cardanoWallets = {
    ccvault: {
        title: "ccvault.io",
        image: "/images/wallets/ccvault.png",
    },
    gerowallet: {
        title: "GeroWallet",
        image: "/images/wallets/gero.png",
    },
    nami: {
        title: "Nami",
        image: "/images/wallets/nami.svg",
    },
};

const solanaWallets = {
    phantom: {
        title: "Phantom",
        image: "/images/wallets/ccvault.png",
    },
};

const ButtonConnect = ({
    chaintype,
    state_wallet,
    availableWallets,
    connectCardanoWallet,
    connectSolanaWallet,
    disconnectCardanoWallet,
    disconnectSolanaWallet,
    loadAssets,
}) => {

    const navigate = useNavigate();

    const [showCardanoWallets, setShowCardanoWallets] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);

    const { setVisible } = useWalletModal();

    const { publicKey, solanaWallet, disconnect, connect, connecting, connected, disconnecting } = useWallet();

    const hideWallets = () => {
        setShowCardanoWallets(false);
    };

    const onclick_connect_wallet = () => {
        console.log("onclick_connect_wallet chaintype:", chaintype);
        switch (chaintype) {
            case "ETH":
                break;
            case "SOL":
                connect_SolanaWallet();
                break;
            case "ADA":
                availableWallets((res) => {
                    if (res.wallets.length === 1) {
                        connect_CardanoWallet(res.wallets[0]);
                    } else if (res.wallets.length > 1) {
                        setShowCardanoWallets(res.wallets);
                    }
                });
                break;
        }
    };

    const onclick_my_wallet = () => {
        navigate("/mywallet");
    };

    const onclick_disconnect_wallet = () => {
        console.log("onclick_disconnect_wallet", chaintype);
        if (state_wallet.connected) {
            switch (state_wallet.chaintype) {
                case "ETH":
                    break;
                case "SOL":
                    disconnect();
                    disconnectSolanaWallet(solanaWallet, (res) => {
                        console.log("disconnectSolanaWallet_res::", res);
                    });
                    break;
                case "ADA":
                    disconnectCardanoWallet(selectedWallet, (res) => {
                        console.log("disconnectCardanoWallet_res::", res);
                    });
                    break;
            }
        }
        navigate("/mywallet");
    };

    const connect_SolanaWallet = () => {
        setVisible(true);
    };

    const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

    const solanaWalletstate = useMemo(() => {
        console.log("solanaWallet status changed");
        if (disconnecting) {
            console.log("solana disconnecting");
            return "disconnecting";
        }
        if (connecting) {
            console.log("solana connecting");
            return "connecting";
        }
        if (connected) {
            console.log("solana connected");
            connectSolanaWallet(solanaWallet, (res) => {
                if (res.success) {
                    console.log("solana wallet state connect success!");
                }
            });
            return "connected";
        }
        if (solanaWallet) {
            console.log("solana connect");
            return "connect";
        }

    }, [connected]);

    const connect_CardanoWallet = (wallet_name) => {
        setShowCardanoWallets(false);
        connectCardanoWallet(wallet_name, (res) => {
            if (res.success) {
                setSelectedWallet(wallet_name);
            }
        });
    };

    const ref = useRef();

    useEffect(() => {
        switch (chaintype) {
            case "ETH":
                break;
            case "SOL":
                break;
            case "ADA":

                if (
                    state_wallet.connected &&
                    !state_wallet.loading &&
                    !state_wallet.loaded_assets
                ) {
                    loadAssets(state_wallet, (res) => { });
                }
                break;
        }
    }, [loadAssets, state_wallet]);

    return (
        <>
            {
                !state_wallet.connected ? (
                    <button
                        className="buttonborder menufont text-white font-bold py-3 lg:px-10 md:px-5"
                        onClick={() => onclick_connect_wallet()}
                    >
                        Connect Wallet
                    </button>
                ) : (
                    <>
                        <button
                            className="buttonborder menufont text-white font-bold py-3 lg:px-10 md:px-5"
                            onClick={() => onclick_my_wallet()}
                        >
                            {`(${state_wallet.chaintype})`}MyWallet
                        </button>
                        <button
                            className="buttonborder menufont text-white font-bold py-3 lg:px-10 md:px-5"
                            onClick={() => onclick_disconnect_wallet()}
                        >
                            Disconnect Wallet
                        </button>
                    </>
                )
            }

            {
                showCardanoWallets ? (
                    <div className="fixed backdrop-filter backdrop-blur-sm bg-backdrop flex items-center justify-center overflow-auto z-50 inset-0">
                        <div
                            className="relative bg-white dark:bg-blue-darkest rounded-xl shadow-xl px-16 py-10 max-w-xl w-11/12 md:w-full"
                            ref={ref}
                        >
                            <div className="text-center mb-7">
                                <h1 className="text-blue-dark dark:text-gray-lightest mb-10 font-bold text-3xl">
                                    Select wallet
                                </h1>
                            </div>{" "}
                            <button
                                type="button"
                                onClick={hideWallets}
                                className="absolute text-2xl px-2.5 text-gray-dark top-3 right-3 hover:opacity-100 opacity-70"
                            >
                                <i className="fas fa-times" />
                            </button>{" "}
                            <div className="flex justify-center gap-7">
                                {showCardanoWallets &&
                                    showCardanoWallets.length > 0 &&
                                    showCardanoWallets.map((name) => (
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => connect_CardanoWallet(name)}
                                                className="relative w-36 p-3 bg-gray-lightest dark:bg-blue-darker rounded-xl text-blue-dark dark:text-gray-regular bg-opacity-60 border-2 hover:bg-opacity-10 dark:hover:bg-blue-meta dark:hover:bg-opacity-20 hover:bg-blue-light hover:border-blue-light text-lg font-semibold dark:border-blue-darkest"
                                            >
                                                <img
                                                    src={cardanoWallets[name].image}
                                                    alt="eternl wallet"
                                                    className="w-16 h-16 p-2 mx-auto mb-2"
                                                />
                                                {name}
                                                <div className="text-xs font-normal mt-1.5 text-blue-dark dark:text-blue-meta">
                                                    <i className="fas fa-link" />
                                                    enabled
                                                </div>
                                            </button>
                                        </div>
                                    ))}

                            </div>
                        </div>
                    </div>
                ) : null
            }
        </>
    );
};


//state.reducerName.StateName
function mapStateToProps(state) {
    return {
        chaintype: state.chain.chaintype,
        state_wallet: state.wallet,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        availableWallets: (callback) => dispatch(availableWallets(callback)),
        connectCardanoWallet: (is_silent, callback) =>
            dispatch(connectCardanoWallet(is_silent, callback)),
        connectSolanaWallet: (is_silent, callback) =>
            dispatch(connectSolanaWallet(is_silent, callback)),
        disconnectCardanoWallet: (is_silent, callback) =>
            dispatch(disconnectCardanoWallet(is_silent, callback)),
        disconnectSolanaWallet: (is_silent, callback) =>
            dispatch(disconnectSolanaWallet(is_silent, callback)),
        loadAssets: (wallet, callback) => dispatch(loadAssets(wallet, callback)),
    };
}

export default compose(connect(mapStateToProps, mapDispatchToProps))(
    ButtonConnect
);
