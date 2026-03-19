// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Imara {
    enum Status {
        Open,
        InProgress,
        Completed,
        Failed
    }

    struct Task {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 stakeRequired;
        uint256 deadline;
        address participant;
        string proofLink;
        Status status;
        bool resolved;
    }

    uint256 public taskCount;

    mapping(uint256 => Task) private tasks;
    mapping(address => uint256) public reputation;

    event TaskCreated(
        uint256 indexed taskId,
        address indexed creator,
        uint256 stakeRequired,
        uint256 deadline
    );
    event ParticipantJoined(
        uint256 indexed taskId,
        address indexed participant,
        uint256 staked
    );
    event WorkSubmitted(
        uint256 indexed taskId,
        address indexed participant,
        string proofLink
    );
    event TaskResolved(
        uint256 indexed taskId,
        address indexed participant,
        bool approved,
        uint256 payout
    );

    modifier taskExists(uint256 taskId) {
        require(taskId < taskCount, "Task does not exist");
        _;
    }

    modifier onlyCreator(uint256 taskId) {
        require(msg.sender == tasks[taskId].creator, "Not task creator");
        _;
    }

    function createTask(
        string calldata title,
        string calldata description,
        uint256 stakeRequired,
        uint256 deadline
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(bytes(description).length > 0, "Description required");
        require(stakeRequired > 0, "Stake required");
        require(deadline > block.timestamp, "Deadline must be in future");

        uint256 id = taskCount;
        taskCount++;

        tasks[id] = Task({
            id: id,
            creator: msg.sender,
            title: title,
            description: description,
            stakeRequired: stakeRequired,
            deadline: deadline,
            participant: address(0),
            proofLink: "",
            status: Status.Open,
            resolved: false
        });

        emit TaskCreated(id, msg.sender, stakeRequired, deadline);
        return id;
    }

    function stakeAndJoin(uint256 taskId) external payable taskExists(taskId) {
        Task storage task = tasks[taskId];

        require(task.status == Status.Open, "Task not open");
        require(task.participant == address(0), "Task already taken");
        require(block.timestamp <= task.deadline, "Deadline passed");
        require(msg.value == task.stakeRequired, "Incorrect stake amount");
        require(msg.sender != task.creator, "Creator cannot join own task");

        task.participant = msg.sender;
        task.status = Status.InProgress;

        emit ParticipantJoined(taskId, msg.sender, msg.value);
    }

    function submitWork(
        uint256 taskId,
        string calldata proofLink
    ) external taskExists(taskId) {
        Task storage task = tasks[taskId];

        require(task.participant == msg.sender, "Not task participant");
        require(task.status == Status.InProgress, "Task not in progress");
        require(block.timestamp <= task.deadline, "Deadline passed");
        require(bytes(proofLink).length > 0, "Proof required");

        task.proofLink = proofLink;

        emit WorkSubmitted(taskId, msg.sender, proofLink);
    }

    function verifyAndResolve(
        uint256 taskId,
        bool approved
    ) external taskExists(taskId) onlyCreator(taskId) {
        Task storage task = tasks[taskId];

        require(!task.resolved, "Already resolved");
        require(task.status == Status.InProgress, "Task not in progress");
        require(task.participant != address(0), "No participant");
        require(bytes(task.proofLink).length > 0, "Proof not submitted");

        task.resolved = true;

        if (approved) {
            uint256 payout = task.stakeRequired;
            task.status = Status.Completed;
            reputation[task.participant]++;

            (bool success, ) = payable(task.participant).call{value: payout}("");
            require(success, "Refund failed");

            emit TaskResolved(taskId, task.participant, true, payout);
            return;
        }

        task.status = Status.Failed;
        emit TaskResolved(taskId, task.participant, false, 0);
    }

    function reclaimExpiredTask(
        uint256 taskId
    ) external taskExists(taskId) onlyCreator(taskId) {
        Task storage task = tasks[taskId];

        require(task.status == Status.Open, "Task not open");
        require(task.participant == address(0), "Task already taken");
        require(block.timestamp > task.deadline, "Deadline not passed");

        task.resolved = true;
        task.status = Status.Failed;
    }

    function getTask(
        uint256 taskId
    ) external view taskExists(taskId) returns (Task memory) {
        return tasks[taskId];
    }

    function getAllTasks() external view returns (Task[] memory) {
        Task[] memory allTasks = new Task[](taskCount);

        for (uint256 i = 0; i < taskCount; i++) {
            allTasks[i] = tasks[i];
        }

        return allTasks;
    }

    receive() external payable {}
}
