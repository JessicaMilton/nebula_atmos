export const AirWitnessABI = {
  "abi": [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum AirWitnessFHE.BadgeLevel",
          "name": "level",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "reportCount",
          "type": "uint256"
        }
      ],
      "name": "BadgeClaimed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "reporter",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "string",
          "name": "regionCode",
          "type": "string"
        }
      ],
      "name": "ReportSubmitted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "voter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "up",
          "type": "bool"
        }
      ],
      "name": "Voted",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "enum AirWitnessFHE.BadgeLevel",
          "name": "level",
          "type": "uint8"
        }
      ],
      "name": "claimBadge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "reportId",
          "type": "uint256"
        }
      ],
      "name": "downvote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getBadgeRequirements",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "bronze",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "silver",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gold",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expert",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "reportId",
          "type": "uint256"
        }
      ],
      "name": "getReport",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "reporter",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "metadataCID",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "regionCode",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            },
            {
              "internalType": "euint32",
              "name": "pm25",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "pm10",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "visibility",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "smell",
              "type": "bytes32"
            }
          ],
          "internalType": "struct AirWitnessFHE.Report",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "regionCode",
          "type": "string"
        }
      ],
      "name": "getReportsByRegion",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserBadges",
      "outputs": [
        {
          "internalType": "bool",
          "name": "bronze",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "silver",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "gold",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "expert",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserReportCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "reportId",
          "type": "uint256"
        }
      ],
      "name": "getVotes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "up",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "down",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "internalType": "enum AirWitnessFHE.BadgeLevel",
          "name": "level",
          "type": "uint8"
        }
      ],
      "name": "hasBadge",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextReportId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "protocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "externalEuint32",
          "name": "pm25Ext",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "pm10Ext",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "visibilityExt",
          "type": "bytes32"
        },
        {
          "internalType": "externalEuint32",
          "name": "smellExt",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "inputProof",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "metadataCID",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "regionCode",
          "type": "string"
        }
      ],
      "name": "submitReport",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "reportId",
          "type": "uint256"
        }
      ],
      "name": "upvote",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
