// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {GiftBox} from "../src/GiftBox.sol";

interface GiftVm {
    function warp(uint256) external;
    function prank(address) external;
    function deal(address, uint256) external;
    function expectRevert(bytes4) external;
    function expectEmit(bool, bool, bool, bool, address) external;
}

contract GiftNamesMock {
    address public subregistry;
    mapping(bytes32 => address) private owners;
    mapping(bytes32 => uint64) private expiries;

    function setSubregistry(address value) external {
        subregistry = value;
    }

    function getSubregistry(string calldata label) external view returns (address) {
        require(keccak256(bytes(label)) == keccak256("eth"));
        return subregistry;
    }

    function set(string memory label, address owner, uint64 expiry) external {
        owners[keccak256(bytes(label))] = owner;
        expiries[keccak256(bytes(label))] = expiry;
    }

    function findOwner(string calldata label) external view returns (address) {
        bytes32 key = keccak256(bytes(label));
        return block.timestamp < expiries[key] ? owners[key] : address(0);
    }
}

contract GiftTokenMock {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public fee;
    bool public fail;
    bool public noReturn;

    function configure(uint256 fee_, bool fail_, bool noReturn_) external {
        fee = fee_;
        fail = fail_;
        noReturn = noReturn_;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return move(msg.sender, to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        return move(from, to, amount);
    }

    function move(address from, address to, uint256 amount) internal virtual returns (bool) {
        if (fail) return false;
        balanceOf[from] -= amount;
        balanceOf[to] += amount - fee;
        if (noReturn) {
            assembly { return(0, 0) }
        }
        return true;
    }
}

contract CallbackGiftToken is GiftTokenMock {
    GiftBox public target;
    uint256 public attackId;
    bool public armed;
    bool private attacking;
    uint256 public attempts;
    uint256 public blocked;
    uint256 public successes;

    function arm(GiftBox box_, uint256 id, bool enabled) external {
        target = box_;
        attackId = id;
        armed = enabled;
    }

    function claimGift(uint256 id) external {
        target.claim(id);
    }

    function move(address from, address to, uint256 amount) internal override returns (bool) {
        if (armed && !attacking) {
            attacking = true;
            bytes[4] memory payloads = [
                abi.encodeCall(target.claim, (attackId)),
                abi.encodeCall(target.cancel, (attackId)),
                abi.encodeCall(target.giftUsdc, ("riya.eth", 1, uint64(block.timestamp), "callback")),
                abi.encodeCall(target.giftEth, ("riya.eth", uint64(block.timestamp), "callback"))
            ];
            for (uint256 i; i < payloads.length; ++i) {
                (bool ok, bytes memory result) = address(target).call(payloads[i]);
                ++attempts;
                if (ok) ++successes;
                else if (result.length >= 4 && bytes4(result) == GiftBox.Reentrancy.selector) ++blocked;
            }
            attacking = false;
        }
        return super.move(from, to, amount);
    }
}

contract GiftReceiver {
    GiftBox public box;
    uint256 public id;
    bool public reject;
    bool public attempted;
    bool public reentered;

    constructor(GiftBox box_) {
        box = box_;
    }

    function set(uint256 id_, bool reject_) external {
        id = id_;
        reject = reject_;
    }

    function claim() external {
        box.claim(id);
    }

    function send(uint64 unlockAt) external payable {
        id = box.giftEth{value: msg.value}("riya.eth", unlockAt, "");
    }

    function cancelGift() external {
        box.cancel(id);
    }

    receive() external payable {
        require(!reject);
        attempted = true;
        (reentered,) = address(box).call(abi.encodeCall(box.claim, (id)));
    }
}

contract GiftBoxTest {
    GiftVm constant vm = GiftVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    GiftBox box;
    GiftTokenMock token;
    GiftNamesMock root;
    GiftNamesMock names;
    address constant RIYA = address(0xA11CE);
    address constant NEW_OWNER = address(0xB0B);
    uint64 constant UNLOCK = 2000;
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

    receive() external payable {}

    function setUp() public {
        vm.warp(1000);
        vm.deal(address(this), 10 ether);
        root = new GiftNamesMock();
        names = new GiftNamesMock();
        root.setSubregistry(address(names));
        token = new GiftTokenMock();
        box = new GiftBox(address(token), address(root));
        token.mint(address(this), 100e6);
        token.approve(address(box), type(uint256).max);
        names.set("riya", RIYA, type(uint64).max);
    }

    function send() private returns (uint256) {
        return box.giftUsdc("riya.eth", 10e6, UNLOCK, "Happy birthday");
    }

    function testUsdcClaimAndDetails() public {
        uint256 id = send();
        GiftBox.Gift memory g = box.gifts(id);
        require(
            g.sender == address(this) && g.token == address(token) && g.amount == 10e6 && g.unlockAt == UNLOCK
                && !g.done
        );
        require(keccak256(bytes(g.message)) == keccak256("Happy birthday"));
        require(box.giftsFor("riya.eth")[0] == id && token.balanceOf(address(box)) == 10e6);
        vm.warp(UNLOCK);
        vm.prank(RIYA);
        box.claim(id);
        require(box.gifts(id).done && token.balanceOf(RIYA) == 10e6 && token.balanceOf(address(box)) == 0);
    }

    function testEarlyClaim() public {
        uint256 id = send();
        vm.expectRevert(GiftBox.NotClaimable.selector);
        vm.prank(RIYA);
        box.claim(id);
    }

    function testNonOwner() public {
        uint256 id = send();
        vm.warp(UNLOCK);
        vm.expectRevert(GiftBox.NotClaimable.selector);
        box.claim(id);
    }

    function testOwnershipTransfer() public {
        uint256 id = send();
        names.set("riya", NEW_OWNER, type(uint64).max);
        vm.warp(UNLOCK);
        vm.expectRevert(GiftBox.NotClaimable.selector);
        vm.prank(RIYA);
        box.claim(id);
        vm.prank(NEW_OWNER);
        box.claim(id);
        require(token.balanceOf(NEW_OWNER) == 10e6);
    }

    function testCancelBeforeUnlock() public {
        uint256 id = send();
        box.cancel(id);
        require(token.balanceOf(address(this)) == 100e6 && box.gifts(id).done);
    }

    function testNonSenderCancel() public {
        uint256 id = send();
        vm.expectRevert(GiftBox.NotCancellable.selector);
        vm.prank(RIYA);
        box.cancel(id);
    }

    function testRecoveryBoundaries() public {
        uint256 id = send();
        vm.warp(UNLOCK);
        vm.expectRevert(GiftBox.NotCancellable.selector);
        box.cancel(id);
        vm.warp(uint256(UNLOCK) + 90 days - 1);
        vm.expectRevert(GiftBox.NotCancellable.selector);
        box.cancel(id);
        vm.warp(uint256(UNLOCK) + 90 days);
        box.cancel(id);
        require(box.gifts(id).done);
    }

    function testClaimRemainsPossibleAfterRecoveryBoundary() public {
        uint256 id = send();
        vm.warp(uint256(UNLOCK) + 90 days + 1);
        vm.prank(RIYA);
        box.claim(id);
    }

    function testDoneCannotBeUsedAgain() public {
        uint256 a = send();
        uint256 b = send();
        box.cancel(b);
        vm.warp(UNLOCK);
        vm.prank(RIYA);
        box.claim(a);
        vm.expectRevert(GiftBox.InvalidGift.selector);
        vm.prank(RIYA);
        box.claim(a);
        vm.expectRevert(GiftBox.InvalidGift.selector);
        vm.prank(RIYA);
        box.claim(b);
        vm.expectRevert(GiftBox.InvalidGift.selector);
        box.cancel(b);
    }

    function testEthClaimAndRefund() public {
        uint256 a = box.giftEth{value: 1 ether}("riya.eth", UNLOCK, "ETH");
        uint256 b = box.giftEth{value: 2 ether}("riya.eth", UNLOCK, "refund");
        box.cancel(b);
        vm.warp(UNLOCK);
        vm.prank(RIYA);
        box.claim(a);
        require(RIYA.balance == 1 ether && address(box).balance == 0 && address(this).balance == 9 ether);
    }

    function testInvalidNames() public {
        string[10] memory bad = [
            "Riya.eth",
            "riya.web3mcp.eth",
            "riya",
            ".eth",
            "-riya.eth",
            "riya-.eth",
            "ri_ya.eth",
            "riya.ETH",
            "a..eth",
            "ab--cd.eth"
        ];
        for (uint256 i; i < bad.length; ++i) {
            vm.expectRevert(GiftBox.InvalidName.selector);
            box.giftEth{value: 1}(bad[i], UNLOCK, "");
        }
    }

    function testUnregisteredAndExpired() public {
        vm.expectRevert(GiftBox.UnregisteredName.selector);
        box.giftEth{value: 1}("nobody.eth", UNLOCK, "");
        names.set("riya", RIYA, 1500);
        uint256 id = send();
        vm.warp(UNLOCK);
        require(box.ownerOf("riya.eth") == address(0));
        vm.expectRevert(GiftBox.NotClaimable.selector);
        vm.prank(RIYA);
        box.claim(id);
        vm.expectRevert(GiftBox.UnregisteredName.selector);
        box.giftEth{value: 1}("riya.eth", UNLOCK, "");
    }

    function testDynamicRootRegistry() public {
        uint256 id = send();
        GiftNamesMock replacement = new GiftNamesMock();
        replacement.set("riya", NEW_OWNER, type(uint64).max);
        root.setSubregistry(address(replacement));
        vm.warp(UNLOCK);
        vm.prank(NEW_OWNER);
        box.claim(id);
    }

    function testPayoutFailureAndReentrancy() public {
        GiftReceiver receiver = new GiftReceiver(box);
        names.set("riya", address(receiver), type(uint64).max);
        uint256 id = box.giftEth{value: 1 ether}("riya.eth", UNLOCK, "");
        receiver.set(id, true);
        vm.warp(UNLOCK);
        vm.expectRevert(GiftBox.TransferFailed.selector);
        receiver.claim();
        require(!box.gifts(id).done);
        receiver.set(id, false);
        receiver.claim();
        require(receiver.attempted() && !receiver.reentered() && box.gifts(id).done);
    }

    function testZeroAndInvalidUnlock() public {
        vm.expectRevert(GiftBox.InvalidAmount.selector);
        box.giftEth("riya.eth", UNLOCK, "");
        vm.expectRevert(GiftBox.InvalidAmount.selector);
        box.giftUsdc("riya.eth", 0, UNLOCK, "");
        vm.expectRevert(GiftBox.InvalidUnlock.selector);
        box.giftEth{value: 1}("riya.eth", 999, "");
    }

    function testRefundFailurePreservesGift() public {
        GiftReceiver sender = new GiftReceiver(box);
        sender.send{value: 1 ether}(UNLOCK);
        sender.set(0, true);
        vm.expectRevert(GiftBox.TransferFailed.selector);
        sender.cancelGift();
        require(!box.gifts(0).done);
        sender.set(0, false);
        sender.cancelGift();
        require(box.gifts(0).done && address(sender).balance == 1 ether);
    }

    function testTokenFailureAndFeeAccounting() public {
        token.configure(0, true, false);
        vm.expectRevert(GiftBox.TransferFailed.selector);
        send();
        token.configure(1, false, false);
        vm.expectRevert(GiftBox.TransferFailed.selector);
        send();
        require(
            token.balanceOf(address(this)) == 100e6 && token.balanceOf(address(box)) == 0
                && box.giftsFor("riya.eth").length == 0
        );
        token.configure(0, false, false);
        uint256 id = send();
        token.configure(1, false, false);
        vm.warp(UNLOCK);
        vm.expectRevert(GiftBox.TransferFailed.selector);
        vm.prank(RIYA);
        box.claim(id);
        require(!box.gifts(id).done);
    }

    function testMaliciousTokenCallbacksCannotDrainOrDoubleClaim() public {
        CallbackGiftToken evil = new CallbackGiftToken();
        GiftBox escrow = new GiftBox(address(evil), address(root));
        evil.mint(address(this), 100e6);
        evil.approve(address(escrow), type(uint256).max);
        names.set("riya", address(evil), type(uint64).max);
        uint64 unlock = uint64(block.timestamp);
        uint256 seed = escrow.giftUsdc("riya.eth", 10e6, unlock, "seed escrow");
        evil.arm(escrow, seed + 1, true);
        uint256 id = escrow.giftUsdc("riya.eth", 10e6, unlock, "attack during transferFrom");
        require(evil.attempts() == 4 && evil.blocked() == 4 && evil.successes() == 0, "deposit callbacks blocked");
        require(evil.balanceOf(address(escrow)) == 20e6 && !escrow.gifts(id).done && !escrow.gifts(seed).done);
        evil.claimGift(id);
        require(evil.attempts() == 8 && evil.blocked() == 8 && evil.successes() == 0, "payout callbacks blocked");
        require(escrow.gifts(id).done && !escrow.gifts(seed).done);
        require(evil.balanceOf(address(evil)) == 10e6 && evil.balanceOf(address(escrow)) == 10e6, "other escrow intact");
        vm.expectRevert(GiftBox.InvalidGift.selector);
        evil.claimGift(id);
        evil.arm(escrow, seed, false);
        evil.claimGift(seed);
        require(evil.balanceOf(address(escrow)) == 0 && evil.balanceOf(address(evil)) == 20e6);
        require(evil.balanceOf(address(this)) == 80e6, "no extra tokens withdrawn");
    }

    function testNoReturnTokenSupported() public {
        token.configure(0, false, true);
        uint256 id = send();
        vm.warp(UNLOCK);
        vm.prank(RIYA);
        box.claim(id);
        require(token.balanceOf(RIYA) == 10e6);
    }

    function testConstructorAndMissingRegistry() public {
        vm.expectRevert(GiftBox.InvalidAddress.selector);
        new GiftBox(address(0), address(root));
        vm.expectRevert(GiftBox.InvalidAddress.selector);
        new GiftBox(address(token), address(0));
        root.setSubregistry(address(0));
        vm.expectRevert(GiftBox.InvalidAddress.selector);
        new GiftBox(address(token), address(root));
    }

    function testMaxTimestampDoesNotOverflow() public {
        uint256 id = box.giftEth{value: 1}("riya.eth", type(uint64).max, "");
        vm.warp(uint256(type(uint64).max) + 90 days);
        box.cancel(id);
    }

    function testNamesAndInvalidIds() public {
        bytes memory longLabel = new bytes(64);
        for (uint256 i; i < 64; ++i) {
            longLabel[i] = "a";
        }
        vm.expectRevert(GiftBox.InvalidName.selector);
        box.ownerOf(string.concat(string(longLabel), ".eth"));
        vm.expectRevert(GiftBox.InvalidGift.selector);
        box.gifts(0);
        vm.expectRevert(GiftBox.InvalidGift.selector);
        box.claim(0);
        names.set("a--b", RIYA, type(uint64).max);
        require(box.ownerOf("a--b.eth") == RIYA);
    }

    function testFuzzEthAccounting(uint96 raw) public {
        uint256 amount = uint256(raw) % 1 ether + 1;
        uint256 id = box.giftEth{value: amount}("riya.eth", UNLOCK, "");
        require(address(box).balance == amount);
        vm.warp(UNLOCK);
        vm.prank(RIYA);
        box.claim(id);
        require(RIYA.balance == amount && address(box).balance == 0);
    }

    function testEvents() public {
        bytes32 hash = keccak256("riya.eth");
        vm.expectEmit(true, true, true, true, address(box));
        emit GiftSent(0, hash, address(this), address(token), 10e6, UNLOCK, "riya.eth", "Happy birthday");
        uint256 id = send();
        vm.expectEmit(true, true, true, true, address(box));
        emit GiftCancelled(id, hash, address(this), address(token), 10e6);
        box.cancel(id);
        id = send();
        vm.warp(UNLOCK);
        vm.expectEmit(true, true, true, true, address(box));
        emit GiftClaimed(id, hash, RIYA, address(token), 10e6);
        vm.prank(RIYA);
        box.claim(id);
    }
}
