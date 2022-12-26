import { NS } from "@ns";
import { SERVERFILE } from "lib/constants";
import { openPorts, searchServers } from "lib/utils";

/**
 * updates records of all servers
 * @param ns 
 */
export async function main(ns: NS) {
	ns.disableLog("nuke")
	const data = ns.flags([
		['nuke', false]
	]);
	const servers = searchServers(ns)
	ns.write(SERVERFILE, JSON.stringify(servers), "w")

	if (data.nuke) {
		for (const s of servers) openPorts(ns, s)
		for (const s of servers) ns.nuke(s)
		ns.exit()
	}



}