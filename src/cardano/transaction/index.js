import Cardano from "../serialization-lib";
import CoinSelection from "./coinSelection";
import ErrorTypes from "./error.types";
import Wallet from "../wallet";
import { languageViews } from "./languageViews";
import { fromHex, toHex } from "../../utils/converter";
import {getProtocolParameters, txEvaluate} from "../blockfrost-api";

const costModel = {
  plutusV1: 0,
  cost: [
  205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366,
    10475, 4, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100,
    23000, 100, 100, 100, 23000, 100, 19537, 32, 175354, 32, 46417, 4, 221973,
    511, 0, 1, 89141, 32, 497525, 14068, 4, 2, 196500, 453240, 220, 0, 1, 1,
    1000, 28662, 4, 2, 245000, 216773, 62, 1, 1060367, 12586, 1, 208512, 421,
    1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000, 32, 80556, 1,
    57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924, 473, 1,
    208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32, 16563, 32,
    76511, 32, 196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1, 60091, 32,
    196500, 453240, 220, 0, 1, 1, 196500, 453240, 220, 0, 1, 1, 806990, 30482,
    4, 1927926, 82523, 4, 265318, 0, 4, 0, 85931, 32, 205665, 812, 1, 1,
    41182, 32, 212342, 32, 31220, 32, 32696, 32, 43357, 32, 32247, 32, 38314,
    32, 9462713, 1021, 10,
  ],
};

export const assetsToValue = (assets) => {
  const multiAsset = Cardano.Instance.MultiAsset.new();
  const lovelace = assets.find((asset) => asset.unit === "lovelace");
  const policies = [
    ...new Set(
      assets
        .filter((asset) => asset.unit !== "lovelace")
        .map((asset) => asset.unit.slice(0, 56))
    ),
  ];
  policies.forEach((policy) => {
    const policyAssets = assets.filter(
      (asset) => asset.unit.slice(0, 56) === policy
    );
    const assetsValue = Cardano.Instance.Assets.new();
    policyAssets.forEach((asset) => {
      assetsValue.insert(
        Cardano.Instance.AssetName.new(fromHex(asset.unit.slice(56))),
        Cardano.Instance.BigNum.from_str(asset.quantity)
      );
    });
    multiAsset.insert(
      Cardano.Instance.ScriptHash.from_bytes(fromHex(policy)),
      assetsValue
    );
  });
  const value = Cardano.Instance.Value.new(
    Cardano.Instance.BigNum.from_str(lovelace ? lovelace.quantity : "0")
  );
  if (assets.length > 1 || !lovelace) value.set_multiasset(multiAsset);
  return value;
};

export const initializeTx = async () => {
  const metadata = {};

  const Parameters = await getProtocolParameters();
  console.log("[DAVID](initializeTx) Parameters = ", Parameters);
  const costmdls = Cardano.Instance.Costmdls.new();
  const costmdl = Cardano.Instance.CostModel.new();
  costModel.cost.forEach((cost, index) => {
    costmdl.set(index, Cardano.Instance.Int.new_i32(cost));
  });
  costmdls.insert(Cardano.Instance.Language.new_plutus_v1(), costmdl);
  const trBuilderConfig = Cardano.Instance.TransactionBuilderConfigBuilder.new()
    .coins_per_utxo_word(Cardano.Instance.BigNum.from_str(Parameters.coinsPerUtxoWord))
    .fee_algo(
      Cardano.Instance.LinearFee.new(
        Cardano.Instance.BigNum.from_str(Parameters.linearFee.minFeeA),
        Cardano.Instance.BigNum.from_str(Parameters.linearFee.minFeeB)))
    .key_deposit(Cardano.Instance.BigNum.from_str(Parameters.keyDeposit))
    .pool_deposit(Cardano.Instance.BigNum.from_str(Parameters.poolDeposit))
    .max_tx_size(Parameters.maxTxSize)
    .max_value_size(Parameters.maxValSize)
    .price_mem(Parameters.priceMem)
    .price_step(Parameters.priceStep)
    .costmdls(costmdls)
    .prefer_pure_change(false)
    .build();
  const txBuilder = Cardano.Instance.TransactionBuilder.new(trBuilderConfig);
  
  const datums = Cardano.Instance.PlutusList.new();

  const outputs = Cardano.Instance.TransactionOutputs.new();

  return { metadata, txBuilder, datums, outputs };
};

export const finalizeTx = async ({
  txBuilder,
  changeAddress,
  reqSigner,
  utxos,
  outputs,
  datums,
  metadata,
  action,
  assetUtxo,
  plutusScripts,
}) => {
  const Parameters = await getProtocolParameters();
  const transactionWitnessSet = Cardano.Instance.TransactionWitnessSet.new();
  CoinSelection.setProtocolParameters(
    Parameters.coinsPerUtxoWord,
    Parameters.linearFee.minFeeA,
    Parameters.linearFee.minFeeB,
    Parameters.maxTxSize.toString()
  );

  let inputs = [...utxos];
  if (assetUtxo) {
    inputs.push(assetUtxo);
  }

  let { input, change } = CoinSelection.randomImprove(inputs, outputs, 16);
  input.forEach((utxo) => {
    txBuilder.add_input(
      utxo.output().address(),
      utxo.input(),
      utxo.output().amount()
    );
  });
  
  for (let i = 0; i < outputs.len(); i++) {
    const txOut = outputs.get(i)
    txBuilder.add_output(txOut);
  }

  let scriptDataHash;
  if (plutusScripts) {
    const redeemers = Cardano.Instance.Redeemers.new();
    const redeemerIndex = txBuilder
      .index_of_input(assetUtxo.input())
      .toString();
    redeemers.add(action(redeemerIndex));
    txBuilder.set_redeemers(
      Cardano.Instance.Redeemers.from_bytes(redeemers.to_bytes())
    );
    txBuilder.set_plutus_data(
      Cardano.Instance.PlutusList.from_bytes(datums.to_bytes())
    );
    txBuilder.set_plutus_scripts(plutusScripts);
    
    const collateral = (await Wallet.getCollateral()).map((utxo) =>
      Cardano.Instance.TransactionUnspentOutput.from_bytes(fromHex(utxo))
    );
    setCollateral(txBuilder, collateral);
    transactionWitnessSet.set_plutus_scripts(plutusScripts);
    transactionWitnessSet.set_plutus_data(datums);
    transactionWitnessSet.set_redeemers(redeemers);

    const costmdls = Cardano.Instance.Costmdls.new();
    const costmdl = Cardano.Instance.CostModel.new();
    costModel.cost.forEach((cost, index) => {
      costmdl.set(index, Cardano.Instance.Int.new_i32(cost));
    });
    costmdls.insert(Cardano.Instance.Language.new_plutus_v1(), costmdl);
    scriptDataHash = Cardano.Instance.hash_script_data(
      redeemers, 
      costmdls, 
      datums
    );
    console.log("[DAVID](plutusScripts) scriptDataHash = ", toHex(scriptDataHash.to_bytes()));
    // txBuilder.set_script_data_hash(scriptDataHash);
  }

  let aux_data;

  console.log("[DAVID](finalizeTx) ----------- 3 ----- ");
  if (metadata) {
    aux_data = Cardano.Instance.AuxiliaryData.new();
    const generalMetadata = Cardano.Instance.GeneralTransactionMetadata.new();
    generalMetadata.insert(
      Cardano.Instance.BigNum.from_str("100"),
      Cardano.Instance.encode_json_str_to_metadatum(JSON.stringify(metadata), 1)
    );

    aux_data.set_metadata(generalMetadata);
    txBuilder.set_auxiliary_data(aux_data);
  }

  const changeMultiAssets = change.multiasset();

  console.log("[DAVID](finalizeTx) ----------- 5 ----- changeMultiAssets = ", changeMultiAssets);
  // check if change value is too big for single output
  if (
    changeMultiAssets &&
    change.to_bytes().length * 2 > Parameters.maxValSize
  ) {
    const partialChange = Cardano.Instance.Value.new(
      Cardano.Instance.BigNum.from_str("0")
    );

    const partialMultiAssets = Cardano.Instance.MultiAsset.new();
    const policies = changeMultiAssets.keys();
    const makeSplit = () => {
      for (let j = 0; j < changeMultiAssets.len(); j++) {
        const policy = policies.get(j);
        const policyAssets = changeMultiAssets.get(policy);
        const assetNames = policyAssets.keys();
        const assets = Cardano.Instance.Assets.new();
        for (let k = 0; k < assetNames.len(); k++) {
          const policyAsset = assetNames.get(k);
          const quantity = policyAssets.get(policyAsset);
          assets.insert(policyAsset, quantity);
          //check size
          const checkMultiAssets = Cardano.Instance.MultiAsset.from_bytes(
            partialMultiAssets.to_bytes()
          );
          checkMultiAssets.insert(policy, assets);
          const checkValue = Cardano.Instance.Value.new(
            Cardano.Instance.BigNum.from_str("0")
          );
          checkValue.set_multiasset(checkMultiAssets);
          if (checkValue.to_bytes().length * 2 >= Parameters.maxValSize) {
            partialMultiAssets.insert(policy, assets);
            return;
          }
        }
        partialMultiAssets.insert(policy, assets);
      }
    };
    console.log("[DAVID](cancelListing) ----------- 6 ----- ");
    makeSplit();
    partialChange.set_multiasset(partialMultiAssets);
    const minAda = Cardano.Instance.min_ada_required(
      partialChange,
      false,
      Cardano.Instance.BigNum.from_str(Parameters.coinsPerUtxoWord)
    );
    partialChange.set_coin(minAda);

    console.log("[DAVID](cancelListing) ----------- 7 ----- ");
    txBuilder.add_output(
      Cardano.Instance.TransactionOutput.new(
        changeAddress.to_address(),
        partialChange
      )
    );
  }

  console.log("[DAVID](finalizeTx) ----------- 8 ----- ");
  try {
    txBuilder.add_change_if_needed(changeAddress.to_address());
  } catch (error) {
    throw new Error("INPUTS_EXHAUSTED");
  }

  // console.log("[DAVID](finalizeTx) ----------- 9 ----- ", txBuilder);
  // let inpVal = txBuilder.get_total_input();
  // let outVal = txBuilder.get_total_output();
  // let fee = inpVal.checked_sub(outVal);
  // console.log("[DAVID](finalizeTx) ----------- 9.1 ----- ", fee.to_json());
  
  const txBody = txBuilder.build();

  if (scriptDataHash) {
    txBody.set_script_data_hash(scriptDataHash);
  }
  // if (reqSigner) {
  //   const reqSigners = Cardano.Instance.Ed25519KeyHashes.new();
  //   reqSigners.add(
  //     reqSigner.payment_cred().to_keyhash()
  //   );
  //   txBody.set_required_signers(reqSigners);
  // }
  console.log("[DAVID](finalizeTx) ----------- 10 ----- "); 
  let tx = Cardano.Instance.Transaction.new(
    txBody,
    Cardano.Instance.TransactionWitnessSet.from_bytes(
      transactionWitnessSet.to_bytes()
    ),
    aux_data
  );

  console.log("[DAVID](finalizeTx) ----------- 10.1 ----- "); //, tx.to_json()
  const size = tx.to_bytes().length * 2;
  if (size > Parameters.maxTxSize) throw new Error(ErrorTypes.MAX_SIZE_REACHED);

  console.log("[DAVID](finalizeTx) ----------- 10.2 ----- ");
  let txVkeyWitnesses = await Wallet.signTx(toHex(tx.to_bytes()), true);
  txVkeyWitnesses = Cardano.Instance.TransactionWitnessSet.from_bytes(
    fromHex(txVkeyWitnesses)
  );

  console.log("[DAVID](finalizeTx) ----------- 11 ----- ");
  transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());

  console.log("[DAVID](finalizeTx) ----------- 12 ----- ");
  const signedTx = Cardano.Instance.Transaction.new(
    tx.body(),
    transactionWitnessSet,
    tx.auxiliary_data()
  );

  console.log("[DAVID](finalizeTx) ----------- 13 ----- ");
  const txHash = await Wallet.submitTx(toHex(signedTx.to_bytes()));

  console.log("[DAVID](finalizeTx) ----------- 14 ----- ");
  return txHash;
};

export const createTxOutput = async (address, value, { datum } = {}) => {
  const Parameters = await getProtocolParameters();
  let hasDataHash = false;
  if (datum && Cardano.Instance.hash_plutus_data(datum))
    hasDataHash = true;
  const minAda = Cardano.Instance.min_ada_required(
    value,
    hasDataHash,
    Cardano.Instance.BigNum.from_str(Parameters.coinsPerUtxoWord),
  );
  if (minAda.compare(value.coin()) === 1) value.set_coin(minAda);
  const output = Cardano.Instance.TransactionOutput.new(address, value);
  if (datum) {
    output.set_data_hash(Cardano.Instance.hash_plutus_data(datum));
  }
  return output;
};

/**
 * @throws COULD_NOT_CREATE_TRANSACTION_UNSPENT_OUTPUT
 */
export const createTxUnspentOutput = (address, utxo) => {
  try {
    return Cardano.Instance.TransactionUnspentOutput.new(
      Cardano.Instance.TransactionInput.new(
        Cardano.Instance.TransactionHash.from_bytes(fromHex(utxo.tx_hash)),
        utxo.output_index
      ),
      Cardano.Instance.TransactionOutput.new(
        address,
        assetsToValue(utxo.amount)
      )
    );
  } catch (error) {
    console.error(
      `Unexpected error in createTxUnspentOutput. [Message: ${error.message}]`
    );
    throw new Error(ErrorTypes.COULD_NOT_CREATE_TRANSACTION_UNSPENT_OUTPUT);
  }
};

/**
 * @throws COULD_NOT_SERIALIZE_TRANSACTION_UNSPENT_OUTPUT
 */
export const serializeTxUnspentOutput = (hexEncodedBytes) => {
  try {
    return Cardano.Instance.TransactionUnspentOutput.from_bytes(
      fromHex(hexEncodedBytes)
    );
  } catch (error) {
    console.error(
      `Unexpected error in serializeTxUnspentOutput. [Message: ${error.message}]`
    );
    throw new Error(ErrorTypes.COULD_NOT_SERIALIZE_TRANSACTION_UNSPENT_OUTPUT);
  }
};

export const valueToAssets = (value) => {
  const assets = [];
  assets.push({ unit: "lovelace", quantity: value.coin().to_str() });
  if (value.multiasset()) {
    const multiAssets = value.multiasset().keys();
    for (let j = 0; j < multiAssets.len(); j++) {
      const policy = multiAssets.get(j);
      const policyAssets = value.multiasset().get(policy);
      const assetNames = policyAssets.keys();
      for (let k = 0; k < assetNames.len(); k++) {
        const policyAsset = assetNames.get(k);
        const quantity = policyAssets.get(policyAsset);
        const asset = toHex(policy.to_bytes()) + toHex(policyAsset.name());
        assets.push({
          unit: asset,
          quantity: quantity.to_str(),
        });
      }
    }
  }
  return assets;
};

// const getProtocolParameters = () => {
//   return parseInt(process.env.REACT_APP_CARDANO_NETWORK_ID) === 0
//     ? {
//       linearFee: {
//         minFeeA: "44",
//         minFeeB: "155381",
//       },
//       minUtxo: "34482",
//       poolDeposit: "500000000",
//       keyDeposit: "2000000",
//       maxValSize: 5000,
//       maxTxSize: 16384,
//       priceMem: 0.0577,
//       priceStep: 0.0000721,
//       coinsPerUtxoWord: "1000000",
//     }
//     : {
//       linearFee: {
//         minFeeA: "44",
//         minFeeB: "155381",
//       },
//       minUtxo: "34482",
//       poolDeposit: "500000000",
//       keyDeposit: "2000000",
//       maxValSize: 5000,
//       maxTxSize: 16384,
//       priceMem: 0.0577,
//       priceStep: 0.0000721,
//       coinsPerUtxoWord: "1000000",
//     };
// };

const setCollateralV11 = (txBuilder, utxos) => {
  const inputs = Cardano.Instance.TxInputsBuilder.new();

  utxos.forEach((utxo) => {
    inputs.add_input(utxo.output().address(), utxo.input(), utxo.output().amount());
  });

  txBuilder.set_collateral(inputs);
};

const setCollateral = (txBuilder, utxos) => {
  const inputs = Cardano.Instance.TransactionInputs.new();

  utxos.forEach((utxo) => {
    inputs.add(utxo.input());
    txBuilder.add_address_witness(utxo.output().address());
  });

  txBuilder.set_collateral(inputs);
};

const setCollateralByBody = (txBody, utxos) => {
  const inputs = Cardano.Instance.TxInputsBuilder.new();

  utxos.forEach((utxo) => {
    inputs.add_input(utxo.output().address(), utxo.input(), utxo.output().amount());
  });

  txBody.set_collateral(inputs);
};
