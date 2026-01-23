// NexusDrive Contract Configuration
// To be deployed on Sepolia testnet

export const NEXUS_DRIVE_ADDRESS = "0xDa127E35C32E0D50C96F4FBfBb07384BFbC67fb8" as const; // Placeholder

export const NEXUS_DRIVE_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "attemptId", "type": "uint256" },
            { "indexed": true, "internalType": "bytes32", "name": "modelHash", "type": "bytes32" },
            { "indexed": false, "internalType": "uint256", "name": "trackId", "type": "uint256" },
            { "indexed": false, "internalType": "address", "name": "player", "type": "address" }
        ],
        "name": "ModelSubmitted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "RewardPaid",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "trackId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "attemptId", "type": "uint256" }
        ],
        "name": "TrackAttempted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "cid", "type": "string" }
        ],
        "name": "ModelRegistered",
        "type": "event"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "trackId", "type": "uint256" }],
        "name": "attemptTrack",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "attemptId", "type": "uint256" },
            { "internalType": "bytes32", "name": "modelHash", "type": "bytes32" },
            { "internalType": "uint256", "name": "nonce", "type": "uint256" }
        ],
        "name": "claimVictory",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "uint256", "name": "fee", "type": "uint256" },
            { "internalType": "uint256", "name": "multiplier", "type": "uint256" }
        ],
        "name": "addTrack",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "withdrawTreasury",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "tracks",
        "outputs": [
            { "internalType": "uint256", "name": "entryFee", "type": "uint256" },
            { "internalType": "uint256", "name": "rewardMultiplier", "type": "uint256" },
            { "internalType": "bool", "name": "isActive", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "attempts",
        "outputs": [
            { "internalType": "address", "name": "player", "type": "address" },
            { "internalType": "uint256", "name": "trackId", "type": "uint256" },
            { "internalType": "uint256", "name": "blockNumber", "type": "uint256" },
            { "internalType": "bool", "name": "isPending", "type": "bool" },
            { "internalType": "bytes32", "name": "modelHash", "type": "bytes32" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalAttempts",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
        "name": "usedModelHashes",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "string", "name": "cid", "type": "string" }],
        "name": "registerModel",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getUserModels",
        "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const SEPOLIA_CHAIN = {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
} as const;
