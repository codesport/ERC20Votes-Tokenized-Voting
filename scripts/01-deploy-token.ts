// npx ts-node scripts/01-deploy-token arg1 arg2

import { publicClient, walletClient, contractAddressStoragePath, fs} from "./config";
import { abi, bytecode } from "../artifacts/contracts/VoteToken.sol/VoteToken.json";


//uses ERC20Votes: https://docs.openzeppelin.com/contracts/5.x/api/governance#Votes-delegate-address-
async function main() {

	const hash = await walletClient.deployContract({
		abi,
		bytecode: bytecode as `0x${string}`, // hexadecimal string, which is the standard format for Ethereum bytecode.
		// args: [proposals.map((prop) => toHex(prop, { size: 32 }))],
	});

	console.log("Transaction hash:", hash);

	const receipt = await publicClient.waitForTransactionReceipt({ hash });
	console.log("Token contract deployed to:", receipt.contractAddress);
    const variables = {"tokenAddress":receipt.contractAddress}

    fs.writeFileSync(contractAddressStoragePath, JSON.stringify(variables));

}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});