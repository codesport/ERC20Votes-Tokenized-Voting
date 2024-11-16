// npx ts-node scripts/07-query-ballot.ts

import { publicClient, requestUserInput, isCryptoAddress, readKeyValue } from "./config";
import { abi } from "../artifacts/contracts/TokenizedBallot.sol/TokenizedBallot.json";
import {abi as voteTokenABI } from '../artifacts/contracts/VoteToken.sol/VoteToken.json';
import { Address, formatEther,  parseEther, toHex, hexToString } from "viem";

/**
 *  Get & Display WalletAddress => VotePower: getVotePowerFunction()
 *  Get & Display Winning Vote: getProposalsFunction()
 *  Get & Display Vote Tally: getProposalsFunction()
 *  Request from User, Get from Contract and then Display User's voting Stats
 *  0x9E3885eCcDc7E6F61B291B03838313F83799e03A
 *  0x650Ac918C9e9C5F58f03C2845b2C11C438Ab5BF7
 */


const main = async () => {

    // NB: TS requires all variables to be intialized at creation
    const ballotAddress = readKeyValue('ballotAddress')
    const tokenAddress = readKeyValue('tokenAddress')
    let index_proposal: number = 0;

    const getVotingData = async() =>{
        
        let proposalArrOfObj: any[] =[]//https://learnxinyminutes.com/docs/typescript/
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
        proposalArrOfObj.sort((a, b) => parseFloat(b.votesReceived) - parseFloat(a.votesReceived));
        
        const winningProposal = await getWinner( ballotAddress as Address )
               
        return [proposalArrOfObj, winningProposal]    

    }

    const getWinner = async ( contractAddress: `0x${string}` ) => {

        const winner = await publicClient.readContract({
            address: contractAddress,
            abi,
            functionName: "winnerName",
        }) as `0x${string}`// any[] or as Address
        
        const name = hexToString(winner, { size: 32 });
        console.log( `\n`)
        console.log("  Winning proposal is:", name )

        return name;
    }


     const tokensAtSnapshot = async (wallet: Address) =>{

            const snapShotBalance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: voteTokenABI,
            functionName: 'getVotes',
            args: [ wallet ]
        })   
 
        return snapShotBalance 
     }

    const tokenBalance = async (wallet: Address) =>{

        const balance = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: voteTokenABI,
            functionName: 'balanceOf',
            args: [ wallet ]
        })   

        return balance     
    }    

    const getVotePowerFunction = async( wallet: Address) =>{

        const votePower = await publicClient.readContract({
            address: ballotAddress as `0x${string}`,
            abi: abi,
            functionName: "getVotePower",
            args: [ wallet ]
        })

        const tokensInWallet = await tokenBalance(wallet)
        const tokensInWalletAtSnapshot = await tokensAtSnapshot(wallet)

        return [votePower, tokensInWalletAtSnapshot,  tokensInWallet ]

    }

    const [proposalArrOfObj, winningProposal] = await getVotingData()
    
    console.log(`\n *** PROPOSALS SORTED BY VOTES RECEIVED ***`)   
    index_proposal = 0
    for ( const item of proposalArrOfObj ){
        console.log( `    ${index_proposal + 1}. ${item.name} => Votes Received:  ${item.votesReceived}\n`)
        index_proposal++
    } 



    let walletAddressFromUser: any = await requestUserInput(`\n  Enter a wallet Address to view its remaining voting power. Or press [ENTER] to abort `);

    isCryptoAddress ( walletAddressFromUser )
    const [votePower, tokensInWalletAtSnapshot,  tokensInWallet ] = await getVotePowerFunction(walletAddressFromUser)

    console.log(`\n *** SUMMARY FOR WALLET ${walletAddressFromUser} ***`) 
     console.log(`\n  * Current voting power left: ${ Number(votePower)/1E18 } tokens`)
     console.log(`\n  * Initial voting power: ${ Number(tokensInWalletAtSnapshot)/1E18 } tokens!`)
     console.log(`\n  * Current token (voting + non-voting) balance: ${ Number(tokensInWallet)/1E18 } \n`)

}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});    