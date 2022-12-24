import { NS } from "@ns";
import { calcBatchThreads, calcBatchTimes, calcBatchEndTimes, calcBatchDelays } from "lib/batchlib";
import * as C from "lib/constants";
import { deployScript, findAdminServers, killPids } from "lib/utils";

/**stores every piece of info for batch */

export class Batch {
	private ns: NS
	readonly target: string
	readonly id: string
	private hackAmount?: number
	private threads: number[]
	private times: number[]
	private delays: number[]
	private ends: number[]
	private pids: number[]



	constructor(ns: NS, target: string, id: string, hackAmount?: number) {
		this.ns = ns
		this.target = target
		this.id = id
		this.hackAmount = hackAmount
		this.threads = calcBatchThreads(ns, target, hackAmount)
		this.times = calcBatchTimes(ns, target)
		this.delays = calcBatchDelays(this.times)
		this.ends = calcBatchEndTimes(this.times, this.delays)
		this.pids = []
	}

	public deploy(): void {
		const servers = findAdminServers(this.ns)
		if (this.hackAmount) {
			this.pids.push(...deployScript(this.ns,
				C.SCRIPTS.HACK,
				this.threads[0],
				servers,
				[this.target, this.delays[0].toString()]))
			this.pids.push(...deployScript(this.ns,
				C.SCRIPTS.WEAKEN,
				this.threads[1],
				servers,
				[this.target, this.delays[1].toString()]))

		}
		this.pids.push(...deployScript(this.ns,
			C.SCRIPTS.GROW,
			this.threads[this.threads.length - 2],
			servers,
			[this.target, this.delays[this.threads.length - 2].toString()]))
		this.pids.push(...deployScript(this.ns,
			C.SCRIPTS.WEAKEN,
			this.threads[this.threads.length - 1],
			servers,
			[this.target, this.delays[this.threads.length - 1].toString()]))
	}

	public kill(): void {
		let message = `WARN Killed all scripts started by Batch:${this.id}`
		if (!this.pids.length) {
			message = `ERROR No scripts to kill in Batch:${this.id}`
		}
		killPids(this.ns, this.pids)
		this.ns.print(message)
	}

	public log(): void {
		this.ns.print(`Threads... ${this.threads}`)
		this.ns.print(`Delays.... ${this.delays}`)
		this.ns.print(`Times..... ${this.times}`)
		this.ns.print(`Ends...... ${this.ends}`)
	}

}