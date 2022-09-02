import {
    Address,
    BaseAddress,
    MultiAsset,
    Assets,
    ScriptHash,
    Costmdls,
    Language,
    CostModel,
    AssetName,
    TransactionUnspentOutput,
    TransactionUnspentOutputs,
    TransactionOutput,
    Value,
    TransactionBuilder,
    TransactionBuilderConfigBuilder,
    TransactionOutputBuilder,
    LinearFee,
    BigNum,
    BigInt,
    TransactionHash,
    TransactionInputs,
    TransactionInput,
    TransactionWitnessSet,
    Transaction,
    PlutusData,
    PlutusScripts,
    PlutusScript,
    PlutusList,
    Redeemers,
    Redeemer,
    RedeemerTag,
    Ed25519KeyHashes,
    ConstrPlutusData,
    ExUnits,
    Int,
    NetworkInfo,
    EnterpriseAddress,
    TransactionOutputs,
    hash_transaction,
    hash_script_data,
    hash_plutus_data,
    ScriptDataHash, Ed25519KeyHash, NativeScript, StakeCredential
} from "@emurgo/cardano-serialization-lib-asmjs"
import { blake2b } from "blakejs";
let Buffer = require('buffer/').Buffer
let blake = require('blakejs')

let selectedWallet;

class CardanoWalletAPI {
    constructor(wallet) {
        selectedWallet = wallet;
        this.Wallet = window.cardano
    }

    getWallet = () => {
        return this.Wallet;
    };

    isInstalled = async () => {
        if (this.Wallet) return true
        else return false
    };

    isEnabled = async () => {
        return await this.Wallet.isEnabled()
    };

    enable = async () => {
        if (!await this.isEnabled()) {
            try {
                return await this.Wallet.enable()
            } catch (error) {
                throw error
            }
        }
    };
}

export default CardanoWalletAPI;