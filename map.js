function run() {

let guildTerritories = [];
let images = [];
let rectangles = [];
let bounds = [];
let guildPrefs = 
{
	"Blacklisted": {
		"color": "#323232",
		"prefix": "BLA"
	},
	"Paladins United": {
		"color": "#fff0f5",
		"prefix": "PUN"
	},
	"Imperial": {
		"color": "#990033",
		"prefix": "Imp"
	},
	"Avicia": {
		"color": "#1010fe",
		"prefix": "AVO"
	}
}

try {
	const visited = localStorage.getItem("visited");
	if (!visited) {
	    alert("If you would like to add your guild's preferences (color and prefix), please contact brokenmotor in-game or through discord at regale#5688. Enjoy!");
	    localStorage.setItem("visited", true);
	}
} catch (e) {
	console.error(e);
}	


const map = L.map("map", {    	
	crs: L.CRS.Simple,
	minZoom: 6,
    maxZoom: 10
});	

map.fitBounds([[0, -4], [6, 2]]);

for (let a = 0; a < 3; a++) {
	for (let b = 0; b < 3; b++) {
		bounds.push([[a*2,(2*b)-4], [(a+1)*2, (2*(b+1))-4]])
	}	
}

for (let bound of bounds) {
	images.push(L.imageOverlay(`./public/tiles/${bound[0][1]}/${bound[0][0]}.png`, 
		bound, {
			attribution: "<a href='https://wynndata.tk/map'>WYNNDATA</a>"
			}
		));
}

for (let image of images) {
	image.addTo(map);
}


fetch("https://raw.githubusercontent.com/DevScyu/Wynn/master/territories.json")
	    .then(response =>
	    response.json())
	    .then(json => {
		   for (let territory of json) {
		    let bounds = [territory["start"].split(","), territory["end"].split(",")];

		    for (let i in bounds) {	
		    	bounds[i][0] *= .001
		   		bounds[i][1] *= .001

		   	}

	    	bounds[0].reverse();
	    	bounds[1].reverse();

	    	bounds[0][0] *= -1;
	    	bounds[1][0] *= -1;
	    	let rectangle = L.rectangle(bounds, 
				{color: "#ff7800", weight: 2}).bindTooltip("",
		   		{className: "guild-name", permanent: true, direction:"center"}).openTooltip();

	    	rectangles[territory["name"]] = rectangle;
	  		rectangle.addTo(map);
	    	}	
		}).then(_ => {
		  	update();
		});



function update() {
	fetch("https://api.wynncraft.com/public_api.php?action=territoryList")
	.then(response => response.json())
	.then(json => json["territories"])
	.then(guildTerritories => {
		Object.keys(guildTerritories).forEach(territory => {

			let guild = guildTerritories[territory]["guild"];

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
					})
			} else {
				rectangles[territory].setStyle({
					color: guildPrefs[guild]["color"],
				})
			}	
			if (map.getZoom() > 7) {
				rectangles[territory].setTooltipContent(
					`<div style='text-shadow:-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black,
					0px 0px 1px ${guildPrefs[guild]["color"]},
					0px 0px 2px ${guildPrefs[guild]["color"]},
					0px 0px 3px ${guildPrefs[guild]["color"]},
					0px 0px 4px ${guildPrefs[guild]["color"]},
					0px 0px 5px ${guildPrefs[guild]["color"]},
					0px 0px 6px ${guildPrefs[guild]["color"]} !important;'><div class='identifier'>` +
					guildPrefs[guild]["prefix"] 
					+ "</div><div class='territory'>" 
					+ territory 
					+ "</div></div>"
					);
			} else {
				rectangles[territory].setTooltipContent(" ");
			}
		
	});

	setTimeout(_ => 
		{ console.log("Updating..."); update(); }, 1000);
	})
}

function hex() {
	return "#000000"
	.replace(/0/g, _ => 
		(~~(Math.random()*16)).toString(16));
}


}
