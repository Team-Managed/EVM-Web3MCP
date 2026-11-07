// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

// ABI-compatible subsets verified against ensdomains/contracts-v2 tag
// sepolia-deployment-2026-09-15: IRegistry.sol and IOwnedRegistry.sol.
interface IGiftRoot {
    function getSubregistry(string calldata label) external view returns (address);
}

interface IGiftNames {
    function findOwner(string calldata label) external view returns (address);
}

interface IGiftToken {
    function balanceOf(address account) external view returns (uint256);
}

/// Time-locked gifts follow a name's current owner, never its address record.
contract GiftBox {
    struct Gift {
        address sender;
        address token;
        uint256 amount;
        uint64 unlockAt;
        bool done;
        string name;
        string message;
    }

    /// ERC-173 owner. ENS lets the owner set this contract's primary name; it has no other power.
    address public immutable owner;
    address public immutable usdc;
    IGiftRoot public immutable root;
    uint256 public constant RECOVERY_DELAY = 90 days;
    Gift[] private _gifts;
    mapping(bytes32 => uint256[]) private _byName;
    bool private _entered;

    event GiftSent(
        uint256 indexed id,
        bytes32 indexed nameHash,
        address indexed sender,
        address token,
        uint256 amount,
        uint64 unlockAt,
        string name,
        string message
    );
    event GiftClaimed(
        uint256 indexed id, bytes32 indexed nameHash, address indexed claimant, address token, uint256 amount
    );
    event GiftCancelled(
        uint256 indexed id, bytes32 indexed nameHash, address indexed sender, address token, uint256 amount
    );

    error InvalidAddress();
    error InvalidName();
    error UnregisteredName();
    error InvalidGift();
    error InvalidAmount();
    error InvalidUnlock();
    error NotClaimable();
    error NotCancellable();
    error TransferFailed();
    error Reentrancy();

    modifier guarded() {
        if (_entered) revert Reentrancy();
        _entered = true;
        _;
        _entered = false;
    }

    constructor(address owner_, address usdc_, address root_) {
        if (
            owner_ == address(0) || usdc_ == address(0) || root_ == address(0) || usdc_.code.length == 0
                || root_.code.length == 0
        ) {
            revert InvalidAddress();
        }
        owner = owner_;
        usdc = usdc_;
        root = IGiftRoot(root_);
        address registry = root.getSubregistry("eth");
        if (registry.code.length == 0) revert InvalidAddress();
    }

    function ownerOf(string memory name) public view returns (address) {
        string memory label = _label(name);
        address registry = root.getSubregistry("eth");
        if (registry.code.length == 0) revert InvalidAddress();
        return IGiftNames(registry).findOwner(label);
    }

    function giftsFor(string memory name) external view returns (uint256[] memory) {
        _label(name);
        return _byName[keccak256(bytes(name))];
    }

    function gifts(uint256 id) external view returns (Gift memory) {
        if (id >= _gifts.length) revert InvalidGift();
        return _gifts[id];
    }

    function giftEth(string calldata name, uint64 unlockAt, string calldata message)
        external
        payable
        guarded
        returns (uint256 id)
    {
        return _send(name, address(0), msg.value, unlockAt, message);
    }

    function giftUsdc(string calldata name, uint256 amount, uint64 unlockAt, string calldata message)
        external
        guarded
        returns (uint256 id)
    {
        id = _send(name, usdc, amount, unlockAt, message);
        uint256 beforeBalance = IGiftToken(usdc).balanceOf(address(this));
        _token(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount));
        uint256 afterBalance = IGiftToken(usdc).balanceOf(address(this));
        if (afterBalance < beforeBalance || afterBalance - beforeBalance != amount) revert TransferFailed();
    }

    function claim(uint256 id) external guarded {
        Gift storage g = _active(id);
        address beneficiary = ownerOf(g.name);
        if (block.timestamp < g.unlockAt || beneficiary == address(0) || beneficiary != msg.sender) {
            revert NotClaimable();
        }
        g.done = true;
        _pay(g, msg.sender);
        emit GiftClaimed(id, keccak256(bytes(g.name)), msg.sender, g.token, g.amount);
    }

    function cancel(uint256 id) external guarded {
        Gift storage g = _active(id);
        // Widen before addition: even uint64.max cannot overflow this expression.
        bool locked = block.timestamp >= g.unlockAt && block.timestamp < uint256(g.unlockAt) + RECOVERY_DELAY;
        // A lapsed name has no owner to claim, so the sender may take the gift back before someone re-registers it.
        if (msg.sender != g.sender || (locked && ownerOf(g.name) != address(0))) revert NotCancellable();
        g.done = true;
        _pay(g, msg.sender);
        emit GiftCancelled(id, keccak256(bytes(g.name)), msg.sender, g.token, g.amount);
    }

    function _send(string memory name, address token, uint256 amount, uint64 unlockAt, string memory message)
        private
        returns (uint256 id)
    {
        if (amount == 0) revert InvalidAmount();
        if (unlockAt < block.timestamp) revert InvalidUnlock();
        if (bytes(message).length > 1024) revert InvalidGift();
        if (ownerOf(name) == address(0)) revert UnregisteredName();
        id = _gifts.length;
        _gifts.push(Gift(msg.sender, token, amount, unlockAt, false, name, message));
        bytes32 hash = keccak256(bytes(name));
        _byName[hash].push(id);
        emit GiftSent(id, hash, msg.sender, token, amount, unlockAt, name, message);
    }

    function _active(uint256 id) private view returns (Gift storage g) {
        if (id >= _gifts.length || _gifts[id].done) revert InvalidGift();
        return _gifts[id];
    }

    function _pay(Gift storage g, address to) private {
        if (g.token == address(0)) {
            (bool ok,) = payable(to).call{value: g.amount}("");
            if (!ok) revert TransferFailed();
        } else {
            uint256 held = IGiftToken(usdc).balanceOf(address(this));
            uint256 received = IGiftToken(usdc).balanceOf(to);
            _token(abi.encodeWithSignature("transfer(address,uint256)", to, g.amount));
            uint256 heldAfter = IGiftToken(usdc).balanceOf(address(this));
            uint256 receivedAfter = IGiftToken(usdc).balanceOf(to);
            if (
                heldAfter > held || held - heldAfter != g.amount || receivedAfter < received
                    || receivedAfter - received != g.amount
            ) revert TransferFailed();
        }
    }

    function _token(bytes memory data) private {
        (bool ok, bytes memory result) = usdc.call(data);
        if (!ok || (result.length != 0 && (result.length != 32 || !abi.decode(result, (bool))))) {
            revert TransferFailed();
        }
    }

    function _label(string memory name) private pure returns (string memory) {
        bytes memory n = bytes(name);
        // A conservative ASCII subset of ENS names; no normalization is performed.
        if (
            n.length < 5 || n.length > 67 || n[n.length - 4] != "." || n[n.length - 3] != "e" || n[n.length - 2] != "t"
                || n[n.length - 1] != "h"
        ) revert InvalidName();
        uint256 len = n.length - 4;
        if (n[0] == "-" || n[len - 1] == "-") revert InvalidName();
        if (len >= 4 && n[2] == "-" && n[3] == "-") revert InvalidName();
        bytes memory label = new bytes(len);
        for (uint256 i; i < len; ++i) {
            bytes1 c = n[i];
            if (!((c >= "a" && c <= "z") || (c >= "0" && c <= "9") || c == "-")) revert InvalidName();
            label[i] = c;
        }
        return string(label);
    }
}
