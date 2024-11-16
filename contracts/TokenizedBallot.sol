// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

/**
 * Use token interface IERC20Votes to implement a specific function from an
 * already deployed token contract
 */
interface VotingToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

// Array length: https://ethereum.stackexchange.com/a/126998/3506
// - for lists of things you need to enumerate.  Avoid loops in Solidity.
// function getLength() public view returns (uint256) {
//    return dynamicArray.length;
//  }
//  Map Length: Use a separate array tp staore info on map size.  Use mappings for random access when you know the keys

contract TokenizedBallot {
    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    VotingToken public tokenContract; // or address _tokenContract,
    Proposal[] public proposals;
    uint256 public targetBlockNumber;

    // mapping(key_type => value_type) visbility global_state_variable_name;
    mapping(address => uint256) public votePowerSpent;

    constructor(
        bytes32[] memory _proposalNames,
        address _tokenContract, // or "VotingToken _tokenContract"
        uint256 _targetBlockNumber
    ) {
        tokenContract = VotingToken(_tokenContract);

        /**
         * Client Requirement: Tokens must be held prior to ballot deployment
         *
         * @dev Bro, I'm not going to force the client to know Block number before deploying!
         * Therefore softcoding it in as "targetBlockNumber = (block.number - 1)"
         *
         * @see https://docs.openzeppelin.com/contracts/5.x/governance#timestamp_based_governance
         * @see https://docs.soliditylang.org/en/latest/units-and-global-variables.html#block-and-transaction-properties
         */
        require(
            targetBlockNumber < block.number,
            "Rerverted b/c supplied block number not in the past."
        );
        targetBlockNumber = _targetBlockNumber; //(block.number - 1); //this means I deploy and distribute tokens before deploying ballot

        for (uint i = 0; i < _proposalNames.length; i++) {
            proposals.push(Proposal({name: _proposalNames[i], voteCount: 0}));
        }
    }

    function vote(uint256 proposal, uint256 _amountTokensToVote) external {
        uint256 votePower = getVotePower(msg.sender);
        require(
            votePower >= _amountTokensToVote,
            "Error:  Trying to vote with more votes than available"
        );

        votePowerSpent[msg.sender] += _amountTokensToVote;
        proposals[proposal].voteCount += _amountTokensToVote;
    }

    /**
     * @dev NB: return is implicit b/c no return statement in function. Only in function signature
     *
     * Explicit (in function Body): return votingPower_
     * Implicit (in func signature): function votingPower() public view returns (uint256 votingPower_)
     */
    function getVotePower(
        address _someVoterAddress
    ) public view returns (uint256 votingPower) {
        votingPower =
            tokenContract.getPastVotes(_someVoterAddress, targetBlockNumber) -
            votePowerSpent[_someVoterAddress];
        return votingPower;
    }

    function winningProposal() public view returns (uint winningProposal_) {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    /**
     * @dev NB: return is implicit b/c no return statement in function. Only in function signature
     *
     * Explicit (in function Body): return winnerName
     * Implicit (in func signature): function winnerName() external view returns (bytes32 winnerName_)
     */
    function winnerName() external view returns (bytes32 winnerName_) {
        winnerName_ = proposals[winningProposal()].name;
    }
}
