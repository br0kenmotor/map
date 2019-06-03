function run() {

let guildTerritories = [];
let images = [];
let rectangles = [];
let bounds = [];
let guilds = [];
let colors = 
{
	"Blacklisted": "#323232",
	"Paladins United": "#fff0f5",
	"Imperial":  "#990033",
	"Avicia":  "#1010fe",
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
				{color: "#ff7800", weight: 2})

	    	rectangle.bindTooltip("", {
		   			className: "guild-name", 
		   			permanent: true, 
		   			direction:"center"}).openTooltip();

	    	rectangle.bindPopup("Loading...").openPopup();

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
	.then(territories => {
		guildTerritories = territories;
		render();
	setTimeout(_ => 
		{ console.log("Updating..."); update(); }, 1000);
	})
}

function render() {
	Object.keys(guildTerritories).forEach(territory => {
			let guild = guildTerritories[territory]["guild"];

			if (!(Object.keys(colors).includes(guild))) {
				colors[guild] = hex();
			}

			rectangles[territory].setStyle({
				color: colors[guild],
			})


			if (!(Object.keys(guilds).includes(guild))) {

				fetch(`https://api.wynncraft.com/public_api.php?action=guildStats&command=${guild}`)
					.then(response => response.json())
					.then(json => {
						guilds[guild] = json
					})
					.then(_ => {
					    setContent(guild, territory);	
					});

			} else {
				rectangles[territory].setStyle({
					color: colors[guild],
				})

				setContent(guild, territory);
			}	
					
	});
}

map.on('zoomend', _ => {
	render();
})

function hex() {
	return "#000000"
	.replace(/0/g, _ => 
		(~~(Math.random()*16)).toString(16));
}

function setContent(guild, territory){
	if (map.getZoom() > 7) {
		rectangles[territory].setTooltipContent(
			`<div style='text-shadow:-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black,
			0px 0px 1px ${colors[guild]},
			0px 0px 2px ${colors[guild]},
			0px 0px 3px ${colors[guild]},
			0px 0px 4px ${colors[guild]},
			0px 0px 5px ${colors[guild]},
			0px 0px 6px ${colors[guild]} !important;'><div class='identifier'>` +
			guilds[guild]["prefix"]
			+ "</div><div class='territory'>" 
			+ territory 
			+ "</div></div>");
	} else {
		rectangles[territory].setTooltipContent(" ")
	}

	let diff = (new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})) - new Date(Date.parse(guildTerritories[territory]["acquired"])));

	let day, hour, minute, seconds;
    seconds = Math.floor(diff / 1000);
    minute = Math.floor(seconds / 60);
    seconds = seconds % 60;
    hour = Math.floor(minute / 60);
    minute = minute % 60;
    day = Math.floor(hour / 24);
    hour = hour % 24;

    time = {"day": day, "hour": hour, "minute": minute, "second": seconds}

    str = ""

    for (let unit of Object.keys(time)) {
    	if (time[unit] > 0 || unit === "second") {
    		if (unit === "second" && ((Object.values(time)).filter((_, i) => i != 4)).filter(v => v > 0).length) {
    			str += " and "
    		}

    		str += time[unit] + " " + unit;

    		if (time[unit] !== 1) {
    			str += "s"
    		}
    		if (unit !== "second" && ((Object.values(time)).filter(v => v > 0).length > 2)) {
    			str += ", "
    		} 
    	}
    }

	rectangles[territory].setPopupContent(`<div id="info-popup">
		<div><b>${territory}</b></div>
		<div><a target="_blank" href="https://www.wynndata.tk/stats/guild/${guild}">${guild}</a> [${guilds[guild]["level"]}]</div>
		<div>Aqcuired on ${guildTerritories[territory]["acquired"]}</div>
		<div>Held for ${str}.</div>
		</div>`);	
	}

}
