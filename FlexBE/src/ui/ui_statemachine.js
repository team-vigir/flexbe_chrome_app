UI.Statemachine = new (function() {
	var that = this;

	var R = undefined;
	var drag_indicator = undefined;
	var displayed_sm = undefined;
	var selection_area = undefined;
	var selection_set = undefined;

	var drawings = [];
	var drag_transition;
	var previous_transition_end;
	var connecting = false;
	var selecting = false;
	var mouse_pos = undefined;
	var background = undefined;
	var dataflow_displayed = false;
	var comments_displayed = true;

	var drawn_sms = [];
	var grid = [];

	Mousetrap.bind("shift", function() { displayGrid() }, 'keydown');
	Mousetrap.bind("shift", function() { hideGrid() }, 'keyup');

	var updateMousePos = function(event) {
		var bnds = event.target.getBoundingClientRect();
		
		// adjust mouse x/y
		var mx = event.clientX - bnds.left;
		var my = event.clientY - bnds.top;

		mouse_pos.attr({cx: mx, cy: my});
		if (connecting)
			that.refreshView();
		
	}

	var displayGrid = function() {
		var gridsize = UI.Settings.getGridsize();
		for (var i = gridsize; i < R.width; i += gridsize) {
			grid.push(R.path("M" + i + ",0L" + i + "," + R.height).attr({stroke: '#ddd'}));
		}
		for (var i = gridsize; i < R.height; i += gridsize) {
			grid.push(R.path("M0," + i + "L" + R.width + "," + i).attr({stroke: '#ddd'}));
		}
	}
	var hideGrid = function() {
		grid.forEach(function(el) { el.remove(); });
		grid = [];
	}

	var beginSelection = function(x, y, event) {
		if (connecting) return;
		selecting = true;

		var mx = mouse_pos.attr("cx");
		var my = mouse_pos.attr("cy");

		selection_area.attr({opacity: 1, x: mx, y: my, width: 0, height: 0}).toFront();
	}
	var updateSelection = function(dx, dy, x, y, event) {
		if (!selecting) return;

		var xoffset = 0, yoffset = 0;
		if (dx < 0) {
			xoffset = dx;
			dx = -1 * dx;
		}
		if (dy < 0) {
			yoffset = dy;
			dy = -1 * dy;
		}
		selection_area.transform("T" + xoffset + "," + yoffset);
		selection_area.attr({width: dx, height: dy});
	}
	var endSelection = function(event) {
		if (!selecting) return;
		selecting = false;

		if (selection_area.attr("width") < 10 || selection_area.attr("height") < 10)
			removeSelection();
	}
	var removeSelection = function() {
		selecting = false;
		selection_area.attr({x: 0, y: 0, width: 0, height: 0, opacity: 0});
	}

	var beginSelectionMove = function() {
		//selection_set = R.set();
		//that.getSelectedStates().forEach(function (element) {
		//	selection_set.push(that.getDrawnState(element));
		//});
	}
	var updateSelectionMove = function(dx, dy, x, y, event) {
		//var old_x = selection_set.attr("x");
		//var old_y = selection_set.attr("y");
		//selection_set.attr({x: old_x + dx, y: old_y + dy});
	}
	var endSelectionMove = function() {
		//selection_set.forEach(function (element) {
		//
		//});
		//selection_set.clear();
	}

	var displayInitialDot = function() {
		var dummyStateObj = new State("INIT", Statelib.getFromLib(":INIT"));
		var drawing = R.circle(10, 40, 5)
				.attr({fill: '#000'})
				.data("state", dummyStateObj)
				.data("label", "")
				.click(function() {
					if (connecting) return;
					UI.Statemachine.beginInitTransition();
				});
		if (!connecting) drawing.attr({cursor: 'pointer'});

		return {
			drawing: drawing,
			obj: dummyStateObj
		};
	}

	var displaySMPath = function() {
		return new Drawable.ContainerPath(displayed_sm, R, smDisplayHandler);
	}

	var smDisplayHandler = function() {
		UI.Panels.StateProperties.hide();
		that.setDisplayedSM(this.data("statemachine"));
	}

	var initializeDrawingArea = function() {
		R = Raphael("drawing_area");
		drag_indicator = R.rect(0,0,10,10).attr({opacity: 0});
		selection_area = R.rect(0,0,0,0).attr({opacity: 0, stroke: "#000", 'stroke-dasharray': "--", fill: "rgba(250,250,250,0.4)", 'stroke-width': 0.5})
			.drag(updateSelectionMove, beginSelectionMove, endSelectionMove);

		mouse_pos = R.circle(0, 0, 2).attr({opacity: 0});
		background = R.rect(0, 0, R.width, R.height)
			.attr({fill: '#FFF', stroke: '#FFF'}).toBack()
			.mousemove(updateMousePos)
			.drag(updateSelection, beginSelection, endSelection)
			.click(function() { document.activeElement.blur(); });
	}


	this.initialize = function() {
		initializeDrawingArea();

		displayed_sm = Behavior.getStatemachine();
	}

	this.recreateDrawingArea = function() {
		// clear
		for (var i=0; i<drawings.length; ++i) {
			drawings[i].drawing.remove();
		}
		drawings = [];

		R.remove();

		initializeDrawingArea();
		that.refreshView();
	}

	this.toggleDataflow = function() {
		dataflow_displayed = !dataflow_displayed;

		if (UI.Menu.isPageStatemachine()) that.refreshView();
	}

	this.toggleComments = function() {
		comments_displayed = !comments_displayed;

		if (UI.Menu.isPageStatemachine()) that.refreshView();
	}

	this.getR = function() {
		return R;
	}

	this.getDragIndicator = function() {
		return drag_indicator;
	}

	this.getMousePos = function() {
		return mouse_pos;
	}

	this.getAllDrawings = function() {
		return drawings;
	}

	this.getDisplayedSM = function() {
		return displayed_sm;
	}

	this.setDisplayedSM = function(statemachine) {
		displayed_sm = statemachine;
		connecting = false;
		drag_transition = undefined;
		removeSelection();

		if (UI.Menu.isPageStatemachine()) that.refreshView();
	}

	this.resetStatemachine = function() {
		drawn_sms = [];
		that.setDisplayedSM(Behavior.getStatemachine());
	}

	this.isConnecting = function() {
		return connecting;
	}

	this.isReadonly = function() {
		return RC.Controller.isReadonly() || displayed_sm.isInsideDifferentBehavior();
	}

	this.applyGraphLayout = function() {
		that.refreshView();

		var node_drawings = drawings.filter(function(element) {
			return (
				element.obj instanceof State 
				|| element.obj instanceof Statemachine
				|| element.obj instanceof BehaviorState
				) && (
				!element.obj.getStateClass().startsWith(":") 
				|| element.obj.getStateClass() == ":OUTCOME"
				|| element.obj.getStateClass() == ":STATEMACHINE"
			);
		});
		if (node_drawings.length == 0) return;
		var transitions = displayed_sm.getTransitions();

		// generate node array
		var nodes = [];
		for (var i=0; i<node_drawings.length; i++) {
			var n = node_drawings[i].drawing.getBBox();
			nodes.push({x: n.x + n.width/2, y: n.y + n.height/2, fixed: false});
		}
		nodes.push({x: 10, y: 40, fixed: true});

		// generate link array
		var links = [];
		for (var i=0; i<transitions.length; i++) {
			var t = transitions[i];
			if (t.getFrom().getStateName() == "INIT") continue;
			var from = node_drawings.indexOf(node_drawings.findElement(function (element) {
				return t.getFrom().getStateName() == element.obj.getStateName();
			}));
			var to = node_drawings.indexOf(node_drawings.findElement(function (element) {
				return t.getTo().getStateName() == element.obj.getStateName();
			}));
			links.push({source: from, target: to});
		}
		if (displayed_sm.getInitialState() != undefined) {
			var from_init = node_drawings.length;
			var to_init = node_drawings.indexOf(node_drawings.findElement(function (element) {
				return displayed_sm.getInitialState().getStateName() == element.obj.getStateName();
			}));
			links.push({source: from_init, target: to_init});
		}

		// apply layout algorithm
		var force = d3.layout.force()
			.nodes(nodes)
			.links(links)
			.size([R.width, R.height])
			.linkDistance(function(link, i) {
				return (link.source.index == node_drawings.length)? 30 : 200;
			})
			.gravity(0.05)
			.charge(-100)
			.linkStrength(1);
		
		force.start();
		for (var i = 0; i < 20; ++i) force.tick();
		force.stop();

		// update state positions
		nodes = force.nodes();
		for (var i=0; i<node_drawings.length; i++) {
			var s = node_drawings[i].obj;
			s.setPosition({x: nodes[i].x, y: nodes[i].y});
		}
	}

	this.refreshView = function() {
//		var drawn_sm = drawn_sms.findElement(function(element) {
//			return element.getStatePath() == displayed_sm.getStatePath();
//		});
//		if (drawn_sm == undefined) {
//			drawn_sms.push(displayed_sm);
//			that.applyGraphLayout();
//		}
		if (dataflow_displayed) {
			displayed_sm.updateDataflow();
		}

		var states = displayed_sm.getStates();
		var sm_outcomes = displayed_sm.getSMOutcomes();
		var transitions = displayed_sm.getTransitions();
		var dataflow = displayed_sm.getDataflow();

		// clear
		for (var i=0; i<drawings.length; ++i) {
			drawings[i].drawing.remove();
		}
		drawings = [];

		// draw
		drawings.push(displaySMPath());
		drawings.push(displayInitialDot());

		for (var i=0; i<states.length; ++i) {
			var s = states[i];
			var a = RC.Controller.isRunning() && RC.Controller.isCurrentState(s, true);
			var l = RC.Controller.isLocked() && RC.Controller.isOnLockedPath(s.getStatePath());
			if (s instanceof Statemachine)
				drawings.push(new Drawable.Statemachine(s, R, false, Drawable.State.Mode.OUTCOME, a, l));
			else if (s instanceof BehaviorState)
				drawings.push(new Drawable.BehaviorState(s, R, false, Drawable.State.Mode.OUTCOME, a, l));
			else
				drawings.push(new Drawable.State(s, R, false, Drawable.State.Mode.OUTCOME, a, l));
		}
		for (var i=0; i<sm_outcomes.length; ++i) {
			o = sm_outcomes[i];
			var obj = new Drawable.Outcome(o, R, false);
			drawings.push(obj);
		}

		// draw transitions at last
		var transitions_readonly = RC.Controller.isReadonly() || dataflow_displayed || displayed_sm.isInsideDifferentBehavior();
		var new_transitions = [];
		for (var i=0; i<transitions.length; ++i) {
			var t = transitions[i];
			if (t.getTo() == undefined) continue;
			var dt = new Drawable.Transition(t, R, transitions_readonly, drawings, false, dataflow_displayed, Drawable.Transition.PATH_CURVE);
			new_transitions.forEach(function(ot) {
				if (dt.obj.getFrom().getStateName() == ot.obj.getFrom().getStateName() && dt.obj.getTo().getStateName() == ot.obj.getTo().getStateName()) {
					dt.merge(ot);
				}
			});
			new_transitions.push(dt);
			drawings.push(dt);
		}
		if (connecting) {
			drawings.push(new Drawable.Transition(drag_transition, R, false, drawings, false, false, Drawable.Transition.PATH_CURVE));
		}
		var new_transitions = [];
		if (dataflow_displayed) {
			for (var i=0; i<dataflow.length; ++i) {
				var d = dataflow[i];
				var dt = new Drawable.Transition(d, R, true, drawings, false, false, Drawable.Transition.PATH_STRAIGHT, '#000');
				new_transitions.forEach(function(ot) {
					if (dt.obj.getFrom().getStateName() == ot.obj.getFrom().getStateName() && dt.obj.getTo().getStateName() == ot.obj.getTo().getStateName()) {
						dt.merge(ot);
					}
				});
				new_transitions.push(dt);
				drawings.push(dt);
			}
		}

		// draw comment notes
		if (comments_displayed) {
			var notes = Behavior.getCommentNotes().filter(function(n) { return n.getContainerPath() == displayed_sm.getStatePath(); });
			for (var i = 0; i < notes.length; i++) {
				var n = new Drawable.Note(notes[i], R);
				drawings.push(n);
				if (notes[i].getContent() == "") n.editNote();
			}
		}

		if (RC.Controller.isReadonly()) {
			background.attr({fill: '#f3f6ff', stroke: '#c5d2ee'});
		} else if (displayed_sm.isInsideDifferentBehavior()) {
			background.attr({fill: '#fff3f6'});
		} else {
			background.attr({fill: '#FFF'});
		}
		background.toBack();
		selection_area.toFront();
	}

	this.getDrawnState = function(state) {
		for (var i=0; i<drawings.length; ++i) {
			if(drawings[i].obj.getStateName() == state.getStateName()) {
				return drawings[i].drawing;
			}
		}
	}

	this.beginTransition = function(state, label) {
		if (connecting) return;
		removeSelection();

		var autonomy = 0;
		var autonomy_index = state.getOutcomes().indexOf(label);
		if (autonomy_index != -1)
			autonomy = state.getAutonomy()[autonomy_index];

		drag_transition = new Transition(state, undefined, label, autonomy);
		previous_transition_end = undefined;

		connecting = true;
		this.refreshView();
	}

	this.beginInitTransition = function() {
		if (connecting) return;
		removeSelection();

		if (displayed_sm.getInitialState() != undefined) {
			previous_transition_end = displayed_sm.getInitialState().getStateName();
		} else {
			previous_transition_end = undefined;
		}
		displayed_sm.setInitialState(undefined);

		drag_transition = displayed_sm.getInitialTransition();

		connecting = true;
		this.refreshView();
	}

	this.resetTransition = function(transition) {
		if (connecting) return;
		drag_transition = transition;
		previous_transition_end = drag_transition.getTo().getStateName();
		drag_transition.setTo(undefined);
		connecting = true;
	}

	this.connectTransition = function(state) {
		if (!connecting) return;

		var is_initial = drag_transition == displayed_sm.getInitialTransition();
		var has_transition = displayed_sm.hasTransition(drag_transition);
		var undo_end = previous_transition_end;
		var redo_end = state.getStateName();
		var from = drag_transition.getFrom().getStateName();
		var outcome = drag_transition.getOutcome();
		var autonomy = drag_transition.getAutonomy();
		var container_path = displayed_sm.getStatePath();

		if (!is_initial) {
			drag_transition.setTo(state);

			if (!has_transition) {
				displayed_sm.addTransition(drag_transition);
			}
		} else {
			displayed_sm.setInitialState(state);
		}

		connecting = false;
		this.refreshView();

		ActivityTracer.addActivity(ActivityTracer.ACT_TRANSITION,
			is_initial?
			"Set initial state to " + state.getStateName()
			: "Connected outcome " + outcome + " of " + drag_transition.getFrom().getStateName() + " with " + state.getStateName(),
			function() {
				var container = (container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(container_path);
				var target = container.getStateByName(undo_end);
				if (target == undefined && container.getOutcomes().contains(undo_end)) target = container.getSMOutcomeByName(undo_end);
				if (is_initial) {
					container.setInitialState(target);
				} else {
					var transition = container.getTransitions().findElement(function(trans) {
						return trans.getFrom().getStateName() == from && trans.getOutcome() == outcome;
					});
					if (target != undefined) {
						transition.setTo(target);
					} else {
						transition.getFrom().unconnect(outcome);
						container.removeTransitionFrom(transition.getFrom(), outcome);
					}
				}
				UI.Statemachine.refreshView();
			},
			function() {
				var container = (container_path == "")? Behavior.getStatemachine() : Behavior.getStatemachine().getStateByPath(container_path);
				var target = container.getStateByName(redo_end);
				if (target == undefined && container.getOutcomes().contains(redo_end)) target = container.getSMOutcomeByName(redo_end);
				if (is_initial) {
					container.setInitialState(target);
				} else {
					var transition = container.getTransitions().findElement(function(trans) {
						return trans.getFrom().getStateName() == from && trans.getOutcome() == outcome;
					});
					if (transition != undefined) {
						transition.setTo(target);
					} else {
						container.addTransition(new Transition(container.getStateByName(from), target, outcome, autonomy));
					}
				}
				UI.Statemachine.refreshView();
			}
		);

		previous_transition_end = undefined;
	}

	this.getSelectedStates = function() {
		if (selection_area.attr("opacity") == 0) return [];

		var states = displayed_sm.getStates().map(function(element) {
			return {obj: element, drawing: that.getDrawnState(element)};
		});

		var drawings = states.filter(function(element) {
			var b = element.drawing.getBBox();
			return selection_area.isPointInside(b.x, b.y)
				&& selection_area.isPointInside(b.x, b.y + b.height)
				&& selection_area.isPointInside(b.x + b.width, b.y)
				&& selection_area.isPointInside(b.x + b.width, b.y + b.height);
		});

		return drawings.map(function(element) {
			return element.obj;
		});
	}

	this.getSelectedStatesAndTransitions = function() {
		var selected_states = that.getSelectedStates();

		var selected_transitions = displayed_sm.getTransitions().filter(function(t) {
			if (t.getFrom().getStateName() == "INIT") return false;
			var from_state = selected_states.findElement(function (element) { return element.getStateName() == t.getFrom().getStateName() });
			var to_state = selected_states.findElement(function (element) { return element.getStateName() == t.getTo().getStateName() });
			return from_state != undefined && to_state != undefined;
		});

		return selected_states.concat(selected_transitions);
	}

}) ();