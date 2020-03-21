/* Mind mapping iDevice (custom toolbar and actions) */
// Toolbar.js
mindmaps.ToolBarPresenter = function(eventBus, commandRegistry, view, mindmapModel) {
	
	function commandToButton(commandType) {
		var command = commandRegistry.get(commandType);
		return new mindmaps.ToolBarButton(command);
	}

	function commandsToButtons(commands) {
		return commands.map(commandToButton);
	}

	var nodeCommands = [ mindmaps.CreateNodeCommand, mindmaps.DeleteNodeCommand ];
	var nodeButtons = commandsToButtons(nodeCommands);
	view.addButtonGroup(nodeButtons, view.alignLeft);

	// undo buttons
	var undoCommands = [ mindmaps.UndoCommand, mindmaps.RedoCommand ];
	var undoButtons = commandsToButtons(undoCommands);
	view.addButtonGroup(undoButtons, view.alignLeft);

	// clipboard buttons.
	var clipboardCommands = [ mindmaps.CopyNodeCommand,
	mindmaps.CutNodeCommand, mindmaps.PasteNodeCommand ];
	var clipboardButtons = commandsToButtons(clipboardCommands);
	view.addButtonGroup(clipboardButtons, view.alignLeft);

	// Mediateca (file menu)
	var fileMenu = new mindmaps.ToolBarMenu(_("Options..."), "ui-icon-document");
	var fileCommands = [ 
		mindmaps.SaveDocumentInMediatecaExitCommand, // Save
		mindmaps.OpenDocumentCommand, // Import
		mindmaps.SaveDocumentCommand, // Export
		mindmaps.ExportCommand, // Export as PNG
		mindmaps.PrintCommand // Print
		// mindmaps.CloseDocumentCommand // Finish
	];
	var fileButtons = commandsToButtons(fileCommands);
	fileMenu.add(fileButtons);
	view.addMenu(fileMenu);

	// help button
	view.addButton(commandToButton(mindmaps.HelpCommand), view.alignRight);

	this.go = function() {
		view.init();
	};
	
};

// ApplicationController.js
mindmaps.ApplicationController = function() {
	
	var eventBus = new mindmaps.EventBus();
	var shortcutController = new mindmaps.ShortcutController();
	var commandRegistry = new mindmaps.CommandRegistry(shortcutController);
	var undoController = new mindmaps.UndoController(eventBus, commandRegistry);
	var mindmapModel = new mindmaps.MindMapModel(eventBus, commandRegistry, undoController);
	var clipboardController = new mindmaps.ClipboardController(eventBus, commandRegistry, mindmapModel);
	var helpController = new mindmaps.HelpController(eventBus, commandRegistry);
	var printController = new mindmaps.PrintController(eventBus, commandRegistry, mindmapModel);
	var autosaveController = new mindmaps.AutoSaveController(eventBus, mindmapModel);
	var filePicker = new mindmaps.FilePicker(eventBus, mindmapModel);

	// Handles the new document command
	// Triggered when $mapCode == '{}'
	function doNewDocument() {
		// close old document first
		var doc = mindmapModel.getDocument();
		doCloseDocument(false); // Mediateca: false
		var presenter = new mindmaps.NewDocumentPresenter(eventBus, mindmapModel, new mindmaps.NewDocumentView());
		presenter.go();
	}

	// Import
	function doOpenDocument() {
		var presenter = new mindmaps.OpenDocumentPresenter(eventBus, mindmapModel, new mindmaps.OpenDocumentView(), filePicker);
		presenter.go();
	}
	
	// Mediateca
	
	// Export
	function doSaveDocument() {
		var presenter = new mindmaps.SaveDocumentPresenter(eventBus, mindmapModel, new mindmaps.SaveDocumentView(), autosaveController, filePicker);
		presenter.go();
	}
	
	// Export as image
	function doExportDocument() {
		var presenter = new mindmaps.ExportMapPresenter(eventBus, mindmapModel, new mindmaps.ExportMapView());
		presenter.go();
	}	
	
	// Open $mapCode (no menu option)
	mindmaps.OpenMediatecaDocument = function(eventBus, mindmapModel, view) {

		this.go = function() {
			try {
				var doc = mindmaps.Document.fromObject(JSON.parse(top.mindmapEditor.dataWrapper.html()));
			} catch (e) {
				eventBus.publish(mindmaps.Event.NOTIFICATION_ERROR, _('File is not a valid mind map!'));
				throw new Error(_('Error while opening map from hdd'), e);
			}
			mindmapModel.setDocument(doc);
		};

	};

	function openMediatecaDocument() {
		var doc = mindmapModel.getDocument();
		doCloseDocument(false);
		var presenter = new mindmaps.OpenMediatecaDocument(eventBus, mindmapModel, new mindmaps.NewDocumentView());
		presenter.go();
	}

	// Fullscreen
	function openMapInNewWindow(){
		window.open(window.location.href);
	}
	
	// Hide show the navigator (read only mode)
	function toggleNavigator(){
		$(".ui-dialog").toggle();
	}
	
	function doSaveDocumentInMediatecaExit(data) {
		var renderer = new mindmaps.StaticCanvasRenderer();
		var renderer = new mindmaps.StaticCanvasRenderer();
		var $img = renderer.renderAsPNG(mindmapModel.getDocument());
		var base64img = $img.attr("src");
		
		top.mindmapEditor.imgWrapper.html('<img src="'+base64img+'" alt="" />');
		var result = JSON.stringify(data);
			result = result.replace(/\\"/g,'"')
			result = result.slice(1, -1);
		top.mindmapEditor.dataWrapper.html(result);
		top.mindmapEditor.closeConfirmed = true;
		top.mindmapEditor.dialog.close();
	}	
		
	function saveDocumentInMediatecaExit() {			
			var content = mindmapModel.getDocument().prepareSave().serialize();
			var renderer = new mindmaps.StaticCanvasRenderer();
			var $img = renderer.renderAsPNG(mindmapModel.getDocument());
			var base64img = $img.attr("src");
			doSaveDocumentInMediatecaExit(content);
	}

	// Finish
	function doCloseDocument(showDialog) { 
		if (showDialog!=false) {
			top.mindmapEditor.dialog.close();
		} else {
			var doc = mindmapModel.getDocument();
			if (doc) mindmapModel.setDocument(null);	
		}
	}
	
	// / Mediateca

	// Initializes the controller, registers for all commands and subscribes to event bus
	this.init = function() {
		
		var openDocumentCommand = commandRegistry.get(mindmaps.OpenDocumentCommand);
		openDocumentCommand.setHandler(doOpenDocument);
		openDocumentCommand.setEnabled(true);

		var saveDocumentCommand = commandRegistry.get(mindmaps.SaveDocumentCommand);
		saveDocumentCommand.setHandler(doSaveDocument); 
		
		// Save and exit
		var saveDocumentInMediatecaExitCommand = commandRegistry.get(mindmaps.SaveDocumentInMediatecaExitCommand);
		saveDocumentInMediatecaExitCommand.setHandler(saveDocumentInMediatecaExit);

		var openInNewWindowCommand = commandRegistry.get(mindmaps.OpenInNewWindowCommand);
		openInNewWindowCommand.setHandler(openMapInNewWindow);	

		var toggleNavigatorCommand = commandRegistry.get(mindmaps.ToggleNavigatorCommand);
		toggleNavigatorCommand.setHandler(toggleNavigator);			
		// / Mediateca

		var closeDocumentCommand = commandRegistry.get(mindmaps.CloseDocumentCommand);
		closeDocumentCommand.setHandler(doCloseDocument);

		var exportCommand = commandRegistry.get(mindmaps.ExportCommand);
		exportCommand.setHandler(doExportDocument); 

		eventBus.subscribe(mindmaps.Event.DOCUMENT_CLOSED, function() {
			saveDocumentCommand.setEnabled(false);
			closeDocumentCommand.setEnabled(false);
			exportCommand.setEnabled(false);
		});

		// Mediateca
		var enable = true;
		eventBus.subscribe(mindmaps.Event.DOCUMENT_OPENED, function() {
			saveDocumentCommand.setEnabled(enable); // You can't save the JSON file if it's not an open document (with an open license)
			closeDocumentCommand.setEnabled(true);
			exportCommand.setEnabled(true);
		});		
		// / Mediateca
	};

	// Launches the main view controller
	this.go = function() {
		var viewController = new mindmaps.MainViewController(eventBus, mindmapModel, commandRegistry);
		viewController.go();

		// Mediateca
		var hasData = top && top.mindmapEditor && top.mindmapEditor.dataWrapper && top.mindmapEditor.dataWrapper.html()!="";
		if (hasData) openMediatecaDocument();
		else doNewDocument(); // Triggered when $mapCode == '{}'
		// / Mediateca
	};

	this.init();
	
};
// Command.js
// Import
mindmaps.OpenDocumentCommand = function() {
	this.id = "OPEN_DOCUMENT_COMMAND";
	// Mediateca this.label = _("Open...");
	this.label = _("Import");
	this.shortcut = ["ctrl+o", "meta+o"];
	this.icon = "ui-icon-folder-open";
	// Mediateca this.description = _("Open an existing mind map");
	this.description = _("Open an existing mind map from your disk");
};
mindmaps.OpenDocumentCommand.prototype = new mindmaps.Command();

// Export
mindmaps.SaveDocumentCommand = function() {
	this.id = "SAVE_DOCUMENT_COMMAND";
	this.label = _("Export");
	this.enabled = false;
	this.shortcut = ["ctrl+e", "meta+e"];
	this.icon = "ui-icon-copy";
	this.description = _("Download the map to save it");
};
mindmaps.SaveDocumentCommand.prototype = new mindmaps.Command();

// Save
mindmaps.SaveDocumentInMediatecaCommand = function() {
	this.id = "SAVE_DOCUMENT_IN_MEDIATECA_COMMAND";
	this.label = _("Save...");
	this.enabled = true;
	this.shortcut = ["ctrl+s", "meta+s"];
	this.icon = "ui-icon-disk";
	this.description = _("Save the mind map");
};
mindmaps.SaveDocumentInMediatecaCommand.prototype = new mindmaps.Command();

mindmaps.SaveDocumentInMediatecaExitCommand = function() {
	this.id = "SAVE_DOCUMENT_IN_MEDIATECA_EXIT_COMMAND"; 
	this.label = _("Save and exit");
	this.enabled = true; 
	this.shortcut = ["ctrl+s", "meta+s"];
	this.icon = "ui-icon-disk";
	this.description = "Salvar el mapa mental y salir";
};
mindmaps.SaveDocumentInMediatecaExitCommand.prototype = new mindmaps.Command();

// Fullscreen
mindmaps.OpenInNewWindowCommand = function() {
	this.id = "OPEN_IN_NEW_WINDOW_COMMAND";
	this.label = _("Fullscreen");
	this.enabled = true;
	this.icon = "ui-icon-newwin";
	this.description = _("Open this map in a new window");
};
mindmaps.OpenInNewWindowCommand.prototype = new mindmaps.Command();

// Hide/Show the navigator (read only mode)
mindmaps.ToggleNavigatorCommand = function() {
	this.id = "TOGGLE_NAVIGATOR_COMMAND";
	this.label = _("Navigator");
	this.enabled = true;
	this.icon = "ui-icon-zoomin";
	this.description = _("Hide or show the navigator");
};
mindmaps.ToggleNavigatorCommand.prototype = new mindmaps.Command();

// Finish
mindmaps.CloseDocumentCommand = function() {
	this.id = "CLOSE_DOCUMENT_COMMAND";
	// Mediateca this.label = _("Close");
	this.label = _("Finish");
	this.icon = "ui-icon-close";
	// Mediateca this.description = _("Close the mind map");
	this.description = _("Close the mind map editor");
};
mindmaps.CloseDocumentCommand.prototype = new mindmaps.Command();