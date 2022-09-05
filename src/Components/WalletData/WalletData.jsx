import React, { useEffect, useState } from "react";
import "./WalletData.css";
import CardanoWalletAPI, { Cardano } from '../../APIs/CardanoWalletAPI';
import blockfrostApiKey from '../../config.js';
import DateTimePicker from 'react-datetime-picker';

let wallet;

const WalletData = () => {
    const [connected, setConnected] = useState()
    const [address, setAddress] = useState()
    const [nfts, setNfts] = useState([])
    const [balance, setBalance] = useState()
    const [transaction, setTransaction] = useState()
    const [amount, setAmount] = useState("10")
    const [txHash, setTxHash] = useState()
    const [recipientAddress, setRecipientAddress] = useState("addr_test1qqsjrwqv6uyu7gtwtzvhjceauj8axmrhssqf3cvxangadqzt5f4xjh3za5jug5rw9uykv2klc5c66uzahu65vajvfscs57k2ql")
    const [witnesses, setWitnesses] = useState()
    const [policy, setPolicy] = useState()
    const [builtTransaction, setBuiltTransaction] = useState()

    const [complextxHash, setComplextxHash] = useState()
    const [policyExpiration, setPolicyExpiration] = useState(new Date());
    const [complexTransaction, setComplexTransaction] = useState({
        recipients: [{
            address: "addr_test1qqsjrwqv6uyu7gtwtzvhjceauj8axmrhssqf3cvxangadqzt5f4xjh3za5jug5rw9uykv2klc5c66uzahu65vajvfscs57k2ql",
            amount: "3",
            mintedAssets: [{
                assetName: "MyNFT", quantity: '1', policyId: "Minting PolicyID",
                policyScript: "MintingPolicy"
            }]
        }]
    })
    useEffect(() => {
        const defaultDate = new Date();
        defaultDate.setTime(defaultDate.getTime() + (1 * 60 * 90 * 1000))
        setPolicyExpiration(defaultDate);

    }, [])
    useEffect(() => {

        async function f() {
            const S = await Cardano();
            wallet = new CardanoWalletAPI(
                S,
                window.cardano,
                blockfrostApiKey
            );
            if (await wallet.isInstalled()) {
                await wallet.isEnabled().then(result => { setConnected(result) })
                await getBalance();

            }
        }

        f()
    }, []);

    const connect = async () => {
        // Connects nami wallet to current website 
        await wallet.enable()
            .then(result => setConnected(result))
            .catch(e => console.log(e))
    }

    const getAddress = async () => {
        // retrieve address of nami wallet
        if (!connected) {
            await connect()
        }
        await wallet.getAddress().then((newAddress) => { console.log(newAddress); setAddress(newAddress) })
    }


    const getBalance = async () => {
        if (!connected) {
            await connect()
        }
        await wallet.getBalance().then(async result => {
            console.log(result);
            setNfts(result.assets);
            setBalance(result.lovelace);
        })
    }


    const buildTransaction = async () => {
        if (!connected) {
            await connect()
        }

        const recipients = [{ "address": recipientAddress, "amount": amount }]
        let utxos = await wallet.getUtxosHex();
        const myAddress = await wallet.getAddress();

        let netId = await wallet.getNetworkId();
        const t = await wallet.transaction({
            PaymentAddress: myAddress,
            recipients: recipients,
            metadata: null,
            utxosRaw: utxos,
            networkId: netId.id,
            ttl: 3600,
            multiSig: null
        })
        console.log(t)
        setTransaction(t)
    }



    const buildFullTransaction = async () => {
        if (!connected) {
            await connect()
        }
        try {
            const recipients = complexTransaction.recipients
            const metadataTransaction = complexTransaction.metadata
            console.log(metadataTransaction)
            let utxos = await wallet.getUtxosHex();

            const myAddress = await wallet.getAddress();
            console.log(myAddress)
            let netId = await wallet.getNetworkId();

            const t = await wallet.transaction({
                PaymentAddress: myAddress,
                recipients: recipients,
                metadata: metadataTransaction,
                utxosRaw: utxos,
                networkId: netId.id,
                ttl: 3600,
                multiSig: null
            })
            setBuiltTransaction(t)
            const signature = await wallet.signTx(t)
            console.log(t, signature, netId.id)
            const txHash = await wallet.submitTx({
                transactionRaw: t,
                witnesses: [signature],

                networkId: netId.id
            })
            console.log(txHash)
            setComplextxHash(txHash)
        } catch (e) {
            console.log(e)
        }
    }



    const signTransaction = async () => {
        if (!connected) {
            await connect()
        }

        const witnesses = await wallet.signTx(transaction)
        setWitnesses(witnesses)
    }

    const submitTransaction = async () => {
        let netId = await wallet.getNetworkId();
        const txHash = await wallet.submitTx({
            transactionRaw: transaction,
            witnesses: [witnesses],

            networkId: netId.id
        })
        setTxHash(txHash)

    }

    const createPolicy = async () => {
        console.log(policyExpiration)
        try {
            await wallet.enable()


            const myAddress = await wallet.getHexAddress();

            let networkId = await wallet.getNetworkId()
            const newPolicy = await wallet.createLockingPolicyScript(myAddress, networkId.id, policyExpiration)

            setPolicy(newPolicy)
            setComplexTransaction((prevState) => {
                const state = prevState; state.recipients[0].mintedAssets[0].policyId = newPolicy.id;
                state.recipients[0].mintedAssets[0].policyScript = newPolicy.script;
                state.metadata = {
                    "721": {
                        [newPolicy.id]:
                            { [state.recipients[0].mintedAssets[0].assetName]: { name: "MyNFT", description: "Test NFT", image: "ipfs://QmUb8fW7qm1zCLhiKLcFH9yTCZ3hpsuKdkTgKmC8iFhxV8" } }
                    }
                };
                return { ...state }
            })

        } catch (e) {
            console.log(e)
        }

    }

    return (<>
        <div class="flex flex-wrapify-center mt-14">
            {nfts.map((nft, index) => (
                <div class="w-full md:w-6/12 lg:w-3/12 lg:mb-0 mb-12 px-4">
                    <div class=" relative network-box mt-16">
                        <img alt="" src={nft.image} class="rounded-xl shadow-lg w-full h-auto align-middle border-none undefined" width="50px"></img>

                        <div class="pt-6 text-center">
                            <div class="flex gap-2 pl-6">
                                <h1 class="trading-title  mt-0 mb-2">
                                    {nft.name }
                                </h1>
                                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAZCAYAAAAv3j5gAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJtSURBVHgBrVZdbtpAEJ5Z81egEtyA3ICcoPBG04eUE8SVQl8LJwBOUPJWBSTMCZq8FN7wDercgBvEUls5qX+mO4akibsbMPSTEPLM7Hy7OzOfjaCB2bqtZbEwBaCGfHSAoovxomw99ecw/ykCMhHQlf7hU38SqHN0Tn5NgdBMmFdENEMUbzYbeAaisDlZvLZV+QRoTqMgYdQQsa8iiXeN+B40UBJlIduAvSDOtJ6kwWzcVgBFH/ZD5bz1o6FyPNaIAwQap5viVuAgoA0UznzwbWtRXcWWRHf9d8iT9C7nxRFquislyIUXbsH37qtCkhx0TUg0HM9LVUnm6GIyhUxdyLm4gT1BFM0uF6VBPA6aE8mrWwV3gSOCwu/R+ujpIBM45btSd13j/FKaaurNoG3ZVVdYV1WXCC4gBXiXgrDtgguS5KuOhGEADPl/M0eRrUnoJO9+Q9L8sni1yhZzn6WpDno4HPdIhEI90WEYcKGPCaLZ2kIuYdTmxecnXn+Hbq3FAsBEG11rqKKEkelz4GReNmMyot74W9lhEtltA9iOSq6Q68aH6bR+mvJI0xeCHTkHTS4oP3x8551RRBbsDleuP8LOW2+5gyo4Pt235UVXMpRbppaoIDrORBDeCBCNLaH1DOa+A3EzpB9wwzBcEeb9AXfStmAmSE8im0dqHTfPM/Xm3kCEUzhQvWVyW47MddkrWSMb3fVGFdixbjqS3kSqddIu1MHhNewBLoGKREsU5H0L9gDrms6nJGL9i9+S/6bi+2ZdvFKte9C1nYniRQQfpPshoSOVoVfyikfjebErf22D8Ig/vdbkf7tLl+8PNNMRtnvTGvIAAAAASUVORK5CYII=" alt="" class="w-5 h-5" />
                            </div>
                            <div class="flex items-center justify-end gap-2 pr-5 pb-5">
                                <div>
                                    <h1 class="trading-floor font-bold">Floor</h1>
                                </div>
                                <div class="flex items-center">
                                    <div>
                                        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADPSURBVHgBxZJvDcIwEMUfYAAJlTAcDCfFwSQMBeBgQQESwAE42D7yrTiAa3rNSuhG/yX8kpe03e31bnvAn6hIEgXpSYq0RgEk6cVqkYmA6c4aKj5LpnPMrC5IRHjMrGokcJ4x7BGJnDGzahBBH2DojdHSYxaatWdorS4SMJlTE921XBPUob654Rc3pJPz7Mpn+qID136wwHSXN17vMIb5zkZ6vyUNiKDGOGLHRnYvkcgR39+vQwZ6dDdCei2QSYWIUVf4zQPm5w2kPQoSFOI3dplV7lH6uJoAAAAASUVORK5CYII=" alt="etherum" />
                                    </div>
                                    <div class="trading-price">
                                        70
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="container">
            <h1 style={{ textAlign: "center" }}>Introduction to basic Nami wallet functionalities</h1>
            <p>If you do not have Nami Wallet installed you can download Nami Wallet <a href="https://namiwallet.io/" target="_blank"> here</a>.</p>
            <div className="container">
                <div className="row" >
                    <h1> 1. Connect your website to Nami Wallet</h1>
                </div>
                <div className="row" >
                    <button className={`button ${connected ? "success" : ""}`} onClick={connect} > {connected ? "Connected" : "Connect to Nami"} </button>
                </div>
                <div className="row" >
                    <h1> 2. Retrieve your Nami wallet address</h1>
                </div>
                <div className="row" >
                    <button className={`button ${address ? "success" : ""}`} onClick={getAddress}> Get Your Ada address </button>
                    {address && <div className="item address">
                        <p>My Address:  {address} </p>
                    </div>}
                </div>
                <div className="row" >
                    <h1> 3. Retrieve your balance and NFTs</h1>
                </div>
                <div className="row" >
                    <button className={`button ${balance ? "success" : ""}`} onClick={getBalance}> Get Your Balance and NFTs </button>
                    {balance && <> <div className="column" >
                        <div className="item balance"><p>Balance ₳:  {balance / 1000000.} </p>

                        </div>


                        {nfts.map((nft) => {
                            return <>
                                <div className="item nft">
                                    <p>unit: {nft.unit}</p>
                                    <p>quantity: {nft.quantity}</p>
                                    <p>policy_id: {nft.policy}</p>
                                    <p>asset_name: {nft.name}</p>
                                    <p>fingerprint: {nft.fingerprint}</p>
                                </div>
                            </>

                        })}
                    </div>
                    </>
                    }

                </div>
                <div className="row" >
                    <h1> 4. Build Transaction</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(transaction) ? "success" : ""}`} onClick={() => { if (amount && recipientAddress) buildTransaction() }}> Build Transaction</button>
                    <div className="column" >



                        <div className="item address"><p> Amount</p><input style={{ width: "400px", height: "30px", }}
                            value={amount}
                            onChange={(event) => setAmount(event.target.value.toString())} /></div>

                        <div className="item address"><p> Recipient Address</p>
                            <input style={{ width: "400px", height: "30px" }}
                                value={recipientAddress}
                                onChange={(event) => setRecipientAddress(event.target.value.toString())} /></div>

                    </div>




                </div>

                <div className="row" >
                    <h1> 5. Sign Transaction</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(witnesses) ? "success" : ""}`} onClick={() => { if (transaction) signTransaction() }}> Sign Transaction</button>
                    <div className="column" >






                    </div>
                </div>
                <div className="row" >
                    <h1> 6. Submit Transaction</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(txHash) ? "success" : ""}`} onClick={() => { console.log(witnesses); if (witnesses) submitTransaction() }}> Submit Transaction</button>

                    <div className="column" >
                        <div className="item address">
                            <p>TxHash:  {txHash} </p>
                        </div>





                    </div>

                </div>
                <div className="row" >
                    <h1> 7. Create Policy Script</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(policy) ? "success" : ""}`} onClick={() => { if (policyExpiration) createPolicy() }}> Create Policy</button>

                    <div className="column" >
                        <p>Set Policy Expriaton Date: <DateTimePicker

                            onChange={setPolicyExpiration}
                            value={policyExpiration}
                            minDate={new Date()}
                        />
                        </p>
                        <div className="item address">

                            <p>policyId:  {policy?.id} </p>
                            <p>policyScript:  {policy?.script} </p>
                            <p>paymentKeyHash:  {policy?.paymentKeyHash} </p>
                            <p>ttl:  {policy?.ttl} </p>
                        </div>





                    </div>

                </div>



            </div>



            <div className="row" >
                <h1> 8. Build Full Transaction (incl. Minting)</h1>
            </div>
            <div className="row" >
                <button className={`button ${(complextxHash) ? "success" : ""}`} onClick={buildFullTransaction}> Build Transaction</button>
                <div className="column" >


                    <div className="item address">
                        <p>Complex TxHash:  {complextxHash} </p>
                    </div>

                    <div className="item address"><p> Recipients Input</p><textarea style={{ width: "400px", height: "500px", }}
                        value={JSON.stringify(complexTransaction)}
                        onChange={(event) => { setComplexTransaction((prevState) => ({ ...JSON.parse(event.target.value) })) }} />
                    </div>




                    <div className="item address"><p>Transaction Hash: </p> <textarea style={{ width: "400px", height: "500px", }}
                        value={builtTransaction} />

                    </div>
                </div>



            </div>


        </div>

    </>
    )
}

export default WalletData;