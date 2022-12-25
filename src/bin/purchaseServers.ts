import { NS } from "@ns";
import * as C from "lib/constants";

/**Waits to buy a new pserv 
 * @param {NS} ns 
 * @param {Number} ram
 * @param {string} hostname
*/
async function waitPurchase(ns: NS, ram: number, hostname: string): Promise<void> {
	const cost = ns.getPurchasedServerCost(ram)
	while (ns.getServerMoneyAvailable("home") < C.PSERVBUFFER + cost) {
		await ns.sleep(10)
	}
	ns.purchaseServer(hostname, ram)
}

/**Waits to upgrade an existing pserv
 * @param {NS} ns 
 * @param {Number} ram
 * @param {string} hostname
*/
async function waitUpgrade(ns: NS, ram: number, hostname: string) {
	const cost = ns.getPurchasedServerUpgradeCost(hostname, ram)
	while (ns.getServerMoneyAvailable("home") < C.PSERVBUFFER + cost) {
		await ns.sleep(10)
	}
	ns.upgradePurchasedServer(hostname, ram)
}

/** Deletes all purchased servers 
 * @param {NS} ns
 * @param {string[]} pservs Array of hostnames to delete
*/
export function deletePurchasedServers(ns: NS, pservs: string[]) {
	for (const p of pservs) {
		ns.deleteServer(p)
	}
}

/** @param {NS} ns */
export async function main(ns: NS) {
	let ram = C.PSERVMINRAM
	// eslint-disable-next-line no-constant-condition
	while (true) {
		await ns.sleep(5)
		let pservs = ns.getPurchasedServers()
		while (pservs.length < ns.getPurchasedServerLimit()) {
			const hostname = C.PSERVPREFIX + (pservs.length + 1)
			await waitPurchase(ns, ram, hostname)
		}
		pservs = ns.getPurchasedServers()
		ram *= 2
		for (const p of pservs) {
			if (ns.serverExists(p) && ns.getServerMaxRam(p) < ram) {
				await waitUpgrade(ns, ram, p)
			}
		}
	}
}