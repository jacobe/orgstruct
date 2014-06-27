var neo4j = require('neo4j');

var db = new neo4j.GraphDatabase('http://localhost:7474');

function getNodeData(nodeObj) {
	return nodeObj._data.data;
}

function getRolesAndMembers(callback) {
	db.query([
		'MATCH (role:Role)--(:Organization)<-[rel:WORKS_IN]-(p:Person)',
		'OPTIONAL MATCH (role)<-[:MANAGES]-(parent:Role)',
		'WITH role, parent, p, role.id IN rel.roles AS hasRole',
		'WHERE hasRole',
		'RETURN role, collect(parent.id) as parents, collect(p) AS members'
		].join('\n'), {}, function(err, results) {
			if (err) callback(err);
			var members = results.map(function(res) {
				return {
					role: getNodeData(res['role']),
					parents: res['parents'],
					members: res['members'].map(getNodeData)
				};
			});

			callback(undefined, members);
		});
}

exports.dumpObjects = function() { }

exports.getHierarchyData = function getHierarchyData(callback) {	
	getRolesAndMembers(function(err, results) {

		console.log(results);

		function convertNodesRecursive(parent) {
			var children = results
				.filter(function(res) {
					return (parent === undefined
						? !res.parents.length
						: res.parents.indexOf(parent.role.id) >= 0);
				});
			children.forEach(function(child) {
					child.children = convertNodesRecursive(child);
				});
			return children;
		}

		var hierarchy = convertNodesRecursive();
		callback(hierarchy[0]);
	});
};