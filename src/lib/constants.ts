//Commonly used constants. 

export const DEBUG = false

export const SCRIPTS = Object.freeze({
	HACK: "/lib/hack.js",
	WEAKEN: "/lib/weaken.js",
	GROW: "/lib/grow.js",
});

export const XPTARGET = 'joesguns'

export const PREPARESCRIPT = "/bin/prepareServer.js"
export const PREPAREPORT = 69


export const MAXBATCHES = 1 //Maximum number of batches per server
export const BATCHTARGET = "n00dles" //target server
export const HACKAMOUNT = 0.99 //amount to hack for
export const BATCHDELAY = 50; //Delay between batch steps 
export const BATCHGROWTH = 2 //Default growth rate


export const PSERVBUFFER = 5_000_000_000; //Money required before purchaseing servers
export const PSERVPREFIX = "pserv-" //pserv naming convention
export const PSERVMINRAM = 2 //pserv purchasing starting point