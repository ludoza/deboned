// Deboned.js 13.08.05a
// Ludolph Neethling
// Deboned may be freely distributed under the MIT license.
// https://github.com/ludoza/deboned
"use strict";
(function(root) {
	var _ = root._,
		Backbone = root.Backbone,
		Deboned = root.Deboned = {},
		BaseModel = Backbone.Model,
		BaseCollection = Backbone.Collection,

		attributesToProperties = function() {
			var model = this;
			Object.keys(model.attributes)
				.forEach(function(key, index, array) {
				var value = model.attributes[key],
					// model.id is set in Backbone.Model so we need to stop it from assigning it twice.
					settingId = false,
					setProperty = function(propertyKey) {
						Object.defineProperty(model, propertyKey, {
							get: function() {
								return model.get(key);
							},
							set: function(setValue) {
								if (settingId) {
									settingId = false;
									return;
								};
								if (key === model.idAttribute) settingId = true;
								BaseModel.prototype.set.call(model, key, setValue);
								if (!model.attributes[key]) delete model[key];
							},
							enumerable: true,
							configurable: true
						});
					};
				if (key === 'id' && model.idAttribute !== 'id') return;
				if (key === 'attributes') return;
				if (key === model.idAttribute) {
					setProperty('id');
				};
				setProperty(key);
			});
		};

	var Model = Deboned.Model = BaseModel.extend({
		constructor: function(attributes, options) {
			BaseModel.call(this, attributes, options);
		},
		set: function(attributes, options) {
			var model = this;
			if (_.isObject(model) && model === arguments[0]) arguments[0] = model.attributes;
			var result = BaseModel.prototype.set.apply(model, arguments);
			if (result) attributesToProperties.call(model);
			return result;
		},
	});

	// Needed by Collection.set and other functions copied from Backbone.js
	// Create local references to array methods we'll want to use later.
	var array = [];
	var push = array.push;
	var slice = array.slice;
	var splice = array.splice;
	// Default options for `Collection#set`.
	var setOptions = {
		add: true,
		remove: true,
		merge: true
	};

	var Collection = Deboned.Collection = BaseCollection.extend({
		
		model: Model,
		
		constructor: function(models, options) {
			var collection = new Array();
			_.extend(collection, this);
			collection.models = collection;
			BaseCollection.call(collection, models, options);
			collection.test = 'test';
			return collection;
		},
		
		// Copied from Backbone.js and removed reseting of models
		_reset: function() {
			this.length = 0;
			//this.models = [];
			this._byId = {};
		},

		// Copied from Backbone.js removed length decrease of collection
		remove: function(models, options) {
			models = _.isArray(models) ? models.slice() : [models];
			options || (options = {});
			var i, l, index, model;
			for (i = 0, l = models.length; i < l; i++) {
				model = this.get(models[i]);
				if (!model) continue;
				delete this._byId[model.id];
				delete this._byId[model.cid];
				index = this.indexOf(model);
				this.models.splice(index, 1);
				//this.length--;
				if (!options.silent) {
					options.index = index;
					model.trigger('remove', model, this, options);
				}
				this._removeReference(model);
			}
			return this;
		},

		// Copied from Backbone.js and removed length increase on collection
		set: function(models, options) {
			options = _.defaults({}, options, setOptions);
			if (options.parse) models = this.parse(models, options);
			if (!_.isArray(models)) models = models ? [models] : [];
			var i, l, model, attrs, existing, sort;
			var at = options.at;
			var sortable = this.comparator && (at == null) && options.sort !== false;
			var sortAttr = _.isString(this.comparator) ? this.comparator : null;
			var toAdd = [],
				toRemove = [],
				modelMap = {};
			var add = options.add,
				merge = options.merge,
				remove = options.remove;
			var order = !sortable && add && remove ? [] : false;

			// Turn bare objects into model references, and prevent invalid models
			// from being added.
			for (i = 0, l = models.length; i < l; i++) {
				if (!(model = this._prepareModel(attrs = models[i], options))) continue;

				// If a duplicate is found, prevent it from being added and
				// optionally merge it into the existing model.
				if (existing = this.get(model)) {
					if (remove) modelMap[existing.cid] = true;
					if (merge) {
						attrs = attrs === model ? model.attributes : options._attrs;
						existing.set(attrs, options);
						if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
					}

					// This is a new model, push it to the `toAdd` list.
				} else if (add) {
					toAdd.push(model);

					// Listen to added models' events, and index models for lookup by
					// `id` and by `cid`.
					model.on('all', this._onModelEvent, this);
					this._byId[model.cid] = model;
					if (model.id != null) this._byId[model.id] = model;
				}
				if (order) order.push(existing || model);
				delete options._attrs;
			}

			// Remove nonexistent models if appropriate.
			if (remove) {
				for (i = 0, l = this.length; i < l; ++i) {
					if (!modelMap[(model = this.models[i])
						.cid]) toRemove.push(model);
				}
				if (toRemove.length) this.remove(toRemove, options);
			}

			// See if sorting is needed, update `length` and splice in new models.
			if (toAdd.length || (order && order.length)) {
				if (sortable) sort = true;
				//this.length += toAdd.length;
				if (at != null) {
					splice.apply(this.models, [at, 0].concat(toAdd));
				} else {
					if (order) this.models.length = 0;
					push.apply(this.models, order || toAdd);
				}
			}

			// Silently sort the collection if appropriate.
			if (sort) this.sort({
				silent: true
			});

			if (options.silent) return this;

			// Trigger `add` events.
			for (i = 0, l = toAdd.length; i < l; i++) {
				(model = toAdd[i])
					.trigger('add', model, this, options);
			}

			// Trigger `sort` if the collection was sorted.
			if (sort || (order && order.length)) this.trigger('sort', this, options);
			return this;
		},

		// Copied from Backbone.js using array for sorting instead of model
		sort: function(options) {
			if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
			options || (options = {});

			// Run sort based on type of `comparator`.
			if (_.isString(this.comparator) || this.comparator.length === 1) {
				this.models = this.sortBy(this.comparator, this);
			} else {

				//this.models.sort(_.bind(this.comparator, this));
				array.sort.call(this.models, _.bind(this.comparator, this));
			}

			if (!options.silent) this.trigger('sort', this, options);
			return this;
		},

		// Copied from Backbone.js user array slice
		slice: function() {
			return slice.apply(this, arguments);
		},
	});
})(this);
