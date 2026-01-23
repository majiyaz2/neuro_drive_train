// NexusDrive Contract Configuration
// To be deployed on Sepolia testnet

export const NEXUS_DRIVE_ADDRESS = "0xB6cee43BA090Bd132199503De9890C219BAe5A47" as const; // Placeholder

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
        "inputs": [{ "internalType": "uint256", "name": "trackId", "type": "uint256" }],
        "name": "attemptTrack",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "attemptId", "type": "uint256" },
            { "internalType": "bytes32", "name": "modelHash", "type": "bytes32" }
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
    }
] as const;

export const SEPOLIA_CHAIN = {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
} as const;
