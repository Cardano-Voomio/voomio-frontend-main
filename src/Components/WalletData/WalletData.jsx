import React, { useEffect, useState } from "react";
import "./WalletData.css";
import cardanoWalletAPI from '../../APIs/cardanoWalletAPI';
let wallet;

const WalletData = () => {

    useEffect(() => {
        async function t() {

            const S = await Cardano();
            wallet = new cardanoWalletAPI(
                S,
                window.cardano,
               blockfrostApiKey
            )


            if (await wallet.isInstalled()) {
                await wallet.isEnabled().then(result => { setConnected(result) })

            }
        }

        t()
    });

    return (
        <>
        </>
    );
};

export default WalletData;