// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Structs for claim and proof information
struct ClaimInfo {
    string provider;
    string parameters;
    string context;
}

struct Claim {
    bytes32 identifier;
    address owner;
    uint32 timestampS;
    uint32 epoch;
}

struct SignedClaim {
    Claim claim;
    bytes[] signatures;
}

struct Proof {
    ClaimInfo claimInfo;
    SignedClaim signedClaim;
}

// Interface for ReclaimVerifier
interface IReclaimVerifier {
    function verifyProof(Proof memory proof) external;
}

contract CloutCoin is ERC20, Ownable {
    address public reclaimAddress;
    mapping(string => bool) public hasMinted;

    constructor() ERC20("CloutCoin", "CLT") Ownable(msg.sender) {
        reclaimAddress = 0xB68aCB36334311CEc471EE2541173EDc155FdA71;
    }

    function mint(Proof memory proof) public {
        try IReclaimVerifier(reclaimAddress).verifyProof(proof) {
            string memory context = proof.claimInfo.context;
            string memory screenName = getFieldFromContext(
                context,
                '"screen_name":"'
            );
            require(bytes(screenName).length > 0, "Screen name is missing");
            require(
                !hasMinted[screenName],
                "Tokens already minted for this user"
            );
            hasMinted[screenName] = true;

            string memory followersStr = getFieldFromContext(
                context,
                '"followers_count":'
            );
            require(
                bytes(followersStr).length > 0,
                "Followers count is missing"
            );
            uint256 followerCount = stringToUint(followersStr);

            uint256 mintAmount = followerCount * 1000 * 1e18;
            _mint(msg.sender, mintAmount);
        } catch {
            revert("Proof verification failed");
        }
    }

    function getFollowersCount(Proof memory proof)
        public
        pure
        returns (string memory)
    {
        string memory context = proof.claimInfo.context;
        string memory followersStr = getFieldFromContext(
            context,
            '"followers_count":'
        );
        require(bytes(followersStr).length > 0, "Followers count is missing");
        return followersStr;
    }

    function getFieldFromContext(string memory _data, string memory target)
        internal
        pure
        returns (string memory)
    {
        bytes memory dataBytes = bytes(_data);
        bytes memory targetBytes = bytes(target);
        require(
            dataBytes.length >= targetBytes.length,
            "Target is longer than data"
        );

        uint256 start = 0;
        bool foundStart = false;

        for (uint256 i = 0; i <= dataBytes.length - targetBytes.length; i++) {
            bool isMatch = true;
            for (uint256 j = 0; j < targetBytes.length && isMatch; j++) {
                if (dataBytes[i + j] != targetBytes[j]) {
                    isMatch = false;
                }
            }
            if (isMatch) {
                start = i + targetBytes.length;
                foundStart = true;
                break;
            }
        }

        if (!foundStart) {
            return "";
        }

        uint256 end = start;
        while (
            end < dataBytes.length &&
            dataBytes[end] != "," &&
            dataBytes[end] != "}"
        ) {
            end++;
        }

        if (end <= start) {
            return "";
        }

        bytes memory resultBytes = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            resultBytes[i - start] = dataBytes[i];
        }

        return string(resultBytes);
    }

    function stringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);

        // Check and remove quotes if present
        if (b.length > 1 && b[0] == '"' && b[b.length - 1] == '"') {
            bytes memory temp = new bytes(b.length - 2);
            for (uint256 i = 1; i < b.length - 1; i++) {
                temp[i - 1] = b[i];
            }
            b = temp;
        }

        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            if (b[i] < 0x30 || b[i] > 0x39) {
                revert(
                    string(
                        abi.encodePacked(
                            "Invalid character: 0x",
                            toHexString(uint8(b[i]), 1)
                        )
                    )
                );
            }
            result = result * 10 + (uint256(uint8(b[i])) - 48);
        }
        return result;
    }

    function toHexString(uint256 value, uint256 length)
        internal
        pure
        returns (string memory)
    {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = bytes1(uint8(48 + (value % 16)));
            if (value % 16 > 9) {
                buffer[i] = bytes1(uint8(87 + (value % 16))); // a-f for hex
            }
            value /= 16;
        }
        require(value == 0, "Hex length insufficient");
        return string(buffer);
    }
}
