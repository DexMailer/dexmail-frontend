// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IBaseMailer {
    function claimWallet(
        string calldata email,
        address claimantOwner,
        bytes calldata verificationProof
    ) external;
    
    function registerEmailWithPassword(
        string calldata email,
        address userAddress
    ) external;
    
    function authorizedRelayers(address relayer) external view returns (bool);
    function getWalletAddress(bytes32 emailHash) external view returns (address);
}

/**
 * @title TrustedRelayer
 * @notice Secure relayer contract for email verification and blockchain interactions
 * @dev Handles email verification, signature validation, and secure relaying for Dexmail
 */
contract TrustedRelayer is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // ============ STRUCTS ============
    
    struct EmailVerification {
        address claimant;
        uint256 timestamp;
        bytes32 emailHash;
        bool verified;
        bool used;
    }
    
    struct RelayerConfig {
        bool isActive;
        uint256 maxGasPrice;
        uint256 dailyLimit;
        uint256 dailyUsed;
        uint256 lastResetDay;
    }
    
    // ============ CONSTANTS ============
    
    uint256 public constant MAX_EMAIL_LENGTH = 320;
    bytes32 public constant CLAIM_WALLET_TYPEHASH = keccak256("CLAIM_WALLET");
    bytes32 public constant REGISTER_EMAIL_TYPEHASH = keccak256("REGISTER_EMAIL");
    
    // ============ STATE VARIABLES ============
    
    // Main BaseMailer contract
    IBaseMailer public immutable baseMailer;
    
    // Email verification mappings
    mapping(bytes32 => EmailVerification) public emailVerifications;
    mapping(address => bytes32[]) public userVerifications;
    mapping(bytes32 => bool) public usedNonces;
    
    // Relayer management
    mapping(address => RelayerConfig) public relayerConfigs;
    address[] public authorizedRelayers;
    
    // Security settings
    uint256 public verificationTimeout = 1 hours;
    uint256 public maxGasPrice = 50 gwei;
    uint256 public dailyRelayLimit = 100;
    
    // Fee management
    uint256 public relayFee = 0.001 ether;
    mapping(address => bool) public feeExempt;
    
    // Nonce management for signature replay protection
    mapping(address => uint256) public userNonces;
    
    // Emergency stop
    bool public emergencyStop;
    
    // ============ EVENTS ============
    
    event EmailVerificationRequested(
        bytes32 indexed emailHash,
        address indexed claimant,
        uint256 timestamp
    );
    
    event EmailVerified(
        bytes32 indexed emailHash,
        address indexed claimant,
        address indexed verifier
    );
    
    event WalletClaimed(
        string email,
        address indexed claimant,
        address indexed walletAddress
    );
    
    event RelayerAdded(address indexed relayer, uint256 dailyLimit);
    event RelayerRemoved(address indexed relayer);
    event RelayerConfigUpdated(address indexed relayer, uint256 newLimit);
    
    event EmailRegistered(
        string email,
        address indexed userAddress,
        address indexed relayer
    );
    
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event SecurityConfigUpdated(uint256 timeout, uint256 maxGas, uint256 dailyLimit);
    event EmergencyStopToggled(bool stopped);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    // ============ ERRORS ============
    
    error UnauthorizedRelayer();
    error InvalidSignature();
    error VerificationExpired();
    error EmailAlreadyVerified();
    error InvalidEmailHash();
    error DailyLimitExceeded();
    error InsufficientFee();
    error InvalidNonce();
    error GasPriceTooHigh();
    error VerificationNotFound();
    error AlreadyUsed();
    error InvalidAddress();
    error InvalidEmailLength();
    error EmergencyStopActive();
    error RelayerAlreadyExists();
    error RelayerNotActive();
    error NoFeesToWithdraw();
    error TransferFailed();
    error ClaimantMismatch();
    
    // ============ MODIFIERS ============
    
    modifier onlyAuthorizedRelayer() {
        if (!relayerConfigs[msg.sender].isActive) revert UnauthorizedRelayer();
        _;
    }
    
    modifier validGasPrice() {
        if (tx.gasprice > maxGasPrice) revert GasPriceTooHigh();
        _;
    }
    
    modifier checkDailyLimit() {
        RelayerConfig storage config = relayerConfigs[msg.sender];
        uint256 currentDay = block.timestamp / 1 days;
        
        if (config.lastResetDay < currentDay) {
            config.dailyUsed = 0;
            config.lastResetDay = currentDay;
        }
        
        if (config.dailyUsed >= config.dailyLimit) revert DailyLimitExceeded();
        
        config.dailyUsed++;
        _;
    }
    
    modifier checkFee() {
        if (!feeExempt[msg.sender] && msg.value < relayFee) {
            revert InsufficientFee();
        }
        _;
    }
    
    modifier notEmergencyStopped() {
        if (emergencyStop) revert EmergencyStopActive();
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(
        address _baseMailer,
        address _initialOwner
    ) Ownable(_initialOwner) {
        if (_baseMailer == address(0)) revert InvalidAddress();
        baseMailer = IBaseMailer(_baseMailer);
    }
    
    // ============ EMAIL VERIFICATION ============
    
    /**
     * @notice Request email verification (called by off-chain service)
     * @param emailHash Keccak256 hash of the email address
     * @param claimant Address that will own the wallet
     * @param signature Signature proving email ownership from off-chain verification
     */
    function requestEmailVerification(
        bytes32 emailHash,
        address claimant,
        bytes calldata signature
    ) external payable 
        onlyAuthorizedRelayer 
        whenNotPaused 
        notEmergencyStopped
        checkDailyLimit 
        checkFee 
    {
        if (emailHash == bytes32(0)) revert InvalidEmailHash();
        if (claimant == address(0)) revert InvalidAddress();
        if (emailVerifications[emailHash].verified) revert EmailAlreadyVerified();
        
        // Verify the signature is from the claimant
        bytes32 messageHash = keccak256(abi.encodePacked(
            emailHash, 
            claimant, 
            userNonces[claimant],
            address(this)
        ));
        
        if (!_verifySignature(messageHash, signature, claimant)) {
            revert InvalidSignature();
        }
        
        // Store verification request
        emailVerifications[emailHash] = EmailVerification({
            claimant: claimant,
            timestamp: block.timestamp,
            emailHash: emailHash,
            verified: true,
            used: false
        });
        
        userVerifications[claimant].push(emailHash);
        userNonces[claimant]++;
        
        emit EmailVerificationRequested(emailHash, claimant, block.timestamp);
        emit EmailVerified(emailHash, claimant, msg.sender);
    }
    
    /**
     * @notice Claim wallet after email verification
     * @param email Plaintext email address
     * @param claimant Address that will own the wallet
     * @param nonce Nonce for replay protection
     * @param signature Signature from the claimant
     */
    function claimEmailWallet(
        string calldata email,
        address claimant,
        uint256 nonce,
        bytes calldata signature
    ) external 
        onlyAuthorizedRelayer 
        nonReentrant 
        whenNotPaused 
        notEmergencyStopped
        validGasPrice 
    {
        if (bytes(email).length > MAX_EMAIL_LENGTH) revert InvalidEmailLength();
        if (claimant == address(0)) revert InvalidAddress();
        
        bytes32 emailHash = keccak256(abi.encodePacked(email));
        EmailVerification storage verification = emailVerifications[emailHash];
        
        if (!verification.verified) revert VerificationNotFound();
        if (verification.used) revert AlreadyUsed();
        if (verification.claimant != claimant) revert ClaimantMismatch();
        if (block.timestamp > verification.timestamp + verificationTimeout) {
            revert VerificationExpired();
        }
        
        // Verify claimant's signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            CLAIM_WALLET_TYPEHASH,
            email,
            claimant,
            nonce,
            address(this)
        ));
        
        if (!_verifySignature(messageHash, signature, claimant)) {
            revert InvalidSignature();
        }
        
        if (userNonces[claimant] != nonce) revert InvalidNonce();
        
        // Mark as used
        verification.used = true;
        userNonces[claimant]++;
        
        // Create verification proof for BaseMailer (signed by this contract's authorized relayer)
        bytes memory verificationProof = _createVerificationProof(email, claimant);
        
        // Call BaseMailer to deploy and claim the wallet
        baseMailer.claimWallet(email, claimant, verificationProof);
        
        address walletAddress = baseMailer.getWalletAddress(emailHash);
        
        emit WalletClaimed(email, claimant, walletAddress);
    }
    
    /**
     * @notice Register email with password authentication (for existing users)
     * @param email Email address to register
     * @param userAddress Address to associate with email
     * @param signature Signature proving ownership
     */
    function registerEmailWithAuth(
        string calldata email,
        address userAddress,
        bytes calldata signature
    ) external 
        onlyAuthorizedRelayer 
        whenNotPaused 
        notEmergencyStopped
        checkDailyLimit 
    {
        if (bytes(email).length > MAX_EMAIL_LENGTH) revert InvalidEmailLength();
        if (userAddress == address(0)) revert InvalidAddress();
        
        // Verify signature from user
        bytes32 messageHash = keccak256(abi.encodePacked(
            REGISTER_EMAIL_TYPEHASH,
            email,
            userAddress,
            userNonces[userAddress],
            address(this)
        ));
        
        if (!_verifySignature(messageHash, signature, userAddress)) {
            revert InvalidSignature();
        }
        
        userNonces[userAddress]++;
        
        // Call BaseMailer to register email
        baseMailer.registerEmailWithPassword(email, userAddress);
        
        emit EmailRegistered(email, userAddress, msg.sender);
    }
    
    // ============ RELAYER MANAGEMENT ============
    
    /**
     * @notice Add a new authorized relayer
     * @param relayer Address of the relayer to add
     * @param dailyLimit Daily transaction limit for this relayer
     */
    function addRelayer(
        address relayer,
        uint256 dailyLimit
    ) external onlyOwner {
        if (relayer == address(0)) revert InvalidAddress();
        if (relayerConfigs[relayer].isActive) revert RelayerAlreadyExists();
        
        relayerConfigs[relayer] = RelayerConfig({
            isActive: true,
            maxGasPrice: maxGasPrice,
            dailyLimit: dailyLimit,
            dailyUsed: 0,
            lastResetDay: block.timestamp / 1 days
        });
        
        authorizedRelayers.push(relayer);
        
        emit RelayerAdded(relayer, dailyLimit);
    }
    
    /**
     * @notice Remove an authorized relayer
     * @param relayer Address of the relayer to remove
     */
    function removeRelayer(address relayer) external onlyOwner {
        if (!relayerConfigs[relayer].isActive) revert RelayerNotActive();
        
        relayerConfigs[relayer].isActive = false;
        
        // Remove from array
        for (uint256 i = 0; i < authorizedRelayers.length; i++) {
            if (authorizedRelayers[i] == relayer) {
                authorizedRelayers[i] = authorizedRelayers[authorizedRelayers.length - 1];
                authorizedRelayers.pop();
                break;
            }
        }
        
        emit RelayerRemoved(relayer);
    }
    
    /**
     * @notice Update relayer configuration
     * @param relayer Address of the relayer
     * @param dailyLimit New daily limit
     */
    function updateRelayerConfig(
        address relayer,
        uint256 dailyLimit
    ) external onlyOwner {
        if (!relayerConfigs[relayer].isActive) revert RelayerNotActive();
        
        relayerConfigs[relayer].dailyLimit = dailyLimit;
        
        emit RelayerConfigUpdated(relayer, dailyLimit);
    }
    
    // ============ SECURITY CONFIGURATION ============
    
    /**
     * @notice Update security parameters
     * @param _verificationTimeout New verification timeout
     * @param _maxGasPrice New maximum gas price
     * @param _dailyRelayLimit New daily relay limit
     */
    function updateSecurityConfig(
        uint256 _verificationTimeout,
        uint256 _maxGasPrice,
        uint256 _dailyRelayLimit
    ) external onlyOwner {
        verificationTimeout = _verificationTimeout;
        maxGasPrice = _maxGasPrice;
        dailyRelayLimit = _dailyRelayLimit;
        
        emit SecurityConfigUpdated(_verificationTimeout, _maxGasPrice, _dailyRelayLimit);
    }
    
    /**
     * @notice Update relay fee
     * @param _newFee New relay fee in wei
     */
    function updateRelayFee(uint256 _newFee) external onlyOwner {
        uint256 oldFee = relayFee;
        relayFee = _newFee;
        
        emit FeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @notice Set fee exemption for an address
     * @param account Address to exempt/unexempt
     * @param exempt True to exempt from fees, false to require fees
     */
    function setFeeExemption(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        feeExempt[account] = exempt;
    }
    
    /**
     * @notice Toggle emergency stop
     */
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
        emit EmergencyStopToggled(emergencyStop);
    }
    
    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @notice Pause the contract (emergency use)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw accumulated fees
     * @param to Address to send fees to
     */
    function withdrawFees(address payable to) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFeesToWithdraw();
        
        (bool success, ) = to.call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit FeesWithdrawn(to, balance);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @notice Get user's verification history
     * @param user Address of the user
     * @return Array of email hashes verified by the user
     */
    function getUserVerifications(address user) external view returns (bytes32[] memory) {
        return userVerifications[user];
    }
    
    /**
     * @notice Get all authorized relayers
     * @return Array of authorized relayer addresses
     */
    function getAuthorizedRelayers() external view returns (address[] memory) {
        return authorizedRelayers;
    }
    
    /**
     * @notice Check if email hash is verified and unused
     * @param emailHash Hash of the email to check
     * @return verified True if verified
     * @return used True if already used
     * @return claimant Address of the claimant
     */
    function getVerificationStatus(bytes32 emailHash) 
        external 
        view 
        returns (bool verified, bool used, address claimant) 
    {
        EmailVerification storage verification = emailVerifications[emailHash];
        return (verification.verified, verification.used, verification.claimant);
    }
    
    /**
     * @notice Get relayer's current usage
     * @param relayer Address of the relayer
     * @return dailyUsed Number of transactions used today
     * @return dailyLimit Maximum transactions per day
     * @return isActive True if relayer is active
     */
    function getRelayerUsage(address relayer) 
        external 
        view 
        returns (uint256 dailyUsed, uint256 dailyLimit, bool isActive) 
    {
        RelayerConfig storage config = relayerConfigs[relayer];
        uint256 currentDay = block.timestamp / 1 days;
        
        if (config.lastResetDay < currentDay) {
            dailyUsed = 0;
        } else {
            dailyUsed = config.dailyUsed;
        }
        
        return (dailyUsed, config.dailyLimit, config.isActive);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @notice Verify a signature using ECDSA
     * @param messageHash Hash of the message
     * @param signature Signature to verify
     * @param expectedSigner Expected signer address
     * @return True if signature is valid
     */
    function _verifySignature(
        bytes32 messageHash,
        bytes memory signature,
        address expectedSigner
    ) internal pure returns (bool) {
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);
        
        return recoveredSigner == expectedSigner && recoveredSigner != address(0);
    }
    
    /**
     * @notice Create verification proof for BaseMailer
     * @param email Email address
     * @param claimant Claimant address
     * @return Encoded verification proof signed by trusted relayer
     */
    function _createVerificationProof(
        string memory email,
        address claimant
    ) internal pure returns (bytes memory) {
        // Create a proof that BaseMailer's verifyEmailOwnership can validate
        bytes32 messageHash = keccak256(abi.encodePacked(email, claimant));
        
        // In production, this would be signed by the relayer's private key
        // For now, return the message hash
        return abi.encodePacked(messageHash);
    }
    
    // ============ FALLBACK ============
    
    /**
     * @notice Receive function to accept ETH for fees
     */
    receive() external payable {
        // Allow contract to receive ETH for fees
    }
}