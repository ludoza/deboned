	________          ___.                                .___
	\______ \    ____ \_ |__    ____    ____    ____    __| _/
	 |    |  \ _/ __ \ | __ \  /  _ \  /    \ _/ __ \  / __ | 
	 |    `   \\  ___/ | \_\ \(  <_> )|   |  \\  ___/ / /_/ | 
	/_______  / \___  >|___  / \____/ |___|  / \___  >\____ | 
	        \/      \/     \/              \/      \/      \/ 
	A Dynamic Attribute to Property Experiment.

# Introduction

After reading [Understanding JavaScript OOP](http://killdream.github.io/2011/10/09/understanding-javascript-oop.html) and playing around with [AngularJS](http://angularjs.org/), I decided to play around with dynamic property generation for Backbone.Model attributes and even mixid in Backbone.Collection into a Array like Object.

# Tests

At the moment Deboned fails two tests `Backbone.Collection: reset` because the test assumes Backbone.Collection.models is a array, and `Backbone.Collection: Reset includes previous models in triggered event.`.

You will see in `test/deboned.js` I override Backbone.Model with Deboned.Model and Backbone.Collection with Deboned.Collection for using the Backbone tests in `test/deboned.html`.
  
# Usage

You will us a Deboned.Model exactly the same way than a Backbone.Model the only difference you can now access the attributes as properties as seen below:
 
	
	> var person = new Deboned.Model({name: 'John', surname: 'Snow'});
	undefined
	> person.name
	"John"
	> person.get('name');
	"John"
	> person.name = 'Snow';
	"Snow"
	> person.get('name');
	"Snow"
	> person.set('surname', 'White');
	Deboned.Model.BaseModel…
	> person.surname
	"White"

Deboned.Collections is trying to mimic a Array so so you can call it like a array, and still use it like a Backbone.Collection:

	> var people = new Deboned.Collection([person, {name: 'Peter', surname: 'Parker'}, {name: 'Joe', surname: 'Soap'}]);
	undefined
	> people
	[Deboned.Model.BaseModel…, Deboned.Model.BaseModel…, Deboned.Model.BaseModel…]
	> people[0].name
	"John"
	> people.pluck('name')
	["John", "Peter", "Joe"]
	> people.at(1)
	Deboned.Model.BaseModel…
	> people.at(1).surname
	"Parker"

# Backbone

Backbone supplies structure to JavaScript-heavy applications by providing models key-value binding and custom events, collections with a rich API of enumerable functions, views with declarative event handling, and connects it all to your existing application over a RESTful JSON interface.

For Docs, License, Tests, pre-packed downloads, and everything else, really, see:
http://backbonejs.org

To suggest a feature, report a bug, or general discussion:
http://github.com/jashkenas/backbone/issues

Backbone is an open-sourced component of DocumentCloud:
https://github.com/documentcloud

Many thanks to our contributors:
http://github.com/jashkenas/backbone/contributors

Special thanks to Robert Kieffer for the original philosophy behind Backbone.
http://github.com/broofa
