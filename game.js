"use strict";


const color_list = [
	{ name:"red", hex:"F00" },
	{ name:"orange", hex:"F80" },
	{ name:"yellow", hex:"FF0" },
	{ name:"green", hex:"0F0" },
	{ name:"blue", hex:"00F" },
	{ name:"indigo", hex:"408" },
	{ name:"violet", hex:"90D" }
	];



const upgrade_list = {
	
	
	"market-1":{ name:"Talk to people", cost: 1,
		lore:"'So, I've got those gems...'",
		effects:["unlock market","+3 offers","+3 max bundles"],
		result:()=> {
			unlock_market();
			game.market.unlocked = true;
			game.market.timer = market_refresh_time - 11;
			game.market.number_of_offers += 3;
			game.market.max_bundles_per_offer += 3;
			} },
	
	"pocket-1":{ name:"Small Pockets", cost:5,
		lore:"Sewing pocket allows to transport one more gem to the surface",
		effects:["+1 gem/trip"],
		result:()=>{ game.mine.pocket_size += 1; } },
	
	"store-1":{ name:"Dedicated storage", cost:10,
		lore:"A shoe box, on the ground",
		effects:["+5 max gems"],
		result:()=>{ game.storage.max_gems += 5 },
		depends:["pocket-1"]
		},
	
	"minedepth-1":{ name: "Deep Mine", cost:10,
		lore:"Let's dig deeper!",
		effects:["+1 max quality", "+1 s/gem", "+5 s/trip"],
		result:()=>{ game.mine.max_gem_quality+=1; game.mine.mining_time += 1; game.mine.travel_time+= 5; } },
	
	"gem-speed-1":{ name:"Actual pickaxe", cost:10,
		lore:"I can't believe it wasn't one.",
		effects:["-2s/gem"],
		result:()=>{ game.mine.mining_time -= 2 },
		depends:["market-1","pocket-1", "minedepth-1"] },
	
	"trip-speed-1":{ name:"Wheeled transportation system", cost:20,
		lore:"Rollerblades! :)",
		effects:["-5s/trip"],
		result:()=>{ game.mine.travel_time -= 5 },
		depends:["minedepth-1"] },
	
	"market-2":{ name:"Distribute flyers", cost: 50,
		lore:"'The best gems around'",
		effects:["+2 offers","+1 bundle per offers"],
		result:()=> {
			game.market.number_of_offers += 2;
			game.market.max_bundles_per_offer += 1;
			},
		depends:["market-1"] },
	
	"minedepth-2":{ name: "Deeper Mine", cost:50,
		lore:"Just a little more",
		effects:["+1 max quality", "+2 s/gem", "+10 s/trip"],
		result:()=>{ game.mine.max_gem_quality+=1; game.mine.mining_time += 2; game.mine.travel_time+= 10; },
		depends:["minedepth-1"] },
	
	"gem-speed-2":{ name:"Better pickaxe", cost:50,
		lore:"It's better.",
		effects:["-2s/gem"],
		result:()=>{ game.mine.mining_time -= 2 },
		depends:["gem-speed-1", "minedepth-2"] },
	
	"trip-speed-2":{ name:"Wheeled transportation system", cost:100,
		lore:"Repurposed roller coaster",
		effects:["-5s/trip"],
		result:()=>{ game.mine.travel_time -= 5 },
		depends:["trip-speed-1","minedepth-2"] },
	
	"pocket-2":{ name:"Additional pockets", cost:100,
		lore:"Advancement in pocket technology",
		effects:["+1 gem/trip"],
		result:()=>{ game.mine.pocket_size += 1; },
		depends:["pocket-1"] },
	
	"store-2":{ name:"multilevel storage area", cost:200,
		lore:"Two shelves, in a shed",
		effects:["+5 max gems"],
		result:()=>{ game.storage.max_gems += 5 },
		depends:["store-1"]
		},
	
	"gem-speed-3":{ name:"Memorium pickaxe", cost:250,
		lore:"It remembers every strike for maximum efficiency.",
		effects:["-2s/gem"],
		result:()=>{ game.mine.mining_time -= 2 },
		depends:["gem-speed-2", "minedepth-3"] },
	
	"market-3":{ name:"Establish trade partners", cost: 300,
		lore:"'Let's make it a franchise'",
		effects:["+1 offers","+1 bundle per offers"],
		result:()=> {
			game.market.number_of_offers += 1;
			game.market.max_bundles_per_offer += 1;
			},
		depends:["market-2"] },
	
	"pocket-3":{ name:"a handbag", cost:300,
		lore: "You found a bag!",
		effects:["+1 gem/trip"],
		result:()=>{ game.mine.pocket_size += 1; },
		depends:["pocket-2"] },
	
	"trip-speed-3":{ name:"Wheeled transportation system", cost:100,
		lore:"There's wheels on a lift, right?",
		effects:["-5s/trip"],
		result:()=>{ game.mine.travel_time -= 5 },
		depends:["trip-speed-2","minedepth-3"] },
	
	"minedepth-3":{ name: "Moria Mine", cost:500,
		lore:"How deep is too deep ?",
		effects:["+1 max quality", "+3 s/gem", "+15s/trip"],
		result:()=>{ game.mine.max_gem_quality+=1; game.mine.mining_time += 3; game.mine.travel_time+= 15;  },
		depends:["minedepth-2"] },
	
	"store-3":{ name:"Secured Storage", cost:500,
		lore:"There's a lock on the door",
		effects:["+5 max gems"],
		result:()=>{ game.storage.max_gems += 5 },
		depends:["store-2"]
		},
	
	"end":{ name:"This is the end", cost: 100,
		lore:"Thank you for playing.",
		depend:["store-3","minedepth-3","trip-speed-3","pocket-3","market-3"]
		}
	
	}


// reset save when mismatch
const game_save_version = "0.2";

const seconds_per_tick = 0.1;
const market_refresh_time = 10 * 60;
const game_save_interval = 10;

const sale_ratio = 0.1;
const market_offer_ratio = 0.5;

var auto_reset = false;

var save_timer = 0;

var game = {};


// UI :
var ui = {
	mappings: {
		"sale-ratio": () => format( sale_ratio, {precision: 2} ),
		"mining-time": () => game.mine.mining_time,
		"travel-time": () => game.mine.travel_time,
		"pocket-size": () => game.mine.pocket_size,
		"total-time": ()=> total_mining_time(),
		"money-amount": ()=> { return format( game.money, {precision:2} ) },
		"gem-list-size": ()=> Object.keys(game.storage.gems).length,
		"max-gems": ()=> game.storage.max_gems,
		"market-timer": ()=> Math.floor( ( market_refresh_time - game.market.timer ) / 60 ) + ":" + Math.floor( (  market_refresh_time - game.market.timer ) % 60 )
	},
	mapped_values: {}
	}



/*
 * 
 * UTILITY FUNCTIONS
 * 
 */

function pick( l ){
	
	return l[ Math.floor( Math.random() * l.length ) ];
	}

function randint( min = 0, max = 100 ) {
	return Math.round( Math.random() * ( max - min ) ) + min;
	}

function randfloat( min = 0, max = 1 ) {
	return Math.random() * ( max - min ) + min;
	}

function format( value = 0, options = { precision:5, digits_before:0 } ){
	const zero = "0"
	
	let str_value = "" + Math.round( value * Math.pow( 10, options.precision ) ) / Math.pow( 10, options.precision );
	
	
	if( ( options.digits_before - str_value.length ) > 0 ) {
		debugger;
		return zero.repeat( ( options.digits_before - str_value.length ) ) + str_value
		}
	else
		return str_value;
	}

function swap( a, b ){
	let tmp = a;
	a = b;
	b = tmp;
	}

function quicksort( list, comp = ( a, b ) => a < b ) {
	// it's quicksort !
	
	if( list.length <= 1 ) return list;
	
	let pivot = list[0]
	let less = []
	let more = []
	
	for( let index = 1; index < list.length; index++ ) {
		if( comp( pivot, list[ index ] ) ) {
			more.push( list[ index ] );
			}
		else {
			less.push( list[ index ] );
			}
		}
	
	console.log( "!", list, less, pivot, more )
	
	less = quicksort( less, comp );
	more = quicksort( more, comp );
	
	less.push( pivot );
	let result = less.concat( more );
	
	console.log( "§", result )
	
	return result;
	}


function stable_sort( list, comp = ( a, b ) => a < b ) {
	
	if( list.length <= 1 ) return list;
	
	let part_a = stable_sort( list.slice( 0, list.length/2 ) ).reverse();
	let part_b = stable_sort( list.slice( list.length/2 ) ).reverse();
	
	let joined = [];
	
	while( ( part_a.length + part_b.length ) !== 0 ){
		if( part_a.length === 0 ) {
			joined.push( part_b.pop() );
			continue;
			}
		if( part_b.length === 0 ) {
			joined.push( part_a.pop() );
			continue;
			}
		
		if( comp( part_a[ part_a.length-1 ], part_b[ part_b.length-1 ] ) ) {
			joined.push( part_a.pop() );
			}
		else {
			joined.push( part_b.pop() );
			}
		}
	
	return joined;
	}


/* MINING
 * 
 *
 * 
 */


function total_mining_time() {
	return  game.mine.mining_time * game.mine.pocket_size + game.mine.travel_time;
	}

function create_gem(){
	
	game.mine.next_id++;
	
	let gem = {
		color: pick( color_list ),
		quality: Math.random() * game.mine.max_gem_quality,
		selected: false,
		id: game.mine.next_id-1
		};
	
	return gem;
	}


function add_gem_to_UI( gem ) {
	
	let el_gem = document.createElement( "gem" );
	let el_text = document.createElement( "div" );
	let el_quality = document.createElement( "div" );
	
	el_text.innerText = gem.color.name + " gem";
	el_text.style="color:#"+gem.color.hex;
	el_quality.innerText = "q:" + format(gem.quality,{precision:3});
	
	el_gem.onclick = () => {
		if( el_gem.className != "selected" ) {
			el_gem.className = "selected";
			gem.selected = true;
			}
		else {
			el_gem.className = "";
			gem.selected = false;
			}
		};
	
	el_gem.appendChild( el_text );
	el_gem.appendChild( el_quality );
	
	ui.gem_list.appendChild( el_gem );
	
	gem.el = el_gem;
	}


/* SELLING
 * 
 *
 * 
 */

function sell_gem( gem ){
	
	game.money += gem.quality * sale_ratio;
	if( gem.el ) gem.el.parentElement.removeChild( gem.el );
	}

function sell_selected(){
	
	let remove_list = []
	
	for( let id in game.storage.gems ){
		
		let gem = game.storage.gems[ id ];
		
		if( gem.selected ){
			sell_gem( gem )
			remove_list.push( id );
			}
		}
	
	remove_list.forEach( ( id, _ ) => { delete game.storage.gems[id] } )
	
	}

function sell_all(){
	
	for( let id in game.storage.gems ){
		let gem = game.storage.gems[ id ];
		sell_gem( gem );
		}
	
	game.storage.gems = {};
	}


/* UPGRADES
 * 
 *
 * 
 */

function add_upgrade_to_UI( id ){
	
	let up = upgrade_list[ id ]
	
	let el_up = document.createElement( "upgrade" );
	el_up.innerHTML = "<span>" + up.name + "</span><span style='float:right'>" + up.cost + "¤</span><br/><info>" + up.lore + "<hr>" + up.effects.join("<br/>") + "</info>";
	
	el_up.onclick = () => { buy_upgrade( id ); };
	
	ui.upgrade_list.appendChild( el_up );
	
	up.el = el_up;
	}

function buy_upgrade( id ){
	
	let up = upgrade_list[ id ];
	
	if( ( up === undefined ) || ( up === null ) ){
		alert( "Wrong upgrade id :" + id );
		return;
		}
	
	if( id in game.upgrades.bought ) {
		alert( "already brougth upgrade !?" );
		return;
		}
		
		
	if( up.cost < game.money ) {
		
		game.money -= up.cost;
		up.el.parentElement.removeChild( up.el );
		up.result();
		
		game.upgrades.bought.push( id );
		
		for( let upgrade_id in upgrade_list ){
			
			if( upgrade_id in game.upgrades.bought ) continue;
			
			let candidate = upgrade_list[ upgrade_id ];
			
			if( !candidate.depends ) continue;
			
			if( !candidate.depends.includes( id ) ) continue;
			
			// has it been unlocked ?
			if( candidate.depends.every( ( did ) => game.upgrades.bought.includes( did ) ) ) {
				
				// yes :
				
				console.log( game.upgrades.unlocked, "+", upgrade_id )
				
				game.upgrades.unlocked.push( upgrade_id );
				
				console.log( "=", game.upgrades.unlocked )
				add_upgrade_to_UI( upgrade_id )
				
				}
			}
		
		let upgrade_index = game.upgrades.unlocked.indexOf( id );
		if( upgrade_index > -1 )
			game.upgrades.unlocked.splice( upgrade_index, 1 );
		
		return true;
		}
	else {
		return false;
		}
	
	
	}





/* MARKET
 * 
 *
 * 
 */


function unlock_market() {
	ui.market_section.style="";
	}

function create_offer(){
	
	let generator = () => { return{ count: pick( [1,2,3] ), color: pick( color_list ) } };
	
	
	let value = 0;
	
	let list = [];
	
	let counter = randint( 1, game.market.max_bundles_per_offer )
	
	for( let i=0; i<counter; i++){
		
		let candidate = generator();
		
		let duplicate = list.find( ( v ) => ( v.color === candidate.color ) );
		
		if( duplicate != undefined ) duplicate.count += candidate.count
		else list.push( candidate )
		
		}
	
	let color_sort = ( i1, i2 )=>i1.color.hex <= i2.color.hex;
	
	list = stable_sort( list, color_sort );
	
	
	let count_sum = list.reduce( ( sum, curr ) => sum + curr.count, 0 );
	let gain = Math.ceil( count_sum * randfloat( market_offer_ratio, market_offer_ratio + sale_ratio ) );
	
	game.market.next_id++;
	return { req: list, rep:gain, id: game.market.next_id-1 }
	};


function add_offer_to_UI( offer ) {
	
	let el_offer = document.createElement("market-offer");
	
	el_offer.onclick = ()=>validate_offer( offer.id );
	
	offer.req.forEach( ( req ) => el_offer.innerHTML += "<div>" + req.count + "× <span style=\"color:#" + req.color.hex + "\">" + req.color.name + " gem" + ( req.count > 1 && "s" || " " ) + "</span></div>" );
	
	el_offer.innerHTML += "<hr/><div>receive " + offer.rep + "¤</div>";
	
	offer.el = el_offer;
	
	ui.market.appendChild( el_offer );
	}


function refesh_market(){
	
	for( let id in game.market.offers ) {
		let off = game.market.offers[ id ];
		off.el.parentElement.removeChild( off.el );
		}
	
	game.market.offers = {};
	
	for( let i=0; i<game.market.number_of_offers; i++ ){
		let offer = create_offer();
		game.market.offers[ offer.id ] = offer;
		add_offer_to_UI( offer );
		}
	}


function validate_offer( id ) {
	
	let offer = game.market.offers[ id ];
	
	let selected_gems_ids = [];
	for( let id in game.storage.gems ){
		if( game.storage.gems[ id ].selected )
			selected_gems_ids.push( id );
		}
	
	
	let ids_by_color_name = {}
	
	selected_gems_ids.forEach( ( id, _ ) => {
		let color_name = game.storage.gems[ id ].color.name;
		if( !( color_name in ids_by_color_name ) ) ids_by_color_name[ color_name ] = []
		ids_by_color_name[ color_name ].push( id );
		} )
	
	let condition_satisfied = true;
	offer.req.forEach( ( req ) => {
		if( ( (  req.color.name in ids_by_color_name) && ids_by_color_name[ req.color.name ].length || 0 ) < req.count ) condition_satisfied = false; } );
	
	if( !condition_satisfied ) return
	
	/* Easy modo *
	offer.req.forEach( ( req ) => {
		for( let c=0; c < req.count; c++ ) {
			let gem_id = ids_by_color_name[ req.color.name ][ c ]
			let gem = game.storage.gems[ gem_id ];
			gem.el.parentElement.removeChild( gem.el );
			delete game.storage.gems[ gem_id ];
			}
		} );
	/**/
	
	for( let gem_id in game.storage.gems ){
		let gem = game.storage.gems[ gem_id ];
		if( gem.selected ){
			gem.el.parentElement.removeChild( gem.el );
			delete game.storage.gems[ gem_id ];
			}
		}
	
	game.money += offer.rep;
	
	offer.el.parentElement.removeChild( offer.el );
	delete game.market.offers[ id ];
	}


/* GAME STUFF
 * 
 * 
 * 
 */


function save_exists() {
	return "savegame" in localStorage
	}

function save_version() {
	return localStorage.getItem( "version" );
}

function save_game( game ) {
	
	console.log( game.upgrades );
	
	let stripped_save = {
		mine: game.mine,
		storage: {
			max_gems: game.storage.max_gems,
			gems: [] // we don't need to callback so we don't need id
			},
		market: {
			unlocked: game.market.unlocked,
			number_of_offers: game.market.number_of_offers,
			max_bundles_per_offer: game.market.max_bundles_per_offer,
			timer: game.market.timer,
			offers: [] // same
			},
		upgrades: game.upgrades,
		money: game.money
		};
	
	// recount gems :
	for( let key in game.storage.gems ){
		let gem = game.storage.gems[ key ];
		stripped_save.storage.gems.push( {
			color: gem.color,
			quality: gem.quality
			} );
		}
	
	// recount offers :
	for( let key in game.market.offers ){
		let offer = game.market.offers[ key ];
		stripped_save.market.offers.push( {
			req: offer.req,
			rep: offer.rep
			} );
		}
	
	
	console.log( stripped_save )
	
	// commit save
	
	localStorage.setItem( "savegame", JSON.stringify( stripped_save ) );
	localStorage.setItem( "version", game_save_version );
	localStorage.setItem( "infotab", ui.info_tab.className != "" );
	localStorage.setItem( "optionstab", ui.options_tab.className != "" );
	
	}

function load_game() {
	
	reset_UI();
	
	let save = JSON.parse( localStorage.getItem("savegame") );
	
	
	
	let array = []
	save.storage.gems.prototype = array.prototype;
	save.market.offers.prototype = array.prototype;
	save.upgrades.unlocked.prototype = array.prototype;
	save.upgrades.bought.prototype = array.prototype;
	
	
	// expand gems
	let gem_id = 0;
	let gem_store = {};
	
	save.storage.gems.forEach( ( gem ) => {
		gem_id++;
		gem.id = gem_id-1;
		add_gem_to_UI( gem );
		gem_store[ gem_id-1 ] = gem;
		} );
	
	save.storage.next_id =  gem_id;
	save.storage.gems = gem_store;
	
	
	// expand offers :
	let offer_id = 0;
	let offer_store = {};
	
	save.market.offers.forEach( ( offer ) => {
		offer_id++;
		offer.id = offer_id-1;
		add_offer_to_UI( offer );
		offer_store[ offer_id-1 ] = offer;
		} );
	
	save.market.next_id =  offer_id;
	save.market.offers = offer_store;
	
	
	// expand techs
	console.log( save.upgrades );
	
	save.upgrades.unlocked.forEach( ( tech ) => {
		add_upgrade_to_UI( tech )
		} );
	
	
	// ui bits
	
	ui.info_tab.className = localStorage["infotab"] && "" || "minimized";
	ui.options_tab.className = localStorage["optionstab"] && "" || "minimized";
	
	return save;
	}

function new_save() {
	let tmp = {
		mine: {
			timer: 0,
			next_id: 0,
			max_gem_quality: 2,
			mining_time: 10,
			travel_time: 20,
			pocket_size: 1
			},
		storage: {
			next_id: 0,
			gems: {},
			max_gems: 10
			},
		market: {
			unlocked: false,
			next_id: 0,
			offers: {},
			number_of_offers: 0,
			max_bundles_per_offer: 0,
			timer: 0
			},
		upgrades:{
			unlocked: [],
			bought: []
			},
		
		money: 0
		};
	
	for( let key in upgrade_list ){
		if( ( upgrade_list[ key ].depends && upgrade_list[ key ].depends.length || 0 ) === 0 ) {
			tmp.upgrades.unlocked.push( key );
			}
		}
	
	return tmp
	}

function reset_game() {
	
	game = new_save();
	
	reset_UI();
	
	game.upgrades.unlocked.forEach( ( up ) => add_upgrade_to_UI( up ) );
	
	}

function reset_UI() {
	
	ui.market_section.style="visibility: hidden;";
	
	ui.gem_list.innerHTML = ""
	ui.upgrade_list.innerHTML = ""
	ui.market.innerHTML = ""
	}




function loop() {
	
	game.mine.timer += seconds_per_tick;
	
	if( game.mine.timer > total_mining_time() ){
		game.mine.timer -= total_mining_time();
		
		for( let i=0; i< game.mine.pocket_size; i++ ) {
			let gem = create_gem();
			
			if( Object.keys(game.storage.gems).length == game.storage.max_gems ){
				sell_gem( gem );
				continue;
				}
			
			game.storage.gems[ gem.id ] = gem;
			add_gem_to_UI( gem );
			}
		
		}
	
	if( game.market.unlocked ) {
		game.market.timer += seconds_per_tick;
		if( game.market.timer > market_refresh_time ){
			game.market.timer -= market_refresh_time;
			refesh_market();
			}
		}
	
	
	save_timer += seconds_per_tick;
	if( save_timer > game_save_interval ){
		save_timer -= game_save_interval;
		save_game( game );
		}
	
	
	
	
	ui.mining_progress.value = ( game.mine.timer / total_mining_time() );
	
	if( ui.autosell.checked ) sell_selected();
	
	for( name in ui.mapped_values ){
		
		let value = ui.mappings[ name ];
		
		if( typeof value ===  typeof function () {} ){
			value = value();
			}
			else console.log( value );
		
		ui.mapped_values[ name ].forEach( ( el, _ ) => { el.innerText = value; } );
		}
	
	}

/* stable sort test :
console.log( stable_sort( [ [ 3,1 ], [ 2,2 ], [ 4,3 ], [ 1,4 ], [ 2,5 ], [ 3,6 ], [ 1,7 ], [ 4,8 ] ] ), ( a, b ) => a[0] < b[0] );
/**/

function init() {
	
	ui.mining_progress = document.getElementById( "mining-progress" );
	ui.gem_list = document.getElementById("mining-result");
	ui.autosell = document.getElementById("autosell-toggle");
	ui.upgrade_list = document.getElementById("upgrade-list");
	
	ui.market_section = document.getElementById("market");
	ui.market = document.getElementById( "market-list" );
	ui.market_progress = document.getElementById( "market-progress" );
	
	ui.info_tab = document.getElementById( "info-section" );
	ui.options_tab = document.getElementById( "options-section" );
	
	for( let name in ui.mappings ){
		ui.mapped_values[ name ] = Array.from( document.getElementsByClassName( name ) );
		// console.log( name, ui.mapped_values[ name ] );
		}
	
	
	if( ( !auto_reset ) && save_exists() ){
		
		console.log( "save found, loading." );
		
		if( save_version() == game_save_version ) {
			game = load_game();
			
			// needs a better place
			if( game.market.unlocked ) unlock_market();
			}
		else {
			alert( "Game version mismatch.\nreseting\nSorry for the inconvenience." );
			reset_game();
			}
		
		}
	else {
		console.log( "no save." );
		reset_game();
		}
	
	
	window.setInterval( loop, 1000 * seconds_per_tick );
	}



