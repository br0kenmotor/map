function toggle() {
  if (document.getElementById("menu").style.display === "block") {
  	 document.getElementById("menu").style.display = "none";
  } else {
  	document.getElementById("menu").style.display = "block";
  }
}


function run() {

	// initializing map
	let bounds = [];
	let images = [];

	const map = L.map("map", {  
		crs: L.CRS.Simple,
		minZoom: 6,
	    maxZoom: 10,
	    zoomControl: false,
	    zoom: 8
	});	

	L.control.zoom({
    	position:'topright'
	}).addTo(map);

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

	//initializing variables
	let guildTerritories = [];
	let rectangles = [];
	let guilds = [];
	let leaderboard = [];
	let prevZoom = 7;
	let refresh = 5;
	let colors = 
	{
		"Blacklisted": "#323232",
		"Paladins United": "#fff0f5",
		"Imperial":  "#990033",
		"Avicia":  "#1010fe",
		"BuildCraftia": "#09EA2B",
		"Caeruleum Order": "#012142",
		"The Simple Ones": "#0fcad6",
		"Kingdom Foxes": "#ff8800",
		"Emorians": "#1b5ff1" 
	}

	//grabbing options elements
	let slider = document.getElementById("rate-option");
	let output = document.getElementById("rate-display");
	output.innerHTML = slider.value; 

	let checkboxTerritory = document.getElementById("territory-toggle");
	let checkboxNames = document.getElementById("territory-names");
	let checkboxGuilds = document.getElementById("territory-guilds"); 


	let territoryToggle = true;
	let territoryNames = false;
	let guildNames = true;

	slider.oninput = function() {
		refresh = this.value;
  		output.innerHTML = this.value;
	}

	checkboxTerritory.oninput = function() {
		territoryToggle = this.checked;
		
		checkboxNames.checked = this.checked;
		checkboxGuilds.checked = this.checked;
		territoryNames = this.checked;
		guildNames = this.checked;
		
		render();
	}

	checkboxNames.oninput = function() {
		territoryNames = this.checked
		render();
	}

	checkboxGuilds.oninput = function() {
		guildNames = this.checked
		render();
	}

	//sending alert on first visit
	try {
		const visited = localStorage.getItem("visited");
		if (!visited) {
		    alert("If you would like to add your guild's preferences (color and prefix), please contact brokenmotor in-game or through discord at regale#5688. Press any key for the menu. Enjoy!");
		    localStorage.setItem("visited", true);
		}
	} catch (e) {
		console.error(e);
	}	

	//setting up territories
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
					{color: "rgb(0, 0, 0, 0)", weight: 2})

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


	//calling wynn API every refresh seconds to check territory ownership
	function update() {
		fetch("https://api.wynncraft.com/public_api.php?action=territoryList")
		.then(response => response.json())
		.then(json => json["territories"])
		.then(territories => {
			guildTerritories = territories;
			render();
		setTimeout(_ => 
			{ console.log("Updating..."); update(); }, (refresh * 1000));
		})
	}

	//rendering territories based on territory location, ownership, and settings. also updates leaderboard div
	function render() {
			Object.keys(guildTerritories).forEach(territory => {
				let guild = guildTerritories[territory]["guild"];

				if (!(Object.keys(colors).includes(guild))) {
					colors[guild] = "#000000".replace(/0/g, _ => (~~(Math.random()*16)).toString(16));;
				}

				if (!(Object.keys(guilds).includes(guild))) {

					fetch(`https://api.wynncraft.com/public_api.php?action=guildStats&command=${guild}`)
						.then(response => response.json())
						.then(json => {
							guilds[guild] = json;
						})
						.then(_ => {
						    setContent(guild, territory);	

							if (territoryToggle) {
								rectangles[territory].setStyle({
								    color: colors[guild],
					  			})
							} else {
								rectangles[territory].setStyle({
									color: 'rgba(0,0,0,0)'
								})
							}
					
						});

				} else {
					if (territoryToggle) {
						rectangles[territory].setStyle({
						    color: colors[guild],
				  	  })
					} else {
						rectangles[territory].setStyle({
							color: 'rgba(0,0,0,0)'
						})
					}

					setContent(guild, territory);
				}
			});
		updateLeaderboard();	
	}

	//on zoom end, update map based on zoom
	map.on('zoomend', _ => {
		if ((map.getZoom() >= 7 && prevZoom <= 7) || (map.getZoom() <= 7 && prevZoom >= 7)) {
			for (let territory of Object.keys(rectangles)) {
				setContent(guildTerritories[territory]["guild"], territory);
			}
		}

		prevZoom = map.getZoom();
	})

	//sets tooltip and popup content
	function setContent(guild, territory){
		let tooltip = "<div>"
		if (guildNames) tooltip += 
				`<div style='text-shadow:-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black,
				0px 0px 1px ${colors[guild]},
				0px 0px 2px ${colors[guild]},
				0px 0px 3px ${colors[guild]},
				0px 0px 4px ${colors[guild]},
				0px 0px 5px ${colors[guild]},
				0px 0px 6px ${colors[guild]} !important;'><div class='identifier'>` +
				guilds[guild]["prefix"] + "</div>";

		if (territoryNames) tooltip += "<div class='territory'>" 
				+ territory 
				+ "</div>";

		tooltip += "</div>";
		
		if (map.getZoom() > 7) {
			rectangles[territory].setTooltipContent(tooltip);
		} else {
			rectangles[territory].setTooltipContent(" ");
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

	function updateLeaderboard() {
			let guildsSorted = (Object.keys(guilds).filter(guild => guilds[guild]["territories"] > 0)).sort((a, b) => (guilds[b]["territories"] - guilds[a]["territories"]));
			for (let key of guildsSorted) {
				leaderboard[key] = guilds[key];
			}

			let leaderDiv = document.getElementById("guild-leaderboard");
			leaderDiv.innerHTML = " ";
			if (Object.keys(leaderboard).length < 1) leaderDiv.innerHTML = "Loading ..."
			for (let guild of Object.keys(leaderboard)) {
				let p = document.createElement("p");
				p.classList.add("leaderboard-item");
				p.classList.add("menu-text");
				p.classList.add("guild-name");

				let span = document.createElement("span");
				span.appendChild(document.createTextNode("●"));
				span.style.color = colors[guild];
				p.appendChild(span);

				let a = document.createElement("a");
				a.appendChild(document.createTextNode(" " + guild))
				a.href = `https://www.wynndata.tk/stats/guild/${guild}`
				p.appendChild(a);

				p.appendChild(document.createTextNode(" [" + leaderboard[guild]["territories"] + "]"))
				leaderDiv.appendChild(p);	
			}
	}

	document.getElementById("info").style.opacity = 0;

	setTimeout(_ => { 
		updateLeaderboard()
		document.getElementById("info").style.display = "none";
	}, (2000));

}
