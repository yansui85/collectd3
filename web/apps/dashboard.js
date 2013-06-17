/*jshint globalstrict:true, jquery:true, browser:true */
/*global d3*/
'use strict';

function DashboardCtrl($s, $http, $location, statusOf) {

   var tab = '',
       minWidth = 800; // minimal width to maintain default cell size
   
   $s.switchCard = function (name) {
      tab = name;
   };
   
   $s.isCard = function (name) {
      var current = tab;
      if (current === '' && name === "load") {
         return true;
      }
      return current === name;
   }
   
   $s.statusOf = statusOf;
   
   function render() {

      var cellSize = 70; // default size when space is adequate
          
      if ($("#heatmap").width() < minWidth) { 
         cellSize = Math.ceil($("#heatmap").width() / 10); 
      } 
      
      var width = $("#heatmap").width() - cellSize, //leave padding space for one cell
          nColumns = Math.floor(width / cellSize); //number of columns
      
      var colorScale = d3.scale.quantize()
         .domain([0, 1])
         .range(d3.range(10).map(function(d) { return "cell" + d; }));

      var tooltip = d3.select("#heatmap")
         .append("div")
         .attr("class", "mytooltip")
         .style("position", "absolute")
         .style("z-index", "10")
         .style("visibility", "hidden");

      d3.select("#heatmap").select("svg").remove(); // clear content area

      var svg = d3.select("#heatmap")
         .append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .append("g")
          .attr("class", "heatmap");
//        .attr("filter", "url(#effectFilter)")

      var rect = svg.selectAll("rect")
          .data($s.load && $s.load.heatmap || [])
          .enter().append("rect")
          .attr("class", function(d) { return colorScale(d[1]); }) 
          .attr("width", cellSize - 2) 
          .attr("height", cellSize - 2)
          .attr("x", function(d, i) { return (i % nColumns) * cellSize; })
          .attr("y", function(d, i) { return (Math.floor(i / nColumns)) * cellSize; })
          .attr("rx", 5)
          .attr("ry", 5)
          .on("click", function (d) { $location.path('/details/' + d[0]); $s.$apply(); })
          .on("mouseover", function(d) { 
             return tooltip
                .text("Host ID: " + d[0] + " | Load Average: " + d[1].toFixed(2))
                .style("visibility", "visible"); 
          })
//          .on("mouseover", function(d) { return tooltip.style("visibility", "visible").append("p").text("Host ID: " + d[0]).append("p").text("CPU Usage: " + Math.round(100 * d[1]) + " %"); })
          .on("mousemove", function() { 
             return tooltip
                .style("top", (event.pageY-10)+"px")
                .style("left",(event.pageX+10)+"px");
          })
          .on("mouseout", function() { return tooltip.style("visibility", "hidden"); });      
   }

   $s.fetch = function(){
      var t1 = new Date();
      $s.context.status = "Loading...";

      $http.get("/data/load")
         .success(function(res) {
            $s.load = res;
            $s.context.status = "Done in " + (new Date() - t1) + " ms";
            render();
         }).error(function(err) {
            $s.load = {};
            $s.context.status = "Error getting data. Check the log.";
            render();
         });
         
      $http.get("/data/aggregate")
         .success(function(res) {
            $s.aggregate = res;
            $s.status = "Done in " + (new Date() - t1) + " ms";
            render();
         }).error(function(err) {
            $s.aggregate = {};
            $s.context.status = "Error getting data. Check the log.";
            render();
         });
   };
   
   $s.fetch();
   
   $(window).resize(function() {
      render();
   }); 

} DashboardCtrl.$inject = ['$scope', '$http', '$location', 'statusOf'];
