// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

// const Gettext = imports.gettext.domain('gnome-shell-extensions');
// const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

const SETTINGS_GITHUB_USERNAME = 'github-username';
const SETTINGS_GITHUB_PASSWORD = 'github-password';
const SETTINGS_REPOSITORIES = 'repositories';

function init() {
  // Convenience.initTranslations();
}

const GithubProjectsPrefsWidget = new GObject.Class({
  Name: 'Github.Projects.Prefs.Widget',
  GTypeName: 'GithubProjectsPrefsWidget',
  Extends: Gtk.Grid,

  _init: function(params) {
    this.parent(params);
    this.margin = 12;
    this.row_spacing = this.column_spacing = 6;
    this.set_orientation(Gtk.Orientation.VERTICAL);

    this._repoStore = new Gtk.ListStore();
    this._repoStore.set_column_types([GObject.TYPE_STRING]);
    this._settings = Convenience.getSettings();
    this._settings.connect('changed::' + SETTINGS_REPOSITORIES, Lang.bind(
      this, this._updateRepos));


    let notebook = new Gtk.Notebook();

    let rps = this._drawRepositorySettings();
    notebook.append_page(rps, new Gtk.Label({
      label: 'Repositories'
    }));

    let ghs = this._drawGithubSettings();
    notebook.append_page(ghs, new Gtk.Label({
      label: 'Github Credentials'
    }));

    this.add(notebook);
  },

  _drawGithubSettings: function() {
    let grid = new Gtk.Grid({
      row_spacing: 20
    });
    grid.margin = 12;
    grid.row_spacing = grid.column_spacing = 6;
    grid.set_orientation(Gtk.Orientation.VERTICAL);

    grid.add(new Gtk.Label({
      label: 'Please log in to Github in order to access your private repos.',
      use_markup: true,
      wrap: true,
      xalign: 0,
      track_visited_links: false
    }));

    grid.add(new Gtk.Label({
      label: '<b>Username</b>',
      use_markup: true,
      halign: Gtk.Align.START
    }));

    let usernameEntry = new Gtk.Entry({
      hexpand: true,
      margin_bottom: 12
    });
    grid.add(usernameEntry);

    this._settings.bind('github-username', usernameEntry, 'text',
      Gio.SettingsBindFlags.DEFAULT);

    grid.add(new Gtk.Label({
      label: '<b>Access token</b> (<a href="https://github.com/settings/tokens">' +
        'Create a new access token</a> if you don’t have one)',
      use_markup: true,
      halign: Gtk.Align.START
    }));

    let passwordEntry = new Gtk.Entry({
      hexpand: true,
      margin_bottom: 12
    });
    passwordEntry.set_visibility(false);
    grid.add(passwordEntry);

    this._settings.bind('github-password', passwordEntry, 'text',
      Gio.SettingsBindFlags.DEFAULT);

    return grid;
  },

  _drawRepositorySettings: function() {
    let grid = new Gtk.Grid();
    grid.set_orientation(Gtk.Orientation.VERTICAL);

    this._repoTreeView = new Gtk.TreeView({
      model: this._repoStore,
      hexpand: true,
      vexpand: true
    });
    this._repoTreeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

    let appColumn = new Gtk.TreeViewColumn({
      expand: true,
      sort_column_id: 0,
      title: "Repository"
    });

    let nameRenderer = new Gtk.CellRendererText();
    appColumn.pack_start(nameRenderer, true);
    appColumn.add_attribute(nameRenderer, "text", 0);

    this._repoTreeView.append_column(appColumn);
    grid.add(this._repoTreeView);
    this._updateRepos();

    let toolbar = new Gtk.Toolbar();
    toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);

    let addTButton = new Gtk.ToolButton({
      stock_id: Gtk.STOCK_ADD
    });
    addTButton.connect('clicked', Lang.bind(this, this._addRepo));
    toolbar.add(addTButton);

    let removeTButton = new Gtk.ToolButton({
      stock_id: Gtk.STOCK_REMOVE
    });
    removeTButton.connect('clicked', Lang.bind(this, this._removeRepo));
    toolbar.add(removeTButton);

    grid.add(toolbar);

    return grid;
  },

  _addRepo: function () {
    let repos = this._getSettingsRepos();
    repos.push('ohai');
    this._setSettingsRepos(repos);
  },

  _removeRepo: function () {
    let [any, model, iter] = this._repoTreeView.get_selection().get_selected();
    if (any) {
      let repo = model.get_value(iter, 0);
      let repos = this._getSettingsRepos();

      let repoIndex = repos.indexOf(repo);
      if(repoIndex >= 0) {
        repos.splice(repoIndex, 1);
        this._setSettingsRepos(repos);
      }
    }
  },

  _updateRepos: function() {
    var self = this;
    this._repoStore.clear();

    let repos = this._getSettingsRepos();

    repos.forEach(function (repoName) {
      let iter = self._repoStore.append();
      self._repoStore.set(iter, [0], [repoName]);
    });
  },

  _getSettingsRepos: function () {
    return this._settings.get_strv(SETTINGS_REPOSITORIES);
  },

  _setSettingsRepos: function (repos) {
    this._settings.set_strv(SETTINGS_REPOSITORIES, repos);
  }
});

function buildPrefsWidget() {
  let widget = new GithubProjectsPrefsWidget();
  widget.show_all();

  return widget;
}