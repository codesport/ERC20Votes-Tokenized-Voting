//npx ts-node scripts/03-transfer-tokens.ts

import { publicClient, walletClient, requestUserInput, isCryptoAddress, readKeyValue } from "./config";
import { abi } from "../artifacts/contracts/VoteToken.sol/VoteToken.json";
import { Address, formatEther,  parseEther, toHex, hexToString } from "viem";
import * as readline from "readline";


const main = async () => {

    let transferTokensToAddress = await requestUserInput('Enter the address to transfer tokens into: ');    
    let tokensToTransfer = await requestUserInput(`\nHow many tokens do you want to transfer to ${transferTokensToAddress}? `);
 
    const [account] = await walletClient.getAddresses() 

    if ( isCryptoAddress(  transferTokensToAddress.trim() as Address ) === true && ( Number(tokensToTransfer) > 0 ) ) {

        /**
        * Pair writeContract with simulateContract to validate that the contract write will execute without errors.
        * @see https://viem.sh/docs/contract/writeContract.html#usage
        */
        const { request } = await publicClient.simulateContract({
            account,
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'transfer',
            args: [ transferTokensToAddress.trim(),  parseEther( tokensToTransfer ) ]
        })

        // const txHash = await walletClient.writeContract(request)
       const txHash = await walletClient.writeContract({
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'transfer',
            args: [ transferTokensToAddress.trim(),  parseEther( tokensToTransfer ) ]
  
        })
 	console.log("Transfering was a success! Here's the transaction hash:", txHash);

    //TODO: what do we do with the receipt? 
        // receipt.blocknumber
        // receipt.from 
        // receipt.to
        // receipt.contractAddress
        // receipt.status // === 1 is success

        // need to specify hash type as "hash: txName" when using a name other than "hash" for tx 
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log(receipt)


    } else {
        console.log('Invalid amount of tokens entered')
    
    }

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});    