import { NS } from "@ns";
import { PSERVBUFFER, PSERVMINRAM, PSERVPREFIX } from "lib/constants";

/**
 * waits until sufficient money to buy pserv
 * @param ns 
 * @param ram 
 * @param hostname 
 * @param buffer 
 */
async function waitPurchase(ns: NS, ram: number, hostname: string, buffer: number): Promise<void> {
	const cost = ns.getPurchasedServerCost(ram)
	while (ns.getServerMoneyAvailable("home") < buffer + cost) {
		await ns.sleep(100)
	}
	ns.purchaseServer(hostname, ram)
}

/**
 * wait until sufficient money to buy pserv
 * @param ns 
 * @param ram 
 * @param hostname 
 * @param buffer 
 */
async function waitUpgrade(ns: NS, ram: number, hostname: string, buffer: number) {
	const cost = ns.getPurchasedServerUpgradeCost(hostname, ram)
	while (ns.getServerMoneyAvailable("home") < buffer + cost) {
		await ns.sleep(100)
	}
	ns.upgradePurchasedServer(hostname, ram)
}

/** @param {NS} ns */
export async function main(ns: NS) {
	let ram = PSERVMINRAM
	let buffer = PSERVBUFFER 
	if(ns.args[0]) buffer = parseInt(`${ns.args[0]}`)
	ns.tprint(buffer)
	// eslint-disable-next-line no-constant-condition
	while (true) {
		await ns.sleep(100)
		let pservs = ns.getPurchasedServers()
		while (pservs.length < ns.getPurchasedServerLimit()) {
			const hostname = PSERVPREFIX + (pservs.length + 1)
			await waitPurchase(ns, ram, hostname, buffer)
		}
		pservs = ns.getPurchasedServers()
		ram *= 2
		for (const p of pservs) {
			if (ns.serverExists(p) && ns.getServerMaxRam(p) < ram) {
				await waitUpgrade(ns, ram, p, buffer)
			}
		}
	}
}