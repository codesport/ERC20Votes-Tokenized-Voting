// npx ts-node scripts/02-mint-tokens.ts

import { publicClient, walletClient, requestUserInput, isCryptoAddress, readKeyValue } from "./config";
import { abi } from "../artifacts/contracts/VoteToken.sol/VoteToken.json";
import { Address, formatEther,  parseEther, toHex, hexToString } from "viem";
import * as readline from "readline";



const main = async () => {

    /**
    * CLI function to verify user inputs. depends on `import * as readline from "readline";`
    * 
    *
    * @param message - The confirmation message.
    * @returns Promise resolving to true if confirmed, false otherwise.
    *
    * @see https://viem.sh/docs/contract/writeContract.html#usage
    */
    //NB: Pair writeContract with simulateContract to validate that the contract write will execute without errors.


    let mintTokensToAddress = await requestUserInput('Enter the address of a wallet or contract for receiving minted tokens: ');
    // rl.close()
    
   let tokensToMint = await requestUserInput(`\nHow many tokens to mint for ${mintTokensToAddress}? `);
    // rl.close()
   const [account] = await walletClient.getAddresses() 

    if ( isCryptoAddress(  mintTokensToAddress.trim() as Address ) === true && ( Number(tokensToMint) > 0 ) ) {

        const { request } = await publicClient.simulateContract({
            account,
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'mint',
            args: [ mintTokensToAddress.trim(),  parseEther( tokensToMint ) ]
        })

        // const txHash = await walletClient.writeContract(request)
       const txHash = await walletClient.writeContract({
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'mint',
            args: [ mintTokensToAddress.trim(),  parseEther( tokensToMint ) ]
  
        })
 	console.log("Minting was a success! Here's the transaction hash:", txHash);

    //TODO: what do we do with the receipt? 
        // receipt.blocknumber
        // receipt.from 
        // receipt.contractAddress
        // receipt.status // === 1 is success

        // need to specify hash type as "hash: txName" when using a name other than "hash" for tx 
	let receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });


    } else {
        console.log('Invalid amount of tokens entered')
    
    }

}

// async function main() {

//     await function1()
//     await function2()

// }


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});    