var extend = require('extend');

var nodes = [ 'organisation', 'role', 'person' ];
var edges = [
	{ name: 'belongs-in', from: 'role', to: 'organisation' },
	{ name: 'manages', from: 'role', to: 'role' },
	{ name: 'works-in', from: 'person', to: 'organisation'},
	{ name: 'has-role', from: 'person', to: 'role' }
];

var nextId = 0,
	edgesIndex = {},
	nodesIndex = {};

var edgeInstance = function(edgeType, from, to) {
	var self = this;
	self.id = (nextId++);
	edgesIndex[self.id] = self;
	self.type = edgeType;
	self.from = from;
	self.to = to;

	self.toString = function() {
		return from.data.name + ' -> ' + edgeType + ' -> ' + to.data.name;
	}
}

var nodeInstance = function(nodeType, data) {
	var self = this;
	self.id = (nextId++);
	nodesIndex[self.id] = self;
	self.data = data;
	self.edges = [];
	
	self.addEdge = function(edgeType, target) {
		var edge = new edgeInstance(edgeType, self, target);
		self.edges.push(edge);
		target.edges.push(edge);
	}

	self.getRelated = function(edgeType) {
		var related = [];
		self.edges.forEach(function(edge) {
			if (edge.type == edgeType && edge.from == self) {
				related.push(edge.to);
			}
		});
		return related;
	}

	self.getInverslyRelated = function(edgeType) {
		var related = [];
		self.edges.forEach(function(edge) {
			if (edge.type == edgeType && edge.to == self) {
				related.push(edge.from);
			}
		});
		return related;
	}
}

var testCompany = new nodeInstance('organisation', { name: 'TestCompany' });
var role1 = new nodeInstance('role', { name: 'Board of Directors' });
var role2 = new nodeInstance('role', { name: 'CEO' });
var role3 = new nodeInstance('role', { name: 'CTO' });
var role4 = new nodeInstance('role', { name: 'Project Manager' });

role1.addEdge('belongs-in', testCompany);
role2.addEdge('belongs-in', testCompany);
role3.addEdge('belongs-in', testCompany);
role4.addEdge('belongs-in', testCompany);

role1.addEdge('manages', role2);
role1.addEdge('manages', role3);
role2.addEdge('manages', role4);

var person1 = new nodeInstance('person', { name: 'Jimmy'});
var person2 = new nodeInstance('person', { name: 'Ayende'});
var person3 = new nodeInstance('person', { name: 'Bob'});
var person4 = new nodeInstance('person', { name: 'Mark'});

person1.addEdge('works-in', testCompany);
person2.addEdge('works-in', testCompany);
person3.addEdge('works-in', testCompany);
person4.addEdge('works-in', testCompany);

person1.addEdge('has-role', role1);
person1.addEdge('has-role', role2);
person2.addEdge('has-role', role1);
person2.addEdge('has-role', role3);
person3.addEdge('has-role', role4);
person4.addEdge('has-role', role4);

function getTopRoles() {
	var topRoles = testCompany.getInverslyRelated('belongs-in')
						  .filter(function(role) {
								var managedByRole = role.getInverslyRelated('manages');
								return managedByRole.length == 0;
							});
	return topRoles;
}

function printRoleMembers(roleList, depth) {
	if (depth === undefined) depth = 0;
	var spacer = Array(depth).join('  ');
	for (var i = 0; i < roleList.length; i++) {
		var role = roleList[i];
		console.log(spacer + role.data.name);
		role.getInverslyRelated('has-role').forEach(function(member) {
			console.log(spacer + '- ' + member.data.name);
		});
		var childRoles = role.getRelated('manages');
		printRoleMembers(childRoles, depth + 1);
	};
}

function buildHierarchyData(roleList, parent) {
	if (!parent) {
		parent = { children: [] };
	}

	for (var i = 0; i < roleList.length; i++) {
		var role = roleList[i];
		var nodeData = extend({
			id: role.id,
			members: [],
			children: []
		}, role.data);

		parent.children.push(nodeData);
		role.getInverslyRelated('has-role').forEach(function(member) {
			nodeData.members.push(member.data.name);
		});
		buildHierarchyData(role.getRelated('manages'), nodeData);
	};

	return parent;
}

exports.dumpObjects = function() {
	console.log('------- Nodes -------');
	for (var id in nodesIndex) {
		console.log(id, ':', nodesIndex[id].data);
	}
	console.log('------- Edges -------');
	for (var id in edgesIndex) {
		var edge = edgesIndex[id];
		console.log(id, ':', edge.from.id, edge.type, edge.to.id);
	}
}

exports.getHierarchyData = function() {
	return buildHierarchyData(getTopRoles()).children[0];
}

exports.getNodeBy = function(id) {
	return nodesIndex[id];
}

exports.removeNodeById = function(id) {
	var node = nodesIndex[id];
	node.edges.forEach(function(edge) {
		var otherNode = edge.to === node ? edge.from : edge.to;
		otherNode.edges.splice(otherNode.edges.indexOf(edge), 1);
		delete edgesIndex[edge.id];
	});
	delete nodesIndex[id];
}

exports.createNode = function(nodeType, data) { return new nodeInstance(nodeType, data); };