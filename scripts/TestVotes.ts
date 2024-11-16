// For Internal Runs: 
    // pnpm hardhat run scripts/TestVotes.ts

// For Live Deploys:
    // npx ts-node --files ./scripts/DeployWithViem.ts "arg1" "arg2" "arg3"
    // npx ts-node scripts/DeployWithViem.ts arg1 arg2 arg3

// For Tests:
    // npx hardhat test

//Only for tests
import { assert, expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
//import { VoteToken, TokenizedBallot  } from "../typechain";

// For test and live interactions 
import { toHex, hexToString } from "viem";
import { viem } from "hardhat";
import { Address } from "viem";

// for FS
//import * as fs from 'fs'; //or 
import fs from 'fs';

// For minting
import { parseEther, formatEther } from "viem"

// for FS
const  filePath = 'scripts/data.json'


const TOKENS_ETH = "20"; 
const TOKENS_WEI = parseEther("20") // MINT_VALUE

//Only for tests
const PROPOSAL_CHOSEN = [0, 1, 2];
const USED_VOTE_POWER = 5;
const ACCOUNTS_FOR_TESTING = 3;

//For Ballot tests and live deployment  
const CONTRACT1 = "VoteToken"
const CONTRACT2 = "TokenizedBallot"
const PROPOSALS = ["Bogota", "Medellin", "Villavicencio"]


//beforeEach: preserves state changes before each test. Variable states are shared between each test
//fixture:  resets state changes to t = 0

// const deployFixture = async () => {
// }


// beforeEach(async () => {

// }



async function main() {

// //https://github.com/search?q=ethers.provider.send(%22evm_mine%22)&type=code
// async function skipBlocks(number) {
//     for(let i = 0; i < number; i++) {
//         await ethers.provider.send("evm_mine")
//     }
// }

// https://viem.sh/docs/clients/test
// const testClient = await viem.getTestClient();
// import { createTestClient } from 'viem'
// await testClient.mine({  blocks: 2, })

    const testClient = await hre.viem.getTestClient();

    /**https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-viem#test-client */    
    const mine = async (blocksTomine: number) =>{
        await testClient.mine({
            blocks: blocksTomine, 
        })
    
    }

    const publicClient = await viem.getPublicClient();
    const [deployer, user1, user2, user3] = await viem.getWalletClients();
    const TokenContract = await viem.deployContract( CONTRACT1 );

    console.log(`\n`)
    console.log("Good Sir, I just Deployed Your VoteToken Contract to Address:", TokenContract.address)

    let blockNumber = await publicClient.getBlockNumber()
    console.log("Block number after deploying VoteToken contract:", Number(blockNumber) )
   

    let contractAddressKeyValue = {"tokenAddress":TokenContract.address}
    // fs.writeFileSync(filePath, JSON.stringify(contractAddressKeyValue, null, 4));
    fs.writeFileSync(filePath, JSON.stringify(contractAddressKeyValue, null, 4), (err) => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    });


    /**
     * 
     * 
     * @see https://www.google.com/search?q=TypeScript+and+nodejs%3A+read+a+key+value+pair+from+json+file+and+save+to+variable
     * @param key 
     * @returns value
     */
    function readKeyValue(/*filePath: string,*/ key: string): string | undefined {
        try {
            /**
            * readFileSync reads the file synchronously. The event loop and execution of the remaining code is blocked 
            * until all the data has been read.
            */
            const jsonData = JSON.parse( fs.readFileSync(filePath, 'utf-8') );
            return jsonData[key];
        } catch (error) {
            console.error('Error reading JSON file:', error);
            return undefined;
            //   // If the file doesn't exist, create an empty object
            //   if (err.code === 'ENOENT') {
            //     jsonData = {};
            //   } else {
            //     throw err;
            //   }

        }
    }

    /**
     *
     *
     * @see https://www.google.com/search?q=TypeScript%3A+use+node+to+append+data+to+a+json+file+from+command+line
     * @param keyValue 
     * @returns 
     */
    function appendKeyValue(/*filePath: string,*/ keyValue: string): string | undefined {

        let jsonData: any = {}
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            jsonData = JSON.parse(fileContent);
            Object.assign(jsonData, keyValue);
            fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
        } catch (error) {
            console.error('Error reading JSON file:', error);
            return undefined;
        }
    }


    const deploy = async () => {

        // await transferTokens()

        await mine(10)

        console.log("Everyone has their tokens. Now deploying Ballot")
        
        const savedAddress = readKeyValue("tokenAddress")
        let blockNumber = await publicClient.getBlockNumber();

        // Any Solidity method call that changes the state is a transaction. That transaction is composed of possibly multiple atomic operations.
        const BallotContract = await viem.deployContract( CONTRACT2, [ PROPOSALS.map((prop) => toHex(prop, { size: 32 })), savedAddress, (blockNumber-1n) ],  );

        console.log(`   * Ballot contract deployed to: ${BallotContract.address}`)
        blockNumber = await publicClient.getBlockNumber()
        console.log("   * Token holder snapshot taken at block number", Number(blockNumber - 1n))
        console.log("   * Block number after deploying TokenizedBallot contract", Number(blockNumber))

        const snapshot = await BallotContract.read.targetBlockNumber();
        console.log("   * Token holder snapshot stored in", CONTRACT2, "at block:", Number(snapshot))
        
    
        contractAddressKeyValue = {"ballotAddress":BallotContract.address}
        appendKeyValue(contractAddressKeyValue)

        console.log(`\n---`)

        const user1VotingPower = await BallotContract.read.getVotePower([ user1.account.address ]);
        console.log(user1.account.address, 'voting Power BEFORE Voting First Time:', formatEther(user1VotingPower) )   
        const user1PowerSpent = await BallotContract.read.votePowerSpent([ user1.account.address ]);
        console.log(user1.account.address, 'votePowerSpent BEFORE Voting First Time:', formatEther(user1PowerSpent) )  


        console.log(`---\n`)
                    
        const user2VotingPower = await BallotContract.read.getVotePower([ user2.account.address ]);
        console.log(user2.account.address, 'voting Power BEFORE Voting First Time:', formatEther(user2VotingPower) )
        const user2PowerSpent = await BallotContract.read.votePowerSpent([ user2.account.address ]);
        console.log(user2.account.address, 'votePowerSpent BEFORE Voting First Time:', formatEther(user2PowerSpent) )       
        
        console.log(`---\n`)


        vote(BallotContract)
        //return {publicClient, deployer, user1, user2, user3};
    
    }

    const mint = async () => {

        try {
    
            let mintTx = await TokenContract.write.mint([user1.account.address, TOKENS_WEI ]);
             

            await publicClient.waitForTransactionReceipt({ hash: mintTx });
           // console.log(`\nMinted`, formatEther( TOKENS_WEI ), `tokens to User 1 Account with address ${ user1.account.address }\n` );
        // console.log( `This is equal to ${TOKENS_WEI.toString()} tokens with 18 decimal units\n` );
            
            mintTx = await TokenContract.write.mint([user2.account.address, TOKENS_WEI]);
            await publicClient.waitForTransactionReceipt({ hash: mintTx });
           // console.log(`\nMinted`, formatEther( TOKENS_WEI ), `tokens to User 2 Account with address ${ user2.account.address }\n` );
            const balanceBN = await TokenContract.read.balanceOf([user1.account.address]);
            const balanceBN2 = await TokenContract.read.balanceOf([user2.account.address]);
            
            console.log( `"balanceOf" Account ${ user1.account.address }: ${formatEther(balanceBN)} VoteToken(s)`);
            console.log( `"balanceOf" Account ${ user2.account.address }: ${formatEther(balanceBN2)} VoteToken(s)\n`);
            
            let votes = await TokenContract.read.getVotes([user1.account.address]);
            console.log(`Account ${user1.account.address}: ${votes.toString()} units of voting power before self delegating`);

            votes = await TokenContract.read.getVotes([user2.account.address]);
            console.log(`Account ${user2.account.address}: ${votes.toString()} units of voting power before self delegating`);
            //console.log(`Deployer Account ${deployer.account.address}: ${votes.toString()} units of voting power\n`);

            selfDelegate()

        } catch (e: any) {
            console.log(e);
        }

    }


    const selfDelegate = async ( /*address: Address, account: any[]*/ ) => {

        let delegateTx = await TokenContract.write.delegate([ user1.account.address ], { account: user1.account, });
        await publicClient.waitForTransactionReceipt({ hash: delegateTx });

       delegateTx = await TokenContract.write.delegate([ user2.account.address ], { account: user2.account, });
        await publicClient.waitForTransactionReceipt({ hash: delegateTx });

        const user1VotesAfter = await TokenContract.read.getVotes([user1.account.address]);
        const user2VotesAfter = await TokenContract.read.getVotes([user2.account.address]);

        console.log( `\nAccount ${ user1.account.address}:  ${formatEther(user1VotesAfter.toString())} tokens of voting power after self delegating` ); 
        console.log( `Account ${ user2.account.address}:  ${formatEther(user2VotesAfter.toString())} tokens of voting power after self delegating\n` ); 

        const balanceBN = await TokenContract.read.balanceOf([user1.account.address]);
           // await transferTokens()  
           
        if (balanceBN >= 20E18) {
           await  transferTokens()   
        } else {
             await deploy()
        }
    }   

    const transferTokens = async () => {  

        //TOKENS_TO_MINT / 2n  || BASE_VOTE_POWER / 2]              

        const transferTx = await TokenContract.write.transfer( [user2.account.address, TOKENS_WEI / 10n], { account: user1.account,  } );
        await publicClient.waitForTransactionReceipt({ hash: transferTx });

        const votes1AfterTransfer = await TokenContract.read.getVotes([ user1.account.address, ]);
        console.log( `Account ${ user1.account.address  }: ${formatEther(votes1AfterTransfer.toString())} tokens of voting power after transferring`  );
        const votes2AfterTransfer = await TokenContract.read.getVotes([  user2.account.address, ]);
        console.log( `Account ${ user2.account.address} has ${formatEther(votes2AfterTransfer.toString())} tokens of voting power after receiving a transfer\n` );

        await selfDelegate()
        
    }

    const getPastVotes = async (address) => {

        console.log(`\n Now scanning past votes and blocks: \n`);
            
        const lastBlockNumber = await publicClient.getBlockNumber()

        for (let index = lastBlockNumber - 1n; index > 0n; index--) {
            const pastVotes = await TokenContract.read.getPastVotes([ address, index, ]);
            console.log( `  * Account ${ address } had ${pastVotes.toString()} units of voting power at block ${index}\n` );
        }
        console.log( `Block scan complete\n --- \n`)
    }


      const vote = async (BallotContract: any) => {

        let user1VotingPower: BigInt
        let user2VotingPower: BigInt
        let voteHash: `0x${string}`
        let receipt: {}
        let balanceBN: BigInt

        // const voteHash = await walletClient.writeContract({
        //     abi: abi,
        //     address: contractAddress!, // OR USE: as `0x${string}`
        //     functionName: "vote",
        //     args:[proposalIndex]  // BigInt(proposalIndex) 
        // });

        const user1Connector = await viem.getContractAt(
            CONTRACT2, //contract name defined in contract
            BallotContract.address,
            {client: {wallet: user1}}
        );

        const user2Connector = await viem.getContractAt(
            CONTRACT2, //contract name defined in contract
            BallotContract.address,
            {client: {wallet: user2}}
        );


        user1VotingPower = await BallotContract.read.getVotePower([ user1.account.address, ]);

        console.log(user1.account.address, 'voting Power BEFORE Voting:', formatEther(user1VotingPower) )
        //let voteHash = await BallotContract.write.vote([ 1, user1VotingPower  ], user1.account );
        voteHash = await user1Connector.write.vote([ 1, parseEther("3")  ]);

        //const hash = await BallotContract.write.vote([ 1, parseEther("4")  ]);
        console.log("Vote 1 Transaction hash:", voteHash);
        
        receipt = await publicClient.waitForTransactionReceipt({ hash: voteHash });

        user1VotingPower = await BallotContract.read.getVotePower([ user1.account.address, ]);
        console.log(user1.account.address, 'voting Power AFTER Voting First Time:', formatEther(user1VotingPower) )

       
        //voteHash = await user1Connector.write.vote([ 2, parseEther("2")  ]);    

             console.log(`\n`)

        voteHash = await BallotContract.write.vote([ 2, user1VotingPower], { account: user1.account,  } );    
        console.log("Vote 2 Transaction hash:", voteHash);
      
        receipt = await publicClient.waitForTransactionReceipt({ hash: voteHash });

        user1VotingPower = await BallotContract.read.getVotePower([ user1.account.address, ]);
        console.log(user1.account.address, 'voting Power AFTER Voting SECOND Time:', formatEther(user1VotingPower) )

             console.log(`\n`)
        user2VotingPower = await BallotContract.read.getVotePower([ user2.account.address, ]);
        console.log(user2.account.address, 'voting Power BEFORE Voting First Time:', formatEther(user2VotingPower) )



        voteHash = await BallotContract.write.vote([ 0, user2VotingPower ], { account: user2.account,  } ); 
        receipt = await publicClient.waitForTransactionReceipt({ hash: voteHash });


        user2VotingPower = await BallotContract.read.getVotePower([ user2.account.address, ]);   
        // voteHash = await user2Connector.write.vote([ 0, parseEther("5")  ]);
        console.log(user2.account.address, 'voting Power AFTER Voting First Time:', formatEther(user2VotingPower) )
 //const proposal = (


        //console.log(receipt);
    //     //const user1VotingPower = await TokenContract.read.getVotes([ user1.account.address, ]);
    //     const votes = await TokenContract.read.getVotes([user1.account.address]);
    //     console.log(`Account ${user1.account.address}: ${votes.toString()} units of voting power after voting`);




    //    // voteHash = await BallotContract.write.vote([ 1, user1VotingPower  ], user1.account );
        
      //  voteHash = await user1Connector.write.vote([ 1, parseEther("4")  ]);
        
        
    //      console.log("Vote 2 Transaction hash:", voteHash);

    //     receipt = await publicClient.waitForTransactionReceipt({ hash: voteHash });
    //     console.log(receipt.from, "has successfully Voted " );
        //getPastVotes(user1.account.address)

         console.log(`\n`)
        queryProposal( BallotContract)

    }  

const getWinner = async ( BallotContract: any ) => {

    const winner = await BallotContract.read.winnerName() as `0x${string}`// any[];
    
	const name = hexToString(winner, { size: 32 });
    console.log("The winning proposal is:", name )

    return name;
}

const queryProposal = async ( BallotContract: any ) => {

	 let i: number = 0
	 let proposalArrOfObj: any[] =[] //https://learnxinyminutes.com/docs/typescript/
	 let tempObject: any[]
 
	while (true) {

    //console.log("Index:", i)
		try {
			tempObject = await BallotContract.read.proposals([ i ]);
			
			if (tempObject) {
				//console.log("Proposal Inside Loop", proposalArrOfObj);
               // console.log("Proposal Inside Loop", tempObject);
				proposalArrOfObj.push({
					name: hexToString(tempObject[0], { size: 32 }),
					votesReceived: formatEther( tempObject[1] ) //get rid of "n" big number notation. see: https://stackoverflow.com/a/53970656/946957
					})
				i++
			}

		} catch (e) {

       // console.log(e)
			break;
		}	
	}
	//Sorting and Array of JS Objects by a Specific Key: https://stackoverflow.com/a/979289/946957
	proposalArrOfObj.sort((a, b) => parseFloat(b.votesReceived) - parseFloat(a.votesReceived));
	console.log("QUERY 1. Historical Snapshot of Proposal Status Sorted in Descending Order:",  proposalArrOfObj)
	console.log("QUERY 2. Historical Winning Proposal: " + await getWinner( BallotContract ) )


}


   mint()
  
   

}


 main().catch( (err) =>{
    console.error(err)
    process.exitCode = 1
 } )