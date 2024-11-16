// npx ts-node scripts/05-deploy-ballot.ts

import { publicClient, walletClient, readKeyValue, appendKeyValue, requestUserInput } from "./config";
import { abi, bytecode } from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import { toHex } from "viem";


async function main() {

    let proposalCount = await requestUserInput('Sir, you look more handsome each day! Tell me, how many proposals will we be submitting? ');   
    let proposals: string[] = []  //Must initialize all variables in TS: error TS2454: Variable 'proposals' is used before being assigned.
    
    for (let i = 0; i < Number(proposalCount); i++) {

        proposals[i] = await requestUserInput(`   Enter the name of proposal #${i +1}: `);

    }

    // console.log(proposals)

    const blockNumber = await publicClient.getBlockNumber();
    const voteTokenAddress = readKeyValue('tokenAddress')

//     console.log(blockNumber)
//     process.exit(0) //graceful exit
//    console.log(blockNumber)

    console.log( `\nRead JSON storage file.  We will attach to the token contract at: ${voteTokenAddress}`)
	const hash = await walletClient.deployContract({
		abi,
		bytecode: bytecode as `0x${string}`, // hexadecimal string, which is the standard format for Ethereum bytecode.
		args: [   proposals.map((prop) => toHex(prop, { size: 32 })), voteTokenAddress, blockNumber - 2n    ],
	});

	console.log(`\nTransaction hash: ${hash}`);

	const receipt = await publicClient.waitForTransactionReceipt({ hash });
    // const receipt = await publicClient.waitForTransactionReceipt({ hash: customnameTxHash });

	console.log("Ballot contract successfully deployed to:", receipt.contractAddress);
    const ballotAddressToSave = {"ballotAddress":receipt.contractAddress}
        
    appendKeyValue(ballotAddressToSave)

        console.log('These proposals were saved on-chain:', proposals)
        console.log(`\nSummary Contract Deploy Data from Receipt Object`)

        console.log(` * Transaction Receipt Status:`, receipt.status)
        console.log(' * Block Number:', receipt.blockNumber)
        console.log(' * Transaction Hash:', receipt.transactionHash )
        console.log(' * From Address:', receipt.from )
        console.log(' * To Address:', receipt.to)
        console.log(' * Deployed Contract Address:', receipt.contractAddress);
}



main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


