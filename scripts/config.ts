// Inspired by Ralph Chu: https://github.com/EncodeClub-EVMBootcamp24Q4-Group2/project2/commits?author=ralphchu66

import { createPublicClient, http, createWalletClient, Address } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import * as readline from 'readline'; // https://stackoverflow.com/a/49055758
import * as fs from 'fs';
import 'dotenv/config' // (source: https://www.npmjs.com/package/dotenv )

/********** CHANGE PROVIDER AS NEEDED*/
const ETH_SEPOLIA_RPC_URL = process.env.ETH_SEPOLIA_RPC_URL_2
/********** CHANGE PROVIDER AS NEEDED*/


// Create shared client instance
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(ETH_SEPOLIA_RPC_URL),
});

// Create primary wallet client (deployer) account
let account = privateKeyToAccount(`0x${process.env.PRIVATE_KEY}`);
const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(ETH_SEPOLIA_RPC_URL),
});

// Create secondary wallet client (user) account
account = privateKeyToAccount(`0x${process.env.CB_PRIVATE_KEY}`);
const secondaryWalletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(ETH_SEPOLIA_RPC_URL),
});


const contractAddressStoragePath = 'scripts/contract-data.json'

/**
 * Continue or Abort script based on user input
 *
 * - CLI function to verify user inputs. depends on `import * as readline from "readline";`
 * - call from within another async function
 * - https://www.google.com/search?q=when+and+why+use+promise.all?
 * - https://www.google.com/search?q=when+to+use+promise.all
 * - https://www.google.com/search?q=use+node+to+prompt+user+input+from+command+line
 * - In TypeScript: https://www.google.com/search?q=TypeScript%3A+use+node+to+prompt+user+input+from+command+line?
 * - Boss Mode: https://github.com/SBoudrias/Inquirer.js
 *
 * @param message - The confirmation message.
 * @returns Promise resolving to true if confirmed, false otherwise.
 *
 * Usage:
 *
 *  const isConfirmed = await confirmAction('Would you like to continue? ');
 *   if (isConfirmed === false) { 
 *      console.log("Operation cancelled by the user. Exiting gracefully now.");
 *       process.exit(0);
 *   }
 */
const confirmAction = async (message: string): Promise<boolean> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(`${message} \n  Press any key to continue. Or 'q' to quit! `, (answer) => {
            rl.close();
            //resolve(answer.trim().toLowerCase() === "y");
            resolve(answer.trim().toLowerCase() !== "q");
        });
    });
}

/**
 * Request, verify, and save user input to a variable
 *
 * - CLI function to verify user inputs. Depends on `import * as readline from "readline";`
 * - call from within another async function
 *
 * @param message - The confirmation message.
 * @returns Promise that returns user input.
 * @see https://stackoverflow.com/a/61395541
 *
 * Usage:
 *  // Get user input using await
 *  const userInputAddress = await requestUserInput('Enter the address of a wallet or contract: ');
 *
 *   // Print the result
 *  console.log(`Saving address, ${userInputAddress}`);
 *
 *  // Close the readline interface
 *  rl.close();
 *   }
 */
const requestUserInput = async (message: string): Promise<string> => {
    // Create an interface for input and output
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(message, (answer) => {
            rl.close(); //this is not convention. should be in prompt caller
            resolve(answer);
        });
    });

}

/**
 * Evaluate user input from provided list and save to variable 
 *
 * @param message 
 * @returns Number as a Promise. An in-bound number or 0 if user input is out-of-bounds.  
 *          Caller will evaluate as process.exit(0)
 */
const selectFromList = async (message: string): Promise<number> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(`${message} Press 'Q' to quit! \n\n 1) Developer 1: 0x9E3885eCcDc7E6F61B291B03838313F83799e03A \n 2) Developer 2: 0x650Ac918C9e9C5F58f03C2845b2C11C438Ab5BF7\n`, (answer) => {


            resolve(Number(answer));
            rl.close();
            //( isNaN(Number(answer)) || Number(answer) !== 1 || Number(answer) !== 2 ) ? 0: Number(answer)
            //resolve(answer.trim().toLowerCase() === "y");
            // resolve(answer !== 1 || answer !== 2);
        });
    });
}


/**
 * 
 * 
 * @see https://www.google.com/search?q=TypeScript+and+nodejs%3A+read+a+key+value+pair+from+json+file+and+save+to+variable
 * @param key 
 * @returns value
 */
function readKeyValue(/*filePath: string,*/ key: string): string | undefined { //data-type can also be :any instead of string
    try {
        /**
        * readFileSync reads the file synchronously. The event loop and execution of the remaining code is blocked 
        * until all the data has been read.
        */
        const jsonData = JSON.parse(fs.readFileSync(contractAddressStoragePath, 'utf-8'));
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
function appendKeyValue(/*filePath: string,*/ keyValue: any): any | undefined {

    let jsonData: any = {}
    try {
        const fileContent = fs.readFileSync(contractAddressStoragePath, 'utf-8');
        jsonData = JSON.parse(fileContent);
        Object.assign(jsonData, keyValue);
        fs.writeFileSync(contractAddressStoragePath, JSON.stringify(jsonData, null, 4));
    } catch (error) {
        console.error('Error reading JSON file:', error);
        return undefined;
    }
}

/**
 * 
 * @param address 
 * @returns true if valid address.  exit code 1 if invalid
 */
function isCryptoAddress(address: Address) {
    if (/^0x[a-fA-F0-9]{40}$/.test(address) === false) {

        //throw new Error("Invalid EVM address");
        console.log(`\nAborting now. ${address} is not a valid crypto address`)
        process.exit(1)
        //if not using throw (i.e., just cosle logging) can do graceful exit w/error via: process.exit(1);
        // NB: process.exit(0); is grceful exit with no error

    } else {

        console.log(`\nValid EVM address provided: ${address} \n`)
        return true
    }
}


//Make this file portable with Named Exports
export { walletClient, publicClient, fs, contractAddressStoragePath, readKeyValue, appendKeyValue, requestUserInput, isCryptoAddress, secondaryWalletClient, confirmAction }

// Node.js how to save data from terminal

// https://stackoverflow.com/a/36093141/946957
// https://blog.logrocket.com/reading-writing-json-files-node-js-complete-tutorial/
// https://www.geeksforgeeks.org/how-to-read-and-write-json-file-using-node-js/
// https://www.geeksforgeeks.org/how-to-add-data-in-json-file-using-node-js/
// https://heynode.com/tutorial/readwrite-json-files-nodejs/
// https://stackoverflow.com/a/65751329/946957
// https://stackoverflow.com/questions/72106425/how-to-append-data-in-json-file-using-typescript
// https://www.google.com/search?q=TypeScript%3A+use+node+and++asyn%2Fawait++to+append+data+to+a+json+file+from+command+line
