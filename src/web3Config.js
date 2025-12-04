// src/web3Config.js

// 1. PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE
// (The one you got from Remix/Ganache)
// export const contractAddress = "0xf3f79bAcEb4672d590031895962541545d187153"; 
export const contractAddress = "0x88957CEaAAf03113206a055f87bf2a299924ABFF"; 

// 2. PASTE YOUR FULL ABI HERE
// (The one you copied from the "Compile" tab in Remix)
export const contractABI =
  [
	// {
	// 	"inputs": [],
	// 	"stateMutability": "nonpayable",
	// 	"type": "constructor"
	// },
	// {
	// 	"anonymous": false,
	// 	"inputs": [
	// 		{
	// 			"indexed": true,
	// 			"internalType": "uint256",
	// 			"name": "id",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"indexed": true,
	// 			"internalType": "address",
	// 			"name": "owner",
	// 			"type": "address"
	// 		},
	// 		{
	// 			"indexed": false,
	// 			"internalType": "string",
	// 			"name": "title",
	// 			"type": "string"
	// 		},
	// 		{
	// 			"indexed": false,
	// 			"internalType": "uint256",
	// 			"name": "goal",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "CampaignCreated",
	// 	"type": "event"
	// },
	// {
	// 	"anonymous": false,
	// 	"inputs": [
	// 		{
	// 			"indexed": true,
	// 			"internalType": "uint256",
	// 			"name": "id",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "CampaignDeactivated",
	// 	"type": "event"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "string",
	// 			"name": "_title",
	// 			"type": "string"
	// 		},
	// 		{
	// 			"internalType": "string",
	// 			"name": "_description",
	// 			"type": "string"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "_goal",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "createCampaign",
	// 	"outputs": [],
	// 	"stateMutability": "nonpayable",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "_campaignId",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "deactivateCampaign",
	// 	"outputs": [],
	// 	"stateMutability": "nonpayable",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "_donationId",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "address payable",
	// 			"name": "_beneficiaryAddress",
	// 			"type": "address"
	// 		}
	// 	],
	// 	"name": "distribute",
	// 	"outputs": [],
	// 	"stateMutability": "nonpayable",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "_campaignId",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "donate",
	// 	"outputs": [],
	// 	"stateMutability": "payable",
	// 	"type": "function"
	// },
	// {
	// 	"anonymous": false,
	// 	"inputs": [
	// 		{
	// 			"indexed": true,
	// 			"internalType": "uint256",
	// 			"name": "donationId",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"indexed": false,
	// 			"internalType": "address",
	// 			"name": "beneficiary",
	// 			"type": "address"
	// 		},
	// 		{
	// 			"indexed": false,
	// 			"internalType": "uint256",
	// 			"name": "amount",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "DonationDistributed",
	// 	"type": "event"
	// },
	// {
	// 	"anonymous": false,
	// 	"inputs": [
	// 		{
	// 			"indexed": true,
	// 			"internalType": "uint256",
	// 			"name": "donationId",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"indexed": true,
	// 			"internalType": "uint256",
	// 			"name": "campaignId",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"indexed": true,
	// 			"internalType": "address",
	// 			"name": "donor",
	// 			"type": "address"
	// 		},
	// 		{
	// 			"indexed": false,
	// 			"internalType": "uint256",
	// 			"name": "amount",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "DonationReceived",
	// 	"type": "event"
	// },
	// {
	// 	"inputs": [],
	// 	"name": "campaignCounter",
	// 	"outputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "campaigns",
	// 	"outputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "id",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "address payable",
	// 			"name": "owner",
	// 			"type": "address"
	// 		},
	// 		{
	// 			"internalType": "string",
	// 			"name": "title",
	// 			"type": "string"
	// 		},
	// 		{
	// 			"internalType": "string",
	// 			"name": "description",
	// 			"type": "string"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "goal",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "amountRaised",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "amountDistributed",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "bool",
	// 			"name": "active",
	// 			"type": "bool"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [],
	// 	"name": "donationCounter",
	// 	"outputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "donations",
	// 	"outputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "id",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "campaignId",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "address",
	// 			"name": "donor",
	// 			"type": "address"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "amount",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "bool",
	// 			"name": "distributed",
	// 			"type": "bool"
	// 		},
	// 		{
	// 			"internalType": "address",
	// 			"name": "beneficiary",
	// 			"type": "address"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "donationsPerCampaign",
	// 	"outputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "address",
	// 			"name": "",
	// 			"type": "address"
	// 		},
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "donationsPerDonor",
	// 	"outputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [],
	// 	"name": "getAllCampaigns",
	// 	"outputs": [
	// 		{
	// 			"components": [
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "id",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "address payable",
	// 					"name": "owner",
	// 					"type": "address"
	// 				},
	// 				{
	// 					"internalType": "string",
	// 					"name": "title",
	// 					"type": "string"
	// 				},
	// 				{
	// 					"internalType": "string",
	// 					"name": "description",
	// 					"type": "string"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "goal",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "amountRaised",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "amountDistributed",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "bool",
	// 					"name": "active",
	// 					"type": "bool"
	// 				}
	// 			],
	// 			"internalType": "struct SecureFund.Campaign[]",
	// 			"name": "",
	// 			"type": "tuple[]"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [
	// 		{
	// 			"internalType": "uint256",
	// 			"name": "_campaignId",
	// 			"type": "uint256"
	// 		}
	// 	],
	// 	"name": "getDonationsByCampaign",
	// 	"outputs": [
	// 		{
	// 			"components": [
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "id",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "campaignId",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "address",
	// 					"name": "donor",
	// 					"type": "address"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "amount",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "bool",
	// 					"name": "distributed",
	// 					"type": "bool"
	// 				},
	// 				{
	// 					"internalType": "address",
	// 					"name": "beneficiary",
	// 					"type": "address"
	// 				}
	// 			],
	// 			"internalType": "struct SecureFund.Donation[]",
	// 			"name": "",
	// 			"type": "tuple[]"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [],
	// 	"name": "getMyDonations",
	// 	"outputs": [
	// 		{
	// 			"components": [
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "id",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "campaignId",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "address",
	// 					"name": "donor",
	// 					"type": "address"
	// 				},
	// 				{
	// 					"internalType": "uint256",
	// 					"name": "amount",
	// 					"type": "uint256"
	// 				},
	// 				{
	// 					"internalType": "bool",
	// 					"name": "distributed",
	// 					"type": "bool"
	// 				},
	// 				{
	// 					"internalType": "address",
	// 					"name": "beneficiary",
	// 					"type": "address"
	// 				}
	// 			],
	// 			"internalType": "struct SecureFund.Donation[]",
	// 			"name": "",
	// 			"type": "tuple[]"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// },
	// {
	// 	"inputs": [],
	// 	"name": "i_admin",
	// 	"outputs": [
	// 		{
	// 			"internalType": "address",
	// 			"name": "",
	// 			"type": "address"
	// 		}
	// 	],
	// 	"stateMutability": "view",
	// 	"type": "function"
	// }


	//new
	
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
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "goal",
				"type": "uint256"
			}
		],
		"name": "CampaignCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_goal",
				"type": "uint256"
			}
		],
		"name": "createCampaign",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_campaignId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_donationId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "_beneficiary",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_amountToDistribute",
				"type": "uint256"
			}
		],
		"name": "distributeFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_campaignId",
				"type": "uint256"
			}
		],
		"name": "donate",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "donationId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "donor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "DonationReceived",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "donationId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "beneficiary",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountDistributed",
				"type": "uint256"
			}
		],
		"name": "FundsDistributed",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "campaignCount",
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
				"name": "",
				"type": "uint256"
			}
		],
		"name": "campaigns",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "title",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "description",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "goal",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountRaised",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "active",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "donationCount",
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
				"name": "",
				"type": "uint256"
			}
		],
		"name": "donations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "id",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "campaignId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "donor",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amountUsed",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllCampaigns",
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
						"name": "owner",
						"type": "address"
					},
					{
						"internalType": "string",
						"name": "title",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "description",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "goal",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "amountRaised",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "active",
						"type": "bool"
					}
				],
				"internalType": "struct SecureFund.Campaign[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMyDonations",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "id",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "campaignId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "donor",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "amountUsed",
						"type": "uint256"
					}
				],
				"internalType": "struct SecureFund.Donation[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userDonations",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}

];