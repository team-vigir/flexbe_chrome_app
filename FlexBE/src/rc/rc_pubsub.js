RC.PubSub = new (function() {
	var that = this;

	var ros;

	var current_state_listener;
	var outcome_request_listener;
	var behavior_feedback_listener;
	var behavior_status_listener;
	var command_feedback_listener;
	var onboard_heartbeat_listener;

	var behavior_start_publisher;
	var mirror_structure_publisher;
	var transition_command_publisher;
	var autonomy_level_publisher;
	var preempt_behavior_publisher;
	var lock_behavior_publisher;
	var unlock_behavior_publisher;
	var sync_mirror_publisher;

	var synthesis_action_client;

	var last_heartbeat_time = undefined;
	var expected_sync_path = undefined;

	var current_state_callback = function (msg) {
		console.log("Behavior update");
		console.log(msg);
		if (RC.Sync.hasProcess("Transition")) RC.Sync.remove("Transition");
		//if (expected_sync_path != undefined && RC.Sync.hasProcess("Sync") && expected_sync_path == msg.data) RC.Sync.remove("Sync");

		RC.Controller.setCurrentStatePath(msg.data);
		if (msg.data == "") {
			RC.Controller.signalFinished();
		} else {
			RC.Controller.signalRunning();
		}
	}
	var outcome_request_callback = function(msg) {
		console.log(msg);
		var target_state = Behavior.getStatemachine().getStateByPath(msg.target);
		UI.RuntimeControl.displayOutcomeRequest(target_state.getOutcomes()[msg.outcome], target_state);
	}

	var behavior_feedback_callback = function (msg){
		UI.RuntimeControl.displayBehaviorFeedback(msg.status_code, msg.text);
	}

	var behavior_status_callback = function (msg){
		console.log(msg);
		// constants of BEStatus.msg (not directly accessible via roslib.js)
		var STARTED = 0;
		var FINISHED = 1;
		var FAILED = 2;
		var WARNING = 10;
		var ERROR = 11;
		var READY = 20;

		if (msg.code == STARTED && !RC.Controller.haveBehavior()) {
			T.logError("Onboard behavior is still running! Stopping it...");
			RC.Sync.register("EmergencyStop", 30);
			RC.Sync.setStatus("EmergencyStop", RC.Sync.STATUS_ERROR);
			RC.PubSub.sendPreemptBehavior();
			return;
		}
		if (RC.Sync.hasProcess("EmergencyStop") && (msg.code == FINISHED || msg.code == FAILED)) {
			RC.Sync.remove("EmergencyStop");
			T.logInfo("Onboard behavior stopped!");
			T.logInfo("Please press 'Stop Execution' next time before closing this window when running a behavior.");
		}

		if (RC.Controller.isLocked() && msg.code == STARTED && msg.args.length > 0 
			&& RC.Controller.isCurrentState(Behavior.getStatemachine().getStateByPath(msg.args[0]), false)) {

			RC.Sync.remove("Switch");
			that.sendBehaviorUnlock(msg.args[0]);
		} else if (msg.code == FINISHED || msg.code == FAILED) {
			RC.Controller.signalFinished();
			UI.RuntimeControl.displayBehaviorFeedback(4, "No behavior active.");
		} else if (msg.code == STARTED) {
			RC.Sync.remove("BehaviorStart");
			RC.Controller.signalRunning();
		} else if (msg.code == ERROR) {
			RC.Sync.setProgress("BehaviorStart", 1, false);
			RC.Sync.setStatus("BehaviorStart", RC.Sync.STATUS_ERROR);
			if(!RC.Controller.isLocked()) {
				RC.Controller.signalFinished();
				UI.RuntimeControl.displayBehaviorFeedback(4, "No behavior active.");
			}
		} else if (msg.code == READY) {
			RC.Controller.signalFinished();
			UI.RuntimeControl.displayBehaviorFeedback(4, "Onboard engine just started.");
		}
	}

	var heartbeat_timer;
	var onboard_heartbeat_callback = function (msg){
		if (heartbeat_timer != undefined) clearTimeout(heartbeat_timer);
		RC.Controller.signalConnected();

		var now = Date.now();
		if (last_heartbeat_time != undefined) {
			delay = (now - last_heartbeat_time) / 1000;
			last_heartbeat_time = now;
			relative_delay = (delay - 1) / (RC.Controller.onboardTimeout - 1);
			RC.Sync.setProgress("Delay", Math.min(Math.max(1 - relative_delay, 0), 1), false);
				 if (relative_delay > 0.95) RC.Sync.setStatus("Delay", RC.Sync.STATUS_ERROR);
			else if (relative_delay > 0.60) RC.Sync.setStatus("Delay", RC.Sync.STATUS_WARN);
			else RC.Sync.setStatus("Delay", RC.Sync.STATUS_OK);
			//console.log("Heartbeat delay: " + delay + " (= " + Math.round(relative_delay * 100) + "%)");
		} else {
			last_heartbeat_time = now;
			RC.Sync.setProgress("Delay", 1, false);
		}

		heartbeat_timer = setTimeout(function() {
			console.log("Onboard connection timed out.");
			RC.Controller.signalDisconnected();
		}, RC.Controller.onboardTimeout * 1000);
	}

	var command_feedback_callback = function (msg) {
		console.log(msg);
		if (msg.command == "transition") {
			if (msg.args[0] == msg.args[1]) {
				RC.Sync.setProgress("Transition", 0.8, false);
			} else {
				RC.Sync.setStatus("Transition", RC.Sync.STATUS_WARN);
			}
		}
		if (msg.command == "autonomy") {
			RC.Sync.remove("Autonomy");
		}
		if (msg.command == "preempt") {
			if (RC.Sync.hasProcess("Preempt")) {
				RC.Sync.remove("Preempt");
				RC.Controller.signalFinished();
			}
		}
		if (msg.command == "lock") {
			if (msg.args[0] == msg.args[1]) {
				RC.Sync.remove("Lock");
				RC.Sync.register("Changes", 0);
				RC.Sync.setProgress("Changes", 1, false);
				RC.Controller.signalLocked();
			} else {
				RC.Sync.setProgress("Lock", 1, false);
				RC.Sync.setStatus("Lock", RC.Sync.STATUS_WARN);
				RC.Sync.remove("Lock");
			}
		}
		if (msg.command == "unlock") {
			if (msg.args[0] == msg.args[1]) {
				RC.Sync.remove("Unlock");
				RC.Sync.remove("Changes");
				RC.Controller.signalUnlocked();
			} else {
				RC.Sync.setStatus("Unlock", RC.Sync.STATUS_WARN);
			}
		}
		if (msg.command == "sync") {
			if (RC.Sync.hasProcess("Sync")) {
				expected_sync_path = msg.args[0];
				//RC.Sync.setProgress("Sync", 0.6, false);
				RC.Sync.remove("Sync");
			}
		}
		if (msg.command == "switch") {
			if (msg.args[0] == "failed") 			RC.Sync.setStatus("Switch", RC.Sync.STATUS_ERROR);
			if (msg.args[0] == "not_switchable")	RC.Sync.setStatus("Switch", RC.Sync.STATUS_WARN);
			if (msg.args[0] == "received")			RC.Sync.setProgress("Switch", 0.2);
			if (msg.args[0] == "start")				RC.Sync.setProgress("Switch", 0.4);
			if (msg.args[0] == "prepared")			RC.Sync.setProgress("Switch", 0.6);
		}
	}

	var synthesis_action_feedback_callback = function(feedback, root, feedback_cb) {
		console.log(feedback);

		if(feedback_cb != undefined) feedback_cb(feedback);
	}

	var synthesis_action_result_callback = function(result, root, result_cb) {
		if (result.error_code.value != 1) {
			T.logError("Synthesis failed: " + result.error_code.value);
			return;
		}

		var root_split = root.split("/");
		var root_name = root_split[root_split.length - 1];
		var root_container_path = root.replace("/" + root_name, "");
		var root_container = (root_container_path == "")? Behavior.getStatemachine() : 
								Behavior.getStatemachine().getStateByPath(root_container_path);
		var root_varname = "";
		var defs = ModelGenerator.parseInstantiationMsg(result.states);

		var state_machine = ModelGenerator.buildStateMachine(root_name, root_varname, defs.sm_defs, defs.sm_states, true);

		var sm_instance = root_container.getStateByName(state_machine.getStateName());
		if (sm_instance != undefined) {
			var transitions = root_container.getTransitions().filter(function(t) {
				return t.getFrom().getStateName() == sm_instance.getStateName() && state_machine.getOutcomes().contains(t.getOutcome())
					|| t.getTo() != undefined && t.getTo().getStateName() == sm_instance.getStateName();
			});
			root_container.removeState(sm_instance);
			root_container.addState(state_machine);
			transitions.forEach(function (t) {
				if (t.getTo().getStateName() == state_machine.getStateName()) t.setTo(state_machine);
				if (t.getFrom().getStateName() == state_machine.getStateName()) t.setFrom(state_machine);
			});
			transitions.forEach(root_container.addTransition);
		} else {
			root_container.addState(state_machine);
		}

		if(UI.Menu.isPageStatemachine()) UI.Statemachine.refreshView();

		ActivityTracer.addActivity(ActivityTracer.ACT_STATE_ADD,
			"Added synthesized statemachine " + root_name,
			function() {
				state_machine.getContainer().removeState(state_machine);
				if (UI.Panels.StateProperties.isCurrentState(state_machine)) {
					UI.Panels.StateProperties.hide();
				}
				UI.Statemachine.refreshView();
			},
			function() {
				var container = (root_container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(root_container_path);
				container.addState(state_machine);
				UI.Statemachine.refreshView();
			}
		);

		if(result_cb != undefined) result_cb(result);
	}


	this.initialize = function(_ros) {
		ros = _ros;


		// Subscriber

		current_state_listener = new ROSLIB.Topic({ 
			ros : ros,
			name : '/flexbe/behavior_update',
			messageType : 'std_msgs/String'
		});
		current_state_listener.subscribe(current_state_callback);

		outcome_request_listener = new ROSLIB.Topic({ 
			ros : ros,
			name : '/flexbe/outcome_request',
			messageType : 'flexbe_msgs/OutcomeRequest'
		});
		outcome_request_listener.subscribe(outcome_request_callback);

		behavior_feedback_listener = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/log',
			messageType: 'flexbe_msgs/BehaviorLog',
		});
		behavior_feedback_listener.subscribe(behavior_feedback_callback);

		behavior_status_listener = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/status',
			messageType: 'flexbe_msgs/BEStatus',
		});
		behavior_status_listener.subscribe(behavior_status_callback);

		command_feedback_listener = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command_feedback',
			messageType: 'flexbe_msgs/CommandFeedback',
		});
		command_feedback_listener.subscribe(command_feedback_callback);

		onboard_heartbeat_listener = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/heartbeat',
			messageType: 'std_msgs/Empty',
		});
		onboard_heartbeat_listener.subscribe(onboard_heartbeat_callback);


		// Publisher

		behavior_start_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/request_behavior',
			messageType: 'flexbe_msgs/BehaviorRequest'
		});

		transition_command_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command/transition',
			messageType: 'flexbe_msgs/OutcomeRequest'
		});

		autonomy_level_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command/autonomy',
			messageType: 'std_msgs/UInt8'
		});

		preempt_behavior_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command/preempt',
			messageType: 'std_msgs/Empty'
		});

		lock_behavior_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command/lock',
			messageType: 'std_msgs/String'
		});

		unlock_behavior_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command/unlock',
			messageType: 'std_msgs/String'
		});

		sync_mirror_publisher = new ROSLIB.Topic({ 
			ros: ros,
			name: '/flexbe/command/sync',
			messageType: 'std_msgs/Empty'
		});

		// Action Clients
		if (UI.Settings.isSynthesisEnabled()) that.initializeSynthesisAction();
	}

	this.initializeSynthesisAction = function() {
		synthesis_action_client = new ROSLIB.ActionClient({
			ros: ros,
			serverName: '/vigir_behavior_synthesis',
			actionName: 'vigir_synthesis_msgs/BehaviorSynthesisAction'
		});
	}

	this.shutdown = function() {
		if (heartbeat_timer != undefined) clearTimeout(heartbeat_timer);

		current_state_listener.unsubscribe();
		outcome_request_listener.unsubscribe();
		behavior_feedback_listener.unsubscribe();
		command_feedback_listener.unsubscribe();
		onboard_heartbeat_listener.unsubscribe();

		behavior_start_publisher.unadvertise();
		mirror_structure_publisher.unadvertise();
		transition_command_publisher.unadvertise();
		autonomy_level_publisher.unadvertise();
		preempt_behavior_publisher.unadvertise();
		lock_behavior_publisher.unadvertise();
		unlock_behavior_publisher.unadvertise();
		sync_mirror_publisher.unadvertise();

		ros = undefined;
	}

	this.sendBehaviorStart = function(param_keys, param_vals, autonomy) {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		var names = Behavior.createNames();
		BehaviorPacker.loadBehaviorCode(function(code) {
			RC.Controller.signalStarted();
			RC.Sync.register("BehaviorStart", 60);

			// request start
			behavior_start_publisher.publish({
				behavior_name: Behavior.getBehaviorName(),
				autonomy_level: autonomy,
				arg_keys: param_keys,
				arg_values: param_vals,
				structure: Behavior.createStructureInfo()
			});
			RC.Sync.setProgress("BehaviorStart", 0.2, false);
		});
	}

	this.sendBehaviorUpdate = function(param_keys, param_vals, autonomy) {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		var names = Behavior.createNames();
		RC.Sync.register("Switch", 70);
		BehaviorPacker.loadBehaviorCode(function(code) {
			//RC.Controller.signalStarted(); // would it work?

			// request start
			behavior_start_publisher.publish({
				behavior_name: Behavior.getBehaviorName(),
				autonomy_level: autonomy,
				arg_keys: param_keys,
				arg_values: param_vals,
				structure: Behavior.createStructureInfo()
			});
		});
		RC.Sync.setProgress("Switch", 0.2, false);

		//var _ros = ros;
		//that.shutdown();
		//that.initialize(_ros);
	}

	this.sendOutcomeRequest = function(state, outcome) {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		var target_name = state.getStateName();
		RC.Sync.register("Transition", 50);
		transition_command_publisher.publish({
			target: target_name,
			outcome: state.getOutcomes().indexOf(outcome)
		});
		RC.Sync.setProgress("Transition", 0.2, false);
	}

	this.sendAutonomyLevel = function(level) {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		if (RC.Controller.isRunning()) {
			RC.Sync.register("Autonomy", 30);
		}
		autonomy_level_publisher.publish({
			data: level
		});
		RC.Sync.setProgress("Autonomy", 0.2, false);
	}

	this.sendPreemptBehavior = function() {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		if (RC.Controller.isRunning() || RC.Controller.isReadonly()) {
			RC.Sync.register("Preempt", 60);
			RC.Sync.setProgress("Preempt", 0.2, false);
		}
		preempt_behavior_publisher.publish();
	}

	this.sendBehaviorLock = function(path) {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		if (!RC.Controller.isActive()) return;

		RC.Sync.register("Lock", 50);
		lock_behavior_publisher.publish({
			data: path
		});
		RC.Sync.setProgress("Lock", 0.2, false);
	}
	this.sendBehaviorUnlock = function(path) {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		if (!RC.Controller.isLocked()) return;

		RC.Sync.register("Unlock", 50);
		unlock_behavior_publisher.publish({
			data: path
		});
		console.log("unlocked in state " + path);
		RC.Sync.setProgress("Unlock", 0.2, false);
	}

	this.sendSyncRequest = function() {
		if (ros == undefined) { T.debugWarn("ROS not initialized!"); return; }
		if (RC.Controller.isRunning() || RC.Controller.isReadonly()) {
			RC.Sync.register("Sync", 60);
		}
		sync_mirror_publisher.publish();
		RC.Sync.setProgress("Sync", 0.2, false);
	}

	this.requestBehaviorSynthesis = function(root, system, goals, initial_conditions, outcomes, result_cb, feedback_cb) {
		var goal = new ROSLIB.Goal({
			actionClient: synthesis_action_client,
			goalMessage: {
				request: {
					name: root,
					system: system,
					goals: goals,
					initial_conditions: initial_conditions,
					sm_outcomes: outcomes
				}
			}
		});

		goal.on('feedback', function(feedback) { synthesis_action_feedback_callback(feedback, root, feedback_cb); });
		goal.on('result', function(result) { synthesis_action_result_callback(result, root, result_cb); });

		goal.send();
	}

	this.DEBUG_synthesis_action_result_callback = function(result, root) {
		synthesis_action_result_callback(result, root);
	}

}) ();