// Counter Contract Configuration
// Deployed on Sepolia testnet

export const COUNTER_ADDRESS = "0xB65EC31daA17191F08eeB9A0f54Cff0ACDc4A019" as const;

export const COUNTER_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "uint256",
                name: "by",
                type: "uint256",
            },
        ],
        name: "Increment",
        type: "event",
    },
    {
        inputs: [],
        name: "inc",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "uint256",
                name: "by",
                type: "uint256",
            },
        ],
        name: "incBy",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [],
        name: "x",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
] as const;

// Sepolia chain configuration
export const SEPOLIA_CHAIN = {
    id: 11155111,
    name: "Sepolia",
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
} as const;
