// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title NebulaAtmosFHE
 * @notice 空气质量 DApp（FHE 版本），核心能力与 AirWitnessFHE 等价，但命名与事件做了全面重命名。
 *         - 存储：pm25, pm10, visibility, smell 为 euint32（密文）
 *         - 明文：metadataCID、regionCode、timestamp、reporter
 *         - 同一 inputProof 下允许多个 external 句柄
 */
contract NebulaAtmosFHE is ZamaEthereumConfig {
    struct Reading {
        uint256 id;
        address reporter;
        string metadataCID;
        string regionCode;
        uint256 timestamp;
        // 密文字段
        euint32 pm25;
        euint32 pm10;
        euint32 visibility;
        euint32 smell; // 0: None, 1: Pungent, 2: Smoke, 3: Gasoline...
    }

    uint256 public nextReadingId = 1;

    mapping(uint256 => Reading) private _readings;
    mapping(string => uint256[]) private _readingIdsByRegion;
    mapping(address => uint256) private _userReadingCount;

    // 投票（可选）
    mapping(uint256 => uint256) private _votesUp;
    mapping(uint256 => uint256) private _votesDown;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    // 限频：同地址-同 UTC 日-同区域，只允许一次提交
    mapping(address => mapping(uint256 => mapping(bytes32 => bool))) private _submittedByDayAndRegion;

    // 勋章系统（重命名）
    enum MedalTier { None, Bronze, Silver, Gold, Expert }
    mapping(address => mapping(MedalTier => bool)) private _redeemedMedals;

    event ReadingLogged(uint256 indexed id, address indexed reporter, string indexed regionCode);
    event ReadingVoted(uint256 indexed id, address indexed voter, bool up);
    event MedalRedeemed(address indexed user, MedalTier tier, uint256 readingCount);

    /**
     * @dev 提交（加密）读数
     */
    function lodgeReading(
        externalEuint32 pm25Ext,
        externalEuint32 pm10Ext,
        externalEuint32 visibilityExt,
        externalEuint32 smellExt,
        bytes calldata inputProof,
        string calldata metadataCID,
        string calldata regionCode
    ) external returns (uint256 id) {
        _requireRegion(regionCode);
        _requireCID(metadataCID);

        uint256 day = block.timestamp / 1 days;
        bytes32 regionHash = keccak256(bytes(regionCode));
        require(!_submittedByDayAndRegion[msg.sender][day][regionHash], "Daily region cap reached");
        _submittedByDayAndRegion[msg.sender][day][regionHash] = true;

        euint32 cPm25 = FHE.fromExternal(pm25Ext, inputProof);
        euint32 cPm10 = FHE.fromExternal(pm10Ext, inputProof);
        euint32 cVisibility = FHE.fromExternal(visibilityExt, inputProof);
        euint32 cSmell = FHE.fromExternal(smellExt, inputProof);

        id = nextReadingId++;

        _readings[id] = Reading({
            id: id,
            reporter: msg.sender,
            metadataCID: metadataCID,
            regionCode: regionCode,
            timestamp: block.timestamp,
            pm25: cPm25,
            pm10: cPm10,
            visibility: cVisibility,
            smell: cSmell
        });

        // 解密授权：合约自身与上报者
        FHE.allowThis(cPm25);
        FHE.allowThis(cPm10);
        FHE.allowThis(cVisibility);
        FHE.allowThis(cSmell);
        FHE.allow(cPm25, msg.sender);
        FHE.allow(cPm10, msg.sender);
        FHE.allow(cVisibility, msg.sender);
        FHE.allow(cSmell, msg.sender);

        _readingIdsByRegion[regionCode].push(id);
        _userReadingCount[msg.sender] += 1;

        emit ReadingLogged(id, msg.sender, regionCode);
    }

    function fetchReading(uint256 readingId) external view returns (Reading memory) {
        require(readingId > 0 && readingId < nextReadingId, "Reading not found");
        return _readings[readingId];
    }

    function listRegionReadings(string calldata regionCode) external view returns (uint256[] memory) {
        return _readingIdsByRegion[regionCode];
    }

    function totalUserReadings(address user) external view returns (uint256) {
        return _userReadingCount[user];
    }

    /**
     * @dev 领取勋章
     */
    function redeemMedal(MedalTier tier) external {
        require(tier != MedalTier.None, "Invalid medal tier");
        require(!_redeemedMedals[msg.sender][tier], "Medal already redeemed");

        uint256 readingCount = _userReadingCount[msg.sender];
        uint256 requiredCount = _requiredReadings(tier);

        require(readingCount >= requiredCount, "Not enough readings");

        _redeemedMedals[msg.sender][tier] = true;
        emit MedalRedeemed(msg.sender, tier, readingCount);
    }

    function ownsMedal(address user, MedalTier tier) external view returns (bool) {
        return _redeemedMedals[user][tier];
    }

    function getUserMedals(address user) external view returns (bool bronze, bool silver, bool gold, bool expert) {
        return (
            _redeemedMedals[user][MedalTier.Bronze],
            _redeemedMedals[user][MedalTier.Silver],
            _redeemedMedals[user][MedalTier.Gold],
            _redeemedMedals[user][MedalTier.Expert]
        );
    }

    function medalThresholds() external pure returns (uint256 bronze, uint256 silver, uint256 gold, uint256 expert) {
        return (2, 50, 200, 500);
    }

    // 投票
    function upvoteReading(uint256 readingId) external {
        _vote(readingId, true);
    }

    function downvoteReading(uint256 readingId) external {
        _vote(readingId, false);
    }

    function readingVotes(uint256 readingId) external view returns (uint256 up, uint256 down) {
        require(readingId > 0 && readingId < nextReadingId, "Reading not found");
        return (_votesUp[readingId], _votesDown[readingId]);
    }

    function _vote(uint256 readingId, bool up) internal {
        require(readingId > 0 && readingId < nextReadingId, "Reading not found");
        require(!_hasVoted[readingId][msg.sender], "Already voted");
        _hasVoted[readingId][msg.sender] = true;
        if (up) {
            _votesUp[readingId] += 1;
        } else {
            _votesDown[readingId] += 1;
        }
        emit ReadingVoted(readingId, msg.sender, up);
    }

    function _requiredReadings(MedalTier tier) internal pure returns (uint256) {
        if (tier == MedalTier.Bronze) return 2;
        if (tier == MedalTier.Silver) return 50;
        if (tier == MedalTier.Gold) return 200;
        if (tier == MedalTier.Expert) return 500;
        return 0;
    }

    function _requireRegion(string calldata regionCode) internal pure {
        require(bytes(regionCode).length > 0 && bytes(regionCode).length <= 64, "Invalid region");
    }

    function _requireCID(string calldata metadataCID) internal pure {
        require(bytes(metadataCID).length > 0 && bytes(metadataCID).length <= 128, "Invalid CID");
    }
}



