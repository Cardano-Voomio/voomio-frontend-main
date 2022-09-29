import Cardano from "../serialization-lib";
import Contracts from "./plutus";
import { fromHex } from "../../utils/converter";

export const contractAddress = (version) => {
  return Cardano.Instance.Address.from_bech32(Contracts[version].address);
};

export const contractScripts = (version) => {
  const scripts = Cardano.Instance.PlutusScripts.new();

  scripts.add(Cardano.Instance.PlutusScript.new(fromHex(Contracts[version].cborHex)));

  return scripts;
};

export const contractScriptsWithVersion = (version) => {
  const scripts = Cardano.Instance.PlutusScripts.new();

  const language = Cardano.Instance.Language.new_plutus_v1();
  scripts.add(
    Cardano.Instance.PlutusScript.new_with_version(
    fromHex(Contracts[version].cborHex), language)
  );
  return scripts;
};

