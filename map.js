
let guildTerritories = [];
let images = [];
let rectangles = [];
let bounds = [];

let guildPrefs = {
	"Blacklisted": {
		"color": "#323232",
		"prefix": "BLA"
	}
}


function init() {
	const map = L.map('map', {
    	crs: L.CRS.Simple
	});

	map.fitBounds([[0, -4], [6, 2]]);

	for (let a = 0; a < 3; a++) {
		for (let b = 0; b < 3; b++) {
			bounds.push([[a*2,(2*b)-4], [(a+1)*2, (2*(b+1))-4]])
		}	
	}

	for (let bound of bounds) {
		images.push(L.imageOverlay(`./tiles/${bound[0][1]}/${bound[0][0]}.png`, bound));
	}

	for (let image of images) {
		image.addTo(map);
	}


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
		}).then(_ => {
		  	update();
		});
}


function update() {
	fetch("https://api.wynncraft.com/public_api.php?action=territoryList")
	.then(response => response.json())
	.then(json => json["territories"])
	.then(guildTerritories => {
		Object.keys(guildTerritories).forEach(territory => {

		let guild = guildTerritories[territory]["guild"]

		if (!(Object.keys(guildPrefs).includes(guild))) {
			guildPrefs[guild] = {};
			guildPrefs[guild]["color"] = hex();

			fetch(`https://api.wynncraft.com/public_api.php?action=guildStats&command=${guild}`)
				.then(response => response.json())
				.then(json => {guildPrefs[guild]["prefix"] = json["prefix"]})
				.then(_ => {
					rectangles[territory].setStyle({
						color: guildPrefs[guild]["color"],
					})
					rectangles[territory].setTooltipContent(guildPrefs[guild]["prefix"]);
				})
		}	else {
				rectangles[territory].setStyle({
					color: guildPrefs[guild]["color"],
				})
				rectangles[territory].setTooltipContent(guildPrefs[guild]["prefix"]);
			}	
		
	});

	setTimeout(_ => 
		{ console.log("Updating..."); update(); }, 3000);
	})
}

function hex() {
	return "#000000"
	.replace(/0/g, _ => 
		(~~(Math.random()*16)).toString(16));

}