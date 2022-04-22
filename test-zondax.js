const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const StarkwareApp = require("@zondax/ledger-starkware-app").default;
const { BigNumber } = require("@ethersproject/bignumber");

const { defaultProvider, hash, ec } = require("starknet");

// deploy a contract
// (1) Get HEX pubkey from Ledger device
// (2) Deploy an ArgentAccount:
//     nile deploy --network goerli ArgentAccount
// (3) Set public key as a signer
//     nile invoke --network goerli AccountAddress initialize 0x06e7cc973ed172ad13233d921ec8bba7ffd0071471199a6075894045756e0238 0
// (3) Put the account address address in ACCOUNT_ADDRESS

const main = async () => {
  const PATH = "m/2645'/579218131'/0'/0'";
  const MESSAGE =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. 123";

  const ACCOUNT_ADDRESS =
    "0x01bb7aa6031083a8dc0c58aced8918daf5dba82f06850d3daa881b8607ab3f07";

  const MESSAGE_HASH = hash.starknetKeccak(MESSAGE).toBuffer("be", 32);

  console.log("MESSAGE HASH = " + MESSAGE_HASH.toString("hex"));

  const transport = await TransportNodeHid.create();
  const app = new StarkwareApp(transport);

  try {
    const res = await app.getPubKey(PATH);
    const starkPub = `0x${res.publicKey.slice(1, 32 + 1).toString("hex")}`;

    console.log("starkPub HEX", starkPub);
    console.log("starkPub DEC", BigNumber.from(starkPub).toString());

    /* get signer from account contract */
    /*const { result } = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "get_signer",
      calldata: [],
    });
    console.log("signer   HEX", result[0]);*/

    const signature = await app.signFelt(PATH, MESSAGE_HASH);
    console.log(signature);
    console.log(signature.r.length, signature.r.toString("hex"));
    console.log(signature.s.length, signature.s.toString("hex"));

    const r = BigNumber.from(signature.r);
    const s = BigNumber.from(signature.s);
    const hash = BigNumber.from(MESSAGE_HASH);

    console.log("hash BN= " + hash);
    console.log("r BN= " + r.toString());
    console.log("s BN= " + s.toString());

    /* check signature locally */
    const kp = ec.getKeyPairFromPublicKey("0x" + res.publicKey.toString("hex"));

    const kp_pub = ec.getStarkKey(kp);
    console.log("kp_pub", kp_pub);

    console.log(
      ec.verify(kp, "0x" + MESSAGE_HASH.toString("hex"), [
        r.toString(),
        s.toString(),
      ])
    );

    /* check signature on-chain */
    /*const isValid = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "is_valid_signature",
      calldata: [hash.toString(), "2", r.toString(), s.toString()],
    });
    console.log(isValid);*/
  } catch (error) {
    console.log(error);
  }
};

main();
