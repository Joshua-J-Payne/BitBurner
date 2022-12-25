//Commonly used constants. 

export const DEBUG = true

export const SCRIPTS = Object.freeze({
	HACK: "/lib/hack.js",
	WEAKEN: "/lib/weaken.js",
	GROW: "/lib/grow.js",
});


export const BATCHTARGET = "n00dles" //target server
export const HACKAMOUNT = 0.2 //amount to hack for
export const BATCHDELAY = 100; //Delay between batch steps 
export const BATCHGROWTH = 2 //Default growth rate


export const PSERVBUFFER = 5_000_000_000; //Money required before purchaseing servers
export const PSERVPREFIX = "pserv-" //pserv naming convention
export const PSERVMINRAM = 2 //pserv purchasing starting point