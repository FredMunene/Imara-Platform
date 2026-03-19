// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Imara} from "../src/Imara.sol";

contract ImaraTest is Test {
    Imara private imara;

    address private creator = address(0xA11CE);
    address private participant = address(0xB0B);
    address private otherUser = address(0xCAFE);

    uint256 private constant STAKE_REQUIRED = 1 ether;
    uint256 private constant DEFAULT_DEADLINE_OFFSET = 1 days;

    function setUp() public {
        imara = new Imara();
        vm.deal(creator, 10 ether);
        vm.deal(participant, 10 ether);
        vm.deal(otherUser, 10 ether);
    }

    function testCreateTaskStoresExpectedFields() public {
        uint256 deadline = block.timestamp + DEFAULT_DEADLINE_OFFSET;

        vm.prank(creator);
        uint256 taskId = imara.createTask(
            "Ship hackathon demo",
            "Build the first task flow on Polkadot Hub EVM",
            STAKE_REQUIRED,
            deadline
        );

        Imara.Task memory task = imara.getTask(taskId);

        assertEq(taskId, 0);
        assertEq(imara.taskCount(), 1);
        assertEq(task.id, 0);
        assertEq(task.creator, creator);
        assertEq(task.title, "Ship hackathon demo");
        assertEq(task.description, "Build the first task flow on Polkadot Hub EVM");
        assertEq(task.stakeRequired, STAKE_REQUIRED);
        assertEq(task.deadline, deadline);
        assertEq(task.participant, address(0));
        assertEq(task.proofLink, "");
        assertEq(uint256(task.status), uint256(Imara.Status.Open));
        assertTrue(!task.resolved);
    }

    function testCreateTaskRevertsWithEmptyTitle() public {
        vm.prank(creator);
        vm.expectRevert(bytes("Title required"));
        imara.createTask("", "Description", STAKE_REQUIRED, block.timestamp + DEFAULT_DEADLINE_OFFSET);
    }

    function testCreateTaskRevertsWithEmptyDescription() public {
        vm.prank(creator);
        vm.expectRevert(bytes("Description required"));
        imara.createTask("Title", "", STAKE_REQUIRED, block.timestamp + DEFAULT_DEADLINE_OFFSET);
    }

    function testCreateTaskRevertsWithZeroStake() public {
        vm.prank(creator);
        vm.expectRevert(bytes("Stake required"));
        imara.createTask("Title", "Description", 0, block.timestamp + DEFAULT_DEADLINE_OFFSET);
    }

    function testCreateTaskRevertsWhenDeadlineIsNotInFuture() public {
        vm.prank(creator);
        vm.expectRevert(bytes("Deadline must be in future"));
        imara.createTask("Title", "Description", STAKE_REQUIRED, block.timestamp);
    }

    function testStakeAndJoinMovesTaskToInProgress() public {
        uint256 taskId = createTask();

        vm.prank(participant);
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);

        Imara.Task memory task = imara.getTask(taskId);
        assertEq(task.participant, participant);
        assertEq(uint256(task.status), uint256(Imara.Status.InProgress));
        assertEq(address(imara).balance, STAKE_REQUIRED);
        assertEq(imara.pendingStakeTotal(), STAKE_REQUIRED);
    }

    function testStakeAndJoinRevertsForCreator() public {
        uint256 taskId = createTask();

        vm.prank(creator);
        vm.expectRevert(bytes("Creator cannot join own task"));
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);
    }

    function testStakeAndJoinRevertsForWrongStakeAmount() public {
        uint256 taskId = createTask();

        vm.prank(participant);
        vm.expectRevert(bytes("Incorrect stake amount"));
        imara.stakeAndJoin{value: 0.5 ether}(taskId);
    }

    function testStakeAndJoinRevertsWhenTaskAlreadyTaken() public {
        uint256 taskId = createTask();

        vm.prank(participant);
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);

        vm.prank(otherUser);
        vm.expectRevert(bytes("Task not open"));
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);
    }

    function testStakeAndJoinRevertsAfterDeadline() public {
        uint256 deadline = block.timestamp + DEFAULT_DEADLINE_OFFSET;
        uint256 taskId = createTaskAt(deadline);

        vm.warp(deadline + 1);

        vm.prank(participant);
        vm.expectRevert(bytes("Deadline passed"));
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);
    }

    function testSubmitWorkStoresProofLink() public {
        uint256 taskId = createJoinedTask();
        string memory proof = "https://github.com/imara/proof/1";

        vm.prank(participant);
        imara.submitWork(taskId, proof);

        Imara.Task memory task = imara.getTask(taskId);
        assertEq(task.proofLink, proof);
        assertEq(uint256(task.status), uint256(Imara.Status.InProgress));
    }

    function testSubmitWorkRevertsForNonParticipant() public {
        uint256 taskId = createJoinedTask();

        vm.prank(otherUser);
        vm.expectRevert(bytes("Not task participant"));
        imara.submitWork(taskId, "https://github.com/imara/proof/2");
    }

    function testSubmitWorkRevertsWithEmptyProof() public {
        uint256 taskId = createJoinedTask();

        vm.prank(participant);
        vm.expectRevert(bytes("Proof required"));
        imara.submitWork(taskId, "");
    }

    function testSubmitWorkRevertsAfterDeadline() public {
        uint256 deadline = block.timestamp + DEFAULT_DEADLINE_OFFSET;
        uint256 taskId = createTaskAt(deadline);

        vm.prank(participant);
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);

        vm.warp(deadline + 1);

        vm.prank(participant);
        vm.expectRevert(bytes("Deadline passed"));
        imara.submitWork(taskId, "https://github.com/imara/proof/3");
    }

    function testVerifyAndResolveApproveRefundsStakeAndIncrementsReputation() public {
        uint256 taskId = createTaskReadyForReview("https://github.com/imara/proof/4");
        uint256 participantBalanceBeforeJoin = 10 ether;

        vm.prank(creator);
        imara.verifyAndResolve(taskId, true);

        Imara.Task memory task = imara.getTask(taskId);
        assertEq(uint256(task.status), uint256(Imara.Status.Completed));
        assertTrue(task.resolved);
        assertEq(imara.reputation(participant), 1);
        assertEq(participant.balance, participantBalanceBeforeJoin);
        assertEq(address(imara).balance, 0);
        assertEq(imara.pendingStakeTotal(), 0);
    }

    function testVerifyAndResolveRejectKeepsStakeInContract() public {
        uint256 taskId = createTaskReadyForReview("https://github.com/imara/proof/5");

        vm.prank(creator);
        imara.verifyAndResolve(taskId, false);

        Imara.Task memory task = imara.getTask(taskId);
        assertEq(uint256(task.status), uint256(Imara.Status.Failed));
        assertTrue(task.resolved);
        assertEq(imara.reputation(participant), 0);
        assertEq(participant.balance, 9 ether);
        assertEq(address(imara).balance, STAKE_REQUIRED);
        assertEq(imara.pendingStakeTotal(), 0);
        assertEq(imara.totalSlashed(), STAKE_REQUIRED);
        assertEq(imara.availableSlashedFunds(), STAKE_REQUIRED);
    }

    function testVerifyAndResolveRevertsForNonCreator() public {
        uint256 taskId = createTaskReadyForReview("https://github.com/imara/proof/6");

        vm.prank(otherUser);
        vm.expectRevert(bytes("Not task creator"));
        imara.verifyAndResolve(taskId, true);
    }

    function testVerifyAndResolveRevertsWithoutProofSubmission() public {
        uint256 taskId = createJoinedTask();

        vm.prank(creator);
        vm.expectRevert(bytes("Proof not submitted"));
        imara.verifyAndResolve(taskId, true);
    }

    function testVerifyAndResolveRevertsWhenAlreadyResolved() public {
        uint256 taskId = createTaskReadyForReview("https://github.com/imara/proof/7");

        vm.prank(creator);
        imara.verifyAndResolve(taskId, true);

        vm.prank(creator);
        vm.expectRevert(bytes("Already resolved"));
        imara.verifyAndResolve(taskId, true);
    }

    function testReclaimExpiredTaskMarksTaskAsFailed() public {
        uint256 deadline = block.timestamp + DEFAULT_DEADLINE_OFFSET;
        uint256 taskId = createTaskAt(deadline);

        vm.warp(deadline + 1);

        vm.prank(creator);
        imara.reclaimExpiredTask(taskId);

        Imara.Task memory task = imara.getTask(taskId);
        assertEq(uint256(task.status), uint256(Imara.Status.Failed));
        assertTrue(task.resolved);
        assertEq(task.participant, address(0));
    }

    function testReclaimExpiredTaskRevertsBeforeDeadline() public {
        uint256 taskId = createTask();

        vm.prank(creator);
        vm.expectRevert(bytes("Deadline not passed"));
        imara.reclaimExpiredTask(taskId);
    }

    function testReclaimExpiredTaskRevertsIfTaskAlreadyTaken() public {
        uint256 deadline = block.timestamp + DEFAULT_DEADLINE_OFFSET;
        uint256 taskId = createTaskAt(deadline);

        vm.prank(participant);
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);

        vm.warp(deadline + 1);

        vm.prank(creator);
        vm.expectRevert(bytes("Task not open"));
        imara.reclaimExpiredTask(taskId);
    }

    function testOwnerCanPauseAndUnpause() public {
        imara.pause();
        assertTrue(imara.paused());

        imara.unpause();
        assertTrue(!imara.paused());
    }

    function testPauseBlocksCreateTask() public {
        imara.pause();

        vm.prank(creator);
        vm.expectRevert(bytes("Pausable: paused"));
        imara.createTask(
            "Ship hackathon demo",
            "Build the first task flow on Polkadot Hub EVM",
            STAKE_REQUIRED,
            block.timestamp + DEFAULT_DEADLINE_OFFSET
        );
    }

    function testPauseBlocksStakeAndJoin() public {
        uint256 taskId = createTask();

        imara.pause();

        vm.prank(participant);
        vm.expectRevert(bytes("Pausable: paused"));
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);
    }

    function testPauseRevertsForNonOwner() public {
        vm.prank(creator);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        imara.pause();
    }

    function testWithdrawSlashedTransfersOnlyAvailableSlashedFunds() public {
        uint256 taskId = createTaskReadyForReview("https://github.com/imara/proof/8");
        uint256 recipientBalanceBefore = otherUser.balance;

        vm.prank(creator);
        imara.verifyAndResolve(taskId, false);

        imara.withdrawSlashed(payable(otherUser), STAKE_REQUIRED);

        assertEq(otherUser.balance, recipientBalanceBefore + STAKE_REQUIRED);
        assertEq(imara.availableSlashedFunds(), 0);
        assertEq(imara.totalWithdrawn(), STAKE_REQUIRED);
        assertEq(address(imara).balance, 0);
    }

    function testWithdrawSlashedRevertsForNonOwner() public {
        uint256 taskId = createTaskReadyForReview("https://github.com/imara/proof/9");

        vm.prank(creator);
        imara.verifyAndResolve(taskId, false);

        vm.prank(creator);
        vm.expectRevert(bytes("Ownable: caller is not the owner"));
        imara.withdrawSlashed(payable(creator), STAKE_REQUIRED);
    }

    function testWithdrawSlashedRevertsWhenStakeIsStillPending() public {
        createJoinedTask();

        assertEq(imara.availableSlashedFunds(), 0);

        vm.expectRevert(bytes("Amount exceeds available slashed funds"));
        imara.withdrawSlashed(payable(otherUser), 1);
    }

    function testGetAllTasksReturnsTasksInCreationOrder() public {
        uint256 firstTaskId = createTaskWithData(
            "First task",
            "Design the task protocol",
            STAKE_REQUIRED,
            block.timestamp + DEFAULT_DEADLINE_OFFSET
        );
        uint256 secondTaskId = createTaskWithData(
            "Second task",
            "Implement the UI flow",
            2 ether,
            block.timestamp + (2 days)
        );

        Imara.Task[] memory tasks = imara.getAllTasks();

        assertEq(tasks.length, 2);
        assertEq(tasks[0].id, firstTaskId);
        assertEq(tasks[0].title, "First task");
        assertEq(tasks[1].id, secondTaskId);
        assertEq(tasks[1].title, "Second task");
        assertEq(tasks[1].stakeRequired, 2 ether);
    }

    function testGetTaskRevertsForUnknownTaskId() public {
        vm.expectRevert(bytes("Task does not exist"));
        imara.getTask(999);
    }

    function createTask() internal returns (uint256 taskId) {
        return createTaskAt(block.timestamp + DEFAULT_DEADLINE_OFFSET);
    }

    function createTaskAt(uint256 deadline) internal returns (uint256 taskId) {
        return createTaskWithData(
            "Ship hackathon demo",
            "Build the first task flow on Polkadot Hub EVM",
            STAKE_REQUIRED,
            deadline
        );
    }

    function createTaskWithData(
        string memory title,
        string memory description,
        uint256 stakeRequired,
        uint256 deadline
    ) internal returns (uint256 taskId) {
        vm.prank(creator);
        taskId = imara.createTask(title, description, stakeRequired, deadline);
    }

    function createJoinedTask() internal returns (uint256 taskId) {
        taskId = createTask();

        vm.prank(participant);
        imara.stakeAndJoin{value: STAKE_REQUIRED}(taskId);
    }

    function createTaskReadyForReview(
        string memory proofLink
    ) internal returns (uint256 taskId) {
        taskId = createJoinedTask();

        vm.prank(participant);
        imara.submitWork(taskId, proofLink);
    }
}
