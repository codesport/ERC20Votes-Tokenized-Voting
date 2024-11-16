// npx ts-node scripts/04-delegate-tokens

import { publicClient, walletClient, requestUserInput, isCryptoAddress, readKeyValue, secondaryWalletClient, confirmAction } from "./config";
import { abi } from "../artifacts/contracts/VoteToken.sol/VoteToken.json";
import { Address, formatEther,  parseEther, toHex, hexToString } from "viem";
import * as readline from "readline";


const main = async () => {

    const confirmSelfDelegate = await confirmAction('All tokens for dev wallets will be self-delegated. Would you like to continue?');    

    if (confirmSelfDelegate === false) {
        console.log("Operation cancelled by the user.");
        process.exit(0);
    }

    //const tokensToTransfer = await requestUserInput(`\nHow many tokens to transfer for ${transferTokensToAddress}? `);
 
    const [ account1 ] = await walletClient.getAddresses() 
    const [ account2 ]  = await secondaryWalletClient.getAddresses() 
    let account = account1

    // console.log(account1, account2) 
      
        /**
        * Pair writeContract with simulateContract to validate that the contract write will execute without errors.
        * @see https://viem.sh/docs/contract/writeContract.html#usage
        */
        let { request } = await publicClient.simulateContract({
            account,
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'delegate',
            args: [ account ]
        })
       // console.log( request);


        account = account2;
        (  { request } =  await publicClient.simulateContract({
            account,
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'delegate',
            args: [ account ]
        }) )

        //console.log( request );

     //  
     // const txHash = await walletClient.writeContract(request)

        let hash = await walletClient.writeContract({
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'delegate',
            args: [ account1 ]
        })
 	    console.log(`Delegating for ${account1} was a success!`) 
        console.log(`Here's the transaction hash: ${hash}`);

        // need to specify hash type as "hash: txName" when using a name other than "hash" for tx 
        let receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log(`  Transaction Receipt Status For ${account1}`, receipt.status)
        console.log('  Transaction Hash:', receipt.transactionHash )
        console.log('  From Address:', receipt.from )
        console.log('  Block Number:', receipt.blockNumber)
        console.log('  To Address:', receipt.to)

 	    
        hash = await secondaryWalletClient.writeContract({
            address: readKeyValue('tokenAddress') as `0x${string}`,
            abi: abi,
            functionName: 'delegate',
            args: [ account2 ]
        })        
        console.log(`\n`)
 	    console.log(`Delegating for ${account2} was a success!`) 
        console.log(`Here's the transaction hash: ${hash}`);

        // need to specify hash type as "hash: txName" when using a name other than "hash" for tx 
        receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log(`  Transaction Receipt Status For ${account1}`, receipt.status)
        console.log('  Transaction Hash:', receipt.transactionHash )
        console.log('  From Address:', receipt.from )
        console.log('  Block Number:', receipt.blockNumber)
        console.log('  To Address:', receipt.to)

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});    