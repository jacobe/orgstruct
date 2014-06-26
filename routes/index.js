var path = require("path");
var cfg = require(path.join(__dirname, '..' , 'configuration', "config"));
var graphData = require(path.join(__dirname, '..', 'graphData'));

exports.index = function(req, res) {
  res.render('index', { title: cfg.application.title});
};

exports.graph = function(req, res) {
	var root = graphData.getHierarchyData();
	res.send(root, 200);
};

exports.save = function(req, res) {
	if (req.body.save !== undefined) {
		console.log('- Saving', req.body);
		var role = graphData.getNodeBy(req.body.id);
		role.data.name = req.body.role;
	}
	else if (req.body.remove !== undefined) {
		console.log('- Removing', req.body);
		graphData.removeNodeById(req.body.id);
	}
	else if (req.body.add !== undefined) {
		console.log('- Adding', req.body);
		var parent = graphData.getNodeBy(req.body.id);
		var role = graphData.createNode('role', { name: req.body.role });
		parent.addEdge('manages', role);
	}

	graphData.dumpObjects();
	res.redirect('/');
};