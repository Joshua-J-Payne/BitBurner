//Commonly used constants. 
export const DEBUG = false

export const SCRIPTS = Object.freeze({
	HACK: "/lib/hack.js",
	WEAKEN: "/lib/weaken.js",
	GROW: "/lib/grow.js",
	SHARE: "/lib/share.js"
});

//CONFIG STUFF 
export const SERVERFILE = '/txt/servers.txt' //where found server list is stored

export const SHAREPERCENT = 0.40 //Amount of overall RAM to spend on share()

export const XPTARGET = 'joesguns'

export const PREPARESCRIPT = "/bin/prepareServer.js"

export const SERVERCOUNT = 5 //number of servers to target
export const BATCHMAX = 5 //Maximum number of batches per server
export const HACKAMOUNT = 0.50 //Default hack amount
export const BATCHDELAY = 50; //Delay between batch steps 
export const GROWTHAMOUNT = 2 //Default growth amount


export const PSERVBUFFER = 20_000_000_000; //Money required before purchasing servers
export const PSERVPREFIX = "pserv-" //pserv naming convention
export const PSERVMINRAM = 4 //pserv purchasing starting point