const { defaultProvider, hash, ec } = require("starknet");

const main = async () => {
  for (i = 0; i < 10000; i++) {
    const result = Math.random().toString(20).slice(2, 50);
    const MESSAGE = result;
    const HASH = hash.starknetKeccak(MESSAGE).toString("hex");
    console.log(
      "MESSAGE = " + MESSAGE + " HASH " + HASH + " length = " + HASH.length
    );
  }
};

main();
