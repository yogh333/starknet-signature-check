const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const Eth = require("@ledgerhq/hw-app-eth").default;
const { BigNumber } = require("@ethersproject/bignumber");

const { defaultProvider, hash, ec } = require("starknet");

// deploy a contract
// (1) Get HEX pubkey from Ledger device
// (2) Deploy an ArgentAccount:
//     nile deploy --network goerli ArgentAccount
// (3) Set public key as a signer
//     nile invoke --network goerli AccountAddress initialize 0x04ba080a863da2b0f16f754769fe2e18365e6d3d640f12babe97b4f586808ab5 0
// (3) Put the account address address in ACCOUNT_ADDRESS

function hexZeroPad(hash, length) {
  let value = hash;
  console.log("value = " + value);
  if (value.length > 2 * length + 2) {
    throw new Error("value out of range");
  }
  while (value.length < 2 * length + 2) {
    value = `0x0${value.substring(2)}`;
  }
  return value;
}

function fixMessage(msg) {
  const pureHex = msg.replace(/^0x0*/, "");

  if (pureHex.length <= 62) {
    // In this case, pureHex should not be transformed, as the byteLength() is at most 31,
    // so delta < 0 (see _truncateToN).
    return pureHex;
  }
  //assert(pureHex.length === 63);
  // In this case delta will be 4 so we perform a shift-left of 4 bits by adding a ZERO_BN.
  return `${pureHex}0`;
}

const main = async () => {
  const PATH = "/2645'/579218131'/0'/0'/0";
  const MESSAGE =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. 123";

  const MESSAGE_HASH = hash.starknetKeccak(MESSAGE).toString("hex");

  console.log("HASH = " + MESSAGE_HASH.toString("hex"));

  const transport = await TransportNodeHid.create();
  const app = new Eth(transport);

  try {
    const res = await app.starkGetPublicKey(PATH);
    const starkPub = `0x${res.slice(1, 1 + 32).toString("hex")}`;

    console.log("starkPub HEX", starkPub);
    console.log("starkPub DEC", BigNumber.from(starkPub).toString());

    const ACCOUNT_ADDRESS =
      "0x065587b4410f4b7e68467b363a8fb87b19330456bc315eb76c2ee930d53ea269";
    /*const { result } = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "get_signer",
      calldata: [],
    });

    console.log("signer   HEX", result[0]);
    */

    const msgHash = fixMessage(MESSAGE_HASH);
    console.log("msgHash = " + msgHash);
    const signature = await app.starkUnsafeSign(PATH, msgHash);

    console.log(signature);

    const r = BigNumber.from("0x" + signature.r);
    const s = BigNumber.from("0x" + signature.s);

    console.log("r BN= " + r.toString());
    console.log("s BN= " + s.toString());

    /* check signature locally */
    const kp = ec.getKeyPairFromPublicKey(res);
    console.log(ec.verify(kp, MESSAGE_HASH, [r.toString(), s.toString()]));
    /* end of local check */

    /*
    const hash = BigNumber.from("0x" + msgHash);
    const isValid = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "is_valid_signature",
      calldata: [hash.toString(), "2", r.toString(), s.toString()],
    });
    console.log(isValid);
    */
  } catch (error) {
    console.log(error);
  }
};

main();
