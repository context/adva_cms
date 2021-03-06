var TinyTab = Class.create();
TinyTab.prototype = {
  initialize: function(element, panels) {
		this.container = $(element)
    if(this.container) {
			var tabs = $(this.container).select('.tabs')[0];
	    tabs.cleanWhitespace();
	    this.tabs = $A(tabs.childNodes);

	    this.panels = $(this.container).select('.panel');
			this.showPanel(this.panels[0]);

			this.selectFirstTab();
	    this.tabs.each(function(link) {
	      Event.observe(link, 'click', function(event) {
					this.selectTab(Event.element(event).parentNode)
	    		Event.stop(event);
	      }.bindAsEventListener(this));
	    }.bind(this));
		}
  },
	selectedTab: function(element) {
		return this.tabs.detect(function(tab){ return tab.hasClassName('selected') })
	},
	selectFirstTab: function() {
		var tab = this.tabs.detect(function(tab){ return tab.visible() });
		this.selectTab(tab);
	},
	selectTab: function(element) {
		this.unselectTab();
    element.addClassName('selected');
    this.showPanel(element);
	},
	unselectTab: function() {
		var selected = this.selectedTab();
		if(selected) selected.removeClassName('selected');
	},
	showPanel: function(element) {
    this.panels.each(function(panel) { Element.hide(panel) });
    $(element.getAttribute('id').replace('tab_', '')).show();
	}
};

var AssetWidget = {
	siteId: function() {
		return location.href.match(/sites\/([0-9]+)\//)[1];
	},
	assetId: function(element) {
		return element.getAttribute('id').match(/_(\d+)$/)[1];
	},
	memberId: function() {
		return location.href.match(/\/([0-9]+)\/(edit)/)[1];
	},
	assetsUrl: function() {
		return '/admin/sites/' + this.siteId() + '/assets';
	},
  isEdit: function() {
    return location.href.match(/\/[0-9]+\/edit#?$/)
  },
	collectionUrl: function(element) {
		return this.assetsUrl() + '/' + this.assetId(element) + '/contents';
	},
	memberUrl: function(element) {
		return this.collectionUrl(element) + '/' + this.memberId();
	},
  attachAsset: function(element, authenticityToken) {
    if(!this.isAttached(element)) {
	    new Ajax.Request(this.collectionUrl(element), { 'method': 'post', 'parameters': { 'content_id': this.memberId(), 'authenticity_token': authenticityToken }});
		}
  },
  detachAsset: function(element, authenticityToken) {
    if(this.isAttached(element)) {
			new Ajax.Request(this.memberUrl(element), { 'method': 'post', 'parameters': { '_method': 'delete', 'authenticity_token': authenticityToken }});
		}
  },
	isAttached: function(element) {
		return $('attached_asset_' + this.assetId(element)) ? true : false;
	},
	updateSelected: function() {
		if(!$('assets_widget')) return;
		var selectedIds = this.selectedAssetIds();
		this.updateSelectedTab(selectedIds.length > 0);
		this.updateSelectedAssets(selectedIds);
	},
	updateSelectedTab: function(show) {
		show ? this.showSelectedTab() : this.hideSelectedTab();
		if(!TinyTab.assets.selectedTab()){
			TinyTab.assets.selectFirstTab();
		}
	},
	showSelectedTab: function() {
		$('tab_attached_assets').show();
	},
	hideSelectedTab: function() {
		$('tab_attached_assets').hide();
		if(TinyTab.assets.selectedTab() == $('tab_attached_assets')) {
			TinyTab.assets.unselectTab();
		}
		$('attached_assets').hide();
	},
	updateSelectedAssets: function(ids) {
		['latest', 'bucket'].each(function(prefix) {
			$$('.' + prefix + '_asset').each(function(asset) { 
				asset.removeClassName('selected'); 
			});
			ids.each(function(id) { 			
				var asset = $(prefix + '_asset_' + id);
				if (asset) { asset.addClassName('selected'); }
		  });
		}.bind(this));		
	},
	selectedAssetIds: function() {
		return $$('.attached_asset').collect(function(asset) { 
			return asset.getAttribute('id').match(/_(\d+)$/)[1]; 
		});
	},	
  showAttachTools: function(id) {
    if(this.isEdit()) {
		  ['attach', 'detach'].each(function(prefix){ $(prefix + '_' + id).show(); })
    }
  },  
  hideAttachTools: function(id) {
		['attach', 'detach'].each(function(prefix){ $(prefix + '_' + id).hide(); })
  },
	search: function(query) {
    if(!query) return;
    $('search_assets_spinner').show();
    new Ajax.Request(this.assetsUrl(), { parameters: { query: escape(query), limit: 6, source: 'widget' }, method: 'get' });
	},
  upload: function(element, authenticityToken) {
		if(!$('asset_upload_frame')) {
			document.body.appendChild(new Element('iframe', { id: 'asset_upload_frame', name: 'asset_upload_frame', style: 'display:none;' }));
		}
		var form = new Element('form', { action: this.assetsUrl(), method: 'post', enctype: 'multipart/form-data', target: 'asset_upload_frame', style: 'display: none;' });
		form.appendChild(new Element('input', { type: 'hidden', name: 'authenticity_token', value: authenticityToken}));
		form.appendChild(new Element('input', { type: 'hidden', name: 'respond_to_parent', value: '1'}));
		form.appendChild(element.cloneNode(true));
		document.body.appendChild(form);
		form.submit();
		Element.remove(form);
  }	
};

Event.addBehavior({
  '#assets_widget .attach_asset:click': function() { AssetWidget.attachAsset(this, $('content_form').authenticity_token.value); return false; },
  '#assets_widget .detach_asset:click': function() { AssetWidget.detachAsset(this, $('content_form').authenticity_token.value); return false; },
  '#assets_widget .asset:mouseover': 	  function() { AssetWidget.showAttachTools(this.getAttribute('id')); },
  '#assets_widget .asset:mouseout': 		function() { AssetWidget.hideAttachTools(this.getAttribute('id')); },

	'#search_assets_button:click':        function(event) { AssetWidget.search($F('search_assets_query')); },
	'#search_assets_query:keypress':      function(event) { if(event.keyCode == Event.KEY_RETURN) { AssetWidget.search($F('search_assets_query')); Event.stop(event); } },
	'#upload_assets_button:click':        function(event) { AssetWidget.upload($('asset_uploaded_data'), $('content_form').authenticity_token.value);}

  // '#assets_widget .asset img':          function() { new Draggable(this, { revert: true, ghosting: true }); },
	//'#article_body':                      function() { Droppables.add(this, { onDrop: function(drag, drop, event) {} }); }
});                                 

Event.onReady(function() {
  TinyTab.assets = new TinyTab('assets_widget', 'panels');
	AssetWidget.updateSelected();
});
