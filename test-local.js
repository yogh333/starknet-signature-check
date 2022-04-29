const { BigNumber } = require("@ethersproject/bignumber");
const { defaultProvider, hash, ec, stark } = require("starknet");

// deploy a contract
// (1) Get HEX pubkey from Ledger device
// (2) Deploy an ArgentAccount:
//     nile deploy --network goerli ArgentAccount
// (3) Set public key as a signer
//     nile invoke --network goerli AccountAddress initialize 0x02dd3a230ec2d99d8fd070460433afd223831b896210af37a4574c660b726ef2 0
// (3) Put the account address address in ACCOUNT_ADDRESS

const main = async () => {
  const privateKey =
    "0x04a2c3811d30daef56d3025ab276ebe6bdfc70a8fc0bf22e9b8398af5954d8ef";
  console.log("Private Key = " + privateKey);

  const starkKeyPair = ec.getKeyPair(privateKey);
  const starkKeyPub = ec.getStarkKey(starkKeyPair);
  console.log("starkPub HEX", starkKeyPub);

  const MESSAGE =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. 123";
  const MESSAGE_HASH = hash.starknetKeccak(MESSAGE).toString("hex");

  const ACCOUNT_ADDRESS =
    "0x0537d40f5344592d5556af59ec7b16a1a4ff6e155c055a983a71d13b0ab3e81a";

  console.log("HASH = " + MESSAGE_HASH);

  try {
    console.log("starkPub HEX", starkKeyPub);
    console.log("starkPub DEC", BigNumber.from(starkKeyPub).toString());

    const { result } = await defaultProvider.callContract({
      contractAddress: ACCOUNT_ADDRESS,
      entrypoint: "get_signer",
      calldata: [],
    });

    console.log("signer   HEX", result[0]);

    const signature = ec.sign(starkKeyPair, MESSAGE_HASH);

    console.log(signature);

    /* check signature locally */
    console.log(ec.verify(starkKeyPair, MESSAGE_HASH, signature));
    /* end of local check */

    const r = BigNumber.from(signature[0]);
    const s = BigNumber.from(signature[1]);

    const hash = BigNumber.from("0x" + MESSAGE_HASH);

    console.log("hash = " + hash);

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
