import { NS } from "@ns";
import { findServers, openPorts } from "lib/utils";
import { prioritizeServers } from "/lib/batchlib";

/**Updates records of all servers
 * @param {NS} ns
 */
export async function main(ns: NS) {

	const data = ns.flags([
		['nuke', false],
		['ports', false],
		['all', false],
		['priority', 0]
	]);
	const servers = findServers(ns)
	if (data.all) {
		for (const s of servers) {
			openPorts(ns, s)
			if (ns.getServerNumPortsRequired(s) <= ns.getServer(s).openPortCount) ns.nuke(s)
		}
		ns.exit()
	}
	if (data.nuke) {
		for (const s of servers) ns.nuke(s)
		ns.exit()
	}
	if (data.ports) {
		for (const s of servers) openPorts(ns, s)
		ns.exit()
	}
	if (data.priority > 0) {
		const prioritized = prioritizeServers(ns, servers)
		for (let i = 0; i < data.priority; i++) {
			ns.tprint(prioritized[i])
		}
	}


}