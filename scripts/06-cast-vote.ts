// npx ts-node scripts/06-cast-vote.ts

import { publicClient, walletClient, requestUserInput, readKeyValue, secondaryWalletClient  } from "./config";
import { abi } from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import { Address, formatEther,  parseEther, toHex, hexToString } from "viem";
import { select, Separator } from '@inquirer/prompts'  // https://github.com/SBoudrias/Inquirer.js/tree/main/packages/select

/**
 *  Select Wallet:  setWalletFunction()
 *  Get & Display VotePower: getVotePowerFunction()
 *  Get & Display Proposals: getProposalsFunction()
 *  Set Vote Allocation: getProposalsFunction()
 *  Get & Display Historical Vote Results: getProposalsFunction()
 *  Vote: main()
 *  TODO: If Vote Power Remaining ...ask to repeat or exit
 */


const main = async () => {

    // NB: TS requires all variables to be intialized at creation
    const ballotAddress = readKeyValue('ballotAddress')
    let primaryAddress = await walletClient.getAddresses()
    let secondaryAddress = await secondaryWalletClient.getAddresses()
    let index_proposal: number = 0  

    const setWalletFunction = async()/*: Promise<any>*/ =>{

       
        let [selectedWalletAddress]: any = await select({
            message: 'Select a dev wallet to vote with',
            choices: [
                {
                name: 'Primary Dev Wallet: ' + primaryAddress,
                value: primaryAddress,
                description: 'New and Primary Dev Wallet',
                },
                {
                name: 'Secondary Dev Wallet: ' + secondaryAddress,
                value: secondaryAddress,
                description: 'Older and Secondary Dev Wallet',
                },
            ]
        });
        //const walletSelected = selectedWalletAddress.toString

        if ( selectedWalletAddress == primaryAddress ){
            var  selectedClient = walletClient
        } else {
            var selectedClient = secondaryWalletClient     
        }    

        return [selectedWalletAddress, selectedClient]
    }


    const getProposalsFunction = async() =>{
        
        let proposalArrOfObj: any[] =[] //https://learnxinyminutes.com/docs/typescript/
        let tempObject: any[]
    
        while (true) {
            //console.log("Index:", index_proposal)
            try {
                tempObject = await publicClient.readContract({
                address: ballotAddress as `0x${string}`,
                abi: abi,
                functionName: "proposals",
                args: [index_proposal]
            }) as  any[]
                
                if (tempObject) {
                // console.log("Proposal Inside Loop", proposalArrOfObj);
                // console.log("Proposal Inside Loop", tempObject);
                    proposalArrOfObj.push({
                        name: hexToString(tempObject[0], { size: 32 }),
                        votesReceived: formatEther( tempObject[1] ) //get rid of "n" big number notation. see: https://stackoverflow.com/a/53970656/946957
                        })
                    index_proposal++
                }
            } catch (e) {
                // console.log(e)
                break;
            }	
        }

	    //Sorting and Array of JS Objects by a Specific Key: https://stackoverflow.com/a/979289/946957
       // proposalArrOfObj.sort((a, b) => parseFloat(b.votesReceived) - parseFloat(a.votesReceived));
        console.log(`\n *** PROPOSALS AVAILABLE & VOTE TALLY ***`) 

        index_proposal = 0;
        for ( const item of proposalArrOfObj ){
            console.log( `    ${index_proposal + 1}. ${item.name} => Votes Received:  ${item.votesReceived}\n`)
            index_proposal++
        } 
            
        const proposalSelected = await requestUserInput('  Which proposal will you vote on?  Enter a number: ');
        if ( isNaN(Number(proposalSelected)) || Number(proposalSelected) > index_proposal + 1 ) {
            console.log("INVALID proposal entered. Exiting program now.");
            process.exit(0); 
            //return false
         }

        const votePower = await getVotePowerFunction(selectedWalletAddress)
        const tokenVoteAllocation = await requestUserInput(`\n  You have ${ Number(votePower)/1E18 } tokens with which you may vote. How many will you allocate to proposal #${proposalSelected }? `);
        
        return [proposalSelected, tokenVoteAllocation]    

    }

    const getVotePowerFunction = async( wallet: Address) =>{
        const votePower = await publicClient.readContract({
            address: ballotAddress as `0x${string}`,
            abi: abi,
            functionName: "getVotePower",
            args: [ wallet ]
        })
        return votePower 
    }

    const castVote = async(selectedWalletAddress: Address, selectedClient: any, proposalSelected: number, tokenVoteAllocation:string) =>{
 
        /**
        * Pair writeContract with simulateContract to validate that the contract write will execute without errors.
        * @see https://viem.sh/docs/contract/writeContract.html#usage
        */
        const { request } = await publicClient.simulateContract({
            account: selectedWalletAddress as `0x${string}`,
            address: ballotAddress as `0x${string}`,
            abi: abi,
            functionName: 'vote',
            args: [ Number(proposalSelected) - 1, parseEther(tokenVoteAllocation)   ]
        });
        // console.log(`\nSIMULATION OUTPUT`); console.log( request);
        // process.exit(0); //graceful exit
        //  This throws Alchemy & Infura RPC error.
        // const txHash = await walletClient.writeContract(request)


        let hash = await selectedClient.writeContract({
            address: ballotAddress as `0x${string}`,
            abi: abi,
            functionName: 'vote',
            args: [ Number(proposalSelected) - 1, parseEther(tokenVoteAllocation) ]
        })
        console.log(`\n * Voting for proposal #${proposalSelected} by wallet ${selectedWalletAddress} was successful!`) 
        console.log(` * Here's the transaction hash: ${hash}`);

        // need to specify hash type as "hash: txName" when using a name other than "hash" for tx 
        let receipt = await publicClient.waitForTransactionReceipt({ hash });

        console.log(`\n *** TRANSACTION RECEIPT METADATA ***`) 
        console.log(`    1. Transaction Receipt Status:`, receipt.status)
        console.log('    2. Transaction Hash:', receipt.transactionHash )
        console.log('    3. From Address:', receipt.from )
        console.log('    4. Block Number:', receipt.blockNumber)
        console.log('    5. To Address:', receipt.to)
        console.log('    6. Deployed Contract Address:', receipt.contractAddress);

    }   


    const[selectedWalletAddress, selectedClient] = await setWalletFunction()
    const [proposalSelected, tokenVoteAllocation] = await getProposalsFunction()
    await castVote(selectedWalletAddress, selectedClient, Number(proposalSelected), tokenVoteAllocation)    


}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});    