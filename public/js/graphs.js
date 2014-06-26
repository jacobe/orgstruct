var width = 960,
	height = 500,
	ratio = width/height;

var options = { nodeRadius: 5, fontSize: 12 };

var tree = d3.layout.tree()
	.size([width - 100, height - 100]);

$.ajax({
	url: '/graph',
	dataType: 'json',
	success: function(res) {
		renderTree(res);
	}
})

function renderTree(root) {
	var nodes = tree.nodes(root);
	var links = tree.links(nodes);

	var svg = d3.select('#chart').append('svg:svg')
		.attr('width', width).attr('height', height)
		.append('svg:g')
		.attr('transform', 'scale(0.9), translate(220,0)');

	var diagonal = d3.svg.diagonal()
		.projection(function(d)
	        {
	            return [d.y * ratio / 1.1, d.x / ratio];
	        });

	svg.selectAll('path.link')
		.data(links)
		.enter()
		.append('svg:path')
		.attr('class', 'link')
		.attr('d', diagonal);

	var nodeGroup = svg.selectAll('g.node')
	    .data(nodes)
	    .enter()
	    .append("svg:g")
	    .attr("class", "node")
	    .attr('transform', function(d)
	    {
	        return "translate(" + (d.y * ratio / 1.1) + "," + (d.x / ratio) + ")";
	    });

	nodeGroup.append("svg:rect")
	    .attr("class", "node-box")
	    .attr("width", function(d) {
	    	var strlen = d.name.length;
	    	if (d.members && d.members.length) {
	    		d.membersStr = d.members.join(', ');
	    		if (d.membersStr.length > strlen)
	    		{
	    			strlen = d.membersStr.length;
	    		}
	    	}
	    	d.width = 15 + strlen * options.fontSize * 0.6;
	    	return d.width;
	    })
	    .attr("height", function(d) {
	    	return options.fontSize * (d.members ? 3 : 2);
	    })
	    .attr("y", function(d) { return -options.fontSize - 1; })
	    .attr("x", function(d) { return d.children ? -d.width : null; })
	    .attr("rx", options.nodeRadius * 2)
	    .attr("ry", options.nodeRadius * 2)
	    .on('click', function(d) {
	    	var editNode = $('#editNode');
	    	editNode.css({'left': d3.event.x, 'top': d3.event.y}).show();
	    	editNode.find('[name=id]').val(d.id);
	    	editNode.find('[name=role]').val(d.name);
	    	editNode.find('[name=members]').val(d.membersStr);
	    });

	nodeGroup.append("svg:text")
	    .attr("text-anchor", function(d)
	    {
	        return d.children ? "end" : "start";
	    })
	    .attr("dx", function(d)
	    {
	        var gap = 2 * options.nodeRadius;
	        return d.children ? -gap : gap;
	    })
	    .attr("dy", 3)
	    .text(function(d)
	    {
	        return d.name;
	    });


	nodeGroup
		.filter(function(d) {
			return d.membersStr !== undefined;
		})
		.append("svg:text")
	    .attr("text-anchor", function(d)
	    {
	        return d.children ? "end" : "start";
	    })
	    .attr('class', 'members')
	    .attr("dx", function(d)
	    {
	        var gap = 2 * options.nodeRadius;
	        return d.children ? -gap : gap;
	    })
	    .attr("dy", 3 + options.fontSize)
	    .text(function(d, i)
	    {
	    	return d.membersStr;
	    });
}