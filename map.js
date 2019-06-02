
let guildTerritories = [];



var map = L.map('map', {
    crs: L.CRS.Simple
});

map.fitBounds([[0, -4], [6, 2]]);

let bounds = [];
for (let a = 0; a < 3; a++) {
	for (let b = 0; b < 3; b++) {
		bounds.push([[a*2,(2*b)-4], [(a+1)*2, (2*(b+1))-4]])
	}	
}

let images = [];
for (let bound of bounds) {
	images.push(L.imageOverlay(`./tiles/${bound[0][1]}/${bound[0][0]}.png`, bound));
}

for (let image of images) {
	image.addTo(map);
}

let rectangles = [];

fetch('https://raw.githubusercontent.com/DevScyu/Wynn/master/territories.json')
  .then(response =>
    response.json())
  .then(json => {
    for (let territory of json) {
    	let bounds = [territory["start"].split(','), territory["end"].split(',')];
    	
    	for (let i in bounds) {	
    		bounds[i][0] *= .001
    		bounds[i][1] *= .001

    	}

    	bounds[0].reverse();
    	bounds[1].reverse();


    	bounds[0][0] *= -1;
    	bounds[1][0] *= -1;

    	let rectangle = L.rectangle(bounds, 
		{color: "#ff7800", weight: 1}).bindTooltip("BLA",
   		{className: "guild-name", permanent: true, direction:"center"}
  		).openTooltip()

    	rectangles[territory["name"]] = rectangle;
  		rectangle.addTo(map);
   }
  });

update();

function update() {
	fetch("https://api.wynncraft.com/public_api.php?action=territoryList")
	.then(response => response.json())
	.then(json => json["territories"])
	.then(guildTerritories => {
		Object.keys(guildTerritories).forEach(territory => {
		rectangles[territory].setTooltipContent(guildTerritories[territory]["guild"]);
	});

	setTimeout(_ => 
		{ console.log("Updating..."); update(); }, 3000);
	})
}