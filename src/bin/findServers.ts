import { NS } from "@ns";
import { SERVERFILE } from "lib/constants";
import { openPorts, searchServers } from "lib/utils";

/**
 * updates records of all servers
 * @param ns 
 */
export async function main(ns: NS) {
	ns.disableLog("nuke")
	ns.disableLog("disableLog")
	const data = ns.flags([
		['nuke', false]
	]);
	const servers = searchServers(ns)
	ns.write(SERVERFILE, JSON.stringify(servers), "w")

	if (data.nuke) {
		for (const s of servers) openPorts(ns, s)
		for (const s of servers) {
			try { ns.nuke(s) }
			catch(e) {ns.print(e)}
			ns.tail()
			ns.exit()
		}
	}
}