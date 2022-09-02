import React, { useEffect, useState } from "react";
import "./WalletData.css";
import CardanoWalletAPI from '../../APIs/CardanoWalletAPI';

let wallet;

const WalletData = () => {

    const [selectedWallet, setSelectedWallet] = useState(undefined);

    useEffect(() => {
        console.log(window.cardano);
        console.log(window.cardano.isEnabled());
        console.log("WalletData");
        
        
        if (window.cardano.nami)
            setSelectedWallet("nami");
        else if (window.cardano.eternl)
            setSelectedWallet("eternl");

        
        async function f() {
            wallet = new CardanoWalletAPI(selectedWallet);
            
            console.log(wallet.getWallet());
            console.log(await wallet.isInstalled()) 
            console.log(await wallet.enable())
            
        }
        
        f()
    });

    return (
        <>
        </>
    );
};

export default WalletData;