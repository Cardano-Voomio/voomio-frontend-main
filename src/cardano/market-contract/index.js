import Cardano from "../serialization-lib";
import ErrorTypes from "./error.types";
import { serializeSale, deserializeSale } from "./datums";
import { BUYER, SELLER } from "./redeemers";
import { contractAddress, contractScripts } from "./validator";
import {
  assetsToValue,
  createTxOutput,
  finalizeTx,
  initializeTx,
  serializeTxUnspentOutput,
} from "../transaction";
import { toHex } from "../../utils/converter";

export const listAsset = async (
  datum,
  seller: { address: BaseAddress, utxos: [] },
  version
) => {
  try {
    let { txBuilder, datums, outputs } = await initializeTx();
    const utxos = seller.utxos.map((utxo) => serializeTxUnspentOutput(utxo));

    const lockAssetDatum = serializeSale(datum);
    datums.add(lockAssetDatum);
    const trOut = await createTxOutput(
      contractAddress(version),
      assetsToValue([
        {
          unit: `${datum.cs}${datum.tn}`,
          quantity: "1",
        },
        { unit: "lovelace", quantity: "2000000" },
      ]),
      { datum: lockAssetDatum }
    );
    outputs.add(trOut);
    const datumHash = toHex(
      Cardano.Instance.hash_plutus_data(lockAssetDatum).to_bytes()
    );
    const txHash = await finalizeTx({
      txBuilder,
      datums,
      utxos,
      outputs,
      changeAddress: seller.address,
      metadata: deserializeSale(lockAssetDatum),
    });
    return {
      datumHash,
      txHash,
    };
  } catch (error) {
    handleError(error, "listAsset");
  }
};

export const updateListing = async (
  currentDatum,
  newDatum,
  seller: { address: BaseAddress, utxos: [] },
  assetUtxo,
  currentVersion,
  latestVersion
) => {
  try {
    const { txBuilder, datums, outputs } = await initializeTx();
    const utxos = seller.utxos.map((utxo) => serializeTxUnspentOutput(utxo));

    const currentListingDatum = serializeSale(currentDatum);
    datums.add(currentListingDatum);

    const newListingDatum = serializeSale(newDatum);
    datums.add(newListingDatum);
    const trOut = await createTxOutput(
      contractAddress(latestVersion),
      assetUtxo.output().amount(),
      {
        datum: newListingDatum,
      }
    )
    outputs.add(trOut);

    // txBuilder.add_required_signer(seller.address.payment_cred().to_keyhash());

    const datumHash = toHex(
      Cardano.Instance.hash_plutus_data(newListingDatum).to_bytes()
    );

    const txHash = await finalizeTx({
      txBuilder,
      datums,
      utxos,
      outputs,
      reqSigner: seller.address,
      changeAddress: seller.address,
      metadata: deserializeSale(newListingDatum),
      assetUtxo,
      plutusScripts: contractScripts(currentVersion),
      action: SELLER,
    });

    return {
      datumHash,
      txHash,
    };
  } catch (error) {
    handleError(error, "updateListing");
  }
};

export const cancelListing = async (
  datum,
  seller: { address: BaseAddress, utxos: [] },
  assetUtxo,
  version
) => {
  try {
    const { txBuilder, datums, outputs } = await initializeTx();
    const utxos = seller.utxos.map((utxo) => serializeTxUnspentOutput(utxo));
    const cancelListingDatum = serializeSale(datum);
    datums.add(cancelListingDatum);
    const trOut = await createTxOutput(seller.address.to_address(), assetUtxo.output().amount());
    outputs.add(trOut);
    const requiredSigners = Cardano.Instance.Ed25519KeyHashes.new();
    requiredSigners.add(
      seller.address.payment_cred().to_keyhash()
    );
    txBuilder.set_required_signers(requiredSigners);
    const txHash = await finalizeTx({
      txBuilder,
      datums,
      utxos,
      outputs,
      changeAddress: seller.address,
      reqSigner: seller.address,
      assetUtxo,
      plutusScripts: contractScripts(version),
      action: SELLER,
    });

    return txHash;
  } catch (error) {
    handleError(error, "cancelListing");
  }
};

export const purchaseAsset = async (
  datum,
  buyer: { address: BaseAddress, utxos: [] },
  beneficiaries: {
    seller: BaseAddress,
    artist: BaseAddress,
    market: BaseAddress,
  },
  assetUtxo,
  version
) => {
  try {
    const { txBuilder, datums, outputs } = await initializeTx();
    const utxos = buyer.utxos.map((utxo) => serializeTxUnspentOutput(utxo));

    const purchaseAssetDatum = serializeSale(datum);
    datums.add(purchaseAssetDatum);
    const trOut = await createTxOutput(buyer.address.to_address(), assetUtxo.output().amount())
    outputs.add(trOut);

    await splitAmount(
      beneficiaries,
      {
        price: datum.price,
        royalties: datum.rp,
      },
      outputs
    );

    // txBuilder.add_required_signer(buyer.address.payment_cred().to_keyhash());
    const requiredSigners = Cardano.Instance.Ed25519KeyHashes.new();
    requiredSigners.add(
      buyer.address.payment_cred().to_keyhash()
    );
    txBuilder.set_required_signers(requiredSigners);
    const txHash = await finalizeTx({
      txBuilder,
      utxos,
      outputs,
      datums,
      changeAddress: buyer.address,
      assetUtxo,
      reqSigner: buyer.address,
      plutusScripts: contractScripts(version),
      action: BUYER,
    });

    return txHash;
  } catch (error) {
    handleError(error, "purchaseAsset");
  }
};

const handleError = (error, source) => {
  console.error(`Unexpected error in ${source}. [Message: ${error.message}]`, error);

  switch (error.message) {
    case "INPUT_LIMIT_EXCEEDED":
      throw new Error(ErrorTypes.TRANSACTION_FAILED_SO_MANY_UTXOS);
    case "INPUTS_EXHAUSTED":
      throw new Error(ErrorTypes.TRANSACTION_FAILED_NOT_ENOUGH_FUNDS);
    case "MIN_UTXO_ERROR":
      throw new Error(ErrorTypes.TRANSACTION_FAILED_CHANGE_TOO_SMALL);
    case "MAX_SIZE_REACHED":
      throw new Error(ErrorTypes.TRANSACTION_FAILED_MAX_TX_SIZE_REACHED);
    default:
      if (error.message.search("NonOutputSupplimentaryDatums") !== -1) {
        throw new Error(ErrorTypes.TRANSACTION_FAILED_DATUMS_NOT_MATCHING);
      } else if (error.message.search("MissingScriptWitnessesUTXOW") !== -1) {
        throw new Error(ErrorTypes.TRANSACTION_FAILED_WRONG_SCRIPT_CONTRACT);
      } else if (error.message.search("OutputTooSmallUTxO") !== -1) {
        throw new Error(ErrorTypes.TRANSACTION_FAILED_ASSET_NOT_SPENDABLE);
      }
      throw error;
  }
};

const splitAmount = async (
  { seller, artist, market },
  { price, royalties },
  outputs
) => {
  const minimumAmount = 1000000;
  const marketFeePercentage = 1 / 100;
  const royaltyFeePercentage = royalties / 1000;

  const royaltyFees = Math.max(royaltyFeePercentage * price, minimumAmount);
  let trOut = await createTxOutput(
    artist.to_address(),
    assetsToValue([{ unit: "lovelace", quantity: `${royaltyFees}` }])
  );
  outputs.add(trOut);
  if (market) {
    const marketFees = Math.max(marketFeePercentage * price, minimumAmount);
    trOut = await createTxOutput(
      market.to_address(),
      assetsToValue([{ unit: "lovelace", quantity: `${marketFees}` }])
    )
    outputs.add(trOut);
  }

  const netPrice =
    price - royaltyFeePercentage * price - marketFeePercentage * price;
  trOut = await createTxOutput(
    seller.to_address(),
    assetsToValue([
      { unit: "lovelace", quantity: `${Math.max(netPrice, minimumAmount)}` },
    ])
  );
  outputs.add(trOut);
};
