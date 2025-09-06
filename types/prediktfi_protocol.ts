export type PrediktfiProtocol = {
  "version": "0.1.0",
  "name": "prediktfi_protocol",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "createPredictionMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "protocolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "marketId",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "endTimestamp",
          "type": "i64"
        },
        {
          "name": "minBetAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "placePrediction",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userPrediction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "prediction",
          "type": "bool"
        }
      ]
    },
    {
      "name": "resolveMarket",
      "accounts": [
        {
          "name": "market",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": "bool"
        }
      ]
    },
    {
      "name": "claimWinnings",
      "accounts": [
        {
          "name": "market",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPrediction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "protocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "totalMarkets",
            "type": "u64"
          },
          {
            "name": "isPaused",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "predictionMarket",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "endTimestamp",
            "type": "i64"
          },
          {
            "name": "createdTimestamp",
            "type": "i64"
          },
          {
            "name": "resolvedTimestamp",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "minBetAmount",
            "type": "u64"
          },
          {
            "name": "isResolved",
            "type": "bool"
          },
          {
            "name": "outcome",
            "type": {
              "option": "bool"
            }
          },
          {
            "name": "totalYesAmount",
            "type": "u64"
          },
          {
            "name": "totalNoAmount",
            "type": "u64"
          },
          {
            "name": "totalParticipants",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "userPrediction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "market",
            "type": "publicKey"
          },
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "prediction",
            "type": "bool"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "winnings",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "ProtocolInitialized",
      "fields": [
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "MarketCreated",
      "fields": [
        {
          "name": "marketId",
          "type": "string",
          "index": true
        },
        {
          "name": "description",
          "type": "string",
          "index": false
        },
        {
          "name": "endTimestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "PredictionPlaced",
      "fields": [
        {
          "name": "marketId",
          "type": "string",
          "index": true
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "prediction",
          "type": "bool",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "MarketResolved",
      "fields": [
        {
          "name": "marketId",
          "type": "string",
          "index": true
        },
        {
          "name": "outcome",
          "type": "bool",
          "index": false
        },
        {
          "name": "totalYesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalNoAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "WinningsClaimed",
      "fields": [
        {
          "name": "marketId",
          "type": "string",
          "index": true
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": true
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MarketAlreadyResolved",
      "msg": "Market has already been resolved"
    },
    {
      "code": 6001,
      "name": "MarketExpired",
      "msg": "Market has expired"
    },
    {
      "code": 6002,
      "name": "MarketNotExpired",
      "msg": "Market has not expired yet"
    },
    {
      "code": 6003,
      "name": "MarketNotResolved",
      "msg": "Market has not been resolved"
    },
    {
      "code": 6004,
      "name": "ProtocolPaused",
      "msg": "Protocol is paused"
    },
    {
      "code": 6005,
      "name": "MarketIdTooLong",
      "msg": "Market ID is too long"
    },
    {
      "code": 6006,
      "name": "DescriptionTooLong",
      "msg": "Description is too long"
    },
    {
      "code": 6007,
      "name": "InvalidMinBetAmount",
      "msg": "Invalid minimum bet amount"
    },
    {
      "code": 6008,
      "name": "InvalidEndTime",
      "msg": "Invalid end time"
    },
    {
      "code": 6009,
      "name": "BetAmountTooLow",
      "msg": "Bet amount is too low"
    },
    {
      "code": 6010,
      "name": "UserAlreadyPredicted",
      "msg": "User has already predicted in this market"
    },
    {
      "code": 6011,
      "name": "AlreadyClaimed",
      "msg": "Winnings already claimed"
    },
    {
      "code": 6012,
      "name": "UserLost",
      "msg": "User did not win this market"
    },
    {
      "code": 6013,
      "name": "MathOverflow",
      "msg": "Math overflow"
    }
  ]
};
