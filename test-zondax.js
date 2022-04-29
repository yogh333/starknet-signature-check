const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const StarkwareApp = require("@zondax/ledger-starkware-app").default;
const { BigNumber } = require("@ethersproject/bignumber");

const { defaultProvider, hash, ec } = require("starknet");

// deploy a contract
// (1) Get HEX pubkey from Ledger device
// (2) Deploy an ArgentAccount:
//     nile deploy --network goerli ArgentAccount
// (3) Set public key as a signer
//     nile invoke --network goerli AccountAddress initialize 0x000eda9fbfb29cceedc4db73620abc7a8bf68459ab7c93283c477a2c62e70270 0
// (3) Put the account address address in ACCOUNT_ADDRESS

const main = async () => {
  const PATH = "m/2645'/579218131'/0'/0'";
  const MESSAGE =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. 123";

  const HASH = hash.starknetKeccak(MESSAGE).toString("hex");
  console.log("HASH = " + HASH);

  const transport = await TransportNodeHid.create();
  const app = new StarkwareApp(transport);

  try {
    const res = await app.getPubKey(PATH);
    const starkPub = `0x${res.publicKey.slice(1, 32 + 1).toString("hex")}`;

    console.log("starkPub HEX", starkPub);
    console.log("starkPub DEC", BigNumber.from(starkPub).toString());

    /* get signer from account contract */
    const ACCOUNT_ADDRESS =
      "0x0537d40f5344592d5556af59ec7b16a1a4ff6e155c055a983a71d13b0ab3e81a";
    const { result } = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "get_signer",
      calldata: [],
    });
    console.log("signer   HEX", result[0]);

    const signature = await app.signFelt(PATH, HASH);
    //console.log(signature);
    //console.log(signature.r.length, signature.r.toString("hex"));
    //console.log(signature.s.length, signature.s.toString("hex"));

    const r = BigNumber.from(signature.r);
    const s = BigNumber.from(signature.s);
    const hash = BigNumber.from("0x" + HASH);

    console.log("hash = " + hash);

    /* check signature locally */
    const kp = ec.getKeyPairFromPublicKey("0x" + res.publicKey.toString("hex"));

    console.log(ec.verify(kp, HASH, [r.toString(), s.toString()]));

    /* check signature on-chain */
    const isValid = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "is_valid_signature",
      calldata: [hash.toString(), "2", r.toString(), s.toString()],
    });
    console.log(isValid);
  } catch (error) {
    console.log(error);
  }
};

main();
