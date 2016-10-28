// Add Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    var onEnter = function(cb) { return function(event) { if(event.keyCode == 13) cb(); } };
    var onEnterFocusChange = function (cb, id) { return onEnter(function() { cb(); document.getElementById(id).focus(); }); };

// General
    document.getElementById('flexbe_about').addEventListener('click', UI.Feed.showAbout);

    document.getElementById('button_to_db').addEventListener('click', UI.Menu.toDashboardClicked);
    document.getElementById('button_to_sm').addEventListener('click', UI.Menu.toStatemachineClicked);
    document.getElementById('button_to_rc').addEventListener('click', UI.Menu.toControlClicked);
    document.getElementById('button_to_se').addEventListener('click', UI.Menu.toSettingsClicked);

    document.getElementById('terminal').addEventListener('click', UI.Panels.Terminal.hide);

    document.getElementById('tool_input_command').addEventListener('keyup', UI.Tools.commandListener);
    document.getElementById('tool_overlay_undo').addEventListener('click', UI.Tools.undoClicked);
    document.getElementById('tool_overlay_redo').addEventListener('click', UI.Tools.redoClicked);
    document.getElementById('tool_overlay_copy').addEventListener('click', UI.Tools.copyClicked);
    document.getElementById('tool_overlay_paste').addEventListener('click', UI.Tools.pasteClicked);
    document.getElementById('tool_overlay_cut').addEventListener('click', UI.Tools.cutClicked);
    document.getElementById('tool_overlay_dfg').addEventListener('click', UI.Tools.dfgClicked);
    document.getElementById('tool_overlay_terminal').addEventListener('click', UI.Tools.terminalClicked);
    document.getElementById('tool_overlay_save').addEventListener('click', UI.Tools.saveClicked);

// Behavior Dashboard
    document.getElementById('input_behavior_name').addEventListener('blur', UI.Dashboard.behaviorNameChanged);
    document.getElementById('input_behavior_description').addEventListener('blur', UI.Dashboard.behaviorDescriptionChanged);
    document.getElementById('input_behavior_tags').addEventListener('blur', UI.Dashboard.behaviorTagsChanged);
    document.getElementById('input_behavior_author').addEventListener('blur', UI.Dashboard.behaviorAuthorChanged);
    document.getElementById('input_behavior_date').addEventListener('blur', UI.Dashboard.behaviorDateChanged);

    document.getElementById('behavior_sourcecode_edit').addEventListener('dragstart', function(evt) {
        n = this.getAttribute("cmd");
        evt.dataTransfer.setData('text/plain', n);//'rosed ' + n.rosnode_name + ' ' + n.file_name+ '\n');
    });
    
    document.getElementById('button_db_variable_add').addEventListener('click', UI.Dashboard.addPrivateVariableClicked);
    document.getElementById('input_db_variable_key_add').addEventListener('keyup', onEnter(UI.Dashboard.addPrivateVariableClicked));
    document.getElementById('input_db_variable_value_add').addEventListener('keyup', onEnterFocusChange(UI.Dashboard.addPrivateVariableClicked, 'input_db_variable_key_add'));

    document.getElementById('button_db_userdata_add').addEventListener('click', UI.Dashboard.addDefaultUserdataClicked);
    document.getElementById('input_db_userdata_key_add').addEventListener('keyup', onEnter(UI.Dashboard.addDefaultUserdataClicked));
    document.getElementById('input_db_userdata_value_add').addEventListener('keyup', onEnterFocusChange(UI.Dashboard.addDefaultUserdataClicked, 'input_db_userdata_key_add'));

    document.getElementById('button_db_parameter_add').addEventListener('click', UI.Dashboard.addParameterClicked);
    document.getElementById('input_db_parameter_name_add').addEventListener('keyup', onEnter(UI.Dashboard.addParameterClicked));
    document.getElementById('button_db_parameter_turn').addEventListener('click', UI.Dashboard.turnParameterClicked);

//    document.getElementById('button_db_function_add').addEventListener('click', UI.Dashboard.addPrivateFunctionClicked);
//    document.getElementById('input_db_function_name_add').addEventListener('keyup', onEnter(UI.Dashboard.addPrivateFunctionClicked));
//    document.getElementById('input_db_function_params_add').addEventListener('keyup', onEnterFocusChange(UI.Dashboard.addPrivateFunctionClicked, 'input_db_function_name_add'));

    document.getElementById('button_db_outcome_add').addEventListener('click', UI.Dashboard.addBehaviorOutcomeClicked);
    document.getElementById('input_db_outcome_add').addEventListener('keyup', onEnter(UI.Dashboard.addBehaviorOutcomeClicked));
    document.getElementById('button_db_input_key_add').addEventListener('click', UI.Dashboard.addBehaviorInputKeyClicked);
    document.getElementById('input_db_input_key_add').addEventListener('keyup', onEnter(UI.Dashboard.addBehaviorInputKeyClicked));
    document.getElementById('button_db_output_key_add').addEventListener('click', UI.Dashboard.addBehaviorOutputKeyClicked);
    document.getElementById('input_db_output_key_add').addEventListener('keyup', onEnter(UI.Dashboard.addBehaviorOutputKeyClicked));

// State Machine Editor
    document.getElementById('button_add_state_confirm').addEventListener('click', UI.Panels.AddState.addStateConfirmClicked);
    document.getElementById('add_state_name').addEventListener('keyup', onEnter(UI.Panels.AddState.addStateConfirmClicked));
    document.getElementById('button_add_state_cancel').addEventListener('click', UI.Panels.AddState.addStateCancelClicked);

    document.getElementById('button_select_behavior_cancel').addEventListener('click', UI.Panels.SelectBehavior.behaviorSelectCancelClicked);

    document.getElementById('button_apply_properties').addEventListener('click', UI.Panels.StateProperties.applyPropertiesClicked);
    document.getElementById('button_close_properties').addEventListener('click', UI.Panels.StateProperties.closePropertiesClicked);
    document.getElementById('button_delete_state').addEventListener('click', UI.Panels.StateProperties.deleteStateClicked);

    document.getElementById('select_container_type').addEventListener('change', UI.Panels.StateProperties.containerTypeChanged);

    document.getElementById('cb_display_synthesis').addEventListener('change', UI.Panels.StateProperties.displaySynthesisClicked);
    document.getElementById('button_prop_synthesize').addEventListener('click', UI.Panels.StateProperties.synthesizeClicked);

    document.getElementById('button_view_behavior').addEventListener('click', UI.Panels.StateProperties.openBehavior);
    document.getElementById('button_view_statemachine').addEventListener('click', UI.Panels.StateProperties.openStatemachine);
    document.getElementById('button_prop_outcome_add').addEventListener('click', UI.Panels.StateProperties.addSMOutcome);
    document.getElementById('button_prop_input_key_add').addEventListener('click', UI.Panels.StateProperties.addSMInputKey);
    document.getElementById('button_prop_output_key_add').addEventListener('click', UI.Panels.StateProperties.addSMOutputKey);
    document.getElementById('input_prop_outcome_add').addEventListener('keyup', onEnter(UI.Panels.StateProperties.addSMOutcome));
    document.getElementById('input_prop_input_key_add').addEventListener('keyup', onEnter(UI.Panels.StateProperties.addSMInputKey));
    document.getElementById('input_prop_output_key_add').addEventListener('keyup', onEnter(UI.Panels.StateProperties.addSMOutputKey));
    document.getElementById('button_close_be_properties').addEventListener('click', UI.Panels.StateProperties.closePropertiesClicked);
    document.getElementById('button_delete_be').addEventListener('click', UI.Panels.StateProperties.deleteStateClicked);
    document.getElementById('button_close_sm_properties').addEventListener('click', UI.Panels.StateProperties.closePropertiesClicked);
    document.getElementById('button_delete_sm').addEventListener('click', UI.Panels.StateProperties.deleteStateClicked);

    document.getElementById('input_prop_state_name').addEventListener('blur', UI.Panels.StateProperties.statePropNameChanged);
    document.getElementById('input_prop_be_name').addEventListener('blur', UI.Panels.StateProperties.statePropNameChanged);
    document.getElementById('input_prop_sm_name').addEventListener('blur', UI.Panels.StateProperties.statePropNameChanged);
    document.getElementById('input_class_filter').addEventListener('keyup', UI.Panels.AddState.classFilterChanged);
    document.getElementById('input_behavior_filter').addEventListener('keyup', UI.Panels.SelectBehavior.behaviorFilterChanged);

// Runtime Control
    document.getElementById('button_rc_connect').addEventListener('click', UI.Settings.connectRosbridgeClicked);
    document.getElementById('button_rc_save').addEventListener('click', UI.Menu.saveBehaviorClicked);
    document.getElementById('button_rc_load').addEventListener('click', UI.Menu.loadBehaviorClicked);

    document.getElementById('button_behavior_start').addEventListener('click', UI.RuntimeControl.startBehaviorClicked);
    document.getElementById('button_behavior_params_reset').addEventListener('click', UI.RuntimeControl.resetParameterTableClicked);

    document.getElementById('button_behavior_attach_external').addEventListener('click', UI.RuntimeControl.attachExternalClicked);

    document.getElementById('sync_bar').addEventListener('click', UI.RuntimeControl.toggleSyncExtension);
    document.getElementById('button_behavior_lock').addEventListener('click', UI.RuntimeControl.behaviorLockClicked);
    document.getElementById('selection_rc_autonomy').addEventListener('change', UI.RuntimeControl.autonomySelectionChanged);
    document.getElementById('button_behavior_repeat').addEventListener('click', UI.RuntimeControl.repeatBehaviorClicked);
    document.getElementById('button_behavior_pause').addEventListener('click', UI.RuntimeControl.pauseBehaviorClicked);
    document.getElementById('button_behavior_preempt').addEventListener('click', UI.RuntimeControl.preemptBehaviorClicked);
    document.getElementById('cb_allow_preempt').addEventListener('change', UI.RuntimeControl.allowPreemptClicked);
    document.getElementById('button_behavior_sync').addEventListener('click', UI.RuntimeControl.syncMirrorClicked);

// Settings
    document.getElementById('button_add_state_folder').addEventListener('click', UI.Settings.addStateFolderClicked);
    document.getElementById('button_apply_state_library').addEventListener('click', UI.Settings.applyStateLibraryClicked);

    document.getElementById('button_behaviors_chooser').addEventListener('click', UI.Settings.behaviorsChooserClicked);  
    document.getElementById('button_be_chooser').addEventListener('click', UI.Settings.beChooserClicked);

    document.getElementById('input_rosbridge_ip').addEventListener('blur', UI.Settings.rosbridgeIPChanged);
    document.getElementById('input_rosbridge_port').addEventListener('blur', UI.Settings.rosbridgePortChanged);
    document.getElementById('button_rosbridge_connect').addEventListener('click', UI.Settings.connectRosbridgeClicked);  
    document.getElementById('button_rosbridge_disconnect').addEventListener('click', UI.Settings.disconnectRosbridgeClicked);

    document.getElementById('input_runtime_timeout').addEventListener('blur', UI.Settings.runtimeTimeoutChanged);
    document.getElementById('cb_stop_behaviors').addEventListener('change', UI.Settings.stopBehaviorsClicked);

    document.getElementById('input_package_namespace').addEventListener('change', UI.Settings.packageNamespaceChanged);
    document.getElementById('select_code_indentation').addEventListener('change', UI.Settings.codeIndentationChanged);
    document.getElementById('select_transition_mode').addEventListener('change', UI.Settings.transitionEndpointsChanged);
    document.getElementById('input_gridsize').addEventListener('change', UI.Settings.gridsizeChanged);
    document.getElementById('cb_commands_enabled').addEventListener('change', UI.Settings.commandsEnabledClicked);
    document.getElementById('input_commands_key').addEventListener('change', UI.Settings.commandsKeyChanged);

    document.getElementById('cb_synthesis_enabled').addEventListener('change', UI.Settings.synthesisEnabledClicked);
    document.getElementById('input_synthesis_topic').addEventListener('change', UI.Settings.synthesisTopicChanged);
    document.getElementById('input_synthesis_type').addEventListener('change', UI.Settings.synthesisTypeChanged);
    document.getElementById('input_synthesis_system').addEventListener('change', UI.Settings.synthesisSystemChanged);
});
////////////////////////////////////////////////////////////////////////////////////////////////

/*chrome.app.window.current().onClosed.addListener(function() {
    // no effect
    if(RC.Controller.isRunning()) {
        RC.PubSub.sendPreemptBehavior();
    }
});*/
/*chrome.app.window.current().onbeforeunload = function (evt) {
    if(RC.Controller.isRunning()) {
        RC.PubSub.sendPreemptBehavior();
    }
}*/

/*window.addEventListener('closed', function() {
    if(RC.Controller.isRunning()) {
        RC.PubSub.sendPreemptBehavior();
    }
});*/

window.addEventListener('resize', function() {
    UI.Statemachine.recreateDrawingArea();
    UI.RuntimeControl.recreateDrawingArea();
});

// Key Bindings
//Mousetrap.bind("ctrl+shift+z", function(event) { ActivityTracer.undo(); });
//Mousetrap.bind("ctrl+shift+y", function() { ActivityTracer.redo(); });

//Mousetrap.bind("ctrl+shift+c", function() { Tools.copy(); });
//Mousetrap.bind("ctrl+shift+v", function() { Tools.paste(); });

Mousetrap.bind("k", function() { console.log("kkkk"); });
Mousetrap.bind("esc", function() {
    UI.Statemachine.abortTransition();
    UI.Statemachine.removeSelection();
});


chrome.commands.onCommand.addListener(function(command) {
    switch(command) {
        case 'Copy': Tools.copy(); break;
        case 'Paste': Tools.paste(); break;
//        case 'Undo': ActivityTracer.undo(); break;
//        case 'Redo': ActivityTracer.redo(); break;
    }
});